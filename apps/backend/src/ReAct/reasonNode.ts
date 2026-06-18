import { llm } from "../index.js";
import { GraphState } from "../types/state.js";
import { ReActSchema } from "./schema.js";

export async function reason(
  state: typeof GraphState.State
) {
  const question =
    state.messages.at(-1)?.content ?? "";

const thoughts =
  state.reasoningTrace.join("\n");

const actions =
  state.actionHistory
    .map(
      a =>
        `${a.tool}: ${a.input}`
    )
    .join("\n");

const observations =
  state.observations
    .map(
      o =>
        `[${o.status}]
${o.tool}: ${o.result}`
    )
    .join("\n");

  const structured =
    llm.withStructuredOutput(
      ReActSchema
    );
const result = await structured.invoke(`
You are an autonomous reasoning agent.

Question:
${question}

Available Tools:

search_documents
- Search indexed documents
- Use when information is missing

calculator
- Evaluate mathematical expressions
- Input should be only a valid expression
- Examples:
  2+2
  (15*8)/3
  sqrt(144)

memory_search
- Retrieve relevant memories
- Use when previous user context
  may help answer the question

finish
- Use only when sufficient information exists
  to answer the question

Previous Thoughts:
${thoughts}

Previous Actions:
${actions}

Previous Observations:
${observations}

Current Iteration:
${state.iterationCount}

Your task is to decide the next best action.

Guidelines:

1. Use search_documents when information
   required to answer the question is missing.

2. Use calculator only for numerical
   calculations.

3. Choose finish only when:
   - The question can be answered confidently
     from the available observations.
   - Additional tool usage is unlikely to
     improve the answer.

4. Avoid repeating identical tool calls
   unless there is a clear reason.

5. If a previous tool call returned an error,
   use the observation to decide an alternative
   action.

6. Think step-by-step before selecting
   the next action.

Return:
- thought
- action
- input
`);
return {
  nextAction: {
    tool: result.action,
    input: result.input,
  },

  reasoningTrace: [
    {
      thought: result.thought,
      action: result.action,
      input: result.input,
      confidence: result.confidence,
    },
  ],
};
}