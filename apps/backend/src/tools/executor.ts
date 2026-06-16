import { GraphState } from "../types/state.js";
import { tools } from "./index.js";

export async function executeTools(
  state: typeof GraphState.State
) {
  // console.log("ENTERING executeTools");
  const observations = [];

  for (
    const call of state.toolCalls
  ) {
    if (
      call.tool === "none"
    )
      continue;

    if (call.tool === "search_documents") {
  const result =
    await tools.search_documents.invoke({
      query: call.input,
    });

  observations.push({
    tool: call.tool,
    result,
  });
}

if (call.tool === "calculator") {
  const result =
    await tools.calculator.invoke({
      expression: call.input,
    });

  observations.push({
    tool: call.tool,
    result,
  });
}}
}