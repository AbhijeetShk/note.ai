import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { graph} from "./agent/agent.js";

dotenv.config();
    // "dev": "nodemon --watch src --ext ts --exec ts-node src/index.ts"
const app = express();
app.use(cors());
app.use(express.json());

app.post("/runs/stream", async (req, res) => {
  const { input } = req.body;

  const result = await graph.invoke({
    messages: [{ role: "user", content: input }],
  });

  res.json(result);
});
app.post("/chat", async (req, res) => {
  const { message } = req.body;
console.log("Received message:", message);
  const result = await graph.invoke({
  messages: [
    {
      role: "user",
      content: message,
    },
  ],
});

  res.json(result);
});
app.listen(2024, () => {
  console.log("Server running on 2024");
});