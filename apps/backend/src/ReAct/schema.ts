import { z } from "zod";

export const ReActSchema = z.object({
  thought: z.string(),

  reasoning: z.string(),

  action: z.enum([
    "search_documents",
    "calculator",
    "finish",
  ]),

  input: z.string(),

  confidence: z.number()
    .min(0)
    .max(1),
}); 