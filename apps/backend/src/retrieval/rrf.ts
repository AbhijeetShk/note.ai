export function rrf(
  rankings: any[][],
  k = 60
) {
  const scores =
    new Map<number, number>();

  rankings.forEach(
    (ranking) => {
      ranking.forEach(
        (doc, rank) => {
          const score =
            1 /
            (k + rank + 1);

          scores.set(
            doc.id,
            (scores.get(doc.id) ?? 0)
              + score
          );
        }
      );
    }
  );

  return [...scores.entries()]
    .sort(
      (a, b) =>
        b[1] - a[1]
    );
}