import React, { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  FaHome, FaBook, FaGraduationCap, FaCalculator, FaRocket,
  FaBriefcase, FaChevronDown, FaSearch, FaUser, FaSignOutAlt,
  FaTrophy
} from "react-icons/fa";
import { supabase, signOut, getCurrentUser, onAuthStateChange } from "../supabaseClient";
import "./NavbarModern.css";

const Navbar = () => {
  const location = useLocation();
  const [scrolled, setScrolled] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const userData = await getCurrentUser();
        setUser(userData);
      } catch (err) {
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    checkAuth();

    const { data: { subscription } } = onAuthStateChange((event, session) => {
      setUser(session?.user || null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const closeMenu = () => setIsOpen(false);

  const handleSignOut = async () => {
    await signOut();
    setUser(null);
  };

  const navLinks = [
    { name: "Home", path: "/", icon: <FaHome /> },
    { name: "Notes", path: "/notes", icon: <FaBook /> },
    {
      name: "Placement",
      path: "/placement-guide",
      icon: <FaBriefcase />,
      submenu: [
        { name: "Guide & Roadmap", path: "/placement-guide" },
        { name: "Mock Tests", path: "/test" }
      ]
    },
    { name: "Model Papers", path: "/model-papers", icon: <FaGraduationCap /> },
    {
      name: "Student Hub",
      path: "/#repeated-questions",
      icon: <FaBook />,
      submenu: [
        { name: "Important Q&A", path: "/#repeated-questions" },
        { name: "Hackathons", path: "/hackathons" },
        { name: "Hackathon Register", path: "/hackathon-register" },
        { name: "Internships", path: "/internships" },
        { name: "FAQs", path: "/faqs" }
      ]
    },
    { name: "Career & Tools", path: "/career-tools", icon: <FaRocket /> },
    { name: "SGPA", path: "/sgpa-calculator", icon: <FaCalculator /> },
  ];

  return (
    <header className={`nav-portal-layer ${scrolled ? "layer-scrolled" : ""}`}>
      <div className="nav-top-bar">
        <div className="nav-left">
          <Link to="/" className="nav-brand">
            <div className="nav-brand-icon">
              <FaGraduationCap size={24} color="#ffffff" style={{ filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.1))" }} />
            </div>
            <div>
              <div className="nav-brand-text">Exam<span>Meta</span></div>
              <div className="nav-brand-tagline">Student Academic Portal</div>
            </div>
          </Link>
        </div>

        <nav className="nav-desktop">
          <ul className="nav-list">
            {navLinks.map((link) => {
              const hasSubmenu = !!link.submenu;
              const active = location.pathname === link.path ||
                (link.path !== "/" && location.pathname.startsWith(link.path + "/"));
              return (
                <li key={link.name}>
                  <Link
                    to={link.path}
                    className={`nav-link ${active ? "is-active" : ""}`}
                  >
                    {link.icon}
                    <span>{link.name}</span>
                    {hasSubmenu && <FaChevronDown size={14} />}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="nav-actions">
          <div className="nav-search">
            <FaSearch className="nav-search-icon" />
            <input
              className="nav-search-input"
              type="text"
              placeholder="Search subjects, papers, notes…"
            />
          </div>

          {user ? (
            <div className="user-profile">
              <div className="user-avatar">
                {user.user_metadata?.full_name?.charAt(0) || user.email?.charAt(0)}
              </div>
              <div className="user-info">
                <div className="user-name">{user.user_metadata?.full_name || user.email}</div>
                <button className="user-signout" onClick={handleSignOut}>
                  <FaSignOutAlt size={16} />
                  <span>Sign Out</span>
                </button>
              </div>
            </div>
          ) : (
            <>
              <Link to="/login" className="nav-btn-signin">Sign in</Link>
              <Link to="/hackathon-register" className="nav-btn-getstarted">
                <FaTrophy size={16} /> Register Hackathon
              </Link>
            </>
          )}
        </div>

        <button
          className="nav-mobile-toggle"
          onClick={() => setIsOpen(!isOpen)}
          aria-label="Toggle Navigation Menu"
        >
          <div className={`nav-burger ${isOpen ? "open" : ""}`}>
            <span></span>
            <span></span>
            <span></span>
          </div>
        </button>
      </div>
    </header>
  );
};

export default Navbar;
