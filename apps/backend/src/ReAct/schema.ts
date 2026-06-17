import { z } from "zod";

export const ReActSchema =
  z.object({
    thought: z.string(),

    action: z.enum([
      "search_documents",
      "calculator",
      "finish",
    ]),

    input: z.string(),
  });