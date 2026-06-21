import { GraphState } from "../types/state.js";

export function buildGroundingContext(
  state: typeof GraphState.State
) {
  const memoryContext =
    state.observations
      .filter(
        (o) =>
          o.tool === "memory_search"
      )
      .map((o) => o.result)
      .join("\n");

  return `
DOCUMENTS:
${state.compressedContext}

MEMORIES:
${memoryContext}
`;
}