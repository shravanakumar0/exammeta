import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    FaSearch, FaExternalLinkAlt, FaCheckCircle,
    FaBookOpen, FaLaptopCode, FaUserTie,
    FaChevronDown, FaChevronUp, FaRocket, FaLightbulb, FaBrain,
    FaGlobe, FaRoad, FaCode, FaChartLine, FaBriefcase,
    FaCopy, FaSync
} from 'react-icons/fa';
import { Link } from 'react-router-dom';
import './PlacementGuideModern.css';

// --- DATA ---
const SECTIONS_DATA = [
    {
        id: 'aptitude',
        category: 'Aptitude',
        icon: <FaBrain />,
        title: 'Aptitude & Assessment Skills',
        info: 'Build accuracy first, then improve speed. Assessment formats differ by employer, so check the job-drive instructions.',
        learn: [
            'Percentages, ratios, averages, time-work, and data interpretation',
            'Logical reasoning, pattern recognition, and verbal comprehension',
            'How to estimate, eliminate options, and manage timed sections'
        ],
        practice: [
            'Complete short timed sets and record accuracy as well as time',
            'Keep an error log; redo missed questions after a few days',
            'Take a full mock weekly and review every incorrect answer'
        ],
        resources: [
            { label: 'SHL practice assessments', url: 'https://www.shl.com/shldirect/en/practice-tests/' },
            { label: 'IndiaBIX aptitude practice', url: 'https://www.indiabix.com/' }
        ],
    },
    {
        id: 'technical',
        category: 'Technical',
        icon: <FaLaptopCode />,
        title: 'Programming, DSA & Core CS',
        info: 'Choose one interview language, learn problem-solving fundamentals, and be ready to explain your computer-science basics.',
        learn: [
            'One language in depth: syntax, collections, OOP, exceptions, and debugging',
            'Arrays, strings, hash maps, stacks, queues, trees, graphs, sorting, and complexity',
            'SQL plus DBMS, operating systems, networking, and object-oriented design basics'
        ],
        practice: [
            'Solve 3–5 problems each week; explain the approach and time/space complexity aloud',
            'Revisit failed problems and write down the pattern you missed',
            'Practise SQL queries and give concise answers to core-CS questions'
        ],
        resources: [
            { label: 'HackerRank Interview Preparation Kit', url: 'https://www.hackerrank.com/interview/interview-preparation-kit' },
            { label: 'Official Java learning path', url: 'https://dev.java/learn/' },
            { label: 'Official Python tutorial', url: 'https://docs.python.org/3/tutorial/' },
            { label: 'PostgreSQL SQL tutorial', url: 'https://www.postgresql.org/docs/current/tutorial.html' }
        ],
    },
    {
        id: 'softskills',
        category: 'Soft Skills',
        icon: <FaUserTie />,
        title: 'Resume & Interview Communication',
        info: 'Make your work easy to verify, and practise explaining your decisions clearly and honestly.',
        learn: [
            'A concise, readable resume tailored to the skills in each role description',
            'STAR (Situation, Task, Action, Result) stories for teamwork and problem solving',
            'How to describe project trade-offs, mistakes, and what you learned'
        ],
        practice: [
            'Rewrite project bullets with the problem, your contribution, and a measured result',
            'Record a 60-second introduction and refine it for clarity',
            'Practise one technical and one behavioural mock interview each week'
        ],
        resources: [
            { label: 'Harvard resume and cover-letter guide', url: 'https://cdn-careerservices.fas.harvard.edu/wp-content/uploads/sites/161/2023/04/resume-and-cover-letter-guide.pdf' },
            { label: 'HackerRank interview preparation', url: 'https://www.hackerrank.com/interview/interview-preparation-kit' }
        ],
    },
    {
        id: 'offcampus',
        category: 'Off-Campus',
        icon: <FaGlobe />,
        title: 'Applications & Job Search',
        info: 'Use campus and off-campus routes together. Always confirm role details and eligibility on the employer’s own careers page.',
        learn: [
            'How to read role requirements and distinguish required from preferred skills',
            'Application basics: resume versions, referrals, recruiter messages, and follow-ups',
            'How to check location, graduation year, work authorization, and deadlines'
        ],
        practice: [
            'Maintain a tracker with company, role, source, date, status, and next action',
            'Tailor your resume to the role without adding skills you cannot demonstrate',
            'Use official company job pages to verify openings before sharing personal data'
        ],
        resources: [
            { label: 'LinkedIn Jobs (Networking)', url: 'https://www.linkedin.com/jobs/' },
            { label: 'Wellfound startup roles', url: 'https://wellfound.com/jobs' },
            { label: 'Unstop opportunities', url: 'https://unstop.com/' }
        ],
    },
    {
        id: 'roadmaps',
        category: 'Roadmaps',
        icon: <FaRoad />,
        title: 'Role-Based Paths',
        info: 'Pick one entry-level role to start. Learn the fundamentals before adding tools to your stack.',
        learn: [
            'Frontend: HTML, CSS, JavaScript, responsive design, accessibility, and browser APIs',
            'Backend: one server language, HTTP/REST, SQL, authentication, testing, and deployment',
            'Data: Python, SQL, statistics, data cleaning, visualisation, and introductory machine learning'
        ],
        practice: [
            'Choose one path for 8–12 weeks and follow its milestones in order',
            'Build a small feature after each topic instead of collecting courses',
            'Use official product documentation when a roadmap and a tool version differ'
        ],
        resources: [
            { label: 'Backend developer roadmap', url: 'https://roadmap.sh/backend' },
            { label: 'Frontend developer roadmap', url: 'https://roadmap.sh/frontend' },
            { label: 'MDN web development curriculum', url: 'https://developer.mozilla.org/en-US/docs/Learn_web_development' },
            { label: 'AWS cloud fundamentals (optional)', url: 'https://aws.amazon.com/training/learn-about/cloud-practitioner/' }
        ],
    },
    {
        id: 'projects',
        category: 'Projects',
        icon: <FaRocket />,
        title: 'Project Portfolio',
        info: 'A focused, working project is stronger evidence than a long list of tools. Make your contribution and decisions easy to inspect.',
        learn: [
            'Git and GitHub workflow, readable code, basic tests, and clear documentation',
            'How to design a small solution around a real user need',
            'Deployment basics, environment variables, and safe handling of credentials'
        ],
        practice: [
            'Build and deploy one end-to-end project related to your target role',
            'Add a useful README with setup steps, screenshots, features, and limitations',
            'Prepare a short demo and explain one trade-off and one improvement'
        ],
        resources: [
            { label: 'GitHub Skills: Introduction to GitHub', url: 'https://skills.github.com/' },
            { label: 'GitHub Hello World guide', url: 'https://docs.github.com/en/get-started/using-github/hello-world' },
            { label: 'MDN project-based web learning', url: 'https://developer.mozilla.org/en-US/docs/Learn_web_development' }
        ],
    },
    {
        id: 'mock-tests',
        category: 'Mock Tests',
        icon: <FaBrain />,
        title: 'Mock Tests & Review',
        info: 'Use practice tests to find gaps, not just to collect scores. Employer assessments vary from role to role.',
        learn: [
            'Timed coding, aptitude, SQL, and computer-science question formats',
            'How to communicate assumptions and test edge cases',
            'How to analyse mistakes and choose the next topic to revise'
        ],
        practice: [
            'Take one timed mock each week under realistic conditions',
            'After each mock, group errors by concept and redo the missed questions',
            'Practise explaining solutions aloud before looking at editorials'
        ],
        resources: [
            { label: 'Start ExamMeta mock test', url: '/test' },
            { label: 'HackerRank coding interview practice', url: 'https://www.hackerrank.com/interview/interview-preparation-kit' },
            { label: 'SHL practice assessments', url: 'https://www.shl.com/shldirect/en/practice-tests/' }
        ],
    }
];

const TIPS_DATA = [
    "Practise consistently and review mistakes; solving more questions without reflection is not a plan.",
    "Read each employer's current role description and assessment instructions before preparing for its process.",
    "Use mock interviews to practise explaining your reasoning, not only to check whether you got the answer.",
    "Deploy one project and make the README clear enough for someone else to run it.",
    "Keep an application tracker and verify openings on the employer's official careers page."
];

const TIMELINE_DATA = [
    {
        sem: 'Weeks 1–2',
        title: 'Choose a target and assess your baseline',
        desc: 'Pick one role, review current job descriptions, choose one programming language, and identify your strongest skill gaps.',
        icon: <FaCode />
    },
    {
        sem: 'Weeks 3–6',
        title: 'Build foundations with deliberate practice',
        desc: 'Study DSA patterns, SQL, aptitude, and the core-CS topics relevant to your roles. Keep an error log and revise weekly.',
        icon: <FaBriefcase />
    },
    {
        sem: 'Weeks 7–9',
        title: 'Build proof of your skills',
        desc: 'Finish and deploy one role-relevant project with tests, a useful README, and a short demo you can explain.',
        icon: <FaRocket />
    },
    {
        sem: 'Weeks 10–12',
        title: 'Rehearse, apply, and improve',
        desc: 'Run timed mocks, refine your resume for each role, verify applications on employer sites, and use feedback to target weak areas.',
        icon: <FaRocket />
    }
];

const CHECKLIST_ITEMS = [
    "Selected a target role and wrote a realistic study plan",
    "Solved and reviewed a set of DSA problems in one language",
    "Practised SQL and revised relevant OS, DBMS, and networking basics",
    "Built and deployed one role-relevant project with a clear README",
    "Prepared a concise resume tailored to a real job description",
    "Completed timed aptitude and coding practice with error review",
    "Practised explaining a project and completed a mock interview",
    "Verified role eligibility and application details on employer career pages"
];

// --- RESUME BUILDER COMPONENT REMOVED (Moved to /resume-builder) ---

// --- INTERNAL COMPONENTS ---


// --- COMPONENT ---
const PlacementGuide = () => {
    const [searchTerm, setSearchTerm] = useState('');
    const [activeCategory, setActiveCategory] = useState('All');
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [checklist, setChecklist] = useState(() => {
        const saved = localStorage.getItem('modernPlacementChecklist');
        return saved ? JSON.parse(saved) : {};
    });

    useEffect(() => {
        localStorage.setItem('modernPlacementChecklist', JSON.stringify(checklist));
    }, [checklist]);

    const handleCheck = (item) => {
        setChecklist(prev => ({ ...prev, [item]: !prev[item] }));
    };

    const calculateXP = () => {
        return CHECKLIST_ITEMS.filter(item => checklist[item]).length * 100;
    };

    const getPlayerLevel = (xp) => {
        if (xp < 300) return "Getting Started";
        if (xp < 600) return "Building Momentum";
        return "Interview Ready";
    };

    const filteredSections = SECTIONS_DATA.filter(section => {
        const query = searchTerm.toLowerCase();
        const searchableContent = [
            section.title,
            section.info,
            ...section.learn,
            ...section.practice,
            ...section.resources.map(resource => resource.label)
        ];
        const matchesSearch = searchableContent.some(content => content.toLowerCase().includes(query));
        const matchesCategory = activeCategory === 'All' || section.category === activeCategory;
        return matchesSearch && matchesCategory;
    });

    const categories = ['All', ...new Set(SECTIONS_DATA.map(item => item.category))];

    const [dailyTip, setDailyTip] = useState('');

    useEffect(() => {
        // Random Tip
        const random = Math.floor(Math.random() * TIPS_DATA.length);
        setDailyTip(TIPS_DATA[random]);
    }, []);

    return (
        <div className="pg-container">
            {/* Hero Section */}
            <header className="pg-hero">
                <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8 }}
                >
                    <h1>Placement <span style={{color: '#a855f7'}}>Readiness</span> 2027</h1>
                    <p>A practical roadmap for 2027 hiring: what to learn, how to practise, and trusted resources to use.</p>
                    <p className="pg-update-note">Hiring rounds and eligibility vary by employer; verify details on the official careers page.</p>
                </motion.div>

                {/* Daily Tip Widget */}
                <motion.div 
                    className="pg-tip-container"
                    initial={{ width: 0, opacity: 0 }}
                    animate={{ width: '100%', opacity: 1 }}
                    transition={{ delay: 0.5, duration: 0.8 }}
                >
                    <div className="pg-tip-card">
                        <div className="pg-tip-icon-box">
                            <FaLightbulb className="pg-tip-icon" />
                        </div>
                        <div className="pg-tip-content">
                            <h3>
                                Daily Logic 
                                <span className="pg-tip-tag">#Motivation</span>
                            </h3>
                            <p>"{dailyTip}"</p>
                        </div>
                        <div className="pg-tip-actions">
                            <button 
                                className="pg-tip-action-btn" 
                                onClick={() => {
                                    navigator.clipboard.writeText(dailyTip);
                                    // Could add a toast here
                                }}
                                title="Copy Quote"
                            >
                                <FaCopy />
                            </button>
                            <button 
                                className="pg-tip-action-btn" 
                                onClick={() => {
                                    const random = Math.floor(Math.random() * TIPS_DATA.length);
                                    setDailyTip(TIPS_DATA[random]);
                                }}
                                title="Next Tip"
                            >
                                <FaSync />
                            </button>
                        </div>
                    </div>
                </motion.div>

                <div className="pg-search-container">
                    <FaSearch className="pg-search-icon" />
                    <input 
                        type="text" 
                        className="pg-search-input"
                        placeholder="Search resources, topics..." 
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>

                {/* Desktop Filters (Hidden on Mobile) */}
                <div className="pg-filters">
                    {categories.map(cat => (
                        <button 
                            key={cat} 
                            className={`pg-filter-btn ${activeCategory === cat ? 'active' : ''}`}
                            onClick={() => setActiveCategory(cat)}
                        >
                            {cat}
                        </button>
                    ))}
                </div>

                {/* Mobile Filter Dropdown (Visible on Mobile) */}
                <div className="pg-mobile-filter-container">
                    <button 
                        className={`pg-mobile-dropdown-btn ${isDropdownOpen ? 'open' : ''}`} 
                        onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                    >
                        <span className="pg-selected-cat">{activeCategory}</span>
                        {isDropdownOpen ? <FaChevronUp /> : <FaChevronDown />}
                    </button>
                    
                    <AnimatePresence>
                        {isDropdownOpen && (
                            <motion.div 
                                className="pg-mobile-dropdown-menu"
                                initial={{ opacity: 0, y: -10, scale: 0.95 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                exit={{ opacity: 0, y: -10, scale: 0.95 }}
                                transition={{ duration: 0.2 }}
                            >
                                {categories.map(cat => (
                                    <div 
                                        key={cat}
                                        className={`pg-mobile-dropdown-item ${activeCategory === cat ? 'active' : ''}`}
                                        onClick={() => {
                                            setActiveCategory(cat);
                                            setIsDropdownOpen(false);
                                        }}
                                    >
                                        {cat}
                                        {activeCategory === cat && <FaCheckCircle className="pg-check-icon-mobile" />}
                                    </div>
                                ))}
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </header>

            {/* Learning roadmap */}
            <section className="pg-grid">
                <AnimatePresence>
                    {filteredSections.map((section) => (
                        <motion.div 
                            key={section.id}
                            className="pg-card"
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            transition={{ duration: 0.3 }}
                            whileHover={{ scale: 1.02, rotateX: 2, rotateY: 2 }} // Simple tilt
                        >
                            <div className="pg-card-header">
                                <div className="pg-icon-wrapper">{section.icon}</div>
                                <h2>{section.title}</h2>
                            </div>
                            <p className="pg-card-info">{section.info}</p>

                            <div className="pg-guidance-grid">
                                <div className="pg-guidance-block">
                                    <h3><FaBookOpen /> What to learn</h3>
                                    <ul>
                                        {section.learn.map((topic) => <li key={topic}>{topic}</li>)}
                                    </ul>
                                </div>
                                <div className="pg-guidance-block">
                                    <h3><FaCheckCircle /> How to practise</h3>
                                    <ul>
                                        {section.practice.map((step) => <li key={step}>{step}</li>)}
                                    </ul>
                                </div>
                            </div>

                            <div className="pg-links-section">
                                <h3><FaExternalLinkAlt /> Sources & learning material</h3>
                                <ul className="pg-link-list">
                                    {section.resources.map((res, i) => (
                                        <li key={i} className="pg-link-item">
                                            {res.url.startsWith('/') ? (
                                                <Link to={res.url} className="pg-link">
                                                    {res.label}
                                                </Link>
                                            ) : (
                                                <a href={res.url} target="_blank" rel="noopener noreferrer" className="pg-link">
                                                    {res.label}
                                                </a>
                                            )}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </motion.div>
                    ))}
                </AnimatePresence>
            </section>
            {filteredSections.length === 0 && (
                <p className="pg-no-results">No matching topics found. Try a broader search.</p>
            )}

            {/* Resume Features Removed */}

            {/* Visual Timeline Strategy */}
            <section className="pg-timeline-section">
                <h2 className="pg-timeline-title"><FaChartLine /> The Strategy Timeline</h2>
                <div className="pg-timeline">
                    {TIMELINE_DATA.map((item, index) => (
                        <div key={index} className="pg-timeline-node">
                            <div className="pg-timeline-dot"></div>
                            <motion.div 
                                className="pg-timeline-content"
                                initial={{ opacity: 0, x: index % 2 === 0 ? -50 : 50 }}
                                whileInView={{ opacity: 1, x: 0 }}
                                transition={{ duration: 0.5, delay: index * 0.2 }}
                            >
                                <span className="pg-timeline-date">{item.sem}</span>
                                <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    {item.icon} {item.title}
                                </h3>
                                <p style={{ color: '#94a3b8', fontSize: '0.95rem' }}>{item.desc}</p>
                            </motion.div>
                        </div>
                    ))}
                </div>
            </section>

            {/* Preparation Tracker (Gamified) */}
            <section className="pg-tracker-section">
                <motion.div 
                    className="pg-tracker-card"
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                >
                    <div className="pg-level-badge">{getPlayerLevel(calculateXP())}</div>
                    <h2 style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <FaCheckCircle style={{ color: '#6366f1' }} /> 
                        Quest Board
                    </h2>
                    
                    <div className="pg-progress-container">
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                            <span>XP: {calculateXP()} / {CHECKLIST_ITEMS.length * 100}</span>
                            <span>{Math.round((calculateXP() / (CHECKLIST_ITEMS.length * 100)) * 100)}%</span>
                        </div>
                        <div className="pg-progress-bar-bg">
                            <div 
                                className="pg-progress-fill" 
                                style={{ width: `${(calculateXP() / (CHECKLIST_ITEMS.length * 100)) * 100}%` }}
                            ></div>
                        </div>
                        <p className="pg-xp-text">Complete quests to level up!</p>
                    </div>

                    <div className="pg-checklist-grid">
                        {CHECKLIST_ITEMS.map((item, index) => (
                            <div 
                                key={index} 
                                className={`pg-checklist-item pg-quest-card ${checklist[item] ? 'checked completed' : ''}`}
                                onClick={() => handleCheck(item)}
                            >
                                <div className="pg-checkbox">
                                    {checklist[item] && <FaCheckCircle className="pg-check-icon"/>}
                                </div>
                                <span>{item}</span>
                                <span className="pg-quest-xp">+100 XP</span>
                            </div>
                        ))}
                    </div>
                </motion.div>
            </section>

        </div>
    );
};

export default PlacementGuide;
