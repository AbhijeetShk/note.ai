import { buildRetriever } from "../index.js";


export async function denseRetrieve(
  query: string,
  k: number,
  searchType: "mmr" | "similarity",
  source?: string
) {
  const docs =
    await buildRetriever(
      k,
      searchType,
      source
    ).invoke(query);

  return docs.map((doc, rank) => ({
    id:
      doc.metadata?.id ??
      doc.metadata?.document_id,

    rank,

    document: doc,
  }));
}