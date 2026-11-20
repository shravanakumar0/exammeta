import React from "react";
import { Link } from "react-router-dom";
import {
  FaEnvelope,
  FaMapMarkerAlt,
  FaChevronRight,
  FaFacebook,
  FaTwitter,
  FaInstagram,
  FaLinkedin,
  FaYoutube,
  FaPhone,
  FaGlobe,
  FaDiscord,
} from "react-icons/fa";
import "./FooterModern.css";
import { SITE_CONTACT } from "../config/siteContact";

const Footer = () => {
  const currentYear = new Date().getFullYear();

  const socialLinks = [
    { name: "Facebook", url: "https://facebook.com/exammeta", icon: <FaFacebook />, color: "#3b5998" },
    { name: "Twitter", url: "https://twitter.com/exammeta", icon: <FaTwitter />, color: "#1da1f2" },
    { name: "Instagram", url: "https://instagram.com/exammeta", icon: <FaInstagram />, color: "#e4405f" },
    { name: "LinkedIn", url: "https://linkedin.com/company/exammeta", icon: <FaLinkedin />, color: "#0a66c2" },
    { name: "YouTube", url: "https://youtube.com/@exammeta", icon: <FaYoutube />, color: "#ff0000" },
    { name: "Discord", url: "https://discord.gg/exammeta", icon: <FaDiscord />, color: "#5865f2" },
  ];

  return (
    <footer className="footer-modern">
      <div className="footer-glass-mesh"></div>

      <div className="footer-container">
        <div className="footer-top-section">
          {/* Brand Column */}
          <div className="footer-col brand-col">
            <div className="footer-brand-header">
              <div className="brand-logo-glow">
                <FaGlobe size={24} className="logo-icon-svg" />
              </div>
              <div className="brand-info">
                <h3>ExamMeta</h3>
                <p>Student Academic Resources</p>
              </div>
            </div>
            <p className="brand-philosophy">
              Study resources, exam preparation tools, SGPA calculators, placement guides,
              and career resources for VTU engineering students.
            </p>
            <div className="brand-contact-glass">
              <div className="glass-item">
                <FaEnvelope className="glass-icon" />
                <a href={`mailto:${SITE_CONTACT.email}`}>{SITE_CONTACT.email}</a>
              </div>
              <div className="glass-item">
                <FaPhone className="glass-icon" />
                <a href={`tel:${SITE_CONTACT.phone}`}>{SITE_CONTACT.phone}</a>
              </div>
              <div className="glass-item">
                <FaMapMarkerAlt className="glass-icon" />
                <a href={SITE_CONTACT.mapUrl} target="_blank" rel="noopener noreferrer">{SITE_CONTACT.location}</a>
              </div>
              <div className="glass-item">
                <FaGlobe className="glass-icon" />
                <a href={SITE_CONTACT.website} target="_blank" rel="noopener noreferrer">{SITE_CONTACT.website}</a>
              </div>
            </div>
            <div className="footer-social">
              <span className="social-label">Follow Us:</span>
              <div className="social-links">
                {socialLinks.map((social) => (
                  <a
                    key={social.name}
                    href={social.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="social-link"
                    style={{ color: social.color }}
                    title={social.name}
                  >
                    {social.icon}
                  </a>
                ))}
              </div>
            </div>
          </div>

          {/* Quick Nav */}
          <div className="footer-col nav-col">
            <h4 className="footer-title-modern">Quick Navigation</h4>
            <ul className="footer-links-modern">
              <li><Link to="/"><FaChevronRight className="link-arrow" /> Home Dashboard</Link></li>
              <li><Link to="/about"><FaChevronRight className="link-arrow" /> Our Story</Link></li>
              <li><Link to="/faqs"><FaChevronRight className="link-arrow" /> FAQs</Link></li>
              <li><Link to="/#repeated-questions"><FaChevronRight className="link-arrow" /> Uploaded PYQ Papers</Link></li>
              <li><Link to="/#hackathon-finder"><FaChevronRight className="link-arrow" /> Hackathons & Internships</Link></li>
              <li><Link to="/contact"><FaChevronRight className="link-arrow" /> Help Center</Link></li>
              <li><Link to="/career-tools"><FaChevronRight className="link-arrow" /> Career & Tools</Link></li>
            </ul>
          </div>

          {/* Tools & Resources */}
          <div className="footer-col nav-col">
            <h4 className="footer-title-modern">Student Tools</h4>
            <ul className="footer-links-modern">
              <li><Link to="/sgpa-calculator"><FaChevronRight className="link-arrow" /> SGPA Calculator</Link></li>
              <li><Link to="/model-papers"><FaChevronRight className="link-arrow" /> Model Papers</Link></li>
              <li><Link to="/placement-guide"><FaChevronRight className="link-arrow" /> Placement Guide</Link></li>
              <li><Link to="/privacy-policy"><FaChevronRight className="link-arrow" /> Privacy Policy</Link></li>
              <li><Link to="/terms-and-conditions"><FaChevronRight className="link-arrow" /> Terms of Service</Link></li>
              <li><Link to="/test"><FaChevronRight className="link-arrow" /> Mock Tests</Link></li>
            </ul>
          </div>

          {/* Community & Newsletter */}
          <div className="footer-col highlight-col">
            <h4 className="footer-title-modern">Join Our Community</h4>
            <p className="newsletter-hint">
              Subscribe to get latest updates on VTU syllabus, model papers, placement drives,
              and hackathons delivered to your inbox.
            </p>

            <div className="newsletter-form">
              <input
                type="email"
                placeholder="Enter your email"
                className="newsletter-input"
              />
              <button className="footer-cta-btn">
                Subscribe <FaChevronRight />
              </button>
            </div>

            <div className="footer-features">
              <div className="feature-item">
                <FaDiscord className="feature-icon" />
                <span>Student Discord Community</span>
              </div>
              <div className="feature-item">
                <FaPhone className="feature-icon" />
                <span>24/7 Student Support</span>
              </div>
              <div className="feature-item">
                <FaGlobe className="feature-icon" />
                <span>All VTU Schemes Covered</span>
              </div>
            </div>
          </div>
        </div>

        <div className="footer-divider-modern"></div>

        <div className="footer-bottom-modern">
          <div className="bottom-left">
            <p>© {currentYear} ExamMeta. All rights reserved.</p>
            <p className="bottom-disclaimer">
              VTU is referenced to describe academic materials and is not an endorsement or affiliation claim.
            </p>
          </div>
          <div className="bottom-right">
            <div className="bottom-legal">
              <Link to="/terms-and-conditions" className="footer-legal-link">Terms of Service</Link>
              <span className="dot-sep">•</span>
              <Link to="/privacy-policy" className="footer-legal-link">Privacy Policy</Link>
              <span className="dot-sep">•</span>
              <Link to="/contact" className="footer-legal-link">Contact Us</Link>
            </div>
            <div className="bottom-social">
              <span className="social-label-small">Follow:</span>
              <div className="social-links-small">
                {socialLinks.slice(0, 3).map((social) => (
                  <a
                    key={social.name}
                    href={social.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="social-link-small"
                    style={{ color: social.color }}
                  >
                    {social.icon}
                  </a>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
