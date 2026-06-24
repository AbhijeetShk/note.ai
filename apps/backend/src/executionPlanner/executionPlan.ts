import { plannerLLM } from "../index.js";
import { GraphState } from "../types/state.js";
import { ExecutionPlanSchema } from "./executionPlanSchema.js";

export async function plan(
  state: typeof GraphState.State
) { 
  const question =
    state.messages.at(-1)?.content || "";

  const structured =
    plannerLLM.withStructuredOutput(
      ExecutionPlanSchema
    );

  const result =
    await structured.invoke(`
You are a cognitive planner.

Decide:

1. Intent
2. Information source
3. Retrieval depth

Question:

${question}

Return structured output only.
`);

  return {
    executionPlan: result,

    intent: result.intent,

    retrievalMode:
      result.retrievalMode,

    retrievalSource:
      result.source,
  };
}