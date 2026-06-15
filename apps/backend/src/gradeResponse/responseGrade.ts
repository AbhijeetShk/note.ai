import { llm } from "../index.js";
import { ResponseGradeSchema }
from "./schema.js";

export async function gradeResponse(
  state: any
) {
  const question =
    state.messages.at(-1)?.content ?? "";

  const answer =
    state.synthesis;

  const context =
    state.compressedContext;

  const structured =
    llm.withStructuredOutput(
      ResponseGradeSchema
    );

  const result =
    await structured.invoke(`
Question:
${question}

Retrieved Context:
${context}

Answer:
${answer}

Evaluate:

1. Correctness
2. Completeness
3. Clarity
4. Grounding

Return scores from 1-10.
`);

  return {
    responseGrade:
      result,
  };
}