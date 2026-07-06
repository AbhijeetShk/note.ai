import { HuggingFaceInferenceEmbeddings }
from "@langchain/community/embeddings/hf";

export const embeddings =
  new HuggingFaceInferenceEmbeddings({
    apiKey:
      process.env.HUGGINGFACEHUB_API_KEY,

    model:
      "BAAI/bge-base-en-v1.5",
  });