import express from "express";
import cors from "cors";
import { OpenAI } from "openai";
import dotenv from "dotenv";
import axios from "axios";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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

// Load system prompt
const systemPrompt = `You are a helpful AI assistant that generates HTML content for a portfolio website. You should:

1. Use Tailwind CSS v3.x classes for styling
2. Generate semantic HTML5 markup
3. Include proper accessibility attributes
4. Use responsive design patterns
5. Follow modern web development best practices

When generating HTML, wrap it in a code block like this:
\`\`\`html
<your HTML here>
\`\`\`

The HTML should be a complete, standalone document that can be rendered directly. Do not include any explanations or text outside the code block.`;

// Ensure logs directory exists
const logsDir = path.join(__dirname, "logs");
if (!fs.existsSync(logsDir)) {
  console.log("Creating logs directory...");
  fs.mkdirSync(logsDir);
}

// Function to save chat history
function saveChatHistory(userMessage, botResponse) {
  try {
    console.log("Attempting to save chat history...");
    const chatHistoryPath = path.join(__dirname, "logs", "chat_history.json");
    console.log("Chat history path:", chatHistoryPath);

    let chatHistory = [];

    // Read existing chat history
    try {
      console.log("Reading existing chat history...");
      if (fs.existsSync(chatHistoryPath)) {
        const data = fs.readFileSync(chatHistoryPath, "utf8");
        chatHistory = JSON.parse(data);
        console.log("Successfully read existing chat history");
      } else {
        console.log("No existing chat history file found, starting new one");
      }
    } catch (error) {
      console.log("Error reading chat history:", error.message);
    }

    // Add new message
    const newEntry = {
      timestamp: new Date().toISOString(),
      userMessage,
      botResponse,
    };
    console.log("Adding new entry:", newEntry);
    chatHistory.push(newEntry);

    // Write updated chat history
    console.log("Writing updated chat history...");
    fs.writeFileSync(chatHistoryPath, JSON.stringify(chatHistory, null, 2));
    console.log("Successfully saved chat history");
  } catch (error) {
    console.error("Error saving chat history:", error);
    throw error;
  }
}

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
    console.log("Received user message:", userMessage);

    // Get vector context from RAG system
    let vectorContext = "";
    try {
      const response = await axios.post("http://localhost:8000/query", {
        query: userMessage,
      });
      const docs = response.data;
      vectorContext = docs.join("\n---\n");
    } catch (err) {
      console.error("Vector store query failed:", err.message);
    }

    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: `${systemPrompt}
---
Context:
${vectorContext}`,
        },
        {
          role: "user",
          content: userMessage,
        },
      ],
      max_tokens: 4096,
    });

    const botResponse = completion.choices[0].message.content;
    console.log("Got bot response:", botResponse);

    // Save chat history
    try {
      saveChatHistory(userMessage, botResponse);
      console.log("Successfully saved chat history");
    } catch (error) {
      console.error("Failed to save chat history:", error);
      // Continue with the response even if saving fails
    }

    res.json({ response: botResponse });
  } catch (error) {
    console.error("Error in /api/chat:", error);
    res
      .status(500)
      .json({ error: "Something went wrong", details: error.message });
  }
});

const PORT = process.env.PORT || 3003;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log("Logs directory:", logsDir);
});
