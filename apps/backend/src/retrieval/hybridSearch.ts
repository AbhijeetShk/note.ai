import { denseRetrieve }
  from "./denseRetriever.js";

import { sparseRetrieve }
  from "./sparseRetriever.js";

import { reciprocalRankFusion }
  from "./rrf.js";

export async function hybridSearch(
  query: string,
  k: number,
  searchType:
    | "mmr"
    | "similarity",
  source?: string
) {
  const [
    denseResults,
    sparseResults,
  ] = await Promise.all([
    denseRetrieve(
      query,
      k,
      searchType,
      source
    ),

    sparseRetrieve(
      query,
      k
    ),
  ]);

  const fused =
    reciprocalRankFusion([
      denseResults,
      sparseResults,
    ]);

  return fused
    .slice(0, k)
    .map(
      (item) =>
        item.document
    );
}