import { useState } from "react";
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

  const toggleView = () => {
    setCurrentView(currentView === "resume" ? "chatbot" : "resume");
  };

  return (
    <div className="app-container">
      <button onClick={toggleView} className="toggle-button">
        {currentView === "resume" ? "View Chatbot" : "View Resume"}
      </button>
      {currentView === "resume" ? <Resume /> : <Chatbot />}
    </div>
  );
}

export default App;
