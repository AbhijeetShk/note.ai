import { supabase } from "../index.js";

export async function fetchParents(
  docs: any[],
) {
  const parentIds = [
    ...new Set(
      docs
        .map(
          (doc) =>
            doc.metadata?.parent_id,
        )
        .filter(Boolean),
    ),
  ];

  const { data, error } =
    await supabase
      .from("parent_documents")
      .select("*")
      .in("id", parentIds);

  if (error) throw error;

  return data;
}