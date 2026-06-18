import { SupabaseVectorStore } from "@langchain/community/vectorstores/supabase";
import { embeddings } from "../index.js";
import { supabase } from "../index.js";

export const memoryStore =
  new SupabaseVectorStore(
    embeddings,
    {
      client: supabase as any,
      tableName: "memories",
      queryName: "match_memories",
    }
  );