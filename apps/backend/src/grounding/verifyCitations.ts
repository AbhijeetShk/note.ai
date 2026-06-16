import { graderLLM, llm } from "../index.js";
import { CitationVerificationSchema }
from "./schema.js";

export async function verifyCitations(
  state: any
) {
  
  // console.log("ENTERING verifyCitations");
  const question =
    state.messages.at(-1)?.content ?? "";

  const context =
    state.compressedContext;

  const answer =
    state.synthesis;
// console.log(
//   "ANSWER LENGTH:",
//   answer.length
// );

// console.log(
//   "CONTEXT LENGTH:",
//   context.length
// );

  const structured =
    llm.withStructuredOutput(
      CitationVerificationSchema
    );

  const result =
    await structured.invoke(`
Question:
${question}

Retrieved Context:
${context}

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
    citationVerification:
      result,
  };
}