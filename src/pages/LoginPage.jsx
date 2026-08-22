import React, { useState, useEffect } from 'react';
import { apiClient } from '../services/apiClient';
import ForgotPasswordModal from '../components/ForgotPasswordModal';
import SSOAuthModal from '../components/SSOAuthModal';
import { 
  Layers, 
  ShieldCheck, 
  Smartphone, 
  Eye, 
  EyeOff,
  User,
  Phone,
  Calendar,
  Users,
  GraduationCap,
  Building2,
  Sun,
  Moon
} from 'lucide-react';

export default function LoginPage({ setCurrentPage, userProfile, setUserProfile, initialTab = 'login', theme, setTheme }) {
  const [step, setStep] = useState(1); // Step 1: Login/Signup, Step 2: Edit Profile
  const [isSignUp, setIsSignUp] = useState(initialTab === 'signup');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isForgotPasswordOpen, setIsForgotPasswordOpen] = useState(false);

  // Single Sign-On (SSO) Modal State
  const [isSSOModalOpen, setIsSSOModalOpen] = useState(false);
  const [ssoProvider, setSsoProvider] = useState('google');

  useEffect(() => {
    setIsSignUp(initialTab === 'signup');
    setStep(1);
  }, [initialTab]);

  useEffect(() => {
    if (step === 2) {
      setFullName('');
      setUniversity('');
      setAge('');
      setPhone('');
    }
  }, [step]);
  
  // Step 1 Form State
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // Role Selector State: 'STUDENT' or 'MENTOR'
  const [selectedRole, setSelectedRole] = useState('STUDENT');

  // Step 2 Student Profile State
  const [fullName, setFullName] = useState('');
  const [university, setUniversity] = useState('');
  const [degree, setDegree] = useState('B.Tech CSE');
  const [major, setMajor] = useState('Computer Science & Engineering (CSE)');
  const [skillsInput, setSkillsInput] = useState('React, Node.js, Python');
  const [experience, setExperience] = useState('');
  const [projectFocus, setProjectFocus] = useState('Web Dev');
  const [currentProject, setCurrentProject] = useState('');
  const [nextProject, setNextProject] = useState('');

  // Step 2 Mentor Profile State
  const [roleTitle, setRoleTitle] = useState('Industry Professional');
  const [mentorInterestsInput, setMentorInterestsInput] = useState('AI/ML, Web Dev, Cloud Architecture');
  const [linkedIn, setLinkedIn] = useState('');
  const [age, setAge] = useState('');
  const [phone, setPhone] = useState('');
  const [gender, setGender] = useState('Student');

  const handleStep1Submit = async (e) => {
    e.preventDefault();
    if (isSignUp) {
      if (!email.trim() || !password.trim()) {
        alert('Please enter your email and password to create an account.');
        return;
      }
      if (password.length < 6) {
        alert('Password must be at least 6 characters long.');
        return;
      }
      setFullName('');
      setUniversity('');
      setExperience('');
      setCurrentProject('');
      setNextProject('');
      setStep(2);
    } else {
      if (!email.trim() || !password.trim()) {
        alert('Please enter your email address and password.');
        return;
      }

      setLoading(true);
      const res = await apiClient.login(email.trim(), password.trim());
      setLoading(false);
      
      if (res.success && res.user) {
        if (res.token) {
          localStorage.setItem('unicollab_token', res.token);
        }
        localStorage.setItem('unicollab_user', JSON.stringify(res.user));

        if (setUserProfile) {
          setUserProfile(res.user);
        }
        if (res.user.role === 'MENTOR') {
          setCurrentPage('mentor-portal');
        } else {
          setCurrentPage('dashboard');
        }
      } else {
        const errorMsg = res.message || 'Login failed. Please check credentials or Sign Up first.';
        setError(errorMsg);
        if (errorMsg.toLowerCase().includes('account not found') || errorMsg.toLowerCase().includes('sign up first')) {
          setIsSignUp(true);
        }
      }
    }
  };

  const handleStep2Submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    const regEmail = email.trim().toLowerCase();
    const fallbackName = regEmail.split('@')[0].replace(/[\._\d]+/g, ' ').trim().split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ') || 'User';
    const finalName = fullName.trim() || fallbackName;
    const regPassword = password.trim() || 'password123';

    const parsedSkills = skillsInput.split(',').map(s => s.trim()).filter(Boolean);
    const parsedInterests = mentorInterestsInput.split(',').map(s => s.trim()).filter(Boolean);

    const payload = {
      name: finalName,
      email: regEmail,
      password: regPassword,
      role: selectedRole,
      university: university.trim() || (selectedRole === 'MENTOR' ? 'University Faculty / Industry' : 'Stanford University'),
      major,
      degree,
      skills: parsedSkills,
      experience,
      projectFocus,
      currentProject,
      nextProject,
      roleTitle,
      mentorInterests: parsedInterests,
      linkedIn,
      age,
      phone,
      gender
    };

    const res = await apiClient.register(payload);
    setLoading(false);

    if (res.success && res.user) {
      if (res.token) {
        localStorage.setItem('unicollab_token', res.token);
      }
      localStorage.setItem('unicollab_user', JSON.stringify(res.user));

      if (setUserProfile) {
        setUserProfile(res.user);
      }
      if (selectedRole === 'MENTOR') {
        setCurrentPage('mentor-portal');
      } else {
        setCurrentPage('dashboard');
      }
    } else {
      setError(res.message || 'Registration failed. Please check your details.');
      if (res.message && res.message.toLowerCase().includes('already exists')) {
        setIsSignUp(false);
        setStep(1);
      }
    }
  };

  // Trigger SSO Modal for interactive Gmail and Password Authentication
  const handleSSOClick = (provider) => {
    setSsoProvider(provider);
    setIsSSOModalOpen(true);
  };

  const handleSSOSuccess = (ssoUser) => {
    if (setUserProfile) {
      setUserProfile(prev => ({
        ...prev,
        ...ssoUser
      }));
    }
    alert(`🎉 SSO Authenticated Successfully via ${ssoProvider.toUpperCase()}!\nSigned in as ${ssoUser.email}`);
    setCurrentPage('dashboard');
  };

  return (
    <div className={`auth-page-container animate-fade-in ${theme === 'dark' ? 'dark-theme' : ''}`}>
      <div className="auth-split-card">
        {/* Left Hero Banner */}
        <div className="auth-left-banner">
          <div className="auth-banner-logo" onClick={() => setCurrentPage('landing')} style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '12px' }}>
            <img 
              src="/code-morphicx-logo.jpg" 
              alt="Code Morphicx Official Logo" 
              style={{ 
                width: '48px', 
                height: '48px', 
                borderRadius: '14px', 
                objectFit: 'cover', 
                border: '2.5px solid #FFFFFF', 
                boxShadow: '0 0 16px rgba(255, 255, 255, 0.5)',
                flexShrink: 0 
              }} 
            />
            <div className="brand-text-wrapper" style={{ display: 'flex', flexDirection: 'column' }}>
              <span className="brand-main white-main" style={{ color: '#FFFFFF', fontWeight: 800, fontSize: '20px' }}>UniCollab</span>
              <span className="code-morphicx-highlight-badge white-theme" style={{ fontSize: '11px', color: '#E2E8F0', marginTop: '2px' }}>
                ✨ Designed by <strong style={{ color: '#FFFFFF', fontWeight: 800 }}>Code Morphicx</strong>
              </span>
            </div>
          </div>

          <div className="auth-banner-content">
            <h1>Empowering the next generation of academic collaboration.</h1>
            <p>Connect with cross-departmental teammates, access verified mentors, and turn university projects into real-world ventures.</p>
          </div>

          <div className="auth-banner-footer">
            <div className="stat-pill-sm">
              <span className="font-bold text-white">100%</span>
              <span className="text-white-sub">Student Verified</span>
            </div>
            <div className="stat-pill-sm">
              <span className="font-bold text-white">50+</span>
              <span className="text-white-sub">Partner Campuses</span>
            </div>
          </div>
        </div>

        {/* Right Form Container */}
        <div className="auth-right-container" style={{ padding: step === 2 ? '28px 36px 36px' : '36px 44px' }}>
          {step === 1 ? (
            <>
              <div className="auth-header-row flex align-center justify-between">
                <div>
                  <h2 className="auth-title">
                    {!isSignUp 
                      ? (selectedRole === 'MENTOR' ? 'Mentor Workspace Sign In 👨‍🏫' : 'Student Account Sign In 🎓') 
                      : (selectedRole === 'MENTOR' ? 'Create Mentor Account 👨‍🏫' : 'Create Student Account 🎓')
                    }
                  </h2>
                  <p className="auth-subtitle">
                    {!isSignUp 
                      ? (selectedRole === 'MENTOR' ? 'Sign in to access your mentor workspace and student booking requests' : 'Sign in to access your student dashboard, projects, and teammate matches') 
                      : (selectedRole === 'MENTOR' ? 'Set up your mentor account to guide university capstone teams' : 'Set up your student account to collaborate on projects and find teammates')
                    }
                  </p>
                </div>

                {setTheme && (
                  <button 
                    className="icon-btn theme-toggle-btn"
                    onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                    title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
                  >
                    {theme === 'dark' ? <Sun size={18} className="theme-icon sun" /> : <Moon size={18} className="theme-icon moon" />}
                  </button>
                )}
              </div>

              <div className="auth-tabs">
                <button 
                  className={`auth-tab ${!isSignUp ? 'active' : ''}`}
                  onClick={() => setIsSignUp(false)}
                >
                  Log in
                </button>
                <button 
                  className={`auth-tab ${isSignUp ? 'active' : ''}`}
                  onClick={() => setIsSignUp(true)}
                >
                  Sign Up
                </button>
                <button 
                  className="auth-tab admin-tab-btn flex align-center justify-center gap-1"
                  onClick={() => setCurrentPage('admin')}
                  style={{ color: '#7C3AED', fontWeight: '800' }}
                >
                  <ShieldCheck size={14} /> Admin Portal
                </button>
              </div>

              {/* Role Selector Pills: Visible for BOTH Log In & Sign Up */}
              <div className="role-selector-pills flex gap-2 mb-3" style={{ display: 'flex', gap: '8px', marginBottom: '14px', background: theme === 'dark' ? '#1F2937' : '#F1F5F9', padding: '4px', borderRadius: '12px' }}>
                <button
                  type="button"
                  className={`role-pill-btn ${selectedRole === 'STUDENT' ? 'active' : ''}`}
                  onClick={() => setSelectedRole('STUDENT')}
                  style={{
                    flex: 1,
                    padding: '8px 12px',
                    borderRadius: '10px',
                    border: 'none',
                    fontSize: '13px',
                    fontWeight: '800',
                    cursor: 'pointer',
                    background: selectedRole === 'STUDENT' ? '#2563EB' : 'transparent',
                    color: selectedRole === 'STUDENT' ? '#FFFFFF' : (theme === 'dark' ? '#94A3B8' : '#64748B'),
                    transition: 'all 0.2s ease'
                  }}
                >
                  🎓 {!isSignUp ? 'Student Login' : "I'm a Student"}
                </button>
                <button
                  type="button"
                  className={`role-pill-btn ${selectedRole === 'MENTOR' ? 'active' : ''}`}
                  onClick={() => setSelectedRole('MENTOR')}
                  style={{
                    flex: 1,
                    padding: '8px 12px',
                    borderRadius: '10px',
                    border: 'none',
                    fontSize: '13px',
                    fontWeight: '800',
                    cursor: 'pointer',
                    background: selectedRole === 'MENTOR' ? '#7C3AED' : 'transparent',
                    color: selectedRole === 'MENTOR' ? '#FFFFFF' : (theme === 'dark' ? '#94A3B8' : '#64748B'),
                    transition: 'all 0.2s ease'
                  }}
                >
                  👨‍🏫 {!isSignUp ? 'Mentor Login' : "I'm a Mentor"}
                </button>
              </div>

              <form onSubmit={handleStep1Submit} className="auth-form">
                <div className="form-group">
                  <label>{selectedRole === 'MENTOR' ? 'Mentor / Professional Email' : 'Academic Email'}</label>
                  <input 
                    type="email" 
                    required 
                    placeholder={selectedRole === 'MENTOR' ? 'mentor@company.com or faculty@university.edu' : 'name@university.edu'}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <div className="label-with-link">
                    <label>Password</label>
                    {!isSignUp && (
                      <button type="button" className="text-link-sm" onClick={() => setIsForgotPasswordOpen(true)}>
                        Forgot password?
                      </button>
                    )}
                  </div>
                  <div className="input-password-wrapper">
                    <input 
                      type={showPassword ? "text" : "password"} 
                      required 
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                    />
                    <button 
                      type="button" 
                      className="eye-btn"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                <div className="form-checkbox-row">
                  <label className="checkbox-label">
                    <input type="checkbox" defaultChecked />
                    <span>Keep me signed in for 30 days</span>
                  </label>
                </div>

                <button 
                  type="submit" 
                  className="btn-primary full-width mt-4" 
                  disabled={loading}
                  style={{
                    background: selectedRole === 'MENTOR' ? '#7C3AED' : '#2563EB',
                    borderColor: selectedRole === 'MENTOR' ? '#6D28D9' : '#1D4ED8'
                  }}
                >
                  {loading 
                    ? 'Processing...' 
                    : isSignUp 
                      ? `Continue to ${selectedRole === 'MENTOR' ? 'Mentor' : 'Student'} Profile Setup (Step 2/2) →` 
                      : `Sign in as ${selectedRole === 'MENTOR' ? 'Mentor 👨‍🏫' : 'Student 🎓'}`
                  }
                </button>
              </form>

              {/* Single Sign-On (SSO) Options */}
              <div className="sso-divider-wrapper" style={{ display: 'flex', alignItems: 'center', margin: '20px 0', color: theme === 'dark' ? '#9CA3AF' : '#64748B', fontSize: '11px', fontWeight: 700, letterSpacing: '0.5px' }}>
                <div style={{ flex: 1, height: '1px', background: theme === 'dark' ? '#374151' : '#E2E8F0' }} />
                <span style={{ padding: '0 12px' }}>OR CONTINUE WITH SSO</span>
                <div style={{ flex: 1, height: '1px', background: theme === 'dark' ? '#374151' : '#E2E8F0' }} />
              </div>

              <div className="sso-buttons-group" style={{ display: 'flex', gap: '12px' }}>
                <button 
                  type="button" 
                  className="btn-sso google-sso-btn"
                  onClick={() => handleSSOClick('google')}
                  disabled={loading}
                  style={{
                    flex: 1,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    padding: '11px 14px',
                    borderRadius: '10px',
                    border: `1px solid ${theme === 'dark' ? '#374151' : '#CBD5E1'}`,
                    background: theme === 'dark' ? '#1F2937' : '#FFFFFF',
                    color: theme === 'dark' ? '#F9FAFB' : '#0F172A',
                    fontSize: '13px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    transition: 'all 0.2s ease'
                  }}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
                  </svg>
                  Google SSO
                </button>

                <button 
                  type="button" 
                  className="btn-sso github-sso-btn"
                  onClick={() => handleSSOClick('github')}
                  disabled={loading}
                  style={{
                    flex: 1,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    padding: '11px 14px',
                    borderRadius: '10px',
                    border: `1px solid ${theme === 'dark' ? '#374151' : '#CBD5E1'}`,
                    background: theme === 'dark' ? '#111827' : '#0F172A',
                    color: '#FFFFFF',
                    fontSize: '13px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    transition: 'all 0.2s ease'
                  }}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                    <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"/>
                  </svg>
                  GitHub SSO
                </button>
              </div>
            </>
          ) : (
            /* STEP 2: EDIT PROFILE SETUP FORM - DYNAMIC ROLE BASED */
            <>
              <div className="auth-header-row flex align-center justify-between" style={{ marginBottom: '16px' }}>
                <div>
                  <h2 className="auth-title" style={{ fontSize: '22px', fontWeight: 800 }}>
                    {selectedRole === 'MENTOR' ? '👨‍🏫 Complete Mentor Profile' : '🎓 Complete Student Profile'}
                  </h2>
                  <p className="auth-subtitle" style={{ fontSize: '13px', color: '#64748B', margin: '2px 0 0' }}>
                    {selectedRole === 'MENTOR' ? 'Set up your mentorship expertise and background' : 'Help teammates and mentors match with your project goals'}
                  </p>
                </div>
              </div>

              <form onSubmit={handleStep2Submit} className="auth-form" autoComplete="off" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div className="form-row" style={{ display: 'flex', gap: '12px' }}>
                  <div className="form-group col-half" style={{ flex: 1 }}>
                    <label style={{ fontSize: '12px', fontWeight: 700, marginBottom: '4px', display: 'block' }}>Full Name</label>
                    <div className="input-icon-wrapper">
                      <User size={16} className="input-icon" />
                      <input 
                        type="text" 
                        required 
                        placeholder={selectedRole === 'MENTOR' ? 'e.g. Dr. Ananya Sharma' : 'e.g. Alex Rivera'}
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="form-group col-half" style={{ flex: 1 }}>
                    <label style={{ fontSize: '12px', fontWeight: 700, marginBottom: '4px', display: 'block' }}>
                      {selectedRole === 'MENTOR' ? 'Current Role / Title' : 'Degree / Program'}
                    </label>
                    <div className="input-icon-wrapper">
                      <GraduationCap size={16} className="input-icon" />
                      {selectedRole === 'MENTOR' ? (
                        <select value={roleTitle} onChange={(e) => setRoleTitle(e.target.value)}>
                          <option value="Industry Professional">Industry Professional</option>
                          <option value="Faculty / Researcher">Faculty / Researcher</option>
                          <option value="Alumni Mentor">Alumni Mentor</option>
                          <option value="Final Year Student Mentor">Final Year Student Mentor</option>
                        </select>
                      ) : (
                        <input 
                          type="text" 
                          placeholder="e.g. B.Tech ECE, B.Tech CSE"
                          value={degree}
                          onChange={(e) => setDegree(e.target.value)}
                        />
                      )}
                    </div>
                  </div>
                </div>

                <div className="form-row" style={{ display: 'flex', gap: '12px' }}>
                  <div className="form-group col-half" style={{ flex: 1 }}>
                    <label style={{ fontSize: '12px', fontWeight: 700, marginBottom: '4px', display: 'block' }}>University / Campus</label>
                    <div className="input-icon-wrapper">
                      <Building2 size={16} className="input-icon" />
                      <input 
                        type="text" 
                        required 
                        placeholder="e.g. Stanford University"
                        value={university}
                        onChange={(e) => setUniversity(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="form-group col-half" style={{ flex: 1 }}>
                    <label style={{ fontSize: '12px', fontWeight: 700, marginBottom: '4px', display: 'block' }}>
                      {selectedRole === 'MENTOR' ? 'Areas of Expertise' : 'Skills (Comma Separated)'}
                    </label>
                    <div className="input-icon-wrapper">
                      <BookOpen size={16} className="input-icon" />
                      {selectedRole === 'MENTOR' ? (
                        <input 
                          type="text" 
                          placeholder="e.g. AI/ML, Web Dev, IoT, Systems"
                          value={mentorInterestsInput}
                          onChange={(e) => setMentorInterestsInput(e.target.value)}
                        />
                      ) : (
                        <input 
                          type="text" 
                          placeholder="e.g. React, Node.js, Python, Figma"
                          value={skillsInput}
                          onChange={(e) => setSkillsInput(e.target.value)}
                        />
                      )}
                    </div>
                  </div>
                </div>

                {selectedRole === 'STUDENT' ? (
                  <>
                    <div className="form-row" style={{ display: 'flex', gap: '12px' }}>
                      <div className="form-group col-half" style={{ flex: 1 }}>
                        <label style={{ fontSize: '12px', fontWeight: 700, marginBottom: '4px', display: 'block' }}>Area of Project Focus</label>
                        <div className="input-icon-wrapper">
                          <Layers size={16} className="input-icon" />
                          <select value={projectFocus} onChange={(e) => setProjectFocus(e.target.value)}>
                            <option value="Web Dev">Web Development</option>
                            <option value="ML/AI">Artificial Intelligence & ML</option>
                            <option value="IoT">Internet of Things (IoT)</option>
                            <option value="Embedded">Embedded Systems & Hardware</option>
                            <option value="Mobile">Mobile Apps</option>
                            <option value="Design">UI/UX & Product Design</option>
                          </select>
                        </div>
                      </div>

                      <div className="form-group col-half" style={{ flex: 1 }}>
                        <label style={{ fontSize: '12px', fontWeight: 700, marginBottom: '4px', display: 'block' }}>Current Project Doing</label>
                        <input 
                          type="text" 
                          placeholder="e.g. Smart Campus IoT Sensor Node"
                          value={currentProject}
                          onChange={(e) => setCurrentProject(e.target.value)}
                          style={{ padding: '8px 12px', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '13px' }}
                        />
                      </div>
                    </div>

                    <div className="form-group">
                      <label style={{ fontSize: '12px', fontWeight: 700, marginBottom: '4px', display: 'block' }}>
                        🎯 Project You Want to Do Next / Seeking Teammates For
                      </label>
                      <input 
                        type="text" 
                        placeholder="e.g. AI Code Reviewer Agent using Claude API & React"
                        value={nextProject}
                        onChange={(e) => setNextProject(e.target.value)}
                        style={{ padding: '8px 12px', borderRadius: '8px', border: '1px solid #2563EB', fontSize: '13px', width: '100%' }}
                      />
                    </div>
                  </>
                ) : (
                  <>
                    <div className="form-group">
                      <label style={{ fontSize: '12px', fontWeight: 700, marginBottom: '4px', display: 'block' }}>Background & Mentorship Summary</label>
                      <input 
                        type="text" 
                        placeholder="e.g. 8+ years experience guiding capstone AI research and cloud infrastructure"
                        value={experience}
                        onChange={(e) => setExperience(e.target.value)}
                        style={{ padding: '8px 12px', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '13px', width: '100%' }}
                      />
                    </div>

                    <div className="form-group">
                      <label style={{ fontSize: '12px', fontWeight: 700, marginBottom: '4px', display: 'block' }}>LinkedIn / Portfolio Link (Optional)</label>
                      <input 
                        type="url" 
                        placeholder="https://linkedin.com/in/yourprofile"
                        value={linkedIn}
                        onChange={(e) => setLinkedIn(e.target.value)}
                        style={{ padding: '8px 12px', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '13px', width: '100%' }}
                      />
                    </div>
                  </>
                )}

                <div className="flex gap-2 mt-4" style={{ display: 'flex', gap: '12px', marginTop: '12px' }}>
                  <button type="button" className="btn-secondary" onClick={() => setStep(1)} disabled={loading} style={{ padding: '10px 20px', borderRadius: '12px', fontWeight: 700 }}>
                    Back
                  </button>
                  <button type="submit" className="btn-primary flex-1" disabled={loading} style={{ padding: '10px 22px', borderRadius: '12px', flex: 1, fontWeight: 800 }}>
                    {loading ? 'Creating Account...' : `Complete & Launch ${selectedRole === 'MENTOR' ? 'Mentor Portal' : 'Dashboard'} 🚀`}
                  </button>
                </div>
              </form>
            </>
          )}
        </div>
      </div>

      {/* Forgot Password Modal */}
      {isForgotPasswordOpen && (
        <ForgotPasswordModal 
          isOpen={isForgotPasswordOpen}
          onClose={() => setIsForgotPasswordOpen(false)}
          theme={theme}
        />
      )}

      {/* Interactive Single Sign-On (SSO) Modal */}
      {isSSOModalOpen && (
        <SSOAuthModal 
          isOpen={isSSOModalOpen}
          onClose={() => setIsSSOModalOpen(false)}
          provider={ssoProvider}
          onSSOSuccess={handleSSOSuccess}
          theme={theme}
        />
      )}
    </div>
  );
}
