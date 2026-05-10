import { ChatGroq } from "@langchain/groq";
import {
  StateGraph,
  Annotation,
  START,
  END,
} from "@langchain/langgraph";
import dotenv from "dotenv";

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
});

async function classify(state: typeof GraphState.State) {
  const response = await llm.invoke([
    {
      role: "system",
      content: "Classify the user query in one line.",
    },
    ...state.messages,
  ]);

  return {
    classification: response.content as string,
    messages: [
      {
        role: "assistant",
        content: `Classification: ${response.content}`,
      },
    ],
  };
}

async function doResearch(state: typeof GraphState.State) {
  const response = await llm.invoke([
    {
      role: "system",
      content: "Research the query based on previous classification.",
    },
    {
      role: "user",
      content: state.classification,
    },
  ]);

  return {
    research: response.content as string,
    messages: [
      {
        role: "assistant",
        content: `Research: ${response.content}`,
      },
    ],
  };
}

async function analyze(state: typeof GraphState.State) {
  const response = await llm.invoke([
    {
      role: "system",
      content: "Analyze the research deeply.",
    },
    {
      role: "user",
      content: state.research,
    },
  ]);

  return {
    analysis: response.content as string,
    messages: [
      {
        role: "assistant",
        content: `Analysis: ${response.content}`,
      },
    ],
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

export const graph = new StateGraph(GraphState)
  .addNode("classify", classify)
  .addNode("do_research", doResearch)
  .addNode("analyze", analyze)
  .addNode("synthesize", synthesize)

  .addEdge(START, "classify")
  .addEdge("classify", "do_research")
  .addEdge("do_research", "analyze")
  .addEdge("analyze", "synthesize")
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