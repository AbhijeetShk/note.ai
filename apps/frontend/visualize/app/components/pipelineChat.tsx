"use client";

import { useState } from "react";
import { PIPELINE_NODES } from "@/lib/pipeline/constants";
import PipelineProgress from "./pipelineProgress";
import NodeCardList from "./NodeCardList";

export default function PipelineChat() {
  const [query, setQuery] = useState("");
  const [values, setValues] = useState<Record<string, unknown>>({});
  const [messages, setMessages] = useState<any[]>([]);

  async function runPipeline() {
    const res = await fetch("http://localhost:2024/chat", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ message: query }),
    });

    const data = await res.json();

    setValues(data);
  }

  return (
    <div className="mx-auto max-w-3xl p-6 space-y-6">
      <div className="flex gap-2">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Ask something..."
          className="border rounded px-3 py-2 w-full"
        />

        <button
          onClick={runPipeline}
          className="bg-black text-white px-4 rounded"
        >
          Run
        </button>
      </div>

      <PipelineProgress
        nodes={PIPELINE_NODES}
        values={values}
        streamingContent={{}}
      />

      <NodeCardList
        nodes={PIPELINE_NODES}
        messages={messages}
        values={values}
        getMetadata={() => undefined}
      />
    </div>
  );
}