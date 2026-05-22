import { ChatGroq } from "@langchain/groq";
import { StateGraph, Annotation, START, END } from "@langchain/langgraph";
import dotenv from "dotenv";
import { ask, retrieveHybrid } from "../index.js";

dotenv.config();

const llm = new ChatGroq({
  apiKey: process.env.GROQ_API_KEY,
  model: "llama-3.3-70b-versatile",
});

type Message = {
  role: "user" | "assistant" | "system";
  content: string;
};

const GraphState = Annotation.Root({
  messages: Annotation<Message[]>({
    reducer: (state, update) => [...state, ...update],
    default: () => [],
  }),

  classification: Annotation<string>({
    reducer: (_, update) => update,
    default: () => "",
  }),

  research: Annotation<string>({
    reducer: (_, update) => update,
    default: () => "",
  }),

  analysis: Annotation<string>({
    reducer: (_, update) => update,
    default: () => "",
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

async function synthesize(state: typeof GraphState.State) {
  const response = await llm.invoke([
    {
      role: "system",
      content: "Generate the final response from analysis.",
    },
    {
      role: "user",
      content: state.analysis,
    },
  ]);

  return {
    synthesis: response.content as string,
    messages: [
      {
        role: "assistant",
        content: response.content as string,
      },
    ],
  };
}
async function retrieve(state: typeof GraphState.State) {
  const question = state.messages[state.messages.length - 1]?.content || "";

  const docs = await retrieveHybrid(question, "balanced");

  return {
    retrievedDocs: docs,
  };
}
async function generateAnswer(state: typeof GraphState.State) {
  const question = state.messages[state.messages.length - 1]?.content || "";

  const result = await ask(question);

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
  .addNode("synthesize", synthesize)

  .addEdge(START, "classify")
  .addConditionalEdges("classify", (state) => state.route, {
    simple_rag: "retrieve",
    deep_rag: "retrieve",
    clarify: "clarify",
  })
  .addEdge("retrieve", "synthesize")
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
