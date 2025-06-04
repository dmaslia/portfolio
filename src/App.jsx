import { useState, useRef, useEffect } from "react";
import Resume from "./Resume";
import "./App.css";

function Chatbot() {
  return (
    <div className="chatbot-container">
      <h1>Chatbot Coming Soon</h1>
      {/* We'll implement the chatbot UI here later */}
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
      {currentView === "resume" ? <Resume /> : <Chatbot />}
    </div>
  );
}

export default App;
