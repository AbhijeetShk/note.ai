import { GraphState }
from "../types/state.js";

export function plannerConfidenceRouter(
  state: typeof GraphState.State
) {
  const confidence =
    state.executionPlan
      ?.confidence ?? 0;

  if (confidence < 0.5) {
    return "clarify";
  }

  return "execute";
}