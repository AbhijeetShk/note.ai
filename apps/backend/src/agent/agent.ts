import { StateGraph, Annotation, START, END } from "@langchain/langgraph";
import dotenv from "dotenv";
import {
  generateFromContext,
  generateFromDocs,
  plannerLLM,
  queryRewrite,
  retrieveHybrid,
  synthesisLLM,
} from "../index.js";
import { z } from "zod";
import { tool } from "@langchain/core/tools";
import { planner } from "../planner/planner.js";
import { executeTools } from "../tools/executor.js";
import { GraphState } from "../types/state.js";
import { RetrievalGradeSchema } from "../retrieval/schema.js";
import { extractCitations } from "../retrieval/citations.js";
import { verifyCitations } from "../grounding/verifyCitations.js";
import { hallucinationCheck } from "../grounding/hallucinationCheck.js";
import { gradeResponse } from "../gradeResponse/responseGrade.js";
import { improveAnswer } from "../grounding/improveAnswer.js";
import { reflectionRouter } from "../reflectionRouter/reflectionRouter.js";
import { reason } from "../ReAct/reasonNode.js";
import { reactRouter } from "../ReAct/reactRouter.js";
import { MemorySaver } from "@langchain/langgraph";
import { extractMemory } from "../memory/extract-memory.js";
import { writeMemory } from "../memory/write-memory.js";
import { checkpointer } from "../checkpointer/postgres.js";
import { evaluateFinish } from "../evalFinish/evaluateFinish.js";
import { finishRouter } from "../evalFinish/finishRouter.js";
import { intentRouter } from "../intentClassify/router.js";
import { classify } from "../intentClassify/classify.js";
import { buildGroundingContext } from "../memory/grounding-context.js";
import { gradeRetrieval } from "../retrieval/gradeRetrieval.js";
import { retrievalRouter } from "../retrieval/retrievalRouter.js";
dotenv.config();

type Message = {
  role: "user" | "assistant" | "system";
  content: string;
};
// const checkpointer = new MemorySaver();
// async function classify(state: typeof GraphState.State) {
//   // console.log("ENTERING classify");
//   const question =
//     state.messages[state.messages.length - 1]?.content.toLowerCase() || "";

//   let route: "simple_rag" | "deep_rag" | "clarify" = "simple_rag";

//   let retrievalMode: "fast" | "balanced" | "accurate" = "balanced";

//   if (question.length < 10) {
//     route = "clarify";
//   }

//   if (
//     question.includes("compare") ||
//     question.includes("analyze") ||
//     question.includes("deep")
//   ) {
//     route = "deep_rag";
//     retrievalMode = "accurate";
//   }

//   return {
//     route,
//     retrievalMode,
//   };
// }

//Improved-->
// export async function classify(state: typeof GraphState.State) {
//   const message = state.messages.at(-1)?.content?.trim().toLowerCase() || "";

//   let route: "simple_rag" | "deep_rag" | "clarify" | "memory" = "simple_rag";

//   let retrievalMode: "fast" | "balanced" | "accurate" = "balanced";

//   if (
//     message.startsWith("i am") ||
//     message.startsWith("i'm") ||
//     message.startsWith("my") ||
//     message.startsWith("i like") ||
//     message.startsWith("i prefer") ||
//     message.startsWith("i want") ||
//     message.startsWith("i work") ||
//     message.startsWith("i build") ||
//     message.startsWith("i built")
//   ) {
//     route = "memory";
//   } else if (message.length < 10) {
//     route = "clarify";
//   }

//   // deep research
//   else if (
//     message.includes("compare") ||
//     message.includes("analyze") ||
//     message.includes("deep") ||
//     message.includes("tradeoff") ||
//     message.includes("architecture")
//   ) {
//     route = "deep_rag";
//     retrievalMode = "accurate";
//   }

//   return {
//     route,
//     retrievalMode,
//   };
// }
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
  const groundingContext = buildGroundingContext(state);
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

Grounding Context:
${groundingContext}

Observations:
${observations}

Generate a direct answer to the user's question.

Priority order:

1. Relevant memory observations
2. Retrieved documents
3. Other tool observations

If memory observations directly answer the question,
use them.

Do not claim information is unavailable if it exists
in the grounding context.

Use both:
- Retrieved documents
- Retrieved memories

When memories contain information relevant to the question,
use them as valid evidence.

Do not ignore memory results.
`;

  const result = await synthesisLLM.invoke(prompt);

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
  const result = await plannerLLM.invoke(`
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
// export async function gradeRetrieval(state: typeof GraphState.State) {
//   console.log("ENTERING gradeRetrieval");
//   const question = state.messages.at(-1)?.content || "";

//   // const context =
//   //   state.rerankedDocs
//   //     .map(
//   //       d => d.pageContent
//   //     )
//   //     .join("\n\n");

//   //token exhaustion hack - top 3 chunks instead of all chunks

//   const context = state.compressedContext;

//   const structured = plannerLLM.withStructuredOutput(RetrievalGradeSchema);

//   //vauge or causing confusion - not providing clear criteria for grading, leading to inconsistent results. Also could lead to token exhaustion with larger contexts
//   //   const result =
//   //     await structured.invoke(`
//   // Question:
//   // ${question}

//   // Retrieved Context:
//   // ${context}

//   // Evaluate whether the
//   // retrieved information is
//   // sufficient to answer the question.
//   // `);

//   const result = await structured.invoke(`
// Question:
// ${question}

// Retrieved Context:
// ${context}

// Determine whether the context contains enough information
// to answer the question accurately.

// Return:
// - sufficient: true if at least one chunk contains the answer
// - score: 1-10 relevance score

// Be generous.
// If the answer can reasonably be produced from the context,
// mark sufficient=true.
// `);
//   // console.log(
//   //   "retryCount:",
//   //   state.retryCount
//   // );

//   // console.log(
//   //   "retrievalQuality:",
//   //   result.sufficient
//   // );

//   // console.log(
//   //   "retrievalScore:",
//   //   result.score
//   // );
//   // console.log(
//   //   "reasoning:",
//   //   result.reasoning
//   // );
//   // console.log("GRADE RESULT:", result);
//   return {
//     retrievalQuality: result.sufficient ? "good" : "bad",

//     retrievalScore: result.score,
//   };
// }
// function retrievalRouter(state: typeof GraphState.State) {
//   console.log("ENTERING retrievalRouter");
//   if (state.retrievalQuality === "good") {
//     return "planner";
//   }

//   if (state.retryCount >= 2) {
//     return "planner";
//   }

//   return "retry";
// }
async function retryRetrieval(state: typeof GraphState.State) {
  console.log("ENTERING retryRetrieval");
  console.log("RETRY UPDATE", {
    before: state.retryCount,
    after: state.retryCount + 1,
  });
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
  .addNode("evaluate_finish", evaluateFinish)
  .addNode("extract_citations", extractCitations)
  .addNode("synthesize", synthesize)

  .addNode("verify_citations", verifyCitations)
  .addNode("hallucination_check", hallucinationCheck)

  .addNode("grade_response", gradeResponse)
  .addNode("improve_answer", improveAnswer)

  .addNode("extract_memory", extractMemory)
  .addNode("write_memory", writeMemory)

  .addEdge(START, "classify")

  .addConditionalEdges("classify", intentRouter, {
    question: "query_rewrite",

    research: "query_rewrite",

    task: "reason",

    memory: "extract_memory",

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

    evaluate_finish: "evaluate_finish",
  })

  .addEdge("execute_tools", "reason")
  .addConditionalEdges("evaluate_finish", finishRouter, {
    synthesize: "extract_citations",

    reason: "reason",
  })

  .addEdge("extract_citations", "synthesize")

  .addEdge("synthesize", "verify_citations")

  .addEdge("verify_citations", "hallucination_check")

  .addEdge("hallucination_check", "grade_response")

  .addConditionalEdges("grade_response", reflectionRouter, {
    improve: "improve_answer",

    done: "extract_memory",
  })

  .addEdge("improve_answer", "grade_response")

  .addEdge("extract_memory", "write_memory")

  .addEdge("write_memory", END)

  .addEdge("clarify", END)

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
