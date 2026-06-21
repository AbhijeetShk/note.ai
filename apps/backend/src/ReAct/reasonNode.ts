import { plannerLLM} from "../index.js";
import { memorySupportsQuestion } from "../memory/memory-relevance.js";
import { GraphState } from "../types/state.js";
import { ReActSchema } from "./schema.js";

export async function reason(state: typeof GraphState.State) {
  console.log("ENTERING reason");
  console.log({
    messages: state.messages.length,

    observations: state.observations.length,

    actions: state.actionHistory.length,

    thoughts: state.reasoningTrace.length,
  });
  const question = state.messages.at(-1)?.content ?? "";

  const thoughts = state.reasoningTrace
    .slice(-3)
    .map(
      (t) => `
Thought:
${t.thought}

Reasoning:
${t.reasoning}

Action:
${t.action}

Confidence:
${t.confidence}
`,
    )
    .join("\n\n");
const actions = state.actionHistory
  .slice(-5)
  .map(
    (a, i) =>
      `${i + 1}. ${a.tool}: ${a.input}`
  )
  .join("\n");

  const observations = state.observations
    .slice(-3)
    .map(
      (o) =>
        `[${o.status}]
${o.tool}: ${o.result}`,
    )
    .join("\n");
  const structured = plannerLLM.withStructuredOutput(ReActSchema);
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
IMPORTANT:

If the same tool has already been
called with substantially similar
input, do NOT call it again.

Use the observations already
available and choose finish.

Tool Reuse Policy:

Before selecting a tool:

- Check previous tool calls.

- If a previous tool call already explored
  substantially similar information,
  do not call the tool again.

Examples:

"AI agents"
"AI agent systems"
"agentic AI"

should be treated as similar.

Prefer finish when additional tool calls
are unlikely to produce meaningfully new information.

Memory Search Policy:

If a memory_search observation directly answers
the user's question, choose finish.

Do not call memory_search again unless:
- the memory result was empty
- the memory result was irrelevant
- the memory result created a new question
that requires additional retrieval

A successful memory retrieval that directly
answers the user's question should terminate
reasoning and select finish.

Memory Query Policy:

When using memory_search:

- Prefer the user's question as the query.

- Do not invent broad phrases such as:
  "previous project"
  "user information"
  "context"

- Use the most relevant part of the user's question.

Examples:

Question:
"What project am I working on?"

memory_search:
"current project"

Question:
"What language do I prefer?"

memory_search:
"preferred language"
Previous Observations:
${observations}

Current Iteration:
${state.iterationCount}

If Current Iteration >= 4,
you should choose finish unless a tool call is absolutely required.

Previous Information Gain:
${state.informationGain}

If information gain is low,
prefer finish.

Do not repeatedly call tools
that return similar information.

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

Return a JSON object with:

- thought:
  short reasoning summary

- reasoning:
  detailed reasoning for why
  this action was chosen

- action:
  one of:
  search_documents
  calculator
  memory_search
  finish

- input:
  tool input
  (empty string if finish)

- confidence:
  number between 0 and 1
`);
  console.log("ACTION:", result.action, result.input);
  console.log("ITERATION:", state.iterationCount);
  console.log(
    "TOOL EXECUTED:",
    result.action,
    "ITERATION:",
    state.iterationCount + 1,
  );
  console.log("REASONING:", result.reasoning);
  // const lastAction = state.actionHistory.at(-1);

const recentActions =
  state.actionHistory.slice(-3);

const duplicateToolCall =
  recentActions.some(
    (a) =>
      a.tool === result.action &&
      a.input
        .toLowerCase()
        .trim() ===
      result.input
        .toLowerCase()
        .trim()
  );

//CONTROL HEURISTICS IMPLEMENTATION

const memoryObservation =
  state.observations.find(
    (o) =>
      o.tool === "memory_search" &&
      o.status === "success" &&
      o.result &&
      o.result !== "[]"
  );

if (memoryObservation) {
  const support =
    await memorySupportsQuestion(
      question,
      memoryObservation.result
    );

  if (support.relevant) {
    return {
      nextAction: {
        tool: "finish",
        input: "",
      },

      reasoningTrace: [
        {
          thought:
            "Memory answers question",

          reasoning:
            support.reasoning,

          action: "finish",

          input: "",

          confidence: 0.95,
        },
      ],
    };
  }
}

// if (memoryObservation) {
//   return {
//     nextAction: {
//       tool: "finish",
//       input: "",
//     },

//     reasoningTrace: [
//       {
//         thought:
//           "Relevant memory retrieved",

//         reasoning:
//           "Memory search returned information that can answer the question.",

//         action: "finish",

//         input: "",

//         confidence: 0.95,
//       },
//     ],
//   };
// }
// CONTROL HEURISTICES DONE ---:
if (duplicateToolCall) {
  return {
    nextAction: {
      tool: "finish",
      input: "",
    },

    reasoningTrace: [
      {
        thought:
          "Duplicate tool call detected",

        reasoning:
          "Previous tool execution already explored similar information",

        action: "finish",

        input: "",

        confidence: 0.9,
      },
    ],
  };
}
console.log("reason node", {result})
if (
  state.informationGain === 0 &&
  result.action === "search_documents"
) {
  return {
    nextAction: {
      tool: "finish",
      input: "",
    },
  };
}
  return {
    nextAction: {
      tool: result.action,
      input: result.input,
    },

    reasoningTrace: [
      {
        thought: result.thought,

        reasoning: result.reasoning,

        action: result.action,

        input: result.input,

        confidence: result.confidence,
      },
    ],
  };
}
