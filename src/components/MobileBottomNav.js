import React from "react";
import { Link, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import {
    AiOutlineHome,
    AiOutlineBook,
    AiOutlineFileText,
    AiOutlineCalculator,
} from "react-icons/ai";
import "./MobileBottomNav.css";

const MobileBottomNav = ({ isMobileMenuOpen }) => {
    const location = useLocation();

    const navItems = [
        { path: "/", icon: <AiOutlineHome />, label: "Home" },
        { path: "/branch-selection/2022", icon: <AiOutlineBook />, label: "Notes" },
        { path: "/placement-guide", icon: <AiOutlineFileText />, label: "Careers" },
        { path: "/model-papers", icon: <AiOutlineFileText />, label: "PYQs" },
        { path: "/sgpa-calculator", icon: <AiOutlineCalculator />, label: "SGPA" },
    ];

    return (
        <div className={`mobile-bottom-nav-island ${isMobileMenuOpen ? 'nav-hidden' : ''}`}>
            <div className="nav-island-container">
                {navItems.map((item) => {
                    const isActive = location.pathname === item.path;
                    return (
                        <Link
                            key={item.path}
                            to={item.path}
                            className={`nav-island-item ${isActive ? "active" : ""}`}
                        >
                            <div className="item-icon-wrapper">
                                {item.icon}
                                {isActive && (
                                    <motion.div
                                        layoutId="nav-glow"
                                        className="nav-active-glow"
                                        transition={{ type: "spring", stiffness: 300, damping: 30 }}
                                    />
                                )}
                            </div>
                            <span className="item-label">{item.label}</span>
                        </Link>
                    );
                })}
            </div>
        </div>
    );
};

export default MobileBottomNav;
