import React from "react";
import { Link } from "react-router-dom";
import { FaEnvelope, FaMapMarkerAlt, FaChevronRight } from "react-icons/fa";
import "./FooterModern.css";
import { SITE_CONTACT } from "../config/siteContact";

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="footer-modern">
      <div className="footer-glass-mesh"></div>

      <div className="footer-container">
        <div className="footer-top-section">
          {/* Brand Column */}
          <div className="footer-col brand-col">
            <div className="footer-brand-header">
              <div className="brand-logo-glow">EM</div>
              <div className="brand-info">
                <h3>ExamMeta</h3>
                <p>Student Academic Resources</p>
              </div>
            </div>
            <p className="brand-philosophy">
              Study resources, exam preparation tools, and student support in one place.
            </p>
            <div className="brand-contact-glass">
              <div className="glass-item">
                <FaEnvelope className="glass-icon" />
                <a href={`mailto:${SITE_CONTACT.email}`}>{SITE_CONTACT.email}</a>
              </div>
              <div className="glass-item">
                <FaMapMarkerAlt className="glass-icon" />
                <a href={SITE_CONTACT.mapUrl} target="_blank" rel="noopener noreferrer">{SITE_CONTACT.location}</a>
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
              <li><Link to="/#hackathon-finder"><FaChevronRight className="link-arrow" /> Hackathons &amp; Internships</Link></li>
              <li><Link to="/study-planner"><FaChevronRight className="link-arrow" /> Study Planner</Link></li>
              <li><Link to="/admin-dashboard"><FaChevronRight className="link-arrow" /> Admin Panel</Link></li>
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
            </ul>
          </div>

          {/* Community & Newsletter */}
          <div className="footer-col highlight-col">
            <h4 className="footer-title-modern">Contact ExamMeta</h4>
            <p className="newsletter-hint">Questions about study resources or student support? Reach the team directly.</p>

            <Link to="/career-tools" className="footer-cta-btn">
              Career Resources <FaChevronRight />
            </Link>
          </div>
        </div>

        <div className="footer-divider-modern"></div>

        <div className="footer-bottom-modern">
          <div className="bottom-left">
            <p>© {currentYear} ExamMeta</p>
          </div>
          <div className="bottom-right">
            <Link to="/terms-and-conditions" className="footer-legal-link">Terms of Service</Link>
            <span className="dot-sep">•</span>
            <Link to="/privacy-policy" className="footer-legal-link">Privacy</Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
