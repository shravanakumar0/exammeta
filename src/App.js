import React, { useEffect, Suspense, lazy, useState } from 'react';
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  useLocation,
} from 'react-router-dom';
import ScrollToTop from './components/ScrollToTop';

// Firebase database remains in use for existing site features.
import { database } from './firebase';
import { ref, get, update } from 'firebase/database';
import { supabase, getCurrentUser, onAuthStateChange } from './supabaseClient';
import './App.css';

// ========================================
// IMMEDIATE LOAD - Critical Components
// ========================================
import Navbar from './components/Navbar';
import Home from './components/Home';
import BeeScene from './components/BeeScene';
import BranchSelection from './components/BranchSelection';
import Branch from './components/Branch';
import Subjects from './components/Subjects';
import ModuleDetail from './components/ModuleDetail';
import PdfViewer from './components/PdfViewer';
import Footer from './components/Footer';
import LoginPage from './components/LoginPage';
import HackathonRegistration from './components/HackathonRegistration';

// ========================================
// LAZY LOAD - Heavy/Less Critical Components
// ========================================
const Calculator = lazy(() => import('./components/Calculator'));
const PlacementGuide = lazy(() => import('./components/PlacementGuide'));
const ResumeBuilder = lazy(() => import('./components/ResumeBuilder'));
const FAQs = lazy(() => import('./components/FAQs'));
const ChatBot = lazy(() => import('./components/ChatBot'));
const TestPage = lazy(() => import('./components/TestPage'));
const ModelPapers = lazy(() => import('./components/ModelPapers'));
const Notes = lazy(() => import('./components/Notes'));
const HackathonsPage = lazy(() => import('./components/HackathonsPage'));
const InternshipsPage = lazy(() => import('./components/InternshipsPage'));
const About = lazy(() => import('./components/About'));
const Contact = lazy(() => import('./components/Contact'));
const PrivacyPolicy = lazy(() => import('./components/PrivacyPolicy'));
const TermsAndConditions = lazy(() => import('./components/TermsAndConditions'));
const SgpaCalculator = lazy(() => import('./components/SgpaCalculator'));
const ProjectEnquiry = lazy(() => import('./components/ProjectEnquiry'));
const CareerToolsPage = lazy(() => import('./components/CareerToolsPage'));
const CareerArticlePage = lazy(() => import('./components/CareerArticlePage'));


// ---------------------------
// ✅ Loading Component
// ---------------------------
function LoadingScreen() {
  return (
    <div className="app-loading">
      <div className="loading-spinner"></div>
      <div className="loading-text">Loading...</div>
    </div>
  );
}

// ---------------------------
// ✅ Auth Guard - Only for protected features (hackathon registration, profile, etc.)
// ---------------------------
function AuthGuard({ children }) {
  const [isAuthenticated, setIsAuthenticated] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const user = await getCurrentUser();
        setIsAuthenticated(!!user);
      } catch (err) {
        setIsAuthenticated(false);
      } finally {
        setLoading(false);
      }
    };

    checkAuth();

    const { data: { subscription } } = onAuthStateChange((event, session) => {
      setIsAuthenticated(!!session);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  if (loading) {
    return <LoadingScreen />;
  }

  return isAuthenticated ? children : <Navigate to="/login" replace />;
}

// ---------------------------
// ✅ Guest Guard - Login/Signup page only
// ---------------------------
function GuestGuard({ children }) {
  const [isAuthenticated, setIsAuthenticated] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const user = await getCurrentUser();
        setIsAuthenticated(!!user);
      } catch (err) {
        setIsAuthenticated(false);
      } finally {
        setLoading(false);
      }
    };

    checkAuth();

    const { data: { subscription } } = onAuthStateChange((event, session) => {
      setIsAuthenticated(!!session);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  if (loading) {
    return <LoadingScreen />;
  }

  return isAuthenticated ? <Navigate to="/" replace /> : children;
}

// ---------------------------
// ✅ Analytics Tracker
// ---------------------------
function AnalyticsTracker() {
  const location = useLocation();

  useEffect(() => {
    if (process.env.NODE_ENV !== 'production') return;

    const updateAnalytics = async () => {
      try {
        const analyticsRef = ref(database, 'analytics');
        const snapshot = await get(analyticsRef);
        const analyticsData = snapshot.exists() ? snapshot.val() : {};

        const today = new Date().toISOString().split('T')[0];
        const totalPageViews = (analyticsData.totalPageViews || 0) + 1;
        const visits = {
          ...(analyticsData.visits || {}),
          [today]: ((analyticsData.visits && analyticsData.visits[today]) || 0) + 1,
        };
        const topPages = {
          ...(analyticsData.topPages || {}),
          [location.pathname]:
            ((analyticsData.topPages && analyticsData.topPages[location.pathname]) || 0) + 1,
        };

        await update(analyticsRef, { totalPageViews, visits, topPages });
      } catch (error) {
        console.error('Error updating analytics:', error);
      }
    };

    updateAnalytics();
  }, [location.pathname]);

  return null;
}

// ---------------------------
// ✅ Main App Component
// ---------------------------
function AppContent() {
  const location = useLocation();
  const isPdfView = location.pathname.startsWith('/pdf/');
  const isLoginView = location.pathname === '/login';

  return (
    <div className="app-container">
      {!isPdfView && !isLoginView && <Navbar />}

      <Suspense fallback={<LoadingScreen />}>
        <Routes>
          {/* Public Routes - No login required */}
          <Route path="/" element={<Home />} />
          <Route path="/bee-scene" element={<BeeScene />} />
          <Route path="/branch-selection/:scheme" element={<BranchSelection />} />
          <Route path="/branch/:branch" element={<Branch />} />
          <Route path="/branch/:branch/:semester" element={<Subjects />} />
          <Route path="/branch/:branch/:semester/modules/:subjectName" element={<ModuleDetail />} />
          <Route path="/notes" element={<Notes />} />
          <Route path="/faqs" element={<FAQs />} />
          <Route path="/pdf/:pdfUrl" element={<PdfViewer />} />
          <Route path="/model-papers" element={<ModelPapers />} />
          <Route path="/hackathons" element={<HackathonsPage />} />
          <Route path="/internships" element={<InternshipsPage />} />
          <Route path="/about" element={<About />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/privacy-policy" element={<PrivacyPolicy />} />
          <Route path="/terms-and-conditions" element={<TermsAndConditions />} />
          <Route path="/placement-guide" element={<PlacementGuide />} />

          {/* Utility Routes - Public */}
          <Route path="/calculator" element={<Calculator />} />
          <Route path="/sgpa-calculator" element={<SgpaCalculator />} />
          <Route path="/chatbot" element={<ChatBot />} />
          <Route path="/test" element={<TestPage />} />
          <Route path="/career-tools" element={<CareerToolsPage />} />
          <Route path="/career-tools/:id" element={<CareerArticlePage />} />
          <Route path="/project-enquiry" element={<ProjectEnquiry />} />

          {/* Auth Routes - Public */}
          <Route path="/login" element={<GuestGuard><LoginPage></LoginPage></GuestGuard>} />

          {/* Protected Routes - Require Login */}
          <Route element={<AuthGuard />}>
            <Route path="/hackathon-register" element={<HackathonRegistration />} />
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>

      {!isPdfView && !isLoginView && <Footer />}
    </div>
  );
}

function App() {
  return (
    <Router>
      <AnalyticsTracker />
      <ScrollToTop />
      <AppContent />
    </Router>
  );
}

export default App;
