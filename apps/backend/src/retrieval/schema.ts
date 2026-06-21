import {z} from "zod";
export const RetrievalGradeSchema =
  z.object({
    relevant: z.boolean(),

    score: z.number()
      .min(0)
      .max(10),

    reasoning: z.string(),
  });