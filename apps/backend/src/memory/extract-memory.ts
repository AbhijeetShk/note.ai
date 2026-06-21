import { plannerLLM } from "../index.js";
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
    plannerLLM.withStructuredOutput(
      MemorySchema
    );

  const result =
  await structured.invoke(`
Extract a concrete memory from the conversation.

Rules:

- Return a specific fact.
- Do not return categories.
- Do not repeat these instructions.
- Write the memory as a standalone statement.

Good Examples:

Conversation:
user: I am building an AI agent platform

Memory:
User is building an AI agent platform.

Conversation:
user: My preferred language is TypeScript

Memory:
User prefers TypeScript.

Conversation:
user: I want to start an XR company

Memory:
User wants to build an XR company.

Bad Examples:

user preferences
long-term goals
projects
important context

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