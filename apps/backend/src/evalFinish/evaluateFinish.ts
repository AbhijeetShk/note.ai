import { GraphState } from "../types/state.js";

export async function evaluateFinish(
  state: typeof GraphState.State
) {
  const confidence =
    state.reasoningTrace.at(-1)
      ?.confidence ?? 0;

  const retrievalScore =
    state.retrievalScore ?? 0;

  const finishApproved =
    confidence >= 0.7 ||
    retrievalScore >= 8 ||
    state.iterationCount >= 5;

  return {
    finishApproved,
  };
}