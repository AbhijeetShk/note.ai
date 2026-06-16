import { llm } from "../index.js";
import { PlanSchema } from "./schema.js";
import { plannerPrompt } from "./prompt.js";
import { GraphState } from "../types/state.js";


export async function planner(
  state: typeof GraphState.State
) {
  // console.log("ENTERING planner");
  const question =
    state.messages[
      state.messages.length - 1
    ]?.content || "";

  const structured =
    llm.withStructuredOutput(
      PlanSchema
    );

  const plan =
    await structured.invoke([
      {
        role: "system",
        content: plannerPrompt,
      },
      {
        role: "user",
        content: question,
      },
    ]);
// console.log("PLAN GENERATED:", plan);
return {
  plan: plan.steps.map(
    (s) => s.task
  ),

  toolCalls:
    plan.steps.map((s) => ({
      tool: s.tool,
      input: s.input,
    })),
};
}