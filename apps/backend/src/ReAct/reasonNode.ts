import { llm } from "../index.js";
import { GraphState } from "../types/state.js";
import { ReActSchema } from "./schema.js";

export async function reason(
  state: typeof GraphState.State
) {
  const question =
    state.messages.at(-1)?.content ?? "";

  const observations =
    state.observations
      .map(
        o =>
          `${o.tool}: ${o.result}`
      )
      .join("\n");

  const structured =
    llm.withStructuredOutput(
      ReActSchema
    );

  const result =
    await structured.invoke(`
Question:
${question}

Previous Observations:
${observations}

Decide the next best action.

If enough information exists,
choose finish.
`);

  return {
    nextAction: {
      tool: result.action,
      input: result.input,
    },

    reasoningTrace: [
      result.thought,
    ],
  };
}