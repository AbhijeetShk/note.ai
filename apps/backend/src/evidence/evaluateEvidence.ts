import { plannerLLM } from "../index.js";
import { EvidenceSchema } from "./schema.js";

export async function evaluateEvidence(
  question: string,
  context: string
) {
  const structured =
    plannerLLM.withStructuredOutput(
      EvidenceSchema
    );

  return structured.invoke(`
Question:
${question}

Available Evidence:
${context}

Determine whether the evidence
is sufficient to answer the question.

Important:

Sufficient means:

- the answer can be grounded
- the answer can be supported
- the answer does not require guessing

Return:

- sufficient
- confidence
- reasoning
`);
}