import { plannerLLM } from "../index.js";
import { GraphState } from "../types/state.js";
import { ExecutionPlanSchema } from "./executionPlanSchema.js";

export async function plan(state: typeof GraphState.State) {
  const question = state.messages.at(-1)?.content || "";

  const structured = plannerLLM.withStructuredOutput(ExecutionPlanSchema);

  const result = await structured.invoke(`
You are a cognitive planner.

Decide:

1. Intent
2. Information source
3. Retrieval depth
4. Tool policy
Tool Policies:

restricted
- memory lookup only
- no document search

normal
- memory + documents

research
- all tools available
Question:

${question}

Return structured output only.
`);
  let allowedTools: (
    | "search_documents"
    | "calculator"
    | "memory_search"
    | "finish"
  )[] = [];

  switch (result.toolPolicy) {
    case "restricted":
      allowedTools = ["memory_search", "finish"];
      break;

    case "normal":
      allowedTools = ["search_documents", "memory_search", "finish"];
      break;

    case "research":
      allowedTools = [
        "search_documents",
        "memory_search",
        "calculator",
        "finish",
      ];
      break;
  }
  console.log("EXECUTION PLAN", {
    intent: result.intent,

    source: result.source,

    retrievalMode: result.retrievalMode,

    toolPolicy: result.toolPolicy,

    confidence: result.confidence,

    reasoning: result.reasoning,

    allowedTools,
  });
  return {
    executionPlan: result,

    allowedTools,

    reasoningLoopCount: 0,

    intent: result.intent,

    retrievalMode: result.retrievalMode,

    retrievalSource: result.source,
  };
}
