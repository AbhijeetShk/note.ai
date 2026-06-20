import { graderLLM, llm } from "../index.js";
import { ResponseGradeSchema }
from "./schema.js";

export async function gradeResponse(
  state: any
) {
  console.log("ENTERING gradeResponse");
  const question =
    state.messages.at(-1)?.content ?? "";

  const answer =
    state.synthesis;

  const context =
    state.compressedContext;

  const structured =
    graderLLM.withStructuredOutput(
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
// console.log(
//   "FINAL SCORE gradeResponse():",
//   result.finalScore
// );
  return {
    responseGrade:
      result,
  };
}