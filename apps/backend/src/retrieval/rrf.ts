export type RankedResult = {
  id: number;
  rank: number;
  document: any;
};

export function reciprocalRankFusion(
  rankings: RankedResult[][],
  k = 60
) {
  const scores =
    new Map<
      number,
      {
        score: number;
        document: any;
      }
    >();

  for (const ranking of rankings) {
    ranking.forEach(
      (item, rank) => {
        const score =
          1 / (k + rank + 1);

        const current =
          scores.get(item.id);

        scores.set(
          item.id,
          {
            score:
              (current?.score ?? 0) +
              score,

            document:
              current?.document ??
              item.document,
          }
        );
      }
    );
  }

  return [...scores.entries()]
    .sort(
      (a, b) =>
        b[1].score -
        a[1].score
    )
    .map(
      ([id, value]) => ({
        id,
        score:
          value.score,
        document:
          value.document,
      })
    );
}