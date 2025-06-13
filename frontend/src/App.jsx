import React, { useState, useRef, useEffect } from "react";
import Resume from "./components/Resume";
import "./App.css";
function Chatbot({ containerWidth }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);
  const containerRef = useRef(null);

  // Calculate available height for messages
  const [availableHeight, setAvailableHeight] = useState(0);

  useEffect(() => {
    const updateHeight = () => {
      if (containerRef.current) {
        const containerHeight = containerRef.current.clientHeight;
        const inputHeight =
          containerRef.current.querySelector(".chat-input-form").clientHeight;
        setAvailableHeight(containerHeight - inputHeight - 40); // 40px for padding
      }
    };

    updateHeight();
    window.addEventListener("resize", updateHeight);
    return () => window.removeEventListener("resize", updateHeight);
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const getChatGPTResponse = async (userMessage) => {
    try {
      const response = await fetch("/api/chat", {
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
    if (!input.trim() || isTyping) return;

    const userMessage = input.trim();
    setInput("");

    // Add user message
    setMessages((prev) => [...prev, { text: userMessage, sender: "user" }]);

    // Prepare for bot response
    setIsTyping(true);
    setMessages((prev) => [...prev, { text: "", sender: "bot" }]);

    try {
      const response = await getChatGPTResponse(userMessage);
      setMessages((prev) => {
        const newMessages = [...prev];
        newMessages[newMessages.length - 1] = { text: response, sender: "bot" };
        return newMessages;
      });
    } catch (error) {
      console.error("Error:", error);
      setMessages((prev) => {
        const newMessages = [...prev];
        newMessages[newMessages.length - 1] = {
          text: "I'm sorry, something went wrong. Please try again.",
          sender: "bot",
        };
        return newMessages;
      });
    } finally {
      setIsTyping(false);
    }
  };

  function extractJSONFromMessage(text) {
    const match = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
    if (match && match[1]) {
      try {
        return JSON.parse(match[1]);
      } catch (e) {
        console.error("❌ JSON parse error:", e);
      }
    }
    return null;
  }

  // Calculate minimum font size based on container width
  const minFontSize = Math.max(containerWidth * 0.014, 14); // Reduced from 0.018 to 0.014 and minimum from 16 to 14
  const minPadding = Math.max(containerWidth * 0.015, 12); // Minimum 12px

  return (
    <div
      ref={containerRef}
      className="chatbot-container"
      style={{
        width: containerWidth,
        maxWidth: "1000px",
      }}>
      <div className="chat-messages" style={{ height: availableHeight }}>
        {messages.map((message, index) => (
          <div
            key={index}
            className={`message ${
              message.sender === "user" ? "user-message" : "bot-message"
            }`}
            style={{
              fontSize: `${minFontSize}px`,
              whiteSpace: "pre-wrap",
              padding: `${minPadding}px ${minPadding * 1.2}px`,
              alignSelf: message.sender === "user" ? "flex-end" : "flex-start",
              textAlign: message.sender === "user" ? "right" : "left",
            }}>
            {/* parsing buttons for responses with buttons */}

            {(() => {
              const parsed = extractJSONFromMessage(message.text);
              if (parsed) {
                return (
                  <>
                    <div>{parsed.text}</div>
                    {parsed.buttons?.map((btn, i) => (
                      <a
                        href={btn.url}
                        key={i}
                        target="_blank"
                        rel="noopener noreferrer">
                        <button className="chatbot-button">{btn.text}</button>
                      </a>
                    ))}
                  </>
                );
              }
              return <>{message.text}</>;
            })()}
            {message.sender === "bot" &&
              index === messages.length - 1 &&
              isTyping && <span className="typing-indicator">▋</span>}
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
          disabled={isTyping}
        />
        <button
          type="submit"
          className="chat-send-button"
          style={{
            fontSize: `${minFontSize}px`,
            padding: `${minPadding}px ${minPadding * 1.5}px`,
          }}
          disabled={isTyping}>
          Send
        </button>
      </form>
    </div>
  );
}

function App() {
  const [currentView, setCurrentView] = useState("resume");
  const containerRef = useRef(null);
  const [containerWidth, setContainerWidth] = useState(1000);

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
      <Chatbot containerWidth={containerWidth} />
    </div>
  );
}

export default App;
