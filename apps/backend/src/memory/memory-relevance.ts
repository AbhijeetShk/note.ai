import { plannerLLM } from "../index.js";
import { z } from "zod";

const MemoryRelevanceSchema = z.object({
  relevant: z.boolean(),
  reasoning: z.string(),
});

export async function memorySupportsQuestion(
  question: string,
  memory: string
) {
  const structured =
    plannerLLM.withStructuredOutput(
      MemoryRelevanceSchema
    );

  return structured.invoke(`
Question:
${question}

Memory:
${memory}

Does this memory directly help answer
the question?

Return:

- relevant
- reasoning
`);
}