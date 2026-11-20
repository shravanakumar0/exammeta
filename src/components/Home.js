import React from 'react';
import { Link } from 'react-router-dom';
import {
  HiOutlineMagnifyingGlass, HiOutlineFire,
  HiOutlineClock, HiOutlineChevronRight, HiOutlineSparkles,
  HiOutlineGraduationCap, HiOutlineDocumentText, HiOutlineCheckCircle,
  HiOutlinePlay, HiOutlineUsers, HiOutlineShieldCheck
} from 'react-icons/hi2';
import {
  FaGraduationCap, FaBook, FaRocket, FaCalculator, FaChartLine,
  FaUsers, FaShieldAlt, FaClock, FaEye, FaDatabase, FaCode,
  FaLaptopCode, FaNetworkWired, FaClipboardList, FaGlobe, FaRobot,
  FaLayerGroup
} from 'react-icons/fa';
import './Home.css';
import MostRepeatedQuestions from './MostRepeatedQuestions';
import HackathonFinder from './HackathonFinder';

const Home = () => {
  const [searchTerm, setSearchTerm] = React.useState('');
  const [selectedCategory, setSelectedCategory] = React.useState('All');

  const categories = [
    'All', 'First Year', 'CSE Core', 'CSE Lab', 'CSE Elective',
    'AI/ML', 'AIML-DS', 'ECE Core', 'Mechanical', 'Civil'
  ];

  const subjectsData = [
    {
      id: 1,
      title: 'Database Management Systems',
      code: '21CS42',
      category: 'CSE Core',
      semester: '4th Semester',
      readTime: '12 min read',
      views: '12.5K',
      likes: '840',
      date: 'Updated 2 days ago',
      variant: 'violet',
      icon: <FaDatabase size={26} />,
      link: '/branch/cse/4/modules/dbms',
      description: 'Comprehensive notes on relational databases, SQL, normalization, and ER modeling.'
    },
    {
      id: 2,
      title: 'Data Structures & Algorithms',
      code: '21CS33',
      category: 'CSE Core',
      semester: '3rd Semester',
      readTime: '15 min read',
      views: '18.2K',
      likes: '1,120',
      date: 'Updated 1 week ago',
      variant: 'orange',
      icon: <FaCode size={26} />,
      link: '/branch/cse/3/modules/dsa',
      description: 'Arrays, linked lists, trees, graphs, sorting and searching algorithms.'
    },
    {
      id: 3,
      title: 'Operating Systems',
      code: '21CS46',
      category: 'CSE Core',
      semester: '4th Semester',
      readTime: '14 min read',
      views: '14.7K',
      likes: '910',
      date: 'Updated 3 days ago',
      variant: 'teal',
      icon: <FaLaptopCode size={26} />,
      link: '/branch/cse/4/modules/os',
      description: 'Process management, memory management, file systems, and concurrency.'
    },
    {
      id: 4,
      title: 'Computer Networks',
      code: '21CS54',
      category: 'CSE Core',
      semester: '5th Semester',
      readTime: '16 min read',
      views: '16.3K',
      likes: '1,050',
      date: 'Updated 5 days ago',
      variant: 'violet',
      icon: <FaNetworkWired size={26} />,
      link: '/branch/cse/5/modules/cn',
      description: 'OSI model, TCP/IP, routing, switching, and network security.'
    },
    {
      id: 5,
      title: 'Software Engineering',
      code: '21CS52',
      category: 'CSE Core',
      semester: '5th Semester',
      readTime: '11 min read',
      views: '11.8K',
      likes: '780',
      date: 'Updated 1 week ago',
      variant: 'orange',
      icon: <FaClipboardList size={26} />,
      link: '/branch/cse/5/modules/se',
      description: 'SDLC, agile methodologies, testing, and project management.'
    },
    {
      id: 6,
      title: 'Discrete Mathematics',
      code: '21CS34',
      category: 'CSE Core',
      semester: '3rd Semester',
      readTime: '13 min read',
      views: '13.1K',
      likes: '890',
      date: 'Updated 4 days ago',
      variant: 'teal',
      icon: <FaCalculator size={26} />,
      link: '/branch/cse/3/modules/dm',
      description: 'Graph theory, combinatorics, logic, and recurrence relations.'
    },
    {
      id: 7,
      title: 'Object Oriented Programming',
      code: '21CS35',
      category: 'CSE Core',
      semester: '3rd Semester',
      readTime: '17 min read',
      views: '19.4K',
      likes: '1,340',
      date: 'Updated 2 days ago',
      variant: 'violet',
      icon: <FaLayerGroup size={26} />,
      link: '/branch/cse/3/modules/oop',
      description: 'Classes, objects, inheritance, polymorphism, and design patterns.'
    },
    {
      id: 8,
      title: 'Web Technologies',
      code: '21CS56',
      category: 'CSE Core',
      semester: '5th Semester',
      readTime: '18 min read',
      views: '21.7K',
      likes: '1,560',
      date: 'Updated 1 day ago',
      variant: 'orange',
      icon: <FaGlobe size={26} />,
      link: '/branch/cse/5/modules/web',
      description: 'HTML, CSS, JavaScript, React, and full-stack development.'
    },
    {
      id: 9,
      title: 'Artificial Intelligence',
      code: '21CS63',
      category: 'AI/ML',
      semester: '6th Semester',
      readTime: '20 min read',
      views: '25.3K',
      likes: '1,890',
      date: 'Updated today',
      variant: 'teal',
      icon: <FaRobot size={26} />,
      link: '/branch/cse/6/modules/ai',
      description: 'Machine learning, neural networks, NLP, and intelligent agents.'
    }
  ];

  const featuredSubjects = React.useMemo(() => {
    return subjectsData.filter(subject => {
      const matchesSearch = subject.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           subject.code.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = selectedCategory === 'All' || subject.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [searchTerm, selectedCategory]);

  const variantIcons = {
    violet: <FaGraduationCap size={26} />,
    orange: <FaRocket size={26} />,
    teal: <FaChartLine size={26} />
  };

  return (
    <div className="home-extreme-root">
      <div className="home-bg-blobs">
        <div className="blob blob-1"></div>
        <div className="blob blob-2"></div>
        <div className="blob blob-3"></div>
      </div>

      <div className="home-container">
        {/* ── Hero Section ── */}
        <section className="hero-section">
          <div className="hero-grid">
            <div className="hero-content">
              <div className="hero-kicker">
                <span className="kicker-dot"></span>
                <span>2026 Academic Year Ready</span>
              </div>
              <h1 className="hero-title">
                Master VTU Exams with <span className="gradient-text">Smart Study Tools</span>
              </h1>
              <p className="hero-subtitle">
                Complete semester notes, previous year question papers, SGPA calculators, placement guides,
                and career resources — everything a VTU engineering student needs in one place.
              </p>
              <div className="hero-actions">
                <Link to="/branch-selection/2022" className="btn btn-primary btn-lg">
                  Browse Subjects <FaGraduationCap size={18} />
                </Link>
                <Link to="/model-papers" className="btn btn-outline btn-lg">
                  View Question Papers
                </Link>
              </div>
            </div>

            <div className="hero-visual">
              <div className="hero-card-float">
                <div className="float-card-icon violet">
                  <FaBook />
                </div>
                <div className="float-card-content">
                  <h4>Semester Notes</h4>
                  <p>Module-wise notes for all branches</p>
                </div>
              </div>
              <div className="hero-card-float">
                <div className="float-card-icon orange">
                  <FaChartLine />
                </div>
                <div className="float-card-content">
                  <h4>SGPA Calculator</h4>
                  <p>Calculate grades instantly</p>
                </div>
              </div>
              <div className="hero-card-float">
                <div className="float-card-icon teal">
                  <FaGraduationCap />
                </div>
                <div className="float-card-content">
                  <h4>Model Papers</h4>
                  <p>PYQs and solved papers</p>
                </div>
              </div>
              <div className="hero-badge-grid">
                <div className="hero-badge-item">
                  <span className="badge-icon violet"><FaEye /></span>
                  <span>50K+ Students</span>
                </div>
                <div className="hero-badge-item">
                  <span className="badge-icon orange"><FaGraduationCap /></span>
                  <span>100+ Subjects</span>
                </div>
                <div className="hero-badge-item">
                  <span className="badge-icon teal"><FaShieldAlt /></span>
                  <span>Verified Notes</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── Category Navigation ── */}
        <section className="category-section">
          <div className="category-nav-card">
            {categories.map((cat) => (
              <button
                key={cat}
                className={`category-chip ${selectedCategory === cat ? 'is-active' : ''}`}
                onClick={() => setSelectedCategory(cat)}
              >
                {cat}
              </button>
            ))}
          </div>
        </section>

        {/* ── Subjects Section ── */}
        <div className="section-header-layout">
          <div className="section-title-row">
            <div className="section-icon violet">
              <FaGraduationCap />
            </div>
            <h2>Trending <span className="accent-text">Subjects</span></h2>
          </div>
          <Link to="/notes" className="view-all-link">
            View All <HiOutlineChevronRight size={18} />
          </Link>
        </div>

        <div className="subjects-grid">
          {featuredSubjects.length === 0 ? (
            <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '4rem 0', color: 'var(--text-muted)' }}>
              <HiOutlineDocumentText size={48} style={{ display: 'block', margin: '0 auto 1rem', opacity: 0.4 }} />
              <h3 style={{ color: 'var(--text-heading)', marginBottom: '0.5rem' }}>No subjects found</h3>
              <p>Try adjusting your search or category filter.</p>
            </div>
          ) : (
            featuredSubjects.map((subject) => {
              return (
                <Link key={subject.id} to={subject.link} className="subject-card">
                  <div className="card-image-area">
                    <div className={`card-image-gradient ${subject.variant}`}>
                      {variantIcons[subject.variant] || <FaGraduationCap size={48} />}
                    </div>
                    <div className="card-badge-tag">{subject.category}</div>
                  </div>
                  <div className="card-content-area">
                    <div className="card-meta">
                      <span>{subject.semester}</span>
                      <span className="meta-dot"></span>
                      <span>{subject.readTime}</span>
                    </div>
                    <h3 className="card-title">{subject.title}</h3>
                    <p className="card-description">{subject.description}</p>
                    <div className="card-footer">
                      <div className="card-stats">
                        <div>
                          <span className="stat-value">{subject.views}</span>
                          <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)' }}>views</span>
                        </div>
                        <div>
                          <span className="stat-value">{subject.likes}</span>
                          <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)' }}>likes</span>
                        </div>
                      </div>
                      <span className="card-arrow">
                        <HiOutlineChevronRight size={16} />
                      </span>
                    </div>
                  </div>
                </Link>
              );
            })
          )}
        </div>

        {/* ── Features ── */}
        <section className="features-section">
          <div className="features-grid">
            <div className="feature-card">
              <div className="feature-icon violet">
                <FaShieldAlt />
              </div>
              <div className="feature-info">
                <h4>Verified Content</h4>
                <p>All notes and papers are verified by academic experts.</p>
              </div>
            </div>
            <div className="feature-card">
              <div className="feature-icon orange">
                <FaClock />
              </div>
              <div className="feature-info">
                <h4>Regular Updates</h4>
                <p>Content updated every week for the latest syllabus.</p>
              </div>
            </div>
            <div className="feature-card">
              <div className="feature-icon teal">
                <FaUsers />
              </div>
              <div className="feature-info">
                <h4>Student Community</h4>
                <p>Join thousands of VTU students learning together.</p>
              </div>
            </div>
          </div>
        </section>

        {/* ── Most Repeated Questions ── */}
        <div className="home-mrq-wrapper" style={{ marginTop: '4rem' }}>
          <MostRepeatedQuestions />
        </div>

        {/* ── Hackathon Finder ── */}
        <div className="home-hackathon-wrapper" style={{ marginTop: '4rem' }}>
          <HackathonFinder />
        </div>
      </div>
    </div>
  );
};

export default Home;
