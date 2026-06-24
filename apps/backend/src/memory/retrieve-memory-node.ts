import { retrieveMemory }
from "./retrieve-memory.js";

import { GraphState }
from "../types/state.js";

export async function retrieveMemoryNode(
  state: typeof GraphState.State
) {
  const question =
    state.messages.at(-1)?.content || "";

  const memories =
    await retrieveMemory(
      question,
      state.userId
    );

  return {
    observations: [
      {
        tool: "memory_search",
        status: "success",
        result: memories
          .map(m => m.pageContent)
          .join("\n"),
      },
    ],
  };
}