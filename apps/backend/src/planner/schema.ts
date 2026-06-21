import { z } from "zod";

export const PlanSchema = z.object({
  reasoning: z.string(),

  steps: z.array(
    z.object({
      task: z.string(),

      tool: z.enum([
        "search_documents",
        "calculator",
        "none",
      ]),

      input: z.string(),
    })
  ),
});

export const RewriteSchema = z.object({
  queries: z.array(z.string()),
});



