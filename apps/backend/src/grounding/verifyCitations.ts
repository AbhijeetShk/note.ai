import { synthesisLLM } from "../index.js";
import { buildGroundingContext } from "../memory/grounding-context.js";
import { CitationVerificationSchema } from "./schema.js";

export async function verifyCitations(state: any) {
  console.log("ENTERING verifyCitations");
  console.log(
  "VERIFY STATE UPDATE",
  {
    hasCitationVerification:
      !!state.citationVerification,
  }
);
console.log(
  "STATE SIZES",
  {
    messages: state.messages.length,
    observations: state.observations.length,
    thoughts: state.reasoningTrace.length,
    actions: state.actionHistory.length,
  }
);
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
console.time("verify");
  const structured = synthesisLLM.withStructuredOutput(
    CitationVerificationSchema,
  );
console.timeEnd("verify");
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
console.log(
  "VERIFY RETURN",
  result
);
console.log("VERIFY STATE SIZE", {
  messages: state.messages.length,
  observations: state.observations.length,
  reasoningTrace: state.reasoningTrace.length,
  actionHistory: state.actionHistory.length,
});
  return {
    citationVerification: result,
  };
}
