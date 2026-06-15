import { z } from "zod";

export const ResponseGradeSchema =
  z.object({
    correctness:
      z.number().min(1).max(10),

    completeness:
      z.number().min(1).max(10),

    clarity:
      z.number().min(1).max(10),

    grounding:
      z.number().min(1).max(10),

    finalScore:
      z.number().min(1).max(10),

    reasoning:
      z.string(),
  });