import { GraphState } from "../types/state.js";

export async function extractCitations(
  state: typeof GraphState.State
) {
  console.log("ENTERING extractCitations");
  const citations =
    state.rerankedDocs.map((doc: any) => ({
      source:
        doc.metadata?.source ??
        "unknown",

      page:
        doc.metadata?.loc
          ?.pageNumber ??
        doc.metadata?.page ??
        null,

      chunkId:
        doc.metadata?.chunk_id ??
        null,
    }));

  return {
    citations,
  };
}