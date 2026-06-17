import { GraphState } from "../types/state.js";
export function reactRouter(
  state: typeof GraphState.State
) {
  const action =
    state.nextAction;

  if (
    !action ||
    action.tool === "finish"
  ) {
    return "synthesize";
  }

  if (
    state.iterationCount >= 5
  ) {
    return "synthesize";
  }

  return "execute_tools";
}