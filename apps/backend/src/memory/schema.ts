import { z } from "zod";

export const MemorySchema =
  z.object({
    shouldStore:
      z.boolean(),

    memory:
      z.string(),
  });