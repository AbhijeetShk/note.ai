import { Document } from "@langchain/core/documents";
import { SupabaseClient } from "@supabase/supabase-js";
import { EmbeddingsInterface } from "@langchain/core/embeddings";
import {childSplitter} from "./childSplitter.js";
import { SupabaseVectorStore } from "@langchain/community/vectorstores/supabase";
import { ParentDocument } from "../../types/retrieval-type.js";

export interface ChildMetadata {
  parent_id: string;
  child_index: number;
  document_id: string;
  source: string;
  user_id: string;
  [key: string]: unknown;
}

export interface ChildDocument extends Document<ChildMetadata> {}

export async function buildAndStoreChildren(
  storedParents: ParentDocument[],
  documentId: string,
  path: string,
  embeddings: EmbeddingsInterface,
  supabase: SupabaseClient,
  userId: string,
): Promise<number> {
  const childDocs: ChildDocument[] = [];

  for (const parent of storedParents) {
    const children =
      await childSplitter.createDocuments([
        parent.content,
      ]);

    const typedChildren: ChildDocument[] = children.map((child, index) => ({
      ...child,
      metadata: {
        ...(child.metadata as Record<string, unknown>),
        parent_id: parent.id.toString(),
        child_index: index,
        document_id: documentId,
        source: path,
        user_id: userId,
      },
    }));

    childDocs.push(...typedChildren);
  }

  await SupabaseVectorStore.fromDocuments(
    childDocs,
    embeddings,
    {
      client: supabase,
      tableName: "documents",
      queryName: "match_documents",
    },
  );

  return childDocs.length;
}