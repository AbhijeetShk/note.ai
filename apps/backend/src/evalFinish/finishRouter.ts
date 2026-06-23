import { GraphState } from "../types/state.js";

export function finishRouter(
  state: typeof GraphState.State
) {
  console.log(
    "ENTERING finishRouter"
  );
console.log(
  "FINISH ROUTER STATE",
  {
    finishApproved:
      state.finishApproved,
    finishAttempts:
      state.finishAttempts,
  }
);
  if (
    state.finishApproved
  ) {
    return "synthesize";
  }

  if (
    state.finishAttempts >= 2
  ) {
    console.log(
      "MAX FINISH ATTEMPTS REACHED, forcing synthesize"
    );
    return "synthesize";
  }

  return "reason";
}