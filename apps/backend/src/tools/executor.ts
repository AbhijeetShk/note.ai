import { retrieveMemory } from "../memory/retrieve-memory.js";
import { GraphState } from "../types/state.js";
import { tools } from "./index.js";
export async function executeTools(state: typeof GraphState.State) {
  const action = state.nextAction;
console.log("ITERATION UPDATE", {
  before: state.iterationCount,
  after: state.iterationCount + 1,
});
  if (!action || action.tool === "finish") {
    return {};
  }

let result = "";

let status:
  | "success"
  | "error" = "success";

  if (action.tool === "search_documents") {
    try {
      result = await tools.search_documents.invoke({
        query: action.input,
      });
    } catch (error) {
        status = "error";

  
      result = `TOOL_ERROR: ${String(error)}`;
    }
  }

  if (action.tool === "calculator") {
    try {
      result = await tools.calculator.invoke({
         expression: action.input,
      });
    } catch (error) {
       status = "error";
      result = `TOOL_ERROR: ${String(error)}`;
    }
  }

if (
  action.tool ===
  "memory_search"
) {
  try {
    result =
      await tools.memory_search.invoke({
        query: action.input,
        userId: state.userId,
      });
  } catch (error) {
    status = "error";

    result =
      `TOOL_ERROR: ${String(error)}`;
  }
}
const previous =
  state.observations.at(-1)?.result ?? "";

let informationGain = 1;

if (
  previous &&
  previous === result
) {
  informationGain = 0;
}

  return {
    actionHistory: [
      {
        tool: action.tool,
        input: action.input,
      },
    ],

observations: [
  {
    tool: action.tool,
    status,
    result,
  },
],

    iterationCount: state.iterationCount + 1,
    informationGain,
  };
}
