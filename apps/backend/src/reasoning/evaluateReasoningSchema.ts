import { z } from "zod";

export const ReasoningEvaluationSchema =
  z.object({
    continueReasoning: z.boolean(),

    reasoning: z.string(),
  });

export type ReasoningEvaluation =
  z.infer<
    typeof ReasoningEvaluationSchema
  >;