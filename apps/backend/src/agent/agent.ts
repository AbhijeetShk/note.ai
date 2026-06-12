import { StateGraph, Annotation, START, END } from "@langchain/langgraph";
import dotenv from "dotenv";
import {
  generateFromContext,
  generateFromDocs,
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
export async function gradeRetrieval(
  state: typeof GraphState.State
) {
  const question =
    state.messages.at(-1)?.content || "";

  const context =
    state.rerankedDocs
      .map(
        d => d.pageContent
      )
      .join("\n\n");

  const structured =
    llm.withStructuredOutput(
      RetrievalGradeSchema
    );

  const result =
    await structured.invoke(`
Question:
${question}

Retrieved Context:
${context}

Evaluate whether the
retrieved information is
sufficient to answer the question.
`);

  return {
    retrievalQuality:
      result.sufficient
        ? "good"
        : "bad",

    retrievalScore:
      result.score,
  };
}
function retrievalRouter(
  state: typeof GraphState.State
) {
  if (
    state.retrievalQuality === "good"
  ) {
    return "planner";
  }

  if (
    state.retryCount >= 2
  ) {
    return "planner";
  }

  return "retry";
}
async function retryRetrieval(
  state: typeof GraphState.State
) {
  return {
    retryCount:
      state.retryCount + 1,
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

  .addNode("planner", planner)
  .addNode("execute_tools", executeTools)

  .addNode("synthesize", synthesize)

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

  .addConditionalEdges(
    "grade_retrieval",
    retrievalRouter,
    {
      retry: "retry_retrieval",
      planner: "planner",
      clarify: "clarify",
    }
  )

  .addEdge("retry_retrieval", "query_rewrite")

  .addEdge("planner", "execute_tools")

  .addConditionalEdges(
    "execute_tools",
    (state) => state.toolStatus,
    {
      continue: "planner",
      done: "synthesize",
    }
  )

  .addEdge("clarify", END)
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
