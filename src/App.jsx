import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import DashboardPage from './pages/DashboardPage';
import FindTeammatesPage from './pages/FindTeammatesPage';
import MentorPortalPage from './pages/MentorPortalPage';
import WorkspacePage from './pages/WorkspacePage';
import AiAssistantPage from './pages/AiAssistantPage';
import ResourceLibraryPage from './pages/ResourceLibraryPage';
import HackathonHubPage from './pages/HackathonHubPage';
import MessagesPage from './pages/MessagesPage';
import ProfilePage from './pages/ProfilePage';
import LoginPage from './pages/LoginPage';
import ProjectsPage from './pages/ProjectsPage';
import SettingsPage from './pages/SettingsPage';
import NotificationsPage from './pages/NotificationsPage';
import AdminPage from './pages/AdminPage';
import GlobalAiChatbotWidget from './components/GlobalAiChatbotWidget';
import Toast from './components/Toast';

import { 
  Users, 
  Zap, 
  ShieldCheck, 
  CheckCircle2, 
  BarChart3, 
  GraduationCap, 
  ArrowRight, 
  Layers,
  Sun,
  Moon
} from 'lucide-react';
import './App.css';

export default function App() {
  const [currentPage, setCurrentPageState] = useState(() => {
    if (typeof window !== 'undefined') {
      const hash = window.location.hash.replace('#', '');
      if (hash) return hash;
    }
    return 'landing';
  });
  
  const [authMode, setAuthMode] = useState('login');
  const [theme, setTheme] = useState('light');
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);

  const [userProfile, setUserProfileState] = useState(() => {
    if (typeof window !== 'undefined') {
      const savedUser = localStorage.getItem('unicollab_user');
      if (savedUser) {
        try {
          const parsed = JSON.parse(savedUser);
          if (parsed && parsed.name && parsed.email) {
            return parsed;
          }
        } catch (e) {}
      }
    }
    return null;
  });

  const setUserProfile = (newProfile) => {
    setUserProfileState(prev => {
      const updated = typeof newProfile === 'function' ? newProfile(prev) : { ...prev, ...newProfile };
      if (typeof window !== 'undefined') {
        localStorage.setItem('unicollab_user', JSON.stringify(updated));
      }
      return updated;
    });
  };

  const [activeChatPartner, setActiveChatPartner] = useState(null);
  const [toasts, setToasts] = useState([]);

  const showToast = (message, type = 'info') => {
    const id = Date.now() + Math.random();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      removeToast(id);
    }, 4000);
  };

  const removeToast = (id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  const handleOpenChat = (partner) => {
    if (partner) {
      setActiveChatPartner({
        name: partner.name || 'Student User',
        initials: partner.initials || (partner.name || 'SU').split(' ').map(n => n[0]).join('').slice(0, 2),
        avatarBg: partner.avatarBg || '#EFF6FF',
        avatarColor: partner.avatarColor || '#2563EB',
        role: partner.title || partner.major || 'Collab Partner',
        type: partner.type || 'direct'
      });
    }
    setCurrentPage('messages');
  };

  // Universal Navigation Helper with Browser History Sync
  const setCurrentPage = (pageName) => {
    const validPage = pageName || 'landing';
    setCurrentPageState(validPage);
    try {
      if (typeof window !== 'undefined') {
        window.history.pushState({ page: validPage }, '', `#${validPage}`);
      }
    } catch (e) {
      console.warn('History pushState error', e);
    }
  };

  // Browser Back / Previous Button Sync Listener (Fix for Chrome Vanishing Issue)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const initialHash = window.location.hash.replace('#', '') || currentPage;
      try {
        window.history.replaceState({ page: initialHash }, '', `#${initialHash}`);
      } catch (e) {}
    }

    const handlePopState = (event) => {
      let targetPage = event.state?.page;
      if (!targetPage && typeof window !== 'undefined') {
        targetPage = window.location.hash.replace('#', '');
      }
      if (!targetPage) {
        targetPage = 'landing';
      }
      setCurrentPageState(targetPage);
    };

    window.addEventListener('popstate', handlePopState);
    window.addEventListener('hashchange', handlePopState);
    return () => {
      window.removeEventListener('popstate', handlePopState);
      window.removeEventListener('hashchange', handlePopState);
    };
  }, []);

  useEffect(() => {
    if (theme === 'dark') {
      document.body.classList.add('dark-theme');
    } else {
      document.body.classList.remove('dark-theme');
    }
  }, [theme]);

  // If Auth / Login Page is selected
  if (currentPage === 'login') {
    return (
      <LoginPage 
        setCurrentPage={setCurrentPage} 
        userProfile={userProfile}
        setUserProfile={setUserProfile}
        initialTab={authMode}
        theme={theme}
        setTheme={setTheme}
      />
    );
  }

  // If Standalone Admin Portal page is selected
  if (currentPage === 'admin') {
    return (
      <AdminPage 
        setCurrentPage={setCurrentPage} 
        theme={theme}
        setTheme={setTheme}
      />
    );
  }

  // If Dashboard or Inner SaaS App page is selected
  const isInnerPage = [
    'dashboard', 'find-teammates', 'projects', 'mentor-portal', 
    'workspace', 'ai-assistant', 'resource-library', 'hackathons', 
    'messages', 'profile', 'settings', 'notifications'
  ].includes(currentPage);

  if (isInnerPage) {
    return (
      <div className={`app-shell ${theme === 'dark' ? 'dark-theme' : ''}`}>
        <Sidebar 
          currentPage={currentPage} 
          setCurrentPage={setCurrentPage} 
          isMobileNavOpen={isMobileNavOpen}
          onCloseMobileNav={() => setIsMobileNavOpen(false)}
        />
        <div className="dash-layout-main">
          <Header 
            currentPage={currentPage} 
            setCurrentPage={setCurrentPage}
            userProfile={userProfile}
            theme={theme}
            setTheme={setTheme}
            isMobileNavOpen={isMobileNavOpen}
            onToggleMobileNav={() => setIsMobileNavOpen(!isMobileNavOpen)}
          />
          
          {currentPage === 'dashboard' && (
            <DashboardPage 
              setCurrentPage={setCurrentPage} 
              userProfile={userProfile}
            />
          )}
          {currentPage === 'find-teammates' && (
            <FindTeammatesPage 
              onOpenChat={handleOpenChat} 
              userProfile={userProfile} 
            />
          )}
          {currentPage === 'projects' && <ProjectsPage setCurrentPage={setCurrentPage} userProfile={userProfile} />}
          {currentPage === 'mentor-portal' && <MentorPortalPage setCurrentPage={setCurrentPage} onOpenChat={handleOpenChat} />}
          {currentPage === 'workspace' && <WorkspacePage />}
          {currentPage === 'ai-assistant' && <AiAssistantPage />}
          {currentPage === 'resource-library' && <ResourceLibraryPage />}
          {currentPage === 'hackathons' && (
            <HackathonHubPage 
              setCurrentPage={setCurrentPage} 
              userProfile={userProfile} 
            />
          )}
          {currentPage === 'messages' && (
            <MessagesPage 
              activeChatPartner={activeChatPartner}
              userProfile={userProfile}
            />
          )}
          {currentPage === 'profile' && (
            <ProfilePage 
              userProfile={userProfile}
              setUserProfile={setUserProfile}
            />
          )}
          {currentPage === 'settings' && (
            <SettingsPage 
              userProfile={userProfile}
              setUserProfile={setUserProfile}
              setCurrentPage={setCurrentPage}
              theme={theme}
              setTheme={setTheme}
            />
          )}
          {currentPage === 'notifications' && (
            <NotificationsPage 
              setCurrentPage={setCurrentPage} 
            />
          )}
        </div>

        {/* Global Floating AI Chatbot Widget (Hidden on full AI Assistant page to prevent UI overlap) */}
        {currentPage !== 'ai-assistant' && <GlobalAiChatbotWidget theme={theme} />}
      </div>
    );
  }

  // LANDING PAGE (DEFAULT FALLBACK)
  return (
    <div className={`app-container ${theme === 'dark' ? 'dark-theme' : ''}`}>
      {/* Top Navbar */}
      <div className="container">
        <header className="navbar">
          <a href="#" className="logo" onClick={(e) => { e.preventDefault(); setCurrentPage('landing'); }}>
            <div className="logo-icon">
              <Layers size={20} />
            </div>
            <div className="brand-text-wrapper">
              <span className="brand-main">UniCollab</span>
              <span className="brand-sub font-medium" style={{ color: '#2563EB', fontWeight: 800 }}>Designed by Code Morphicx</span>
            </div>
          </a>

          <div className="nav-actions">
            <button 
              className="icon-btn theme-toggle-btn"
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            >
              {theme === 'dark' ? <Sun size={18} className="theme-icon sun" /> : <Moon size={18} className="theme-icon moon" />}
            </button>
            <button className="btn-login" onClick={() => { setAuthMode('login'); setCurrentPage('login'); }}>
              Log in
            </button>
            <button className="btn-get-started" onClick={() => { setAuthMode('signup'); setCurrentPage('login'); }}>
              Sign Up
            </button>
            <button className="btn-admin-nav flex align-center gap-1" onClick={() => setCurrentPage('admin')}>
              <ShieldCheck size={14} /> Admin Portal
            </button>
          </div>

          {/* Top Right Emblem Badge */}
          <div className="header-badge-wrapper" title="Designed by Code Morphicx">
            <img 
              src="/assets/badge.png" 
              alt="Code Morphicx Logo Badge" 
              className="header-badge-highlighted"
              onError={(e) => { e.target.style.display = 'none'; }}
            />
          </div>
        </header>

        {/* Hero Section */}
        <section className="hero-section">
          <div className="hero-grid">
            <div className="hero-content">
              <h1 className="hero-title">
                Find Your Team.
                <span className="text-blue">Build Your Dream.</span>
              </h1>
              <p className="hero-desc">
                The professional collaboration platform built exclusively for university students. Connect with developers, designers, and mentors to turn your academic ideas into real-world impact.
              </p>
              <div className="hero-cta-group">
                <button className="btn-join" onClick={() => { setAuthMode('signup'); setCurrentPage('login'); }}>
                  Join UniCollab
                  <ArrowRight size={18} />
                </button>
                <button className="btn-browse" onClick={() => { setAuthMode('signup'); setCurrentPage('login'); }}>
                  Find Teammates
                </button>
              </div>
            </div>

            <div className="hero-image-card" onClick={() => { setAuthMode('signup'); setCurrentPage('login'); }} style={{ cursor: 'pointer' }}>
              <img 
                src="/assets/hero-students.png" 
                alt="University students collaborating around modern study tables" 
                loading="lazy"
                decoding="async"
              />
            </div>
          </div>
        </section>

        {/* Section 2: Built for the Modern Scholar */}
        <section className="scholar-section">
          <div className="section-header-center">
            <h2 className="section-title">Built for the Modern Scholar</h2>
            <p className="section-subtitle">
              Everything you need to move from brainstorming to deployment. Tailored specifically for the academic environment.
            </p>
          </div>

          <div className="features-grid">
            <div className="feature-card" onClick={() => setCurrentPage('login')} style={{ cursor: 'pointer' }}>
              <div className="feature-icon-wrapper">
                <Users size={24} />
              </div>
              <h3 className="feature-card-title">AI-Powered Matching</h3>
              <p className="feature-card-desc">
                Our algorithm analyzes your skills, interests, and course schedule to recommend the perfect teammates for your next project.
              </p>
            </div>

            <div className="feature-card" onClick={() => setCurrentPage('workspace')} style={{ cursor: 'pointer' }}>
              <div className="feature-icon-wrapper">
                <Zap size={24} />
              </div>
              <h3 className="feature-card-title">Unified Workspace</h3>
              <p className="feature-card-desc">
                Stop juggling tools. Manage tasks, files, and communications in one professional dashboard integrated with your calendar.
              </p>
            </div>

            <div className="feature-card" onClick={() => setCurrentPage('mentor-portal')} style={{ cursor: 'pointer' }}>
              <div className="feature-icon-wrapper">
                <ShieldCheck size={24} />
              </div>
              <h3 className="feature-card-title">Verified Mentorship</h3>
              <p className="feature-card-desc">
                Connect with vetted upperclassmen and industry professionals who provide guidance and feedback on your team's progress.
              </p>
            </div>
          </div>
        </section>

        {/* Section 3: Connect Across Departments */}
        <section className="departments-section">
          <div className="two-col-grid">
            <div className="dept-content">
              <h2>Connect Across Departments</h2>
              <p>
                UniCollab breaks the silos of departmental boundaries. Find the CS developer for your engineering prototype, or the Marketing student for your business pitch.
              </p>

              <ul className="dept-list">
                <li className="dept-list-item">
                  <div className="check-icon-circle">
                    <CheckCircle2 size={15} />
                  </div>
                  <span>Cross-faculty search filters</span>
                </li>
                <li className="dept-list-item">
                  <div className="check-icon-circle">
                    <CheckCircle2 size={15} />
                  </div>
                  <span>Skill-based recruitment</span>
                </li>
                <li className="dept-list-item">
                  <div className="check-icon-circle">
                    <CheckCircle2 size={15} />
                  </div>
                  <span>Departmental verified badges</span>
                </li>
              </ul>
            </div>

            <div className="dept-image-card" onClick={() => setCurrentPage('login')} style={{ cursor: 'pointer' }}>
              <img 
                src="/assets/dept-collaboration.png" 
                alt="Isometric illustration of students collaborating across departments" 
                loading="lazy"
                decoding="async"
              />
            </div>
          </div>
        </section>

        {/* Section 4: Track Progress with Precision */}
        <section className="track-section">
          <div className="two-col-grid">
            <div className="track-image-card" onClick={() => setCurrentPage('workspace')} style={{ cursor: 'pointer' }}>
              <img 
                src="/assets/track-progress.png" 
                alt="Isometric project tracking software UI" 
                loading="lazy"
                decoding="async"
              />
            </div>

            <div className="track-content">
              <div className="track-icon-wrapper">
                <BarChart3 size={22} />
              </div>
              <h2>Track Progress with Precision</h2>
              <p>
                Keep your capstone or side-project on schedule with integrated milestone tracking, peer feedback loops, and automated progress reports for course submissions.
              </p>

              <div className="stat-pills">
                <div className="stat-pill">
                  <span className="stat-val font-bold text-blue">94%</span>
                  <span className="stat-lbl text-muted">On-time Delivery</span>
                </div>
                <div className="stat-pill">
                  <span className="stat-val font-bold text-blue">4.9/5</span>
                  <span className="stat-lbl text-muted">Team Satisfaction</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="footer hackathon-footer-row flex align-center justify-between">
          <div className="footer-left flex align-center gap-2">
            <GraduationCap size={20} className="text-blue" />
            <span className="font-bold">UniCollab</span>
            <span className="text-muted">© 2026</span>
            <span className="copyright-text">• Designed by Code Morphicx</span>
          </div>

          <div className="footer-right flex align-center gap-2">
            <button className="btn-footer-secondary" onClick={() => setCurrentPage('landing')}>Main Website</button>
            <button className="btn-footer-secondary" onClick={() => setCurrentPage('admin')}>Admin Portal</button>
          </div>
        </footer>
        {/* Toast Notification Container */}
        <Toast toasts={toasts} removeToast={removeToast} />
      </div>
    </div>
  );
}
