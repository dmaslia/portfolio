import { useState, useRef, useEffect } from "react";
import Resume from "./Resume";
import "./App.css";
function Chatbot({ containerWidth }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const getChatGPTResponse = async (userMessage) => {
    try {
      const response = await fetch("http://localhost:3001/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messages: [
            ...messages.map((msg) => ({
              role: msg.sender === "user" ? "user" : "assistant",
              content: msg.text,
            })),
            {
              role: "user",
              content: userMessage,
            },
          ],
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error("Server error:", errorData);
        throw new Error(errorData.error || `Server error: ${response.status}`);
      }

      const data = await response.json();
      return data.response;
    } catch (error) {
      console.error("Error details:", error);
      if (error.message.includes("Failed to fetch")) {
        return "Cannot connect to the server. Please make sure the backend server is running on port 3001.";
      }
      return `Error: ${error.message}. Please try again later.`;
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMessage = input.trim();
    setInput("");

    // Add user message
    setMessages((prev) => [...prev, { text: userMessage, sender: "user" }]);

    try {
      const response = await getChatGPTResponse(userMessage);
      setMessages((prev) => [...prev, { text: response, sender: "bot" }]);
    } catch (error) {
      console.error("Error:", error);
      setMessages((prev) => [
        ...prev,
        {
          text: "I'm sorry, something went wrong. Please try again.",
          sender: "bot",
        },
      ]);
    }
  };

  // Calculate minimum font size based on container width
  const minFontSize = Math.max(containerWidth * 0.018, 16); // Minimum 16px
  const minPadding = Math.max(containerWidth * 0.015, 12); // Minimum 12px

  return (
    <div
      className="chatbot-container"
      style={{
        width: containerWidth,
        maxWidth: "1000px",
      }}>
      <div className="chat-messages">
        {messages.map((message, index) => (
          <div
            key={index}
            className={`message ${
              message.sender === "user" ? "user-message" : "bot-message"
            }`}
            style={{
              fontSize: `${minFontSize}px`,
              padding: `${minPadding}px ${minPadding * 1.2}px`,
            }}>
            {message.text}
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>
      <form onSubmit={handleSubmit} className="chat-input-form">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type a message..."
          className="chat-input"
          style={{
            fontSize: `${minFontSize}px`,
            padding: `${minPadding}px`,
          }}
        />
        <button
          type="submit"
          className="chat-send-button"
          style={{
            fontSize: `${minFontSize}px`,
            padding: `${minPadding}px ${minPadding * 1.5}px`,
          }}>
          Send
        </button>
      </form>
    </div>
  );
}

function App() {
  const [currentView, setCurrentView] = useState("resume");
  const containerRef = useRef(null);
  const [containerWidth, setContainerWidth] = useState(0);

  useEffect(() => {
    const observer = new ResizeObserver(([entry]) => {
      setContainerWidth(entry.contentRect.width);
    });

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => observer.disconnect();
  }, []);

  const toggleView = () => {
    setCurrentView(currentView === "resume" ? "chatbot" : "resume");
  };

  return (
    <div ref={containerRef} className="app-container">
      <button
        onClick={toggleView}
        style={{
          position: "fixed",
          top: "20px",
          right: "20px",
          background: "#000",
          color: "white",
          border: "none",
          borderRadius: "0px",
          cursor: "pointer",
          width: `${containerWidth * 0.02}px`,
          height: `${containerWidth * 0.02}px`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: 0,
          zIndex: 1000,
        }}>
        <span style={{ fontSize: `${containerWidth * 0.012}px` }}>
          {currentView === "resume" ? "C" : "R"}
        </span>
      </button>
      {currentView === "resume" ? (
        <Resume />
      ) : (
        <Chatbot containerWidth={containerWidth} />
      )}
    </div>
  );
}

export default App;
