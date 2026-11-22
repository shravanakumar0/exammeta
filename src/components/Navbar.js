import React, { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  FaHome, FaBook, FaGraduationCap, FaCalculator, FaRocket,
  FaBriefcase, FaChevronDown, FaSearch, FaUser, FaSignOutAlt,
  FaTrophy, FaTimes
} from "react-icons/fa";
import { signOut, getCurrentUser, onAuthStateChange } from "../supabaseClient";
import "./NavbarModern.css";

const Navbar = () => {
  const location = useLocation();
  const [scrolled, setScrolled] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [user, setUser] = useState(null);

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
      }
    };

    checkAuth();

    const { data: { subscription } } = onAuthStateChange((event, session) => {
      setUser(session?.user || null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const closeMenu = () => setIsOpen(false);

  useEffect(() => {
    setIsOpen(false);
  }, [location.pathname, location.hash]);

  useEffect(() => {
    if (!isOpen) return undefined;

    const previousOverflow = document.body.style.overflow;
    const handleKeyDown = (event) => {
      if (event.key === "Escape") closeMenu();
    };
    document.addEventListener("keydown", handleKeyDown);
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [isOpen]);

  const handleSignOut = async () => {
    await signOut();
    setUser(null);
    closeMenu();
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
                <li key={link.name} className={hasSubmenu ? "nav-item-with-submenu" : undefined}>
                  <Link
                    to={link.path}
                    className={`nav-link ${active ? "is-active" : ""}`}
                  >
                    {link.icon}
                    <span>{link.name}</span>
                    {hasSubmenu && <FaChevronDown size={14} />}
                  </Link>
                  {hasSubmenu && (
                    <ul className="nav-submenu">
                      {link.submenu.map((item) => (
                        <li key={item.path}>
                          <Link to={item.path} onClick={closeMenu}>{item.name}</Link>
                        </li>
                      ))}
                    </ul>
                  )}
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
          aria-expanded={isOpen}
          aria-controls="mobile-navigation"
        >
          <div className={`nav-burger ${isOpen ? "open" : ""}`}>
            <span></span>
            <span></span>
            <span></span>
          </div>
        </button>
      </div>
      {isOpen && (
        <div className="nav-mobile-overlay">
          <button
            type="button"
            className="mobile-overlay-backdrop"
            aria-label="Close navigation menu"
            onClick={closeMenu}
          />
          <div className="mobile-menu-panel" id="mobile-navigation" role="dialog" aria-modal="true" aria-label="Main navigation">
            <div className="mobile-menu-header">
              <span className="mobile-brand-title">ExamMeta</span>
              <button className="mobile-close-btn" onClick={closeMenu} aria-label="Close menu">
                <FaTimes />
              </button>
            </div>
            <nav className="mobile-nav-list" aria-label="Mobile navigation">
              {navLinks.map((link) => {
                const active = location.pathname === link.path ||
                  (link.path !== "/" && !link.path.startsWith("/#") && location.pathname.startsWith(link.path + "/"));
                return (
                  <React.Fragment key={link.name}>
                    <Link
                      to={link.path}
                      className={`mobile-nav-item ${active ? "is-active" : ""}`}
                      onClick={closeMenu}
                    >
                      {link.icon}
                      <span>{link.name}</span>
                    </Link>
                    {link.submenu?.map((item) => (
                      <Link
                        key={item.path}
                        to={item.path}
                        className="mobile-nav-subitem"
                        onClick={closeMenu}
                      >
                        {item.name}
                      </Link>
                    ))}
                  </React.Fragment>
                );
              })}
            </nav>
            <div className="mobile-nav-actions">
              {user ? (
                <>
                  <span className="mobile-user-name">
                    <FaUser /> {user.user_metadata?.full_name || user.email}
                  </span>
                  <button className="mobile-btn-signin" onClick={handleSignOut}>
                    <FaSignOutAlt /> Sign out
                  </button>
                </>
              ) : (
                <>
                  <Link to="/login" className="mobile-btn-signin" onClick={closeMenu}>Sign in</Link>
                  <Link to="/hackathon-register" className="mobile-btn-getstarted" onClick={closeMenu}>
                    <FaTrophy /> Register Hackathon
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
};

export default Navbar;
