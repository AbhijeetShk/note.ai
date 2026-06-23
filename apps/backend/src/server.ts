import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { graph} from "./agent/agent.js";
import {initCheckpointer} from "./checkpointer/init.js";



dotenv.config();
// "dev": "nodemon --watch src --ext ts --exec ts-node src/index.ts"
const app = express();
app.use(cors());
app.use(express.json());
await initCheckpointer();

app.post("/runs/stream", async (req, res) => {
  const {
    input,
    userId,
    threadId,
  } = req.body;

  const result =
    await graph.invoke(
      {
        messages: [
          {
            role: "user",
            content: input,
          },
        ],

        userId,
      },
      {
        configurable: {
          thread_id: threadId,
        },
        recursionLimit: 50,
        runName:
          "agent-query",
      }
    );

  res.json(result);
});
app.post("/chat", async (req, res) => {
  const {
    message,
    userId,
    threadId,
  } = req.body;

  const result =
    await graph.invoke(
      {
        messages: [
          {
            role: "user",
            content: message,
          },
        ],

        userId,
      },
      {
        configurable: {
          thread_id: threadId,
        },
    recursionLimit: 50,
        runName:
          "agent-query",
      }
    );

  res.json(result);
});
app.listen(2024, () => {
  console.log("Server running on 2024");
});