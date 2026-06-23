import { GraphState } from "../types/state.js";
import { supabase } from "../index.js";
import { retrieveMemory } from "./retrieve-memory.js";
import { storeMemory } from "./store-memory.js";

export async function writeMemory(
  state: typeof GraphState.State
) {
  console.log(
    "Entering write MEMORY",
    {
      memory: state.extractedMemory,
      user: state.userId,
    }
  );

  const memoryText = state.extractedMemory?.trim();
  if (!memoryText) {
    return {};
  }

  const { data: existing, error } =
    await supabase
      .from("memories")
      .select("id")
      .eq("user_id", state.userId)
      .eq("content", memoryText)
      .limit(1);

  if (error) {
    console.error("Memory exact-match check failed", error);
  }

  if (existing?.length) {
    console.log("Duplicate memory detected, skipping write", {
      memory: memoryText,
      user: state.userId,
    });
    return {};
  }

  await storeMemory(memoryText, state.userId);

  return {};
}