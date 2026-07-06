import { supabase } from "../config/supabase.js";

type SparseSearchResult = {
  id: number;
  content: string;
  metadata: Record<string, unknown>;
  rank: number;
};

export async function sparseRetrieve(
  query: string,
  limit = 10,
) {
  const { data, error } =
    await supabase.rpc(
      "search_documents_fts",
      {
        query_text: query,
        match_count: limit,
      },
    );

  if (error) throw error;

  return (
    (data as SparseSearchResult[] | null)?.map(
      (doc: SparseSearchResult, rank: number) => ({
        id: doc.id,
        rank,
        document: doc,
      }),
    ) ?? []
  );
}