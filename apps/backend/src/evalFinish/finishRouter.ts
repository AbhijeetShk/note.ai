import { GraphState } from "../types/state.js";

export function finishRouter(
  state: typeof GraphState.State
) {
  console.log(
    "ENTERING finishRouter"
  );

  if (
    state.finishApproved
  ) {
    return "synthesize";
  }

  return "reason";
}