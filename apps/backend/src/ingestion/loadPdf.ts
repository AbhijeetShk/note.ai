import { PDFLoader } from "@langchain/community/document_loaders/fs/pdf";
import { parentSplitter } from "./parentChild/parentSplitter.js";
import { storeParents } from "./parentChild/storeParentsHelper.js";
import { buildAndStoreChildren } from "./parentChild/buildAndStoreChildren.js";
import { embeddings } from "../config/embeddings.js";
import { supabase } from "../config/supabase.js";

const USER_ID = "df1f93ae-6827-4c42-b8a3-9a0e2e80784f";
export async function loadPdf(
  path: string,
  documentId?: string,
) {
  const docs =
    await new PDFLoader(path).load();

  const parentDocs =
    await parentSplitter.splitDocuments(
      docs,
    );

  const storedParents =
    await storeParents(
      parentDocs,
      documentId || path,
    );

  const childCount =
    await buildAndStoreChildren(
      storedParents,
      documentId || path,
      path,
      embeddings,
      supabase,
      USER_ID,
    );

  console.log(
    `Indexed ${childCount} child chunks`,
  );
}