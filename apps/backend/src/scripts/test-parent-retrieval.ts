import { retrieveHybrid } from "../index.js";

async function main() {
  const docs = await retrieveHybrid(
    "What is the significance of Katherine Driscoll?",
    "accurate",
  );

  console.log("\nRESULTS\n");

  docs.forEach((doc, i) => {
    console.log(`\n#${i + 1}`);
    console.log("Parent ID:", doc.metadata?.parent_id);
    console.log(
      doc.pageContent.slice(0, 200),
    );
  });
}

main().catch(console.error);