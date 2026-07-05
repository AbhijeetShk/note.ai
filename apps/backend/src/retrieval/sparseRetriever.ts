import { supabase } from "../index.js";

export async function sparseRetrieve(
  query: string,
  limit = 10
) {
  const { data, error } =
    await supabase.rpc(
      "search_documents_fts",
      {
        query_text: query,
        match_count: limit,
      }
    );

  if (error) throw error;

  return data;
}