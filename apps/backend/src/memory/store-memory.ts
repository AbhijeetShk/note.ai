import { embeddings, supabase } from "../index.js";
import { memoryStore } from "./vector-store.js";

export async function storeMemory(
  memory: string,
  userId: string
) {
  const embedding =
  await embeddings.embedQuery(memory);

await supabase
  .from("memories")
  .insert({
    content: memory,
    embedding,
    user_id: userId,

    metadata: {
      user_id: userId,
    },
  });
  // await memoryStore.addDocuments([
  //   {
  //     pageContent: memory,

  //     metadata: {
  //       user_id: userId,
  //     },
  //   },
  // ]);
  console.log(
  "MEMORY STORED", {
  memory,
  userId,
}
);
}