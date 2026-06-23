import { z } from "zod";

export const EvidenceSchema =
  z.object({
    sufficient:
      z.boolean(),

    confidence:
      z.number()
        .min(0)
        .max(1),

    reasoning:
      z.string(),
  });