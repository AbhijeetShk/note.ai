import { synthesisLLM } from "../index.js";
import { buildGroundingContext } from "../memory/grounding-context.js";
import { CitationVerificationSchema } from "./schema.js";

export async function verifyCitations(state: any) {
  // console.log("ENTERING verifyCitations");
  const question = state.messages.at(-1)?.content ?? "";

  const context = state.compressedContext;

  const answer = state.synthesis;
  // console.log(
  //   "ANSWER LENGTH:",
  //   answer.length
  // );

  // console.log(
  //   "CONTEXT LENGTH:",
  //   context.length
  // );

  const structured = synthesisLLM.withStructuredOutput(
    CitationVerificationSchema,
  );

 const groundingContext =
  buildGroundingContext(state);
  const result = await structured.invoke(`
Question:
${question}

Retrieved Context:
${groundingContext}

Generated Answer:
${answer}

Determine whether every claim
in the answer is supported by
the retrieved context.

Return:
- supported
- reasoning
- unsupportedClaims
`);

  return {
    citationVerification: result,
  };
}
