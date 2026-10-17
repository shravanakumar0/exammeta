import React from "react";
import { Link } from "react-router-dom";
import {
  BookOpen, Calculator, Users, Zap, Globe, CheckCircle, Code,
  Mail, Sparkles, Target, Heart, ArrowRight,
  GraduationCap, Shield, Github, Linkedin, Instagram
} from "lucide-react";
import "./AboutModern.css"; // CHANGED: Modern CSS

const stats = [
  { label: "Study Resources", value: "Browse", icon: <BookOpen /> },
  { label: "Academic Tools", value: "Explore", icon: <Calculator /> },
  { label: "Student Support", value: "Contact", icon: <Users /> },
  { label: "Event Listings", value: "Live sources", icon: <Globe /> },
];

const features = [
  {
    title: "Comprehensive Materials",
    desc: "Notes & Question Papers specifically tailored for CSE, ECE, and other VTU branches.",
    icon: <BookOpen />,
    color: "#60A5FA" // blue-400
  },
  {
    title: "Smart Calculators",
    desc: "Instant SGPA, CGPA, and percentage calculations built for VTU grading logic.",
    icon: <Calculator />,
    color: "#F472B6" // pink-400
  },
  {
    title: "Exam Ready",
    desc: "Official model question papers and solved guides to boost your confidence.",
    icon: <CheckCircle />,
    color: "#34D399" // emerald-400
  },
  {
    title: "High Performance",
    desc: "Blazing fast speeds with lazy loading, CDN caching, and modern code-splitting.",
    icon: <Zap />,
    color: "#FBBF24" // amber-400
  },
];

function About() {
  return (
    <div className="about-container">

      {/* Hero Section */}
      <section className="about-hero">
        <div className="about-hero-badge">
          <Sparkles size={16} /> Made for VTU 2025
        </div>
        <h1 className="about-title">
          The Ultimate Hub for <br />
          <span style={{ color: '#6366F1' }}>Smart Engineers</span>
        </h1>
        <p className="about-subtitle responsive-text-check">
          Simplify your engineering journey with top-quality notes,
          smart tools, and a student-first ecosystem designed for success.
          Built with precision, updated for the latest scheme.
        </p>

        <div className="about-stats-grid">
          {stats.map((stat, i) => (
            <div className="stat-card-modern" key={i}>
              <div style={{ color: '#6366F1', marginBottom: '12px', display: 'flex', justifyContent: 'center' }}>
                {React.cloneElement(stat.icon, { size: 32 })}
              </div>
              <span className="stat-value">{stat.value}</span>
              <span className="stat-label">{stat.label}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Features Grid */}
      <section className="features-section">
        <div style={{ textAlign: 'center', marginBottom: '60px' }}>
          <h2 style={{ fontSize: '2.5rem', fontWeight: '800', marginBottom: '16px', color: 'white' }}>Why Students Love Us</h2>
          <p style={{ color: '#94A3B8' }}>Crafted with care to solve real student problems.</p>
        </div>
        <div className="features-grid">
          {features.map((item, index) => (
            <div className="feature-card-glass" key={index}>
              <div className="feature-icon-box" style={{ color: item.color, background: `${item.color}20` }}>
                {React.cloneElement(item.icon, { size: 28 })}
              </div>
              <h3 className="responsive-text-check">{item.title}</h3>
              <p className="responsive-text-check">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Mission Section */}
      <section className="team-section">
        <div className="dev-highlight-card">
          <div className="dev-avatar-large">V</div>
          <h2 style={{ fontSize: '2rem', marginBottom: '16px', color: 'white' }}>Our Mission</h2>
          <p style={{ fontSize: '1.1rem', lineHeight: '1.8', color: '#CBD5E1', marginBottom: '40px' }} className="responsive-text-check">
            ExamMeta brings study materials, exam preparation tools, and student support together.
            Academic resources are organized by branch, semester, and subject to make them easier to find.
          </p>

          <div style={{ display: 'flex', justifyContent: 'center', gap: '20px', flexWrap: 'wrap' }}>
            <Link to="/contact" style={{ background: '#6366F1', color: 'white', padding: '12px 24px', borderRadius: '100px', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: '600' }}>
              <Mail size={18} /> Contact Team
            </Link>
            <Link to="/branch-selection/2022" style={{ border: '1px solid rgba(255,255,255,0.2)', color: 'white', padding: '12px 24px', borderRadius: '100px', textDecoration: 'none', fontWeight: '600' }}>
              Start Learning
            </Link>
          </div>
        </div>
      </section>

    </div>
  );
}

export default About;
