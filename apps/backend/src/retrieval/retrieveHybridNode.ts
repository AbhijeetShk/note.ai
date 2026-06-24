import { retrieveHybrid } from "../index.js";
import { retrieveMemory } from "../memory/retrieve-memory.js";
import { GraphState } from "../types/state.js";

export async function hybridRetrieve(state: typeof GraphState.State) {
  const question = state.messages.at(-1)?.content ?? "";
  const docs = await retrieveHybrid(question, state.retrievalMode);

  const memories = await retrieveMemory(question, state.userId);

  return {
    retrievedDocs: docs,

    observations: [
      {
        tool: "memory_search",

        status: "success",

        result: memories.map((m) => m.pageContent).join("\n"),
      },
    ],
  };
}
