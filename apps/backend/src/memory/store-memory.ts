import { memoryStore } from "./vector-store.js";

export async function storeMemory(
  memory: string,
  userId: string
) {
  console.log(
  "MEMORY STORED"
);
  await memoryStore.addDocuments([
    {
      pageContent: memory,

      metadata: {
        user_id: userId,
      },
    },
  ]);
}