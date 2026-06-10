import { StateGraph, Annotation, START, END } from "@langchain/langgraph";
import dotenv from "dotenv";
import {
  generateFromContext,
  generateFromDocs,
  llm,
  retrieveHybrid,
} from "../index.js";
import { z } from "zod";
import { tool } from "@langchain/core/tools";
import { planner } from "../planner/planner.js";
import { executeTools } from "../tools/executor.js";
import { GraphState } from "../types/state.js";
dotenv.config();

type Message = {
  role: "user" | "assistant" | "system";
  content: string;
};

async function classify(state: typeof GraphState.State) {
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
  return {
    synthesis: "Can you clarify your question?",
  };
}
async function retrieve(state: typeof GraphState.State) {
  const question = state.messages[state.messages.length - 1]?.content || "";

  const docs = await retrieveHybrid(question, state.retrievalMode);

  return {
    retrievedDocs: docs,
  };
}

async function gradeRetrieval(state: typeof GraphState.State) {
  const docs = state.rerankedDocs;

  if (
    !docs ||
    docs.length === 0 ||
    docs.every((doc) => !doc.pageContent || doc.pageContent.length < 20)
  ) {
    return {
      retrievalQuality: "bad",
    };
  }

  return {
    retrievalQuality: "good",
  };
}
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
  const question = state.messages.at(-1)?.content || "";

  const observations = state.observations
    .map(
      (o) =>
        `[${o.tool}]
${o.result}`,
    )
    .join("\n\n");

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
  };
}
async function rerankDocuments(state: typeof GraphState.State) {
  const docs = state.retrievedDocs;

  const reranked = docs
    .sort((a, b) => b.pageContent.length - a.pageContent.length)
    .slice(0, 4);

  return {
    rerankedDocs: reranked,
  };
}

async function compressContext(state: typeof GraphState.State) {
  const docs = state.rerankedDocs;

  const compressed = docs
    .map((doc) => doc.pageContent.split(".").slice(0, 3).join("."))
    .join("\n\n");

  return {
    compressedContext: compressed,
  };
}
export const graph = new StateGraph(GraphState)
  .addNode("classify", classify)

  // RAG pipeline
  .addNode("retrieve", retrieve)
  .addNode("rerank", rerankDocuments)
  .addNode("compress_context", compressContext)
  .addNode("grade_retrieval", gradeRetrieval)

  // Clarification
  .addNode("clarify", clarify)

  // Agent layer
  .addNode("planner", planner)
  .addNode("execute_tools", executeTools)

  // Final response
  .addNode("synthesize", synthesize)

  // Entry
  .addEdge(START, "classify")

  // Routing
  .addConditionalEdges("classify", (state) => state.route, {
    simple_rag: "retrieve",
    deep_rag: "retrieve",
    clarify: "clarify",
  })

  // Retrieval pipeline
  .addEdge("retrieve", "rerank")
  .addEdge("rerank", "compress_context")
  .addEdge("compress_context", "grade_retrieval")

  // Retrieval quality gate
  .addConditionalEdges(
    "grade_retrieval",
    (state) => state.retrievalQuality,
    {
      good: "planner",
      bad: "clarify",
    }
  )

  // Agent planning
  .addEdge("planner", "execute_tools")

  // Tool execution loop
  .addConditionalEdges(
    "execute_tools",
    (state) => state.toolStatus,
    {
      continue: "planner",
      done: "synthesize",
    }
  )

  .addEdge("synthesize", END)

  .compile();
async function main() {
  const result = await graph.invoke({
    messages: [
      {
        role: "user",
        content: "Explain quantum computing in simple words",
      },
    ],
  });

  console.log(result.synthesis);
}

main();
