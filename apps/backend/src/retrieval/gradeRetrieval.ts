import { plannerLLM } from "../index.js";
import { GraphState } from "../types/state.js";
import { RetrievalGradeSchema } from "./schema.js";
console.log(
  "NEW RETRIEVAL GRADER LOADED"
);
export async function gradeRetrieval(
  state: typeof GraphState.State
) {
  console.log(
    "ENTERING ah gradeRetrieval"
  );

  const question =
    state.messages.at(-1)?.content ??
    "";

  const context =
    state.compressedContext;

  const structured =
    plannerLLM.withStructuredOutput(
      RetrievalGradeSchema
    );

  const result =
    await structured.invoke(`
Question:
${question}

Retrieved Context:
${context}

Task:

Evaluate whether the retrieved context is relevant
to answering the user's question.

A document is relevant if it contains information
that would help answer the question.

Examples:

Question:
Explain RAG architectures

Retrieved:
RAG systems use retrieval and generation components.

Relevant:
true

Question:
Explain RAG architectures

Retrieved:
Stoner is a novel by John Williams.

Relevant:
false

Return:

- relevant (boolean)
- score (0-10)
- reasoning

Scoring Guide:

0-2:
Completely unrelated

3-4:
Weakly related

5-6:
Partially relevant

7-8:
Mostly relevant

9-10:
Highly relevant and directly useful
`);

//   console.log({
//     retrievalRelevant:
//       result.relevant,

//     retrievalScore:
//       result.score,

//     reasoning:
//       result.reasoning,
//   });
  console.log(
    "completed gradeRetrieval", result
  );
  return {
    retrievalRelevant:
      result.relevant,

    retrievalQuality:
      result.relevant
        ? "good"
        : "bad",

    retrievalScore:
      result.score,
  };
}