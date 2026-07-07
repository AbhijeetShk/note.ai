import { Document } from "@langchain/core/documents";
import { InferenceClient } from "@huggingface/inference";

const hf = new InferenceClient(process.env.HUGGINGFACE_API_KEY);

export async function rerankParents(
  query: string,
  docs: Document[],
  topK = 10,
): Promise<Document[]> {

  if (docs.length <= 1) {
    return docs;
  }

  const pairs = docs.map(doc => ({
    text: doc.pageContent,
  }));

  const response =
    await hf.featureExtraction({
      model:
        "BAAI/bge-reranker-v2-m3",
      inputs: {
        query,
        passages: pairs,
      } as any,
    });
    

  const scoredDocs =
    docs.map((doc, i) => ({
      doc,
      score:
        Array.isArray(response)
          ? Number(response[i])
          : 0,
    }));

  return scoredDocs
    .sort((a, b) => b.score - a.score)
    .slice(0, topK)
    .map(item => item.doc);
}