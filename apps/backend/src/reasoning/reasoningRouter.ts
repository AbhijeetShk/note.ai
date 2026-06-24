import { GraphState }
from "../types/state.js";

export function reasoningRouter(
  state: typeof GraphState.State
) {
  if (
    state.reasoningLoopCount >= 2
  ) {
    console.log(
      "Max reasoning loops reached"
    );

    return "evaluate_finish";
  }

  if (
    state.reasoningEvaluation
      ?.continueReasoning
  ) {
    return "reason";
  }

  return "evaluate_finish";
}