import { GraphState } from "../types/state.js";
import { retrieveMemory } from "./retrieve-memory.js";
import { storeMemory } from "./store-memory.js";

export async function writeMemory(
  state: typeof GraphState.State
) {
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