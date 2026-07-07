import fs from "fs/promises";

import {
  recallAtK,
  hitRate,
  precisionAtK,
  reciprocalRank,
} from "../evaluation/retrieval/retrievalMetrics.js";
import { retrieveHybrid } from "../index.js";

async function main() {
  const dataset = JSON.parse(
    await fs.readFile("eval/retrieval/goldens.json", "utf8"),
  );

  const recalls = [];
  const precisions = [];
  const mrrs = [];
  const hitRates = [];
  const latencies: number[] = [];

 for (const [index, item] of dataset.entries()) {
  const start = performance.now();

  const docs = await retrieveHybrid(
    item.query,
    "balanced"
  );

  const latency = performance.now() - start;
  latencies.push(latency);

  const retrieved = docs.map(
    (doc) => Number(doc.metadata.parent_id)
  );


  if (index < 5) {
    console.log("\n========Logs Start============");
    console.log("QUERY:");
    console.log(item.query);

    console.log("\nEXPECTED:");
    console.log(item.expectedParentIds);

    console.log("\nRETRIEVED:");
    console.log(retrieved);

    console.log("\nFIRST DOC METADATA:");
    console.log(docs[0]?.metadata);

    console.log("==========Logs End==========\n");
  }

  recalls.push(
    recallAtK(
      retrieved,
      item.expectedParentIds
    )
  );

  precisions.push(
    precisionAtK(
      retrieved,
      item.expectedParentIds
    )
  );

  mrrs.push(
    reciprocalRank(
      retrieved,
      item.expectedParentIds
    )
  );

  hitRates.push(
    hitRate(
      retrieved,
      item.expectedParentIds
    )
  );

  console.log(
    item.query,
    latency.toFixed(0),
    "ms"
  );
}
  const avg = (arr: number[]) => arr.reduce((a, b) => a + b, 0) / arr.length;

  console.log("Avg Latency:", avg(latencies).toFixed(2), "ms");

  console.log("Recall@10:", avg(recalls));

  console.log("Precision@10:", avg(precisions));

  console.log("MRR:", avg(mrrs));

  console.log("HitRate:", avg(hitRates));
}

main();
