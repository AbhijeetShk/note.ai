import { Document } from "@langchain/core/documents";
import { ChatGroq } from "@langchain/groq";

const llm = new ChatGroq({
  model: "llama-3.3-70b-versatile",
  temperature: 0,
});

export async function compressContext(
  query: string,
  docs: Document[],
): Promise<Document[]> {
  const compressed = await Promise.all(
    docs.map(async (doc) => {
      const response = await llm.invoke(`
Question:
${query}

Context:
${doc.pageContent}

Extract ONLY the information needed to answer the question.

Rules:
- Remove unrelated details
- Preserve facts
- Preserve names, dates, numbers
- Return concise text only
`);

      return new Document({
        pageContent: String(response.content),
        metadata: {
          ...doc.metadata,
          compressed: true,
        },
      });
    }),
  );

  return compressed;
}
