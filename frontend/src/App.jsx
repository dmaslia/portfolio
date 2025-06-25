import React, { useState, useRef, useEffect } from "react";
import Resume from "./components/Resume";
import AIPageRenderer from "./components/AIPageRenderer";
import "./App.css";
function Chatbot({ containerWidth }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [overlayContent, setOverlayContent] = useState(null);
  const [isMinimized, setIsMinimized] = useState(false);
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
      console.log("Bot response:", response); // Debug log

      // Check for HTML content first
      const htmlBlock = extractHTMLBlock(response);
      console.log("Extracted HTML block:", htmlBlock); // Debug log

      if (htmlBlock) {
        // Ensure we have valid HTML before setting it
        if (typeof htmlBlock === "string" && htmlBlock.trim().length > 0) {
          setOverlayContent(htmlBlock);
          if (!isMinimized) {
            setIsMinimized(true);
          }
          // Add a system message about the update
          setMessages((prev) => {
            const newMessages = [...prev];
            newMessages[newMessages.length - 1] = {
              text: "I've updated the webpage based on your request.",
              sender: "bot",
            };
            return newMessages;
          });
        } else {
          console.error("Invalid HTML block extracted:", htmlBlock);
          throw new Error("Invalid HTML content");
        }
      } else {
        setMessages((prev) => {
          const newMessages = [...prev];
          newMessages[newMessages.length - 1] = {
            text: response,
            sender: "bot",
          };
          return newMessages;
        });
      }
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

  function extractHTMLBlock(text) {
    if (!text || typeof text !== "string") return null;

    const match = text.match(/```(?:html)?\s*([\s\S]*?)```/i);
    if (!match) return null;

    return match[1].trim();
  }
  // Calculate minimum font size based on container width
  const minFontSize = Math.max(containerWidth * 0.014, 14); // Reduced from 0.018 to 0.014 and minimum from 16 to 14
  const minPadding = Math.max(containerWidth * 0.015, 12); // Minimum 12px

  const handleCloseOverlay = () => {
    setOverlayContent(null);
    setIsMinimized(false);
  };

  const handleMaximize = () => {
    setIsMinimized(false);
  };

  return (
    <>
      <div
        ref={containerRef}
        className={`chatbot-container ${isMinimized ? "minimized" : ""}`}>
        <div className="chat-messages">
          {messages.map((message, index) => (
            <div
              key={index}
              className={`message ${
                message.sender === "user" ? "user-message" : "bot-message"
              }`}>
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
            disabled={isTyping}
          />
          <button
            type="submit"
            className="chat-send-button"
            disabled={isTyping}>
            Send
          </button>
        </form>
      </div>
      {overlayContent && (
        <>
          <div className={`webpage-overlay ${isMinimized ? "visible" : ""}`}>
            <AIPageRenderer html={overlayContent} />
          </div>
          <button onClick={handleCloseOverlay} className="close-button">
            Close
          </button>
        </>
      )}
    </>
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
