const express = require("express");
const cors = require("cors");
const { OpenAI } = require("openai");
require("dotenv").config();

// Validate environment variables
if (!process.env.OPENAI_API_KEY) {
  console.error("Error: OPENAI_API_KEY is not set in environment variables");
  process.exit(1);
}

const app = express();
app.use(cors());
app.use(express.json());

// Initialize OpenAI with API key from environment variable
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Log all incoming requests
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

app.post("/api/chat", async (req, res) => {
  try {
    console.log("Received chat request:", req.body);
    const { messages } = req.body;

    if (!messages || !Array.isArray(messages)) {
      console.error("Invalid request: messages array is missing or invalid");
      return res.status(400).json({ error: "Invalid request format" });
    }

    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: `You are a helpful assistant representing Daniel Maslia, a software developer. Here is your context:

PROFESSIONAL BACKGROUND:
- Software Developer with experience in full-stack development
- Proficient in JavaScript, React, Node.js, and modern web technologies
- Focus on creating responsive and user-friendly web applications

PROJECTS:
1. Personal Portfolio Website (Current Project)
   - Built with React and Vite
   - Features a chatbot interface
   - Includes a resume viewer
   - Responsive design with dynamic sizing

2. [Add your other projects here with brief descriptions]

TECHNICAL SKILLS:
- Frontend: React, JavaScript, HTML, CSS
- Backend: Node.js, Express
- Tools: Git, VS Code
- [Add other relevant skills]

CREDENTIALS:
- [Add your relevant certifications, degrees, or achievements]

When responding to queries:
1. Be professional but friendly
2. Focus on technical accuracy
3. Provide specific examples from the projects when relevant
4. If asked about capabilities, mention the projects and skills listed above
5. Keep responses concise and helpful

Remember: You are representing Daniel Maslia's professional profile and should respond accordingly.`,
        },
        ...messages,
      ],
      max_tokens: 150,
    });

    console.log("ChatGPT response received");
    res.json({ response: completion.choices[0].message.content });
  } catch (error) {
    console.error("Error in /api/chat:", error);
    res.status(500).json({
      error: "Something went wrong",
      details: error.message,
    });
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log("Environment variables loaded successfully");
  console.log("CORS enabled for all origins");
});
