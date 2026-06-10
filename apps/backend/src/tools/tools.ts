import { tool } from "@langchain/core/tools";
import { z } from "zod";
import { retrieveHybrid } from "../index.js";

export const calculatorTool = tool(
  async ({ expression }) => {
    try {
      const result = Function(
        `"use strict"; return (${expression})`
      )();

      return String(result);
    } catch {
      return "Calculation failed";
    }
  },
  {
    name: "calculator",
    description: "Useful for mathematical calculations",
    schema: z.object({
      expression: z.string(),
    }),
  }
);



const retrievePdfTool = tool(
  async ({ query }) => {
    // TEMP FAKE TOOL

    return JSON.stringify([
      {
        page: 12,
        content: "Quantum computing uses qubits.",
      },
    ]);
  },
  {
    name: "retrieve_pdf_chunks",
    description: "Retrieve relevant chunks from indexed PDFs.",
    schema: z.object({
      query: z.string(),
    }),
  },
);


export const searchTool = tool(
  async ({ query }) => {
    const docs =
      await retrieveHybrid(
        query,
        "balanced"
      );

    return JSON.stringify(
      docs.map(d => ({
        content: d.pageContent,
        source: d.metadata.source,
      }))
    );
  },
  {
    name: "search_documents",
    description:
      "Search indexed documents",
    schema: z.object({
      query: z.string(),
    }),
  }
);
export const tools = {
  search_documents: searchTool,
  calculator: calculatorTool,
};