import dotenv from "dotenv";
dotenv.config();

import { PDFLoader } from "@langchain/community/document_loaders/fs/pdf";
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import { HuggingFaceInferenceEmbeddings } from "@langchain/community/embeddings/hf";
import { SupabaseVectorStore } from "@langchain/community/vectorstores/supabase";
import { createClient } from "@supabase/supabase-js";
import { ChatGroq } from "@langchain/groq";
import { ChatPromptTemplate } from "@langchain/core/prompts";
import { createStuffDocumentsChain } from "@langchain/classic/chains/combine_documents";
import { z } from "zod";

import { tool } from "@langchain/core/tools";
import { GraphState } from "./types/state.js";
import { RewriteSchema } from "./planner/schema.js";
import { hybridSearch } from "./retrieval/hybridSearch.js";
import { parentSplitter } from "./ingestion/parentChild/parentSplitter.js";
import { mapParentsToDocs } from "./retrieval/mapParentsToDocs.js";
import { fetchParents } from "./retrieval/fetchParent.js";
import { embeddings } from "./config/embeddings.js";
import { supabase } from "./config/supabase.js";
// Predef
const USER_ID = "df1f93ae-6827-4c42-b8a3-9a0e2e80784f";
const AnswerSchema = z.object({
  answer: z.string(),
  confidence: z.number().min(0).max(1),
});
console.log("INDEX LOADED");


// for query_rewrite
// planner
// synthesize
// improve_answer, use 70b model for these tasks, as they require more reasoning and context understanding
export const synthesisLLM = new ChatGroq({
  model: "llama-3.3-70b-versatile",
  temperature: 0,
  apiKey: process.env.GROQ_KEY,
});

//for low level tasks - gradeRetrieval
// hallucinationCheck
// verifyCitations
// gradeResponse - use 8b model for grading, 70b model is too expensive for grading tasks
export const plannerLLM = new ChatGroq({
  model: "llama-3.1-8b-instant",

  temperature: 0,

  apiKey: process.env.GROQ_KEY,
});
const vectorStore = new SupabaseVectorStore(embeddings, {
  client: supabase as any,
  tableName: "documents",
  queryName: "match_documents",
});

type Mode = "fast" | "balanced" | "accurate";

type AskOptions = {
  source?: string;
  mode?: Mode;
};

function getModeConfig(mode: Mode) {
  if (mode === "fast") {
    return { k: 4, searchType: "similarity" as const };
  }
  if (mode === "accurate") {
    return { k: 8, searchType: "mmr" as const };
  }
  return { k: 6, searchType: "mmr" as const };
}

async function loadPdf(path: string, documentId?: string) {
  const docs = await new PDFLoader(path).load();
const parentDocs =
  await parentSplitter.splitDocuments(docs);
  const splitter = new RecursiveCharacterTextSplitter({
    chunkSize: 900,
    chunkOverlap: 180,
  });

  const chunks = await splitter.splitDocuments(docs);

  const enriched = chunks.map((doc, index) => ({
    ...doc,
    metadata: {
      ...doc.metadata,
      user_id: USER_ID,
      chunk_id: index,
      source: path,
      document_id: documentId || path,
      uploaded_at: new Date().toISOString(),
    },
  }));

  await SupabaseVectorStore.fromDocuments(enriched, embeddings, {
    client: supabase as any,
    tableName: "documents",
    queryName: "match_documents",
  });

  console.log(`Indexed ${enriched.length} chunks`);
}

export function buildRetriever(
  k = 6,
  searchType: "mmr" | "similarity" = "mmr",
  source?: string,
) {
  return vectorStore.asRetriever({
    k,
    searchType,
    filter: {
      user_id: USER_ID,
      ...(source ? { source } : {}),
    },
  });
}

async function queryExpansion(query: string) {
  const prompt = `Rewrite this query into 3 concise search variations.\n${query}`;
  const result = await synthesisLLM.invoke(prompt);
  const text = String(result.content);

  const variants = text
    .split("\n")
    .map((line) => line.replace(/^[-0-9. )]+/, "").trim())
    .filter(Boolean);

  return Array.from(new Set([query, ...variants])).slice(0, 4);
}

function dedupeDocs(docs: any[]) {
  return Array.from(
    new Map(docs.map((doc) => [doc.pageContent, doc])).values(),
  );
}

export async function retrieveHybrid(
  question: string,
  mode: Mode,
  source?: string,
) {
  const config = getModeConfig(mode);
  const queries = await queryExpansion(question);
  let allDocs: any[] = [];

  // changed to parallel retrieval for all query variants for low latency, better scaling, for further agent/tools integration
  const results = await Promise.all(
    queries.map((q) =>
      hybridSearch(q, config.k, config.searchType, source),
    ),
  );

allDocs = results.flat();

const retrievedChildren =
  dedupeDocs(allDocs);

const parents =
  await fetchParents(
    retrievedChildren,
  );

// ranking map from child retrieval order
const parentScoreMap = new Map<
  number,
  number
>();

retrievedChildren.forEach(
  (doc, rank) => {
    const parentId =
      doc.metadata?.parent_id;

    if (!parentId) return;

    // keeping best i.e lowest rank
    if (
      !parentScoreMap.has(parentId)
    ) {
      parentScoreMap.set(
        parentId,
        rank,
      );
    }
  },
);
console.log(retrievedChildren[2], "strange");
// sorting parents by best child rank
parents.sort((a, b) => {
  const scoreA =
    parentScoreMap.get(a.id) ??
    Number.MAX_SAFE_INTEGER;

  const scoreB =
    parentScoreMap.get(b.id) ??
    Number.MAX_SAFE_INTEGER;

  return scoreA - scoreB;
});

const parentDocs =
  mapParentsToDocs(parents);


console.log(
  "\n RETRIEVED CHILDREN: ",
);

retrievedChildren.forEach(
  (doc, index) => {
    console.log({
    rank: index,
    keys: Object.keys(doc),
    parentId: doc.metadata?.parent_id,
  });
    console.log({
      rank: index,
      parentId:
        doc.metadata?.parent_id,
      hasContent:
        !!doc.pageContent,
      preview:
        doc.pageContent
          ?.slice(0, 80),
    });
  },
);
console.log(
  "\n HYDRATED PARENTS: ",
);

parents.forEach((parent, index) => {
  console.log(
  index,
  parent.id,
);
});
return parentDocs;
}

function formatCitations(docs: any[]) {
  return docs.map((doc, index) => ({
    index: index + 1,
    source: doc.metadata?.source || "unknown",
    page: doc.metadata?.loc?.pageNumber || doc.metadata?.page || null,
    chunk_id: doc.metadata?.chunk_id ?? null,
  }));
}
const ragPrompt = ChatPromptTemplate.fromMessages([
  [
    "system",
    `
You are a grounded RAG assistant.

Answer ONLY from the provided context.

If context is insufficient:
- say you do not know
- keep confidence low

Return:
- answer
- confidence between 0 and 1

Context:
{context}
    `,
  ],
  ["human", "{input}"],
]);
export async function ask(question: string, options: AskOptions = {}) {
  const mode = options.mode || "balanced";

  const docs = await retrieveHybrid(question, mode, options.source);

  // const chain = await createStuffDocumentsChain({
  //   llm: structuredLlm,
  //   prompt,
  // });
  // const response = await chain.invoke({
  //   input: question,
  //   context: docs,
  // });
  return generateFromDocs(question, docs, mode);
}
export async function generateFromDocs(
  question: string,
  docs: any[],
  mode: Mode = "balanced",
) {
  const context = docs.map((doc) => doc.pageContent).join("\n\n");

  const structuredLlm = synthesisLLM.withStructuredOutput(AnswerSchema);

  const formattedPrompt = await ragPrompt.formatMessages({
    context,
    input: question,
  });

  const response = await structuredLlm.invoke(formattedPrompt);

  return {
    ...response,
    docs,
    citations: formatCitations(docs),
    mode,
  };
}
async function evaluate(question: string, answer: string, docs: any[]) {
  const totalChars = docs.reduce((sum, doc) => sum + doc.pageContent.length, 0);

  return {
    question,
    answerLength: answer.length,
    contextCount: docs.length,
    avgChunkSize: Math.round(totalChars / Math.max(docs.length, 1)),
    grounded: docs.length > 0,
  };
}

export async function generateFromContext(
  question: string,
  context: string,
  mode: Mode = "balanced",
) {
  const structuredLlm = synthesisLLM.withStructuredOutput(AnswerSchema);

  const formattedPrompt = await ragPrompt.formatMessages({
    context,
    input: question,
  });

  const response = await structuredLlm.invoke(formattedPrompt);

  return {
    ...response,
    mode,
  };
}

export async function queryRewrite(state: typeof GraphState.State) {
  const question = state.messages.at(-1)?.content || "";

  const structured = synthesisLLM.withStructuredOutput(RewriteSchema);

  const result = await structured.invoke(`
Generate 3 semantic search variations.

Question:
${question}
`);

  return {
    rewrittenQueries: [question, ...result.queries],
  };
}

export async function multiRetrieve(state: typeof GraphState.State) {
  const results = await Promise.all(
    state.rewrittenQueries.map((query) =>
      retrieveHybrid(query, state.retrievalMode),
    ),
  );

  const docs = results.flat();

  const deduped = Array.from(
    new Map(docs.map((doc) => [doc.pageContent, doc])).values(),
  );

  return {
    retrievedDocs: deduped,
  };
}
async function main() {
  const question =
    "What is the significance of Stoner relationship with Katherine Driscoll?";

  const result = await ask(question, {
    mode: "accurate",
    source: "./src/Stoner.pdf",
  });

  console.log("ANSWER:");
  console.log(result.answer);

  console.log("CITATIONS:");
  console.log(result.citations);

  console.log("EVALUATION:");
  console.log(await evaluate(question, result.answer, result.docs));
}

// main();
