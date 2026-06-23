import { evaluateEvidence } from "../evidence/evaluateEvidence.js";
import { buildGroundingContext } from "../memory/grounding-context.js";
import { GraphState } from "../types/state.js";

export async function evaluateFinish(state: typeof GraphState.State) {
  const confidence = state.reasoningTrace.at(-1)?.confidence ?? 0;

  const retrievalScore = state.retrievalScore ?? 0;

  const informationGain = state.informationGain ?? 1;
  const trustScore =
  0.4 * confidence +
  0.3 * (retrievalScore / 10) +
  0.3 * (informationGain === 0 ? 1 : 0);
const question =
  state.messages.at(-1)?.content ?? "";

const groundingContext =
  buildGroundingContext(state);

const evidence =
  await evaluateEvidence(
    question,
    groundingContext
  );
  //too strict, contradicts with confidence score
  // const finishApproved =
  // trustScore >= 0.75 ||
  // state.iterationCount >= 5;

// const finishApproved =
//   confidence >= 0.9 ||
//   informationGain === 0 ||  //new reasoning step produced no new information
//   trustScore >= 0.75 ||
//   state.iterationCount >= 5;
  // const finishApproved =
  //   confidence >= 0.9 ||
  //   informationGain === 0 ||
  //   trustScore >= 0.75 ||
  //   finishAttempts >= 2 ||
  //   state.iterationCount >= 5;
  const finishAttempts =
    (state.finishAttempts ?? 0) + 1;


const finishApproved =
  evidence.sufficient &&
  (
    confidence >= 0.9 ||
    trustScore >= 0.75 ||
    informationGain === 0 ||
    state.iterationCount >= 5
  );
  console.log({
  confidence,
  retrievalScore,
  informationGain,
  finishApproved,
});
  //If want too permissive:
  //   const finishApproved =
  //     confidence >= 0.7 ||
  //     retrievalScore >= 8 ||
  //     informationGain === 0 ||
  //     state.iterationCount >= 5;

//Simpler:
//   const finishApproved =
//     (confidence >= 0.7 && retrievalScore >= 7) ||
//     informationGain === 0 ||
//     state.iterationCount >= 5;
  return {
    finishApproved,
    evidenceSufficient:
    evidence.sufficient,
    finishAttempts
  };
}
