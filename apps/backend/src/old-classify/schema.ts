import { z } from "zod";

export const ClassifySchema =
  z.object({
    route: z.enum([
      "simple_rag",
      "deep_rag",
      "clarify",
      "memory",
    ]),
  });
