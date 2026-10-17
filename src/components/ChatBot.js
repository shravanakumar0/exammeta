import React from "react";
import { useNavigate } from "react-router-dom";
import AiAssistant from "./AiAssistant";

const ChatBot = () => {
  const navigate = useNavigate();
  return <AiAssistant isOpen onClose={() => navigate("/", { replace: true })} />;
};

export default ChatBot;
