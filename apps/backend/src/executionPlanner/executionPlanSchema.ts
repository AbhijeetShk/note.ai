import { z } from "zod";

export const ExecutionPlanSchema = z.object({
  intent: z.enum([
    "question",
    "research",
    "memory",
    "task",
    "clarify",
  ]),

  source: z.enum([
    "documents",
    "memory",
    "hybrid",
    "tools",
  ]),

  retrievalMode: z.enum([
    "fast",
    "balanced",
    "accurate",
  ]),

  toolPolicy: z.enum([
    "restricted",
    "normal",
    "research",
  ]),

  reasoning: z.string(),

  confidence: z.number(),
});

export type ExecutionPlan =
  z.infer<typeof ExecutionPlanSchema>;