export function recallAtK(
  retrieved: number[],
  expected: number[],
) {
  const hits = expected.filter(
    id => retrieved.includes(id)
  );

  return hits.length / expected.length;
}

export function hitRate(
  retrieved: number[],
  expected: number[],
) {
  return expected.some(
    id => retrieved.includes(id)
  )
    ? 1
    : 0;
}

export function precisionAtK(
  retrieved: number[],
  expected: number[],
) {
  const hits = retrieved.filter(
    id => expected.includes(id)
  );

  return hits.length / retrieved.length;
}

export function reciprocalRank(
  retrieved: number[],
  expected: number[],
) {
  for (
    let i = 0;
    i < retrieved.length;
    i++
  ) {
    if (
      expected.includes(
        retrieved[i]
      )
    ) {
      return 1 / (i + 1);
    }
  }

  return 0;
}