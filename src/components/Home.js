import React from 'react';
import { Link } from 'react-router-dom';
import {
  HiOutlineMagnifyingGlass, HiOutlineFire,
  HiOutlineClock, HiOutlineChevronRight, HiOutlineSparkles
} from 'react-icons/hi2';
import {
  FaRocket, FaShieldAlt, FaUserAstronaut,
  FaHeart, FaCrown, FaChevronLeft, FaChevronRight,
  FaGraduationCap, FaLayerGroup, FaRobot, FaCalculator,
  FaTimes, FaEye
} from 'react-icons/fa';
import { motion, AnimatePresence } from 'framer-motion';
import './Home.css';
import './CareerBanner.css';

import { subjectsData } from '../data/subjectsData';
// import { careerArticles } from '../data/careerData'; // Lazy loaded now
import SupportModal from './SupportModal';
import MostRepeatedQuestions from './MostRepeatedQuestions';
import HackathonFinder from './HackathonFinder';

const Home = () => {
  const [searchTerm, setSearchTerm] = React.useState('');
  const [currentPage, setCurrentPage] = React.useState(1);
  const [selectedCategory, setSelectedCategory] = React.useState('All');
  const [isPopupOpen, setIsPopupOpen] = React.useState(false);
  const [careerArticles, setCareerArticles] = React.useState([]); // Lazy load state
  const itemsPerPage = 9;

  // Lazy Load Career Data
  React.useEffect(() => {
    import('../data/careerData').then(module => {
      setCareerArticles(module.careerArticles);
    });
  }, []);

  // Helper to generate gradients based on id
  const getGradient = (id) => {
    const gradients = [
      "linear-gradient(135deg, #6366F1 0%, #A855F7 100%)",
      "linear-gradient(135deg, #EC4899 0%, #F43F5E 100%)",
      "linear-gradient(135deg, #0EA5E9 0%, #2DD4BF 100%)",
      "linear-gradient(135deg, #F59E0B 0%, #EF4444 100%)",
      "linear-gradient(135deg, #10B981 0%, #059669 100%)",
      "linear-gradient(135deg, #8B5CF6 0%, #D946EF 100%)"
    ];
    return gradients[id % gradients.length];
  };

  // Flatten and normalize data with memoization and deterministic metrics
  const featuredSubjects = React.useMemo(() => {
    let allSubjects = [];
    let idCounter = 1;

    const getViews = (id) => `${((id * 3.7) % 15 + 5.2).toFixed(1)}K`;
    const getLikes = (id) => Math.floor((id * 43) % 180) + 55;

    Object.keys(subjectsData).forEach(branch => {
      Object.keys(subjectsData[branch]).forEach(semester => {
        subjectsData[branch][semester].forEach(subject => {

          // Determine Category
          let category = 'General';
          if (branch === 'first-year') category = 'First Year';
          else if (branch === 'cse') category = 'CSE Core';
          else if (branch === 'ece') category = 'ECE Core';

          // Determine Semester String
          const semSuffix = (sem) => {
            if (sem == 1) return 'st';
            if (sem == 2) return 'nd';
            if (sem == 3) return 'rd';
            return 'th';
          };

          allSubjects.push({
            id: idCounter,
            title: subject.name,
            code: subject.code,
            description: subject.info || `${branch === 'first-year' ? 'First Year' : branch.toUpperCase()} ${semester} Semester Notes`,
            category: category,
            semester: `${semester}${semSuffix(semester)} Semester`,
            readTime: `${(subject.credits || 2) + 1} min read`,
            views: getViews(idCounter),
            likes: getLikes(idCounter),
            date: "Updated Recently",
            gradient: getGradient(idCounter),
            link: `/branch/${branch}/${semester}/modules/${subject.name}`
          });
          idCounter++;
        });
      });
    });
    return allSubjects;
  }, []);

  const closePopup = () => {
    setIsPopupOpen(false);
  };

  const categories = ['All', 'First Year', 'CSE Core', 'CSE Lab', 'CSE Elective', 'AI/ML', 'AIML-DS', 'ECE Core'];

  // Mix Logic: Insert 1 article after every 4 subjects
  const mixedContent = React.useMemo(() => {
    let mixed = [];
    
    // PRIORITY 1: "AI in Engineering" Article (Index 0) - Always First
    if (searchTerm === '' && selectedCategory === 'All' && careerArticles.length > 0) {
       mixed.push({ type: 'article', data: careerArticles[0] });
    }

    // Start mixing other articles from index 2 (skipping index 1 initially)
    let articleIdx = 2; 

    // We need to keep track of how many subjects we've added to insert articles correctly
    let subjectCount = 0;

    const filtered = featuredSubjects.filter(subject => {
      const matchesSearch = subject.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          subject.code.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = selectedCategory === 'All' || subject.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });

    filtered.forEach((subject, i) => {
      mixed.push({ type: 'subject', data: subject });
      subjectCount++;

      // PRIORITY 2: "Free AI Tools" Article (Index 1) - Insert after EXACTLY 4 subjects
      if (searchTerm === '' && selectedCategory === 'All' && subjectCount === 4 && careerArticles.length > 1) {
          mixed.push({ type: 'article', data: careerArticles[1] });
      }
      
      // REGULAR INTERVAL: Insert other articles every 4th subject (after the first set)
      else if (subjectCount > 4 && subjectCount % 4 === 0 && careerArticles.length > 0) {
         // Cycle through remaining articles starting from index 2
         const article = careerArticles[articleIdx % careerArticles.length];
         if (article) {
             mixed.push({ type: 'article', data: article });
             articleIdx++;
             
             // If we loop back to 0 or 1 (the special articles), skip them to avoid repetition
             if (articleIdx % careerArticles.length === 0 || articleIdx % careerArticles.length === 1) {
                 articleIdx = 2; 
             }
         }
      }
    });
    
    return mixed;
  }, [searchTerm, selectedCategory, featuredSubjects, careerArticles]);

  const totalPages = Math.ceil(mixedContent.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentItems = mixedContent.slice(startIndex, startIndex + itemsPerPage);

  // --- ANIMATION VARIANTS (Elastic & Smooth) ---
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.08,
        delayChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { y: 30, opacity: 0, scale: 0.95 },
    visible: {
      y: 0,
      opacity: 1,
      scale: 1,
      transition: {
        type: "spring",
        stiffness: 70,
        damping: 12,
        mass: 0.6
      }
    },
    exit: { 
      opacity: 0, 
      scale: 0.9, 
      transition: { duration: 0.2 } 
    }
  };

  return (
    <div className="home-extreme-root">
      {/* --- Background Engine --- */}
      <div className="home-background-shapes">
        <div className="shape s1"></div>
        <div className="shape s2"></div>
        <div className="geo-shape hexagon geo-1"></div>
        <div className="geo-shape triangle geo-2"></div>
        <div className="geo-shape hexagon geo-3"></div>
        <div className="geo-shape triangle geo-4"></div>
      </div>

      <div className="home-container">
        {/* --- 2026 Bento Grid Hero Section --- */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="bento-hero-section"
        >
          {/* Main Hero Header */}
          <div className="bento-hero-header">
            <div className="hero-badge-capsule">
              <span className="pulse-dot"></span>
              <span>2026 ACADEMIC YEAR READY</span>
            </div>
            <h1 className="bento-hero-title">
              Your Ultimate <span className="text-gradient-blue">VTU Engineering</span> Portal
            </h1>
            <p className="bento-hero-subtitle">
              Semester syllabus notes, model question papers, SGPA calculators, placement roadmaps, and career tools for all VTU schemes.
            </p>

            {/* Quick Impact Stats */}
            <div className="hero-stats-bar">
              <div className="stat-pill">
                <FaEye className="stat-ico stat-ico-blue" />
                <span><strong>Notes</strong> Study resources</span>
              </div>
              <div className="stat-pill">
                <FaUserAstronaut className="stat-ico stat-ico-purple" />
                <span><strong>Tools</strong> Student utilities</span>
              </div>
              <div className="stat-pill">
                <FaGraduationCap className="stat-ico stat-ico-green" />
                <span><strong>100+</strong> Subjects</span>
              </div>
              <div className="stat-pill">
                <FaCrown className="stat-ico stat-ico-gold" />
                <span><strong>Rank #3</strong> on Google</span>
              </div>
            </div>
          </div>

          {/* Bento Grid */}
          <div className="bento-grid-container">
            {/* Card 1: Schemes Selection (Featured) */}
            <div className="bento-card bento-card-featured bento-card-schemes">
              <div className="bento-card-glow"></div>
              <div className="bento-card-header">
                <div className="bento-icon-badge scheme-badge">
                  <FaLayerGroup />
                </div>
                <span className="bento-tag">VTU SCHEMES</span>
              </div>
              <div className="bento-card-body">
                <h3>VTU Schemes & Notes</h3>
                <p>Select your scheme to access semester-wise subject modules, notes, and study resources.</p>
                <div className="bento-scheme-buttons">
                  <Link to="/branch-selection/2022" className="bento-scheme-btn active">2022 Scheme</Link>
                  <Link to="/branch-selection/2021" className="bento-scheme-btn">2021 Scheme</Link>
                  <Link to="/branch-selection/2018" className="bento-scheme-btn">2018 Scheme</Link>
                </div>
              </div>
            </div>

            {/* Card 3: Model Question Papers */}
            <div className="bento-card bento-card-pyq">
              <div className="bento-card-header">
                <div className="bento-icon-badge pyq-badge">
                  <FaGraduationCap />
                </div>
                <span className="bento-tag">PYQ & MODEL PAPERS</span>
              </div>
              <div className="bento-card-body">
                <h3>Model Question Papers</h3>
                <p>Updated question paper solutions & previous year question papers for 1st-8th semesters.</p>
                <Link to="/model-papers" className="bento-arrow-link">
                  <span>Explore Papers</span>
                  <HiOutlineChevronRight />
                </Link>
              </div>
            </div>

            {/* Card 4: SGPA Calculator */}
            <div className="bento-card bento-card-sgpa">
              <div className="bento-card-header">
                <div className="bento-icon-badge sgpa-badge">
                  <FaCalculator />
                </div>
                <span className="bento-tag">CALCULATOR</span>
              </div>
              <div className="bento-card-body">
                <h3>SGPA & CGPA Calculator</h3>
                <p>Calculate your grade point average instantly according to current VTU credit rules.</p>
                <Link to="/sgpa-calculator" className="bento-arrow-link">
                  <span>Calculate SGPA</span>
                  <HiOutlineChevronRight />
                </Link>
              </div>
            </div>

            {/* Card 5: Placement & Projects */}
            <div className="bento-card bento-card-career">
              <div className="bento-card-header">
                <div className="bento-icon-badge career-badge">
                  <FaRocket />
                </div>
                <span className="bento-tag">CAREER & PLACEMENTS</span>
              </div>
              <div className="bento-card-body">
                <h3>Placement Guide & Projects</h3>
                <p>Interview roadmaps, company experiences, final year project enquiries, and tech tools.</p>
                <div className="bento-link-group">
                  <Link to="/placement-guide" className="bento-pill-link">Placement Guide</Link>
                  <Link to="/project-enquiry" className="bento-pill-link">Projects</Link>
                  <Link to="/career-tools" className="bento-pill-link">Career Tools</Link>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* --- Category Glass Navigation --- */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="category-nav-island"
        >
          <div className="nav-scroll-wrapper">
            {categories.map((cat, idx) => (
              <motion.button
                key={cat}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 + (idx * 0.05) }}
                className={`category-pill ${selectedCategory === cat ? 'active' : ''}`}
                onClick={() => { setSelectedCategory(cat); setCurrentPage(1); }}
              >
                {cat}
              </motion.button>
            ))}
          </div>
        </motion.div>

        {/* --- Section Header --- */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2, duration: 0.5 }}
            className="section-header-3d"
          >
            <div className="sh-left">
              <HiOutlineFire className="fire-icon" />
              <h2>Trending <span className="sh-alt">Assets</span></h2>
            </div>

            {/* Relocated Search Bar */}
            <div className="trending-search-bar">
                <div className="search-input-wrapper">
                    <HiOutlineMagnifyingGlass className="search-icon-large" />
                    <input 
                      type="text" 
                      placeholder="Search subject or code (e.g., DBMS, 21CS32)..." 
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      autoComplete="off"
                      spellCheck="false"
                    />
                    {searchTerm && (
                      <button 
                        className="search-clear-btn" 
                        onClick={() => setSearchTerm('')}
                        title="Clear search"
                      >
                        <FaTimes />
                      </button>
                    )}
                </div>
                <button className="search-btn-large" onClick={() => setCurrentPage(1)}>
                  <FaRocket />
                </button>
            </div>

            <Link to="/notes" className="explore-link">
              <span>View All</span>
              <HiOutlineChevronRight />
            </Link>
          </motion.div>

        {/* --- 3D Subject Grid (Mixed with Articles) --- */}
        <motion.div 
          className="subjects-grid-3d"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          key={currentPage} // Trigger stagger on page change
        >
          <AnimatePresence mode='popLayout'>
            {currentItems.length === 0 ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="empty-search-card"
              >
                <div className="empty-icon-wrap">
                  <HiOutlineMagnifyingGlass />
                </div>
                <h3>No subjects found matching "{searchTerm}"</h3>
                <p>Try checking for typos, or try one of these quick search suggestions:</p>
                <div className="empty-suggestions">
                  {['DBMS', 'Data Structures', 'Python', 'Mathematics', '2022 Scheme', 'First Year'].map(term => (
                    <button key={term} className="suggestion-chip" onClick={() => { setSearchTerm(term); setCurrentPage(1); }}>
                      {term}
                    </button>
                  ))}
                </div>
                <button className="reset-search-btn" onClick={() => { setSearchTerm(''); setSelectedCategory('All'); setCurrentPage(1); }}>
                  Reset Filters
                </button>
              </motion.div>
            ) : (
              currentItems.map((item, idx) => (
                <React.Fragment key={`${item.type}-${item.data.id}-${idx}`}>
              
                {item.type === 'subject' ? (
                  /* --- SUBJECT CARD --- */
                  <motion.div
                    layout
                    variants={itemVariants}
                    className="card-perspective-wrapper"
                  >
                    <Link to={item.data.link} className="subject-card-magazine">
                      <div className="card-header-magazine" style={{ background: item.data.gradient }}>
                        <div className="card-overlay"></div>
                        <div className="read-time-badge">
                          <HiOutlineClock />
                          <span>{item.data.readTime}</span>
                        </div>
                        <h3 className="card-title-magazine">{item.data.title}</h3>
                        <div className="card-watermark">ExamMeta</div>
                      </div>

                      <div className="card-content-magazine">
                        <div className="card-tags">
                          <span className="tag-category">{item.data.category}</span>
                          <span className="tag-semester">{item.data.semester}</span>
                        </div>
                        <h4 className="card-code">{item.data.code}</h4>
                        <p className="card-description">{item.data.description}</p>
                        <div className="card-metrics">
                          <div className="metric-item">
                            <HiOutlineClock />
                            <span>{item.data.date}</span>
                          </div>
                          <div className="metric-item">
                            <FaEye />
                            <span>{item.data.views}</span>
                          </div>
                          <div className="metric-item metric-likes">
                            <FaHeart />
                            <span>{item.data.likes}</span>
                          </div>
                        </div>
                      </div>
                    </Link>
                  </motion.div>
                ) : (
                  /* --- FEATURED ARTICLE CARD --- */
                  <motion.div
                    layout
                    variants={itemVariants}
                    className="card-perspective-wrapper"
                  >
                    <Link to={`/career-tools/${item.data.id}`} className="article-card-mixed">
                        <div className="ac-image-container">
                          {item.data.imageUrl ? (
                             <img src={item.data.imageUrl} alt={item.data.title} className="ac-bg-image" />
                          ) : (
                             <div className="ac-placeholder-gradient"></div>
                          )}
                          <div className="ac-overlay"></div>
                          <div className="ac-badge">Using AI & Tech</div>
                        </div>
                        
                        <div className="ac-content">
                            <h3>{item.data.title}</h3>
                            <div className="ac-meta">
                              <span>Career Insight</span>
                              <span className="dot">•</span>
                              <span>{item.data.readingTime}</span>
                            </div>
                            <div className="ac-cta">
                               Read Now <HiOutlineChevronRight />
                            </div>
                        </div>
                        <div className="ac-glow-effect"></div>
                     </Link>
                  </motion.div>
                )}

                </React.Fragment>
              ))
            )}
          </AnimatePresence>
        </motion.div>

        {/* --- Premium Pagination --- */}
        {totalPages > 1 && (
          <div className="extreme-pagination">
            <button
              className="p-btn"
              disabled={currentPage === 1}
              onClick={() => setCurrentPage(prev => prev - 1)}
            >
              <FaChevronLeft />
            </button>

            <div className="p-numbers">
              {[...Array(totalPages)].map((_, i) => (
                <button
                  key={i}
                  className={`p-num ${currentPage === i + 1 ? 'active' : ''}`}
                  onClick={() => setCurrentPage(i + 1)}
                >
                  {i + 1}
                </button>
              ))}
            </div>

            <button
              className="p-btn"
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage(prev => prev + 1)}
            >
              <FaChevronRight />
            </button>
          </div>
        )}

        {/* --- Expert Career Guides Banner (Premium 3D Glass) --- */}
        <div className="career-banner-container" style={{ marginTop: '5rem', marginBottom: '3rem' }}>
            <div className="career-banner-link">
              <motion.div
                whileHover={{ scale: 1.02, translateY: -5 }}
                whileTap={{ scale: 0.98 }}
                className="career-banner-modern"
              >
                {/* Background Glow Effects */}
                <div className="career-banner-glow career-banner-glow-top"></div>
                <div className="career-banner-glow career-banner-glow-bottom"></div>

                <div className="cb-content">
                   <div className="cb-badge">
                       <FaCrown className="cb-crown-icon" /> Premium Career Access
                   </div>

                   <h2 className="cb-heading">
                       Master the Future of <br/>
                       <span className="cb-heading-gradient">Engineering Tech.</span>
                   </h2>

                   <p className="cb-description">
                       Get high-fidelity roadmaps, salary insights, and step-by-step guides for the most high-paying domains in 2026.
                   </p>

                   {/* Tech Stack Pills */}
                   <div className="cb-tech-stack">
                       {[
                           { name: 'Artificial Intelligence', color: '#A855F7' },
                           { name: 'Cyber Security', color: '#10B981' },
                           { name: 'DevOps & Cloud', color: '#F59E0B' },
                           { name: 'Full Stack', color: '#38BDF8' }
                       ].map((tech, i) => (
                           <div key={i} className="cb-tech-pill">
                               <span className="cb-tech-dot" style={{ background: tech.color, boxShadow: `0 0 10px ${tech.color}` }}></span>
                               <span className="cb-tech-name">{tech.name}</span>
                           </div>
                       ))}
                   </div>

                   {/* Placement Tools (Quick Access) */}
                   <div className="cb-placement-tools">
                       <div className="cb-placement-label">
                           Placement Resources
                       </div>
                       <div className="cb-placement-grid">
                           {[
                               { name: 'Roadmap', link: '/placement-guide', icon: <FaGraduationCap /> },
                               { name: 'Mock Tests', link: '/test', icon: <FaUserAstronaut /> }
                           ].map((tool, i) => (
                               <Link 
                                 to={tool.link} 
                                 key={i} 
                                 className="cb-tool-link"
                                 onClick={(e) => e.stopPropagation()}
                               >
                                   <span className="cb-tool-icon">{tool.icon}</span>
                                   <span className="cb-tool-name">{tool.name}</span>
                               </Link>
                           ))}
                       </div>
                   </div>

                   <Link 
                     to="/career-tools"
                     className="cb-cta"
                   >
                       <span>START LEARNING</span>
                       <HiOutlineChevronRight />
                   </Link>
                </div>

                {/* 3D Visual Element (Right Side) */}
                <div className="cb-visual">
                    {/* Floating Icons */}
                    <motion.div 
                      animate={{ y: [0, -20, 0], rotate: [0, 5, 0] }} 
                      transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
                      className="cb-floating-card cb-floating-card-top"
                    >
                        <div className="cb-floating-icon cb-floating-icon-ai">
                          <FaRobot />
                        </div>
                        <div className="cb-floating-text">
                            <div className="cb-floating-label">Trending</div>
                            <div className="cb-floating-title">AI & ML Guide</div>
                        </div>
                    </motion.div>

                    <motion.div 
                      animate={{ y: [0, 15, 0], rotate: [0, -3, 0] }} 
                      transition={{ duration: 7, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
                      className="cb-floating-card cb-floating-card-bottom"
                    >
                        <div className="cb-floating-icon cb-floating-icon-security">
                          <FaShieldAlt />
                        </div>
                        <div className="cb-floating-text">
                            <div className="cb-floating-label">High Pay</div>
                            <div className="cb-floating-title">Cyber Security</div>
                        </div>
                    </motion.div>

                    {/* Center Glow */}
                    <div className="cb-center-glow"></div>
                </div>

              </motion.div>
            </div>
        </div>

        {/* --- Latest Insights Section --- */}
        <div className="section-header-3d" style={{ marginTop: '5rem' }}>
          <div className="sh-left">
            <HiOutlineSparkles className="fire-icon" style={{ color: '#F472B6' }} />
            <h2>Latest <span className="sh-alt" style={{ background: 'linear-gradient(135deg, #F472B6, #A78BFA)', backgroundClip: 'text', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Insights</span></h2>
          </div>
          <Link to="/career-tools" className="explore-link">
            <span>Read All</span>
            <HiOutlineChevronRight />
          </Link>
        </div>

        <div className="insights-grid">
          {(careerArticles || []).slice(0, 3).map((article, idx) => (
            <motion.div
              key={article.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: idx * 0.1 }}
              className="insight-card-home"
            >
              <Link to={`/career-tools/${article.id}`} className="insight-link-wrapper">
                <div className="insight-image-container">
                  {article.imageUrl ? (
                    <img src={article.imageUrl} alt={article.title} className="insight-image" />
                  ) : (
                    <div className="insight-placeholder-image"></div>
                  )}
                  <div className="insight-overlay"></div>
                  <span className="insight-category-badge">{article.category}</span>
                </div>
                <div className="insight-content">
                   <div className="insight-meta">
                     <span>{article.readingTime}</span>
                     <span>•</span>
                     <span>{article.date}</span>
                   </div>
                   <h3 className="insight-title">{article.title}</h3>
                   <div className="insight-arrow">
                     Read Article <HiOutlineChevronRight />
                   </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>

      </div>

      {/* --- Most Repeated Questions Section --- */}
      <div className="home-mrq-wrapper">
        <MostRepeatedQuestions />
      </div>

      {/* --- Hackathon Finder Section --- */}
      <div className="home-hackathon-wrapper">
        <HackathonFinder />
      </div>

      <section className="study-planner-promo" aria-labelledby="study-planner-title">
        <div>
          <span className="study-feature-eyebrow">PLAN YOUR NEXT STUDY SESSION</span>
          <h2 id="study-planner-title">A study plan that stays on track</h2>
          <p>Tell ExamMeta your subjects and days until the exam to get a personalized, day-by-day AI revision plan.</p>
        </div>
        <Link to="/study-planner" className="study-planner-promo-link">Open Study Planner <HiOutlineChevronRight aria-hidden="true" /></Link>
      </section>



      {/* --- Support Modal --- */}
      <SupportModal isOpen={isPopupOpen} onClose={closePopup} />

    </div>
  );
};

export default Home;
