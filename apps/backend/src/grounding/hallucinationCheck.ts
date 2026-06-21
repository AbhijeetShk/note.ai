import { plannerLLM, llm } from "../index.js";
import { HallucinationSchema }
from "./hallucinationSchema.js";

export async function hallucinationCheck(
  state: any
) {
  // console.log("ENTERING hallucinationCheck");
  const question =
    state.messages.at(-1)?.content ?? "";

  const context =
    state.compressedContext;

  const answer =
    state.synthesis;

  const structured =
    synthesisLLM.withStructuredOutput(
      HallucinationSchema
    );

  const result =
    await structured.invoke(`
Question:
${question}

Retrieved Context:
${context}

Generated Answer:
${answer}

Determine whether the answer
contains information that is not
supported by the retrieved context.

Return:
- hallucinated
- confidence
- reasoning
`);

  return {
    hallucinationCheck:
      result,
  };
}