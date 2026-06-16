import dotenv from "dotenv";
dotenv.config();

import { HuggingFaceInferenceEmbeddings } from "@langchain/community/embeddings/hf";
import { SupabaseVectorStore } from "@langchain/community/vectorstores/supabase";
import { createClient } from "@supabase/supabase-js";
import { ChatGroq } from "@langchain/groq";
import { ChatPromptTemplate } from "@langchain/core/prompts";
import { createStuffDocumentsChain } from "@langchain/classic/chains/combine_documents";

const USER_ID = "df1f93ae-6827-4c42-b8a3-9a0e2e80784f";

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_ANON_KEY!
);

const embeddings = new HuggingFaceInferenceEmbeddings({
  apiKey: process.env.HUGGINGFACEHUB_API_KEY,
    model: "BAAI/bge-base-en-v1.5"
});

const llm = new ChatGroq({
  model: "llama-3.3-70b-versatile",
  temperature: 0,
  apiKey: process.env.GROQ_KEY,
});

const vectorStore = new SupabaseVectorStore(embeddings, {
  client: supabase as any,
  tableName: "documents",
  queryName: "match_documents",
});

function retriever(searchType: "similarity" | "mmr", k = 6) {
  return vectorStore.asRetriever({
    k,
    searchType,
    filter: {
      user_id: USER_ID,
      source: "./src/Stoner.pdf",
    },
  });
}

async function queryExpansion(query: string) {
  const prompt = `Rewrite this query into 3 short search variations.\n${query}`;
  const res = await llm.invoke(prompt);
  const text = String(res.content);

  const queries = text
    .split("\n")
    .map((line) => line.replace(/^[-0-9. )]+/, "").trim())
    .filter(Boolean);

  return Array.from(new Set([query, ...queries])).slice(0, 4);
}

async function rerank(question: string, docs: any[]) {
  const scored = await Promise.all(
    docs.map(async (doc: any) => {
      const prompt = `Rate relevance from 1 to 10.\nQuestion: ${question}\nPassage: ${doc.pageContent}\nOnly return number.`;
      const res = await llm.invoke(prompt);
      const score = parseInt(String(res.content).match(/\d+/)?.[0] || "0");
      return { doc, score };
    })
  );

  return scored
    .sort((a, b) => b.score - a.score)
    .slice(0, 4)
    .map((item) => item.doc);
}

async function answer(question: string, docs: any[]) {
  const prompt = ChatPromptTemplate.fromMessages([
    [
      "system",
      "Use only the context. If insufficient, say you do not know.\n\n{context}",
    ],
    ["human", "{input}"],
  ]);

  const chain = await createStuffDocumentsChain({
    llm,
    prompt,
  });

  const res = await chain.invoke({
    input: question,
    context: docs,
  });

  return String(res);
}

function printDocs(docs: any[]) {
  return docs
    .slice(0, 3)
    .map((d, i) => {
      const page =
        d.metadata?.loc?.pageNumber ||
        d.metadata?.page ||
        "?";

      const preview = d.pageContent
        .replace(/\s+/g, " ")
        .slice(0, 140);

      return `${i + 1}. page ${page}: ${preview}...`;
    })
    .join("\n");
}

async function runSimilarity(question: string) {
  const docs = await retriever("similarity").invoke(question);
  const ans = await answer(question, docs);
  return { method: "SIMILARITY", docs, ans };
}

async function runMMR(question: string) {
  const docs = await retriever("mmr").invoke(question);
  const ans = await answer(question, docs);
  return { method: "MMR", docs, ans };
}

async function runExpansion(question: string) {
  const queries = await queryExpansion(question);
  const all: any[] = [];

  for (const q of queries) {
    const docs = await retriever("mmr").invoke(q);
    all.push(...docs);
  }

  const unique = Array.from(
    new Map(all.map((d) => [d.pageContent, d])).values()
  ).slice(0, 6);

  const ans = await answer(question, unique);

  return { method: "QUERY_EXPANSION", docs: unique, ans };
}

async function runRerank(question: string) {
  const docs = await retriever("mmr", 8).invoke(question);
  const reranked = await rerank(question, docs);
  const ans = await answer(question, reranked);

  return { method: "RERANKING", docs: reranked, ans };
}

async function compare(question: string) {
  const runs = await Promise.all([
    runSimilarity(question),
    runMMR(question),
    runExpansion(question),
    runRerank(question),
  ]);

  // console.log("\n question:");
  // console.log(question);

  for (const r of runs) {
    console.log("\n==================================================");
    console.log(r.method);
    console.log("--------------------------------------------------");
    console.log("top chunks:");
    console.log(printDocs(r.docs));
    console.log("\nanswer:");
    console.log(r.ans);
  }
}

async function main() {
  await compare(
    "What is the significance of Stoner relationship with Katherine Driscoll?"
  );
}

// main();