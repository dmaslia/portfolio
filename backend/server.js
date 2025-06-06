import express from "express";
import cors from "cors";
import OpenAI from "openai";
import dotenv from "dotenv";
import { execSync } from "child_process";

dotenv.config();

if (!process.env.OPENAI_API_KEY) {
  console.error("Error: OPENAI_API_KEY is not set in environment variables");
  process.exit(1);
}

const app = express();
app.use(cors());
app.use(express.json());

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

app.post("/api/chat", async (req, res) => {
  try {
    const { messages } = req.body;

    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: "Invalid request format" });
    }

    const userMessage = messages[messages.length - 1].content;

    // 🔍 Call Python script to get relevant context
    let vectorContext = "";
    try {
      const result = execSync(`python3 query_vectorstore.py "${userMessage}"`, {
        encoding: "utf-8",
      });
      const docs = JSON.parse(result);
      vectorContext = docs.join("\n---\n");
    } catch (err) {
      console.error("Vector store query failed:", err);
    }

    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: `You are a helpful assistant representing Daniel Maslia. Below is context retrieved from his documents:\n\n${vectorContext}`,
        },
        ...messages,
      ],
      max_tokens: 150,
    });

    res.json({ response: completion.choices[0].message.content });

  } catch (error) {
    console.error("Error in /api/chat:", error);
    res.status(500).json({ error: "Something went wrong", details: error.message });
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log("Environment variables loaded successfully");
  console.log("CORS enabled for all origins");
});
