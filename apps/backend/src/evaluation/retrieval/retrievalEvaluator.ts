export function evaluateRetrieval(
  retrievedDocs: any[],
  relevantDocIds: string[],
) {
  const retrievedIds =
    retrievedDocs.map(
      (doc) =>
        doc.metadata?.id
    );

  const relevant =
    retrievedIds.filter(
      (id) =>
        relevantDocIds.includes(id)
    );

  const precision =
    relevant.length /
    Math.max(
      retrievedIds.length,
      1
    );

  const recall =
    relevant.length /
    Math.max(
      relevantDocIds.length,
      1
    );

  return {
    retrieved:
      retrievedIds.length,

    relevant:
      relevant.length,

    precision,

    recall,
  };
}