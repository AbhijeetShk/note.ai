import { z } from "zod";

export const CitationVerificationSchema =
  z.object({
    supported: z.boolean(),

    reasoning: z.string(),

    unsupportedClaims:
      z.array(z.string()),
  });