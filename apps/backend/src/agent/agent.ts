import { StateGraph, Annotation, START, END } from "@langchain/langgraph";
import dotenv from "dotenv";
import { generateFromDocs, retrieveHybrid } from "../index.js";
import { z } from "zod";
import { tool } from "@langchain/core/tools";
dotenv.config();

type Message = {
  role: "user" | "assistant" | "system";
  content: string;
};

const GraphState = Annotation.Root({
  messages: Annotation<Message[]>({
    reducer: (state, update) => [...state, ...update],
    default: () => [],
  }),

  synthesis: Annotation<string>({
    reducer: (_, update) => update,
    default: () => "",
  }),
  route: Annotation<"simple_rag" | "deep_rag" | "clarify">({
    reducer: (_, update) => update,
    default: () => "simple_rag",
  }),
  retrievedDocs: Annotation<any[]>({
    reducer: (_, update) => update,
    default: () => [],
  }),
  retrievalQuality: Annotation<"good" | "bad">({
    reducer: (_, update) => update,
    default: () => "good",
  }),
});

async function classify(state: typeof GraphState.State) {
  const question =
    state.messages[state.messages.length - 1]?.content.toLowerCase() || "";

  let route: "simple_rag" | "deep_rag" | "clarify" = "simple_rag";

  if (question.length < 10) {
    route = "clarify";
  }

  if (
    question.includes("compare") ||
    question.includes("analyze") ||
    question.includes("deep")
  ) {
    route = "deep_rag";
  }

  return {
    route,
  };
}
async function clarify() {
  return {
    synthesis: "Can you clarify your question?",
  };
}
async function retrieve(state: typeof GraphState.State) {
  const question = state.messages[state.messages.length - 1]?.content || "";

  const docs = await retrieveHybrid(question, "balanced");

  return {
    retrievedDocs: docs,
  };
}
const retrievePdfTool = tool(
  async ({ query }) => {
    // TEMP FAKE TOOL

    return JSON.stringify([
      {
        page: 12,
        content: "Quantum computing uses qubits.",
      },
    ]);
  },
  {
    name: "retrieve_pdf_chunks",
    description: "Retrieve relevant chunks from indexed PDFs.",
    schema: z.object({
      query: z.string(),
    }),
  },
);
async function gradeRetrieval(state: typeof GraphState.State) {
  const docs = state.retrievedDocs;

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
async function synthesize(state: typeof GraphState.State) {
  const question = state.messages[state.messages.length - 1]?.content || "";
  const docs = state.retrievedDocs;
  const result = await generateFromDocs(question, docs, "balanced");

  return {
    synthesis: result.answer,
    messages: [
      {
        role: "assistant",
        content: result.answer,
      },
    ],
  };
}
export const graph = new StateGraph(GraphState)
  .addNode("classify", classify)
  .addNode("retrieve", retrieve)
  .addNode("clarify", clarify)
  .addNode("grade_retrieval", gradeRetrieval)
  .addNode("synthesize", synthesize)

  .addEdge(START, "classify")
  .addConditionalEdges("classify", (state) => state.route, {
    simple_rag: "retrieve",
    deep_rag: "retrieve",
    clarify: "clarify",
  })
  .addEdge("retrieve", "grade_retrieval")
  .addConditionalEdges("grade_retrieval", (state) => state.retrievalQuality, {
    good: "synthesize",
    bad: "clarify",
  })
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
