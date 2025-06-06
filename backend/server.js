import express from "express";
import cors from "cors";
import OpenAI from "openai";
import dotenv from "dotenv";
import axios from "axios"



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
          content: `You are Daniel Maslia's AI assistant on danielmaslia.com, his personal portfolio website. You are talking to someone who is visiting this website and interacting with you through the chat interface.

Your goal is to represent Daniel professionally and provide accurate information about his work, skills, and experience. You should be knowledgeable about the website they are currently on and the projects it showcases.

Here is relevant context about Daniel and this website:
\n\n${vectorContext}\n\n

When responding:
1. Be professional but friendly
2. Reference that you are part of danielmaslia.com
3. Focus on technical accuracy
4. Provide specific examples from the projects when relevant
5. Keep responses concise and helpful
6. Add new lines where appropriate to separate ideas

Remember: You are representing Daniel Maslia's professional profile on his portfolio website and should respond accordingly.`,
        },
        ...messages,
      ],
      max_tokens: 1024,
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
