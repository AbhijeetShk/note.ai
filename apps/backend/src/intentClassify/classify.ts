import { plannerLLM } from "../index.js";
import { GraphState } from "../types/state.js";
import { IntentSchema } from "./schema.js";

export async function classify(
  state: typeof GraphState.State
) {
  const question =
    state.messages.at(-1)?.content ?? "";

  const structured =
    plannerLLM.withStructuredOutput(
      IntentSchema
    );

  const result =
    await structured.invoke(`
Classify the user message.

question:
- asking for information

research:
- requires retrieval, search,
  analysis, comparison

memory:
- user shares information about themselves
- user shares ongoing projects
- user shares long-term goals
- user shares preferences
- user shares personal context
- user shares background information
- user shares something worth remembering

Examples:

"I am building an AI agent platform"

"My project uses LangGraph"

"I prefer TypeScript"

"I want to build an XR company"

"I am working on aiNote"

task:
- asking the assistant to perform
  an action or workflow

clarify:
- too vague to answer

Message:
${question}
`);
console.log("classified intent:", result);
  return {
    intent: result.intent,
  };
}