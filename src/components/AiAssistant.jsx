import React, { useState, useEffect, useRef } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { readApiResponse } from "../api/gemini";
import {
  FaPaperPlane, FaRobot, FaTimes, FaEraser,
  FaLightbulb, FaBookOpen, FaQuestionCircle, FaClipboardCheck, FaCopy, FaBookmark
} from "react-icons/fa";

import { extractTextFromPDF } from "./pdfUtils";
import { studyResources } from "../data/studyResources";
import "./AiAssistant.css";

const welcomeMessage = {
  role: "ai",
  content: "Hello! I’m the ExamMeta Study Assistant. Ask me anything about your VTU studies, or choose a resource when you want answers grounded in a specific PDF.",
};

const AiAssistant = ({ isOpen, onClose, pdfUrl }) => {
  
  const [messages, setMessages] = useState([welcomeMessage]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [pdfText, setPdfText] = useState("");
  const [selectedPdfUrl, setSelectedPdfUrl] = useState(pdfUrl || "");
  const [resourceStatus, setResourceStatus] = useState("idle");
  const [resourceError, setResourceError] = useState("");
  const [copiedIdx, setCopiedIdx] = useState(null);
  const [savedAnswers, setSavedAnswers] = useState(() => {
    try { return JSON.parse(localStorage.getItem("exammeta-saved-answers") || "[]"); }
    catch { return []; }
  });

  const chatEndRef = useRef(null);
  const resourceGroups = React.useMemo(() => {
    const groups = new Map();
    studyResources
      .filter(item => item.resource.previewUrl || item.resource.fileUrl)
      .forEach(item => {
        if (!groups.has(item.subjectKey)) {
          groups.set(item.subjectKey, {
            key: item.subjectKey,
            label: `${item.subject} (${item.code}) Â· ${item.branch} semester ${item.semester}`,
            resources: []
          });
        }
        groups.get(item.subjectKey).resources.push(item);
      });
    return Array.from(groups.values());
  }, []);
  const selectedResource = studyResources.find(item => item.url === selectedPdfUrl);
  const documentTitle = selectedResource
    ? `${selectedResource.subject} Â· ${selectedResource.resource.title}`
    : "Selected course resource";

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  useEffect(() => {
    localStorage.setItem("exammeta-saved-answers", JSON.stringify(savedAnswers));
  }, [savedAnswers]);

  const toggleSavedAnswer = (content, source = documentTitle) => {
    setSavedAnswers(current => {
      const existing = current.find(answer => answer.content === content && answer.source === source);
      return existing
        ? current.filter(answer => answer !== existing)
        : [...current, { content, source, savedAt: Date.now() }];
    });
  };

  useEffect(() => {
    if (pdfUrl) setSelectedPdfUrl(pdfUrl);
  }, [pdfUrl]);

  useEffect(() => {
    let cancelled = false;

    if (!isOpen || !selectedPdfUrl) {
      setPdfText("");
      setResourceStatus("idle");
      setResourceError("");
      return () => {
        cancelled = true;
      };
    }

    setPdfText("");
    setResourceStatus("loading");
    setResourceError("");
    extractTextFromPDF(selectedPdfUrl).then(result => {
      if (cancelled) return;
      if (result.success && result.text.trim()) {
        setPdfText(result.text);
        setResourceStatus("ready");
      } else {
        setResourceStatus("error");
        setResourceError(result.error || "This PDF has no readable text. Try another resource.");
      }
    }).catch(error => {
      console.error("Study resource load failed:", error);
      if (!cancelled) {
        setResourceStatus("error");
        setResourceError(error.message || "Could not load this PDF.");
      }
    });

    return () => {
      cancelled = true;
    };
  }, [isOpen, selectedPdfUrl]);

  const handleSend = async (customPrompt) => {
    const messageToSend = customPrompt || input;
    if (!messageToSend.trim()) return;

    if (resourceStatus === "loading") {
      setMessages(prev => [...prev, { role: "system", content: "The selected resource is still loading. Please try again in a moment." }]);
      return;
    }
    setMessages(prev => [...prev, { role: "user", content: messageToSend }]);
    if (!customPrompt) setInput("");
    setLoading(true);

    try {
      const response = await fetch("/api/gemini", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode: pdfText.trim() ? "study" : "general",
          sourceName: documentTitle,
          sourceText: pdfText.substring(0, 30000),
          question: messageToSend,
          history: messages
            .filter(message => message.role === "user" || message.role === "ai")
            .slice(-8)
            .map(message => ({ role: message.role, content: message.content })),
        }),
      });
      const data = await readApiResponse(response, "The AI request failed.");
      setMessages(prev => [...prev, { role: "ai", content: data.answer, sourceTitle: documentTitle }]);
    } catch (error) {
      console.error("AI Error:", error);
      setMessages(prev => [...prev, { role: "system", content: `AI request failed: ${error.message}` }]);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = async (text, idx) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedIdx(idx);
      setTimeout(() => setCopiedIdx(null), 2000);
    } catch {
      setMessages(prev => [...prev, { role: "system", content: "Clipboard access is unavailable in this browser." }]);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="ai-backdrop" onClick={onClose}>
      <div className="ai-window" onClick={e => e.stopPropagation()}>
        {/* SIDEBAR */}
        <div className="ai-sidebar">
          <div className="sidebar-header">
            <span>EXAMMETA AI COPILOT</span>
          </div>
          <div className="sidebar-content">
            <div className="ai-resource-picker">
              <label htmlFor="ai-source-resource">Answer from a VTU resource</label>
              <select
                id="ai-source-resource"
                value={selectedPdfUrl}
                onChange={event => setSelectedPdfUrl(event.target.value)}
              >
                <option value="">Choose a subject resource...</option>
                {resourceGroups.map(group => (
                  <optgroup key={group.key} label={group.label}>
                    {group.resources.map(item => (
                      <option key={item.id} value={item.url}>
                        {item.resource.title}
                      </option>
                    ))}
                  </optgroup>
                ))}
              </select>
              <span className="ai-resource-status" role="status">
                {resourceStatus === "loading" && "Loading source PDF..."}
                {resourceStatus === "ready" && `Source loaded: ${documentTitle}`}
                {resourceStatus === "error" && (resourceError || "Could not read this source PDF. Choose another resource.")}
                {resourceStatus === "idle" && "No source selected · general study chat is ready"}
              </span>
            </div>

            {resourceStatus === "ready" && (
              <div className="doc-card">
                <FaBookOpen />
                <div className="doc-info">
                  <span className="doc-name">{documentTitle}</span>
                  <span className="doc-status">Website source loaded</span>
                </div>
              </div>
            )}

            <button className="sidebar-btn" onClick={() => setMessages([welcomeMessage])}>
              <FaEraser /> New Chat
            </button>
            <div className="suggestions">
              <h4>Quick Exam Helpers</h4>
              <button className="sidebar-btn" disabled={resourceStatus !== "ready"} onClick={() => handleSend("Give me a 5-minute summary of the key concepts in this resource.")}>
                <FaLightbulb /> 5-Min Concept Summary
              </button>
              <button className="sidebar-btn" disabled={resourceStatus !== "ready"} onClick={() => handleSend("Generate 5 practice quiz questions and answers using only this resource.")}>
                <FaQuestionCircle /> 5 Practice Quiz Questions
              </button>
              <button className="sidebar-btn" disabled={resourceStatus !== "ready"} onClick={() => handleSend("List the key formulas and definitions present in this resource.")}>
                <FaBookOpen /> Formula & Definitions Cheat Sheet
              </button>
            </div>
            <details className="saved-answer-list" style={{ marginTop: "16px", color: "#e2e8f0" }}>
              <summary style={{ cursor: "pointer" }}>Saved answers ({savedAnswers.length})</summary>
              {savedAnswers.map((answer, index) => (
                <div key={`${answer.savedAt}-${index}`} style={{ marginTop: "12px", padding: "10px", borderRadius: "8px", background: "rgba(255,255,255,0.06)" }}>
                  <strong>{answer.source}</strong>
                  <p style={{ whiteSpace: "pre-wrap", fontSize: "0.82rem" }}>{answer.content}</p>
                  <button className="sidebar-btn" onClick={() => setSavedAnswers(items => items.filter(item => item !== answer))}>Remove saved answer</button>
                </div>
              ))}
            </details>
          </div>
        </div>

        {/* MAIN CHAT */}
        <div className="ai-main">
          <div className="chat-header">
            <div className="header-brand">
              <FaRobot /> ExamMeta Study Assistant
            </div>
            <button className="icon-btn" onClick={onClose}>
              <FaTimes />
            </button>
          </div>

          <div className="chat-viewport">
            {messages.map((msg, idx) => (
              <div key={idx} className={`msg-row ${msg.role}`}>
                <div className={`avatar ${msg.role}`}>
                  {msg.role === 'ai' ? <FaRobot /> : msg.role === 'user' ? 'You' : '!'}
                </div>
                <div className="msg-bubble">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {msg.content}
                  </ReactMarkdown>
                  {msg.role === 'ai' && (
                    <>
                    <button
                      className="copy-btn"
                      onClick={() => copyToClipboard(msg.content, idx)}
                      title="Copy response"
                      style={{
                        background: 'transparent',
                        border: 'none',
                        color: '#94a3b8',
                        cursor: 'pointer',
                        fontSize: '0.8rem',
                        marginTop: '8px',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px'
                      }}
                    >
                      {copiedIdx === idx ? <FaClipboardCheck style={{ color: '#10b981' }} /> : <FaCopy />}
                      {copiedIdx === idx ? 'Copied!' : 'Copy'}
                    </button>
                    {idx > 0 && (
                      <button className="copy-btn" onClick={() => toggleSavedAnswer(msg.content, msg.sourceTitle || documentTitle)} style={{ background: "transparent", border: "none", color: "#94a3b8", cursor: "pointer", fontSize: "0.8rem", marginTop: "8px", marginLeft: "12px" }}>
                        <FaBookmark /> {savedAnswers.some(answer => answer.content === msg.content && answer.source === (msg.sourceTitle || documentTitle)) ? "Saved" : "Save answer"}
                      </button>
                    )}
                    {msg.sourceTitle && <small className="ai-answer-source">AI-generated from: {msg.sourceTitle}. Check against your course material.</small>}
                    </>
                  )}
                </div>
              </div>
            ))}
            {loading && (
              <div className="msg-row ai">
                <div className="avatar ai"><FaRobot /></div>
                <div className="msg-bubble">
                  <div className="loading">
                    <span className="dot"></span>
                    <span className="dot"></span>
                    <span className="dot"></span>
                    Generating answer...
                  </div>
                </div>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          <div className="chat-input-zone">
            <div className="input-pill">
              <textarea
                value={input}
                rows={1}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSend();
                  }
                }}
                placeholder={pdfText ? "Ask about the selected resource…" : "Ask a VTU study question…"}
              />
              <button
                className={`send-btn ${input.trim() ? 'active' : ''}`}
                onClick={() => handleSend()}
                disabled={loading || resourceStatus === "loading" || !input.trim()}
              >
                <FaPaperPlane />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AiAssistant;


