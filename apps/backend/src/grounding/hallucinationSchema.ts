import { z } from "zod";

export const HallucinationSchema =
  z.object({
    hallucinated:
      z.boolean(),

    confidence:
      z.number()
        .min(0)
        .max(1),

    reasoning:
      z.string(),
  });