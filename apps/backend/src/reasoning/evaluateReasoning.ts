import { plannerLLM } from "../index.js";
import { GraphState }
from "../types/state.js";
import { ReasoningEvaluationSchema } from "./evaluateReasoningSchema.js";



export async function evaluateReasoning(
  state: typeof GraphState.State
) {
  console.log(
    "ENTERING evaluateReasoning"
  );

  const structured =
    plannerLLM.withStructuredOutput(
      ReasoningEvaluationSchema
    );

  const latestThought =
    state.reasoningTrace
      .slice(-3)
      .map(
        r =>
          `
Thought:
${r.thought}

Action:
${r.action}

Input:
${r.input}
`
      )
      .join("\n");

  const observations =
    state.observations
      .slice(-5)
      .map(
        o =>
          `
Tool:
${o.tool}

Status:
${o.status}

Result:
${o.result}
`
      )
      .join("\n");

  const result =
    await structured.invoke(`
You are evaluating an AI agent.

Question:
${state.messages.at(-1)?.content}

Recent Reasoning:
${latestThought}

Observations:
${observations}

Determine:

1. Is more reasoning needed?
2. Is evidence missing?
3. Is another tool call needed?
4. Is the agent attempting to finish too early?

Return continueReasoning=true only if
the agent should continue working.
`);

return {
  reasoningEvaluation: result,

  reasoningLoopCount:
    state.reasoningLoopCount + 1,
};
}