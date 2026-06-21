import { GraphState } from "../types/state.js";

export function retrievalRouter(
  state: typeof GraphState.State
) {
  console.log(
    "ENTERING retrievalRouter"
  );

  if (
    !state.retrievalRelevant &&
    state.retryCount < 2
  ) {
    return "retry";
  }

  if (
    !state.retrievalRelevant
  ) {
    return "clarify";
  }

  return "planner";
}