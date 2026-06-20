import { checkpointer } from "./postgres.js";

export async function initCheckpointer() {
  await checkpointer.setup();
}