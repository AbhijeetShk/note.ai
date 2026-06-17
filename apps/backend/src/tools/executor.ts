import { GraphState } from "../types/state.js";
import { tools } from "./index.js";
export async function executeTools(
  state: typeof GraphState.State
) {
  const action =
    state.nextAction;

  if (
    !action ||
    action.tool === "finish"
  ) {
    return {};
  }

  let result = "";

  if (
    action.tool ===
    "search_documents"
  ) {
    result =
      await tools.search_documents.invoke({
        query:
          action.input,
      });
  }

  if (
    action.tool ===
    "calculator"
  ) {
    result =
      await tools.calculator.invoke({
        expression:
          action.input,
      });
  }

  return {
    observations: [
      {
        tool:
          action.tool,
        result,
      },
    ],

    iterationCount:
      state.iterationCount + 1,
  };
}