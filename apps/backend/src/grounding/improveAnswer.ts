import { synthesisLLM } from "../index.js";

export async function improveAnswer(
  state: any
) {
  // console.log("ENTERING improveAnswer");
  console.log("REFLECTION UPDATE", {
  before: state.reflectionCount,
  after: state.reflectionCount + 1,
});
  const question =
    state.messages.at(-1)?.content ?? "";

  const answer =
    state.synthesis;

  const evaluation =
    JSON.stringify(
      state.responseGrade,
      null,
      2
    );

  const improved =
    await synthesisLLM.invoke(`
Question:
${question}

Current Answer:
${answer}

Evaluation:
${evaluation}

Improve the answer using
the evaluation feedback.
`);

  return {
    synthesis:
      String(improved.content),

    reflectionCount:
      state.reflectionCount + 1,
  };
}