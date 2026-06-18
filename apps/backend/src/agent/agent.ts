import { StateGraph, Annotation, START, END } from "@langchain/langgraph";
import dotenv from "dotenv";
import {
  generateFromContext,
  generateFromDocs,
  graderLLM,
  llm,
  queryRewrite,
  retrieveHybrid,
} from "../index.js";
import { z } from "zod";
import { tool } from "@langchain/core/tools";
import { planner } from "../planner/planner.js";
import { executeTools } from "../tools/executor.js";
import { GraphState } from "../types/state.js";
import { RetrievalGradeSchema } from "../planner/schema.js";
import { extractCitations } from "../retrieval/citations.js";
import { verifyCitations } from "../grounding/verifyCitations.js";
import { hallucinationCheck } from "../grounding/hallucinationCheck.js";
import { gradeResponse } from "../gradeResponse/responseGrade.js";
import { improveAnswer } from "../grounding/improveAnswer.js";
import { reflectionRouter } from "../reflectionRouter/reflectionRouter.js";
import { reason } from "../ReAct/reasonNode.js";
import { reactRouter } from "../ReAct/reactRouter.js";
import { MemorySaver } from "@langchain/langgraph";
dotenv.config();

type Message = {
  role: "user" | "assistant" | "system";
  content: string;
};
const checkpointer = new MemorySaver();
async function classify(state: typeof GraphState.State) {
  // console.log("ENTERING classify");
  const question =
    state.messages[state.messages.length - 1]?.content.toLowerCase() || "";

  let route: "simple_rag" | "deep_rag" | "clarify" = "simple_rag";

  let retrievalMode: "fast" | "balanced" | "accurate" = "balanced";

  if (question.length < 10) {
    route = "clarify";
  }

  if (
    question.includes("compare") ||
    question.includes("analyze") ||
    question.includes("deep")
  ) {
    route = "deep_rag";
    retrievalMode = "accurate";
  }

  return {
    route,
    retrievalMode,
  };
}
async function clarify() {
  // console.log("ENTERING clarify");
  return {
    synthesis: "Can you clarify your question?",
  };
}
async function retrieve(state: typeof GraphState.State) {
  // console.log("ENTERING retrieve");
  const question = state.messages[state.messages.length - 1]?.content || "";

  const docs = await retrieveHybrid(question, state.retrievalMode);

  return {
    retrievedDocs: docs,
  };
}

// async function gradeRetrieval(state: typeof GraphState.State) {
//   const docs = state.rerankedDocs;

//   if (
//     !docs ||
//     docs.length === 0 ||
//     docs.every((doc) => !doc.pageContent || doc.pageContent.length < 20)
//   ) {
//     return {
//       retrievalQuality: "bad",
//     };
//   }

//   return {
//     retrievalQuality: "good",
//   };
// }
// async function synthesize(state: typeof GraphState.State) {
//   const question = state.messages[state.messages.length - 1]?.content || "";
//   const docs = state.compressedContext;
// const result =
//   await generateFromContext(
//     question,
//     state.compressedContext
//   );

//   return {
//     synthesis: result.answer,
//     messages: [
//       {
//         role: "assistant",
//         content: result.answer,
//       },
//     ],
//   };
// }
async function synthesize(state: typeof GraphState.State) {
  // console.log("ENTERING synthesize");
  const question = state.messages.at(-1)?.content || "";

  const observations = state.observations
    .map(
      (o) =>
        `[${o.status}]
${o.tool}: ${o.result}`,
    )
    .join("\n");

  const prompt = `
Question:
${question}

Plan:
${state.plan.join("\n")}

Observations:
${observations}

Create final answer.
`;

  const result = await llm.invoke(prompt);

  return {
    synthesis: String(result.content),

    messages: [
      {
        role: "assistant",
        content: String(result.content),
      },
    ],
  };
}
async function rerankDocuments(state: typeof GraphState.State) {
  // console.log("ENTERING rerankDocuments");
  const docs = state.retrievedDocs;

  const reranked = docs
    .sort((a, b) => b.pageContent.length - a.pageContent.length)
    .slice(0, 4);

  return {
    rerankedDocs: reranked,
  };
}

// async function compressContext(state: typeof GraphState.State) {
//   console.log("ENTERING compressContext");
//   const docs = state.rerankedDocs;

//   const compressed = docs
//     .map((doc) => doc.pageContent.split(".").slice(0, 3).join("."))
//     .join("\n\n");

//   return {
//     compressedContext: compressed,
//   };
// }
async function compressContext(state: typeof GraphState.State) {
  // console.log("ENTERING compressContext");
  const context = state.rerankedDocs
    .slice(0, 5)
    .map((d) => d.pageContent)
    .join("\n\n");
  //Compression is a filtering/summarization task, not a high-creativity reasoning task. Therefore use 8b model instead of 70b for cost and latency
  const result = await graderLLM.invoke(`
Compress the following context.
Keep only facts useful for answering the question.

Question:
${state.messages.at(-1)?.content}

Context:
${context}
`);

  return {
    compressedContext: String(result.content),
  };
}
export async function gradeRetrieval(state: typeof GraphState.State) {
  // console.log("ENTERING gradeRetrieval");
  const question = state.messages.at(-1)?.content || "";

  // const context =
  //   state.rerankedDocs
  //     .map(
  //       d => d.pageContent
  //     )
  //     .join("\n\n");

  //token exhaustion hack - top 3 chunks instead of all chunks

  const context = state.compressedContext;

  const structured = graderLLM.withStructuredOutput(RetrievalGradeSchema);

  //vauge or causing confusion - not providing clear criteria for grading, leading to inconsistent results. Also could lead to token exhaustion with larger contexts
  //   const result =
  //     await structured.invoke(`
  // Question:
  // ${question}

  // Retrieved Context:
  // ${context}

  // Evaluate whether the
  // retrieved information is
  // sufficient to answer the question.
  // `);

  const result = await structured.invoke(`
Question:
${question}

Retrieved Context:
${context}

Determine whether the context contains enough information
to answer the question accurately.

Return:
- sufficient: true if at least one chunk contains the answer
- score: 1-10 relevance score

Be generous.
If the answer can reasonably be produced from the context,
mark sufficient=true.
`);
  // console.log(
  //   "retryCount:",
  //   state.retryCount
  // );

  // console.log(
  //   "retrievalQuality:",
  //   result.sufficient
  // );

  // console.log(
  //   "retrievalScore:",
  //   result.score
  // );
  // console.log(
  //   "reasoning:",
  //   result.reasoning
  // );
  // console.log("GRADE RESULT:", result);
  return {
    retrievalQuality: result.sufficient ? "good" : "bad",

    retrievalScore: result.score,
  };
}
function retrievalRouter(state: typeof GraphState.State) {
  // console.log("ENTERING retrievalRouter");
  if (state.retrievalQuality === "good") {
    return "planner";
  }

  if (state.retryCount >= 2) {
    return "planner";
  }

  return "retry";
}
async function retryRetrieval(state: typeof GraphState.State) {
  // console.log("ENTERING retryRetrieval");
  return {
    retryCount: state.retryCount + 1,
  };
}
export async function reflect(state: any) {
  // console.log("ENTERING reflect");
  return {
    reflectionCount: state.reflectionCount + 1,
  };
}
export const graph = new StateGraph(GraphState)
  .addNode("classify", classify)

  .addNode("query_rewrite", queryRewrite)
  .addNode("retrieve", retrieve)
  .addNode("rerank", rerankDocuments)
  .addNode("compress_context", compressContext)
  .addNode("grade_retrieval", gradeRetrieval)
  .addNode("retry_retrieval", retryRetrieval)

  .addNode("clarify", clarify)
  .addNode("reason", reason)
  .addNode("execute_tools", executeTools)
  .addNode("extract_citations", extractCitations)
  .addNode("synthesize", synthesize)
  .addNode("verify_citations", verifyCitations)
  .addNode("hallucination_check", hallucinationCheck)
  .addNode("grade_response", gradeResponse)
  .addNode("improve_answer", improveAnswer)

  .addEdge(START, "classify")

  .addConditionalEdges("classify", (state) => state.route, {
    simple_rag: "query_rewrite",
    deep_rag: "query_rewrite",
    clarify: "clarify",
  })

  .addEdge("query_rewrite", "retrieve")
  .addEdge("retrieve", "rerank")
  .addEdge("rerank", "compress_context")
  .addEdge("compress_context", "grade_retrieval")

  .addConditionalEdges("grade_retrieval", retrievalRouter, {
    retry: "retry_retrieval",
    planner: "reason",
    clarify: "clarify",
  })

  .addEdge("retry_retrieval", "query_rewrite")

  .addConditionalEdges("reason", reactRouter, {
    execute_tools: "execute_tools",

    synthesize: "synthesize",
  })
  .addEdge("execute_tools", "reason")

  .addEdge("extract_citations", "synthesize")
  .addEdge("clarify", END)
  .addEdge("synthesize", "verify_citations")

  .addEdge("verify_citations", "hallucination_check")

  .addEdge("hallucination_check", "grade_response")
  .addConditionalEdges("grade_response", reflectionRouter, {
    improve: "improve_answer",

    done: END,
  })
  .addEdge("improve_answer", "grade_response")

   .compile({
    checkpointer,
  });
async function main() {
  const result = await graph.invoke(
    {
      messages: [
        {
          role: "user",
          content: "Explain quantum computing in simple words",
        },
      ],
    },
    {
      configurable: {
        thread_id: crypto.randomUUID(),
      },
      runName: "agent-query",
    },
  );

  //   console.log(result.synthesis);
  //   console.log(
  //   result.citationVerification
  // );
  // console.log(
  //   result.hallucinationCheck
  // );
}

// main();
