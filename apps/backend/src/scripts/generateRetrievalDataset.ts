import fs from "fs/promises";
import { ChatGroq } from "@langchain/groq";
import { supabase } from "../config/supabase.js";
import { RetrievalGolden } from "../evaluation/types.js";

const llm = new ChatGroq({
  model: "llama-3.3-70b-versatile",
  temperature: 0,
});

type ParentDocument = {
  id: number;
  content: string;
  document_id: string;
};

async function main() {
  console.log("Loading parent documents...");

 const { data, error } = await supabase
  .from("parent_documents")
  .select("id, content, document_id")
  .limit(20);

  if (error) throw error;

  const dataset: RetrievalGolden[] = [];

for (const [index, parent] of (
  data as ParentDocument[]
).entries()){
    console.log(`Processing parent ${parent.id}`);
    console.log(
  `[${index + 1}/${data.length}] Parent ${parent.id}`
);

    const prompt = `
You are generating retrieval benchmark queries.

Document:

${parent.content.slice(0, 2500)}

Generate exactly 3 retrieval questions.

Return ONLY valid JSON:

[
  {
    "query":"question here"
  }
]
`;

    try {
      const response = await llm.invoke(prompt);

      const content =
        typeof response.content === "string"
          ? response.content
          : JSON.stringify(response.content);

      const questions = JSON.parse(content);

      for (const q of questions) {
        dataset.push({
          query: q.query,
          expectedParentIds: [parent.id],
          source: parent.document_id,
          difficulty: "medium",
        });
      }
    } catch (err) {
      console.log(`Skipping parent ${parent.id}`);
    }
  }

  await fs.mkdir("eval/retrieval", { recursive: true });

  await fs.writeFile(
    "eval/retrieval/goldens.json",
    JSON.stringify(dataset, null, 2),
  );

  console.log(`Generated ${dataset.length} queries`);
  console.log(`Loaded ${data?.length ?? 0} parent documents`);
  console.log(`Generated ${dataset.length} benchmark queries`);
}

main();
