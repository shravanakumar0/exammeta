import React from "react";
import { useNavigate } from "react-router-dom";

const ChatBot = () => {
  const navigate = useNavigate();
  return (
    <div style={{ padding: "2rem", textAlign: "center", color: "#64748b" }}>
      <h2>AI Assistant Removed</h2>
      <p>The AI study assistant has been removed from this build.</p>
      <button onClick={() => navigate("/", { replace: true })}>Back to Home</button>
    </div>
  );
};

export default ChatBot;
