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

  if (
    existing.length > 0
  ) {
    return {};
  }

  await storeMemory(
    state.extractedMemory,
    state.userId
  );

  return {};
}