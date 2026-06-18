import { memoryStore } from "./vector-store.js";

export async function retrieveMemory(
  query: string,
  userId: string
) {
  const retriever =
    memoryStore.asRetriever({
      k: 5,
      filter: {
        user_id: userId,
      },
    });

  return retriever.invoke(query);
}