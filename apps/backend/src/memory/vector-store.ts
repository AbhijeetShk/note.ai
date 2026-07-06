import { SupabaseVectorStore } from "@langchain/community/vectorstores/supabase";
import { supabase } from "../config/supabase.js";
import { embeddings } from "../config/embeddings.js";


export const memoryStore =
  new SupabaseVectorStore(
    embeddings,
    {
      client: supabase as any,
      tableName: "memories",
      queryName: "match_memories",
    }
  );