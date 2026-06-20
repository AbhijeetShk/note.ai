import { GraphState } from "../types/state.js";

export function reactRouter(
  state: typeof GraphState.State
) {
  console.log(
    "ENTERING reactRouter"
  );

  const action =
    state.nextAction;

  if (!action) {
    return "evaluate_finish";
  }

  if (
    state.iterationCount >= 5
  ) {
    console.log(
      "MAX ITERATIONS REACHED"
    );

    return "evaluate_finish";
  }

  if (
    action.tool === "finish"
  ) {
    return "evaluate_finish";
  }

  return "execute_tools";
}