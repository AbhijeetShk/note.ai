import { GraphState }
from "../types/state.js";

export function retrievalQualityRouter(
  state: typeof GraphState.State
) {
  if (
    state.retrievalRelevant
  ) {
    return "reason";
  }

  if (
    state.retryCount >= 2
  ) {
    return "reason";
  }

  return "retry";
}