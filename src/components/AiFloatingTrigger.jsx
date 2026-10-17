import React, { useState, useEffect } from "react";
import { FaRobot } from "react-icons/fa";
import AiAssistant from "./AiAssistant";
import "./AiFloatingTrigger.css";

const AiFloatingTrigger = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [activePdfUrl, setActivePdfUrl] = useState(null);

  useEffect(() => {
    const handleOpen = (e) => {
      if (e.detail && e.detail.pdfUrl) {
        setActivePdfUrl(e.detail.pdfUrl);
      }
      setIsOpen(true);
    };

    window.addEventListener("open-ai-assistant", handleOpen);
    return () => window.removeEventListener("open-ai-assistant", handleOpen);
  }, []);

  return (
    <>
      <div className="ai-floating-container">
        <div className="ai-pulse-ring"></div>
        <button
          className="ai-floating-button"
          onClick={() => setIsOpen(true)}
          title="Open AI Study Assistant"
        >
          <FaRobot className="ai-floating-icon" />
          <span>Ask AI Copilot</span>
        </button>
      </div>

      <AiAssistant
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        pdfUrl={activePdfUrl}
      />
    </>
  );
};

export default AiFloatingTrigger;
