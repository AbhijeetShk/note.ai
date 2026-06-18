import { memoryStore } from "./vector-store.js";

export async function storeMemory(
  memory: string,
  userId: string
) {
  await memoryStore.addDocuments([
    {
      pageContent: memory,

      metadata: {
        user_id: userId,
      },
    },
  ]);
}