import { memoryStore } from "./vector-store.js";

export async function
retrieveMemoryWithScores(
  query: string,
  userId: string
) {
  return memoryStore
    .similaritySearchWithScore(
      query,
      5,
      {
        user_id: userId,
      }
    );
}