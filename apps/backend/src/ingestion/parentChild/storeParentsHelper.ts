import { supabase } from "../../config/supabase.js";

export async function storeParents(
  parentDocs: any[],
  documentId: string,
) {
  const rows = parentDocs.map(
    (doc, index) => ({
      document_id: documentId,
      parent_index: index,
      content: doc.pageContent,
      metadata: doc.metadata,
    }),
  );

  const { data, error } =
    await supabase
      .from("parent_documents")
      .insert(rows)
      .select();

  if (error) throw error;

  return data;
}