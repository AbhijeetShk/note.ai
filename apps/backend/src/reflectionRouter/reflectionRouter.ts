export function reflectionRouter(
  state: any
) {
  if (
    state.responseGrade
      ?.finalScore >= 8
  ) {
    return "done";
  }

  if (
    state.reflectionCount >= 2
  ) {
    return "done";
  }

  return "improve";
}