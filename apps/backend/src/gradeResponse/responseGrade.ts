import { plannerLLM} from "../index.js";
import { buildGroundingContext } from "../memory/grounding-context.js";
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
    plannerLLM.withStructuredOutput(
      ResponseGradeSchema
    );
const groundingContext =
  buildGroundingContext(state);
  const result =
    await structured.invoke(`
Question:
${question}

Retrieved Context:
${groundingContext}

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