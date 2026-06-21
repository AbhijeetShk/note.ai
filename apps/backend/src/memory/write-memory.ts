import { GraphState } from "../types/state.js";
import { retrieveMemory } from "./retrieve-memory.js";
import { storeMemory } from "./store-memory.js";

export async function writeMemory(
  state: typeof GraphState.State
) {
    console.log(
  "WRITING MEMORY",
  {
    memory:
      state.extractedMemory,
    user:
      state.userId,
  }
);
  if (
    !state.extractedMemory
  ) {
    return {};
  }

  const existing =
    await retrieveMemory(
      state.extractedMemory,
      state.userId
    );

const exactMatch =
  existing.some(
    (m) =>
      m.pageContent
        .toLowerCase()
        .trim() ===
      state.extractedMemory
        .toLowerCase()
        .trim()
  );

if (exactMatch) {
  return {};
}
  await storeMemory(
    state.extractedMemory,
    state.userId
  );

  return {};
}