import React, { useState } from "react";
import { database } from "../firebase";
import { ref, push } from "firebase/database";
import {
  FaEnvelope,
  FaPaperPlane,
  FaCheckCircle,
  FaMapMarkerAlt,
  FaExclamationCircle
} from "react-icons/fa";
import "./ContactModern.css";
import { SITE_CONTACT } from "../config/siteContact";

const Contact = () => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    message: ""
  });

  const [status, setStatus] = useState({ type: "", msg: "" });
  const [loading, setLoading] = useState(false);

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const { name, email, message } = formData;

    if (!name.trim() || !email.trim() || !message.trim()) {
      setStatus({ type: "error", msg: "Please fill in all fields." });
      return;
    }

    setLoading(true);
    try {
      await push(ref(database, "contacts"), {
        ...formData,
        timestamp: new Date().toISOString(),
      });

      setStatus({
        type: "success",
        msg: "Message received! We'll get back to you soon.",
      });

      setFormData({ name: "", email: "", message: "" });
    } catch {
      setStatus({
        type: "error",
        msg: "Failed to send. Please try again later.",
      });
    } finally {
      setLoading(false);
      setTimeout(() => setStatus({ type: "", msg: "" }), 5000);
    }
  };

  return (
    <div className="contact-page-root">
      <div className="contact-bg-shapes">
        <div className="shape c-s1"></div>
        <div className="shape c-s2"></div>
      </div>

      <div className="contact-container">
        {/* Info Column */}
        <div className="contact-info-glass">
          <div className="info-header">
            <h1>Let's <span className="highlight-text">Collaborate</span></h1>
            <p className="info-p">
              Whether you have questions about our notes, need support with the SGPA calculator,
              or want to contribute to <strong>ExamMeta</strong>, use the support form below.
            </p>
          </div>

          <div className="contact-methods">
            <div className="method-item">
              <div className="method-icon"><FaEnvelope /></div>
              <div className="method-text">
                <span className="label">Email Support</span>
                <a className="value" href={`mailto:${SITE_CONTACT.email}`}>{SITE_CONTACT.email}</a>
              </div>
            </div>

            <div className="method-item">
              <div className="method-icon"><FaMapMarkerAlt /></div>
              <div className="method-text">
                <span className="label">Location</span>
                <a className="value" href={SITE_CONTACT.mapUrl} target="_blank" rel="noopener noreferrer">{SITE_CONTACT.location}</a>
              </div>
            </div>
          </div>
        </div>

        {/* Form Column */}
        <div className="contact-form-glass">
          <h3 className="form-title">Send a Message</h3>

          <form onSubmit={handleSubmit} className="form-grid">
            <div className="input-block">
              <label>Your Name</label>
              <input
                type="text"
                name="name"
                className="con-input"
                placeholder="John Doe"
                value={formData.name}
                onChange={handleInputChange}
              />
            </div>

            <div className="input-block">
              <label>Your Email</label>
              <input
                type="email"
                name="email"
                className="con-input"
                placeholder="john@example.com"
                value={formData.email}
                onChange={handleInputChange}
              />
            </div>

            <div className="input-block">
              <label>Message</label>
              <textarea
                name="message"
                className="con-input"
                placeholder="How can we help you?"
                value={formData.message}
                onChange={handleInputChange}
              />
            </div>

            <button type="submit" className="send-msg-btn" disabled={loading}>
              {loading ? (
                "Sending..."
              ) : (
                <>Send Message <FaPaperPlane /></>
              )}
            </button>

            {status.msg && (
              <div className={`form-status ${status.type}`}>
                {status.type === "success" ? <FaCheckCircle /> : <FaExclamationCircle />}
                <span>{status.msg}</span>
              </div>
            )}
          </form>
        </div>
      </div>
    </div>
  );
};

export default Contact;
