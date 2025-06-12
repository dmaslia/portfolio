import express from "express";
import cors from "cors";
import OpenAI from "openai";
import dotenv from "dotenv";
import axios from "axios"
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

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

// Read the system prompt from file
const systemPrompt = fs.readFileSync(path.join(__dirname, 'system_prompt.txt'), 'utf8');
const projectList = fs.readFileSync(path.join(__dirname, 'project_list.txt'), 'utf8');

// Create logs directory if it doesn't exist
const logsDir = path.join(__dirname, 'logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir);
}

// Function to log chat messages
const logChatMessage = (message, response) => {
  const timestamp = new Date().toISOString();
  const logEntry = {
    timestamp,
    userMessage: message,
    botResponse: response
  };
  
  const logFile = path.join(logsDir, 'chat_history.json');
  let logs = [];
  
  // Read existing logs if file exists
  if (fs.existsSync(logFile)) {
    try {
      const fileContent = fs.readFileSync(logFile, 'utf8');
      logs = JSON.parse(fileContent);
    } catch (error) {
      console.error('Error reading log file:', error);
    }
  }
  
  // Add new log entry
  logs.push(logEntry);
  
  // Write back to file
  try {
    fs.writeFileSync(logFile, JSON.stringify(logs, null, 2));
  } catch (error) {
    console.error('Error writing to log file:', error);
  }
};

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
      const response = await axios.post("http://localhost:8000/query", {
        query: userMessage,
      }, {
        timeout: 5000,  // 5 seconds
      });
      const docs = response.data; // This should be a list of strings
      vectorContext = docs.join("\n---\n"); // Combine them if needed
    } catch (err) {
      console.error("Vector store query failed:", err.message);
      if (err.response) {
        console.error("Status:", err.response.status);
        console.error("Response:", err.response.data);
      } else if (err.request) {
        console.error("No response received:", err.request);
      } else {
        console.error("Error config:", err.config);
      }
    }

    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: `${systemPrompt}\n\nHere is the complete list of Daniel's verified projects and experiences:\n${projectList}\n\nHere is additional relevant context about Daniel and this website:\n${vectorContext}`,
        },
        ...messages,
      ],
      max_tokens: 1024,
    });

    const botResponse = completion.choices[0].message.content;
    
    // Log the chat interaction
    logChatMessage(userMessage, botResponse);

    res.json({ response: botResponse });

  } catch (error) {
    console.error("Error in /api/chat:", error);
    res.status(500).json({ error: "Something went wrong", details: error.message });
  }
});

// Add endpoint to view chat history
app.get("/api/chat-history", (req, res) => {
  try {
    const logFile = path.join(logsDir, 'chat_history.json');
    if (!fs.existsSync(logFile)) {
      return res.json([]);
    }
    const fileContent = fs.readFileSync(logFile, 'utf8');
    const logs = JSON.parse(fileContent);
    res.json(logs);
  } catch (error) {
    console.error("Error reading chat history:", error);
    res.status(500).json({ error: "Failed to read chat history" });
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log("Environment variables loaded successfully");
  console.log("CORS enabled for all origins");
});
