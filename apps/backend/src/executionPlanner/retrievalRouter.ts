import { GraphState }
from "../types/state.js";

export function retrievalRouter(
  state: typeof GraphState.State
) {
  const source =
    state.executionPlan?.source;

  switch (source) {
    case "memory":
      return "retrieve_memory";

    case "documents":
      return "query_rewrite";

    case "hybrid":
      return "hybrid_retrieve";

    case "tools":
      return "reason";

    default:
      return "query_rewrite";
  }
}