import fs from "fs/promises";
import { retrieveHybrid } from "../index.js";
import { evaluateRetrieval } from "../evaluation/retrieval/retrievalEvaluator.js";



async function run() {
  const raw =
    await fs.readFile(
      "evals/retrieval/gold.json",
      "utf8",
    );

  const evalSet =
    JSON.parse(raw);

  let totalPrecision = 0;
  let totalRecall = 0;

  for (const sample of evalSet) {
    const docs =
      await retrieveHybrid(
        sample.query,
        "balanced",
      );

    const metrics =
      evaluateRetrieval(
        docs,
        sample.relevantDocs,
      );

    totalPrecision +=
      metrics.precision;

    totalRecall +=
      metrics.recall;

    console.log(
      `Query: ${sample.query}`,
    );

    console.log(metrics);
    console.log(
      "------------------",
    );
  }

  console.log(
    "Average Precision:",
    totalPrecision /
      evalSet.length,
  );

  console.log(
    "Average Recall:",
    totalRecall /
      evalSet.length,
  );
}

run();