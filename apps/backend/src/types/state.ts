import { Annotation } from "@langchain/langgraph";
type Message = {
  role: "user" | "assistant" | "system";
  content: string;
};
export const GraphState = Annotation.Root({
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
  retrievalMode: Annotation<"fast" | "balanced" | "accurate">({
    reducer: (_, update) => update,
    default: () => "balanced",
  }),
  rerankedDocs: Annotation<any[]>({
    reducer: (_, update) => update,
    default: () => [],
  }),
  compressedContext: Annotation<string>({
    reducer: (_, update) => update,
    default: () => "",
  }),
  plan: Annotation<string[]>({
    reducer: (_, update) => update,
    default: () => [],
  }),


  toolCalls: Annotation<
    {
      tool: string;
      input: any;
    }[]
  >({
    reducer: (_, update) => update,
    default: () => [],
  }),

observations: Annotation<
  {
    tool: string;
    status: "success" | "error";
    result: string;
  }[]
>({
  reducer: (state, update) => [
    ...state,
    ...update,
  ],
  default: () => [],
}),
  toolStatus: Annotation<"continue" | "done">({
  reducer: (_, update) => update,
  default: () => "done",
}),
rewrittenQueries: Annotation<string[]>({
  reducer: (_, update) => update,
  default: () => [],
}),
retrievalScore: Annotation<number>({
  reducer: (_, update) => update,
  default: () => 0,
}),
retryCount: Annotation<number>({
  reducer: (_, update) => update,
  default: () => 0,
}),
citations: Annotation<
  {
    source: string;
    page: number | null;
    chunkId: number | null;
  }[]
>({
  reducer: (_, update) => update,
  default: () => [],
}),
citationVerification: Annotation<{
  supported: boolean;
  reasoning: string;
  unsupportedClaims: string[];
} | null>({
  reducer: (_, update) => update,
  default: () => null,
}),
hallucinationCheck: Annotation<{
  hallucinated: boolean;
  confidence: number;
  reasoning: string;
} | null>({
  reducer: (_, update) => update,
  default: () => null,
}),
responseGrade: Annotation<{
  correctness: number;
  completeness: number;
  clarity: number;
  grounding: number;
  finalScore: number;
  reasoning: string;
} | null>({
  reducer: (_, update) => update,
  default: () => null,
}),
reflectionCount: Annotation<number>({
  reducer: (_, update) => update,
  default: () => 0,
  
}),
nextAction: Annotation<{
  tool:
    | "search_documents"
    | "calculator"
    | "memory_search"
    | "finish";

  input: string;
} | null>({
  reducer: (_, update) => update,
  default: () => null,
}),
reasoningTrace: Annotation<
  {
    thought: string;
    action: string;
    input: string;
    confidence?: number;
  }[]
>({
  reducer: (state, update) => [
    ...state,
    ...update,
  ],
  default: () => [],
}),
iterationCount: Annotation<number>({
  reducer: (_, update) => update,
  default: () => 0,
}),
actionHistory: Annotation<
  {
    tool: string;
    input: string;
  }[]
>({
  reducer: (state, update) => [
    ...state,
    ...update,
  ],
  default: () => [],
}),
userId: Annotation<string>({
  reducer: (_, update) => update,
  default: () => "",
}),
extractedMemory: Annotation<string>({
  reducer: (_, update) => update,
  default: () => "",
}),
});
