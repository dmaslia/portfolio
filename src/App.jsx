import { useState, useRef, useEffect } from "react";
import Resume from "./Resume";
import "./App.css";
function Chatbot({ containerWidth }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const typeMessage = (text, index) => {
    let currentText = "";
    let currentIndex = 0;
    const typingSpeed = 40; // milliseconds per character

    const typingInterval = setInterval(() => {
      if (currentIndex < text.length) {
        currentText += text[currentIndex];
        setMessages((prev) => {
          const newMessages = [...prev];
          newMessages[index] = { ...newMessages[index], text: currentText };
          return newMessages;
        });
        currentIndex++;
      } else {
        clearInterval(typingInterval);
        setIsTyping(false);
      }
    }, typingSpeed);
  };

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

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Something went wrong");
      }
      return data.response;
    } catch (error) {
      console.error("Error calling chat API:", error);
      return "I'm sorry, I'm having trouble connecting right now. Please try again later.";
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!input.trim() || isTyping) return;

    const userMessage = input.trim();
    setInput("");

    // Add user message
    setMessages((prev) => [...prev, { text: userMessage, sender: "user" }]);

    // Get and display bot response
    setIsTyping(true);
    setMessages((prev) => [...prev, { text: "", sender: "bot" }]);

    try {
      const response = await getChatGPTResponse(userMessage);
      typeMessage(response, messages.length + 1);
    } catch (error) {
      console.error("Error:", error);
      typeMessage(
        "I'm sorry, something went wrong. Please try again.",
        messages.length + 1
      );
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
