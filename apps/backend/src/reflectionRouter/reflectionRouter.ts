export function reflectionRouter(
  state: any
) {
  console.log('Reflection',{
  finalScore:
    state.responseGrade?.finalScore,

  reflectionCount:
    state.reflectionCount,
});
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