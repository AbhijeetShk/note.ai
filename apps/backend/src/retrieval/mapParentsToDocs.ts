import { Document } from "@langchain/core/documents";
import { ParentDocument } from "../types/retrieval-type.js";


export function mapParentsToDocs(
  parents: ParentDocument[],
): Document[] {
  return parents.map(
    (parent) =>
      new Document({
        pageContent: parent.content,

        metadata: {
          ...parent.metadata,

          parent_id: parent.id,

          document_id:
            parent.document_id,
        },
      }),
  );
}