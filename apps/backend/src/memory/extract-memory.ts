import { llm } from "../index.js";
import { GraphState } from "../types/state.js";
import { MemorySchema } from "./schema.js";

export async function extractMemory(
  state: typeof GraphState.State
) {
  const conversation =
    state.messages
      .map(
        (m) =>
          `${m.role}: ${m.content}`
      )
      .join("\n");

  const structured =
    llm.withStructuredOutput(
      MemorySchema
    );

  const result =
    await structured.invoke(`
Extract a memory worth saving.

Store only:
- user preferences
- long-term goals
- projects
- recurring facts
- important personal context

Do not store:
- temporary questions
- one-off requests
- greetings

Conversation:
${conversation}
`);

  return {
    extractedMemory:
      result.shouldStore
        ? result.memory
        : "",
  };
}