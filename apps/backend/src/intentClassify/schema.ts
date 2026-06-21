import { z } from "zod";

export const IntentSchema = z.object({
  intent: z.enum([
    "question",
    "research",
    "memory",
    "task",
    "clarify",
  ]),

  confidence: z.number()
    .min(0)
    .max(1),

  reasoning: z.string(),
});