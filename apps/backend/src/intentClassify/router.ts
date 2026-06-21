import { GraphState } from "../types/state.js";

export function intentRouter(
  state: typeof GraphState.State
) {
  console.log(
    "INTENT ROUTER:",
    state.intent
  );

  return state.intent;
}