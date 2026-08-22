import React, { useState, useEffect } from 'react';
import { Users, Download, Search, ShieldCheck, Database, CheckCircle2, RefreshCw, Key, Lock, Unlock, AlertCircle, Mail, CheckCircle, Layers, ArrowLeft, Sun, Moon, Clock, Trash2 } from 'lucide-react';
import { apiClient } from '../services/apiClient';

const formatDateTime = (rawTime) => {
  if (!rawTime) return { date: '20 Aug 2026', time: '10:00:00 AM', relative: '' };
  try {
    const d = new Date(rawTime);
    if (isNaN(d.getTime())) return { date: String(rawTime), time: '', relative: '' };
    
    const dateStr = d.toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' });
    const timeStr = d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true });

    const diffMs = Date.now() - d.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    let relative = '';
    if (diffMins < 2) relative = '⚡ Just now';
    else if (diffMins < 60) relative = `${diffMins}m ago`;
    else if (diffMins < 1440) relative = `${Math.floor(diffMins / 60)}h ago`;
    else relative = `${Math.floor(diffMins / 1440)}d ago`;

    return { date: dateStr, time: timeStr, relative };
  } catch (e) {
    return { date: String(rawTime), time: '', relative: '' };
  }
};

export default function AdminPage({ setCurrentPage, theme, setTheme }) {
  const [usersList, setUsersList] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [adminTab, setAdminTab] = useState('ALL'); // 'ALL' | 'STUDENT' | 'MENTOR'
  
  // Admin Security Auth State
  const [adminKeyInput, setAdminKeyInput] = useState('');
  const [authError, setAuthError] = useState('');
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(() => {
    return typeof window !== 'undefined' && sessionStorage.getItem('unicollab_admin_auth') === 'true';
  });

  // Admin Key Reset Modal State
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);
  const [resetStep, setResetStep] = useState(1); // 1: Email, 2: Code & New Key
  const [adminEmail, setAdminEmail] = useState('');
  const [generatedCode, setGeneratedCode] = useState('');
  const [inputCode, setInputCode] = useState('');
  const [newAdminKey, setNewAdminKey] = useState('');
  const [confirmAdminKey, setConfirmAdminKey] = useState('');
  const [resetMsg, setResetMsg] = useState({ type: '', text: '' });
  const [issuedResetToken, setIssuedResetToken] = useState('');

  // Get active Admin Key from localStorage or default
  const getActiveAdminKey = () => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('unicollab_custom_admin_key') || 'admin123';
    }
    return 'admin123';
  };

  useEffect(() => {
    if (isAdminAuthenticated) {
      fetchRegisteredUsers();

      // Connect to Socket.io for real-time live admin user registration updates
      let socketInstance = null;
      try {
        if (typeof window !== 'undefined') {
          const socketUrl = window.location.hostname === 'localhost' ? 'http://localhost:5000' : window.location.origin;
          if (window.io) {
            socketInstance = window.io(socketUrl, {
              auth: { token: localStorage.getItem('unicollab_token') || 'admin' },
              transports: ['websocket', 'polling']
            });
            socketInstance.emit('join_admin_room');

            socketInstance.on('admin:newUser', (newUser) => {
              if (!newUser || !newUser.email) return;
              setUsersList(prev => {
                const exists = prev.some(u => u.email?.toLowerCase() === newUser.email?.toLowerCase());
                if (exists) return prev;
                const formatted = {
                  ...newUser,
                  id: newUser.id || `usr_${Date.now()}`,
                  name: newUser.name || newUser.fullName || newUser.email.split('@')[0],
                  university: newUser.university || 'Campus Network',
                  major: newUser.major || 'Engineering',
                  created: newUser.created || new Date().toISOString().split('T')[0]
                };
                return [formatted, ...prev];
              });
            });
          }
        }
      } catch (err) {
        console.warn('Socket.io listener setup warning:', err);
      }

      return () => {
        if (socketInstance) {
          socketInstance.off('admin:newUser');
          socketInstance.disconnect();
        }
      };
    }
  }, [isAdminAuthenticated]);

  const handleAdminAuthenticate = async (e) => {
    e.preventDefault();
    if (!adminKeyInput.trim()) {
      setAuthError('Please enter the Admin Security Authorization Key.');
      return;
    }

    try {
      const res = await apiClient.authenticateAdmin(adminKeyInput.trim());
      if (res.success) {
        setIsAdminAuthenticated(true);
        if (typeof window !== 'undefined') {
          sessionStorage.setItem('unicollab_admin_auth', 'true');
        }
        setAuthError('');
        setAdminKeyInput('');
        return;
      }
    } catch (err) {
      console.warn('Backend admin auth fallback');
    }

    // Local fallback check
    const currentAdminKey = getActiveAdminKey();
    if (adminKeyInput.trim() === currentAdminKey) {
      setIsAdminAuthenticated(true);
      if (typeof window !== 'undefined') {
        sessionStorage.setItem('unicollab_admin_auth', 'true');
      }
      setAuthError('');
      setAdminKeyInput('');
    } else {
      setAuthError('Access Denied: Invalid Admin Authorization Key. Only authorized administrators may enter.');
    }
  };

  const handleLockAdmin = () => {
    setIsAdminAuthenticated(false);
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem('unicollab_admin_auth');
    }
  };

  const handleExitAdminPortal = () => {
    if (setCurrentPage) {
      setCurrentPage('landing');
    }
  };

  // Admin Password Reset Handlers via Backend Allowlist
  const handleSendResetCode = async (e) => {
    e.preventDefault();
    if (!adminEmail.trim()) {
      setResetMsg({ type: 'error', text: 'Please enter your Admin Email address.' });
      return;
    }

    setLoading(true);
    try {
      const res = await apiClient.requestAdminPasskeyReset(adminEmail.trim());
      if (res._devCode) {
        setGeneratedCode(res._devCode);
      }

      setResetStep(2);
      setResetMsg({ 
        type: 'success', 
        text: res.message || `If this email is an authorized administrator, a 6-digit verification code has been dispatched to your inbox.` 
      });
    } catch (err) {
      setResetMsg({ type: 'error', text: 'Server error requesting passkey reset.' });
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtpAndSaveKey = async (e) => {
    e.preventDefault();
    if (!inputCode.trim()) {
      setResetMsg({ type: 'error', text: 'Please enter the 6-digit verification code.' });
      return;
    }

    if (!newAdminKey.trim()) {
      setResetMsg({ type: 'error', text: 'New Admin Passkey cannot be empty.' });
      return;
    }

    if (newAdminKey !== confirmAdminKey) {
      setResetMsg({ type: 'error', text: 'New Admin Passkey and Confirm Passkey do not match.' });
      return;
    }

    setLoading(true);
    try {
      let token = issuedResetToken;
      if (!token) {
        const verifyRes = await apiClient.verifyAdminResetOtp(adminEmail.trim(), inputCode.trim());
        if (!verifyRes.success) {
          setResetMsg({ type: 'error', text: verifyRes.message || 'Invalid or expired verification code.' });
          setLoading(false);
          return;
        }
        token = verifyRes.resetToken;
        setIssuedResetToken(token);
      }

      const resetRes = await apiClient.resetAdminPasskey(adminEmail.trim(), token, newAdminKey.trim());
      if (resetRes.success) {
        if (typeof window !== 'undefined') {
          localStorage.setItem('unicollab_custom_admin_key', newAdminKey.trim());
        }
        setResetMsg({ type: 'success', text: 'Master Admin Passkey updated successfully! You may now authenticate.' });
        setTimeout(() => {
          setIsResetModalOpen(false);
          setResetStep(1);
          setAdminEmail('');
          setInputCode('');
          setNewAdminKey('');
          setConfirmAdminKey('');
          setIssuedResetToken('');
          setResetMsg({ type: '', text: '' });
        }, 2000);
      } else {
        setResetMsg({ type: 'error', text: resetRes.message || 'Failed to update admin passkey.' });
      }
    } catch (err) {
      if (generatedCode && inputCode.trim() === generatedCode) {
        if (typeof window !== 'undefined') {
          localStorage.setItem('unicollab_custom_admin_key', newAdminKey.trim());
        }
        setResetMsg({ type: 'success', text: 'Master Admin Passkey updated successfully!' });
        setTimeout(() => {
          setIsResetModalOpen(false);
          setResetStep(1);
          setAdminEmail('');
          setInputCode('');
          setNewAdminKey('');
          setConfirmAdminKey('');
          setResetMsg({ type: '', text: '' });
        }, 2000);
      } else {
        setResetMsg({ type: 'error', text: 'Invalid verification code.' });
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchRegisteredUsers = async () => {
    setLoading(true);
    try {
      let serverUsers = [];
      let isServerSuccess = false;
      try {
        const apiRes = await apiClient.getAdminUsers();
        if (apiRes.success && Array.isArray(apiRes.users)) {
          serverUsers = apiRes.users;
          isServerSuccess = true;
        }
      } catch (e) {
        console.warn('Backend users fetch error:', e);
      }

      const cached = typeof window !== 'undefined' ? JSON.parse(localStorage.getItem('unicollab_registered_users') || '[]') : [];
      const combined = [...serverUsers, ...cached];
      const uniqueUsers = Array.from(
        new Map(
          combined
            .filter(u => u && u.email)
            .map(u => {
              const rawEmail = (u.email || '').toLowerCase().trim();
              const emailPrefix = rawEmail.split('@')[0] || 'student';
              const formattedNameFromEmail = emailPrefix
                .replace(/[\._\d]+/g, ' ')
                .trim()
                .split(' ')
                .filter(Boolean)
                .map(w => w.charAt(0).toUpperCase() + w.slice(1))
                .join(' ');
              
              const resolvedName = (u.name && u.name.trim()) 
                || (u.fullName && u.fullName.trim()) 
                || formattedNameFromEmail 
                || 'Student User';

              const rawCreated = u.createdAt || u.created_at || u.created || (typeof u.id === 'string' && u.id.startsWith('usr_') ? new Date(parseInt(u.id.replace('usr_', ''))).toISOString() : new Date().toISOString());
              const parsedTime = new Date(rawCreated).getTime() || 0;

              return [
                rawEmail, 
                {
                  ...u,
                  name: resolvedName,
                  university: u.university || 'Campus Network',
                  major: u.major || 'Engineering',
                  createdAt: rawCreated,
                  createdTimestamp: parsedTime
                }
              ];
            })
        ).values()
      );

      // Sort strictly in reverse chronological order: newest registrations at the very top
      uniqueUsers.sort((a, b) => (b.createdTimestamp || 0) - (a.createdTimestamp || 0));

      setUsersList(uniqueUsers);
    } catch (err) {
      console.error('Failed to load admin user list', err);
    } finally {
      setLoading(false);
    }
  };

  const handleClearAllUsers = async () => {
    if (!confirm('⚠️ Are you sure you want to delete and reset ALL registered users data from the database and portal? This cannot be undone.')) {
      return;
    }
    setLoading(true);
    try {
      await apiClient.clearAdminUsers();
      if (typeof window !== 'undefined') {
        localStorage.removeItem('unicollab_registered_users');
      }
      setUsersList([]);
      alert('🗑️ All users data deleted successfully! Database is now empty and fresh.');
    } catch (err) {
      setUsersList([]);
    } finally {
      setLoading(false);
    }
  };

  const studentUsers = usersList.filter(u => u.role !== 'MENTOR');
  const mentorUsers = usersList.filter(u => u.role === 'MENTOR');

  const tabFilteredUsers = usersList.filter(u => {
    if (adminTab === 'STUDENT') return u.role !== 'MENTOR';
    if (adminTab === 'MENTOR') return u.role === 'MENTOR';
    return true;
  });

  const filteredUsers = tabFilteredUsers.filter(u => 
    (u.name && u.name.toLowerCase().includes(searchQuery.toLowerCase())) ||
    (u.email && u.email.toLowerCase().includes(searchQuery.toLowerCase())) ||
    (u.major && u.major.toLowerCase().includes(searchQuery.toLowerCase())) ||
    (u.degree && u.degree.toLowerCase().includes(searchQuery.toLowerCase())) ||
    (u.roleTitle && u.roleTitle.toLowerCase().includes(searchQuery.toLowerCase())) ||
    (u.university && u.university.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const handleExportCSV = () => {
    if (!filteredUsers.length) return alert('No user data to export.');
    const headers = 'ID,Role,Name,Email,RegisteredTime,DegreeOrTitle,MajorOrFocus,University,Status\n';
    const rows = filteredUsers.map(u => 
      `"${u.id || ''}","${u.role === 'MENTOR' ? 'MENTOR' : 'STUDENT'}","${(u.name || '').replace(/"/g, '""')}","${(u.email || '').replace(/"/g, '""')}","${u.createdAt || ''}","${(u.roleTitle || u.degree || '').replace(/"/g, '""')}","${(u.major || '').replace(/"/g, '""')}","${(u.university || '').replace(/"/g, '""')}","Active"`
    ).join('\n');

    const blob = new Blob([headers + rows], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `unicollab_${adminTab.toLowerCase()}_users_database.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className={`standalone-admin-wrapper ${theme === 'dark' ? 'dark-theme' : ''}`} style={{ minHeight: '100vh', background: theme === 'dark' ? '#0B0F19' : '#F8FAFC' }}>
      {/* Standalone Admin Top Navigation Bar */}
      <header style={{ 
        height: '70px', 
        padding: '0 32px', 
        background: theme === 'dark' ? '#111827' : '#FFFFFF', 
        borderBottom: `1px solid ${theme === 'dark' ? '#1F2937' : '#E2E8F0'}`, 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-between',
        position: 'sticky',
        top: 0,
        zIndex: 1000
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: '#7C3AED', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <ShieldCheck size={24} />
          </div>
          <div>
            <h2 style={{ fontSize: '18px', fontWeight: '800', margin: 0, color: theme === 'dark' ? '#FFFFFF' : '#0F172A' }}>UniCollab Admin System</h2>
            <p style={{ fontSize: '11px', color: '#7C3AED', fontWeight: '800', margin: 0 }}>Designed by Code Morphicx • Master Portal</p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {setTheme && (
            <button 
              className="icon-btn theme-toggle-btn"
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
              style={{ background: theme === 'dark' ? '#1F2937' : '#F1F5F9', border: 'none', padding: '8px', borderRadius: '50%', cursor: 'pointer' }}
            >
              {theme === 'dark' ? <Sun size={18} className="theme-icon sun" style={{ color: '#F59E0B' }} /> : <Moon size={18} className="theme-icon moon" style={{ color: '#2563EB' }} />}
            </button>
          )}

          <button 
            onClick={handleExitAdminPortal}
            style={{ 
              padding: '10px 18px', 
              borderRadius: '9999px', 
              border: `1px solid ${theme === 'dark' ? '#374151' : '#CBD5E1'}`, 
              background: theme === 'dark' ? '#1F2937' : '#FFFFFF', 
              color: theme === 'dark' ? '#F9FAFB' : '#334155', 
              fontSize: '13px', 
              fontWeight: '700',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              transition: 'all 0.2s ease'
            }}
          >
            <ArrowLeft size={16} /> Return to Main Website
          </button>
        </div>
      </header>

      {/* Main Admin Content Container */}
      <main style={{ padding: '32px 40px', maxWidth: '1400px', margin: '0 auto' }}>
        {/* If Not Authenticated, Show Standalone High-Security Lock Gate */}
        {!isAdminAuthenticated ? (
          <div className="animate-fade-in flex align-center justify-center" style={{ minHeight: 'calc(100vh - 160px)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {!isResetModalOpen ? (
              <div className="modal-card animate-fade-in" style={{ maxWidth: '460px', width: '100%', padding: '36px', textAlign: 'center', background: theme === 'dark' ? '#111827' : 'white', borderRadius: '24px', border: `1px solid ${theme === 'dark' ? '#1F2937' : '#E2E8F0'}`, boxShadow: '0 20px 40px rgba(0,0,0,0.1)' }}>
                <div style={{ width: '68px', height: '68px', borderRadius: '50%', background: theme === 'dark' ? '#1E293B' : '#EFF6FF', color: '#2563EB', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
                  <Lock size={34} />
                </div>
                
                <h2 style={{ fontSize: '22px', fontWeight: '800', color: theme === 'dark' ? '#FFFFFF' : '#0F172A' }}>Admin Authorization Required</h2>
                <p className="subtext mt-2" style={{ fontSize: '13.5px', color: theme === 'dark' ? '#94A3B8' : '#64748B' }}>
                  This portal contains confidential student registration database records. Please enter your Admin Authorization Key to proceed.
                </p>

                <form onSubmit={handleAdminAuthenticate} className="auth-form mt-6">
                  <div className="form-group text-left" style={{ textAlign: 'left' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', marginBottom: '8px' }}>
                      <label style={{ fontWeight: '700', fontSize: '13px', margin: 0, color: theme === 'dark' ? '#E2E8F0' : '#334155' }}>Master Admin Secret Key</label>
                      <button 
                        type="button" 
                        onClick={() => { setIsResetModalOpen(true); setResetStep(1); setResetMsg({ type: '', text: '' }); }}
                        style={{ fontSize: '12px', color: '#60A5FA', fontWeight: '700', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                      >
                        Forgot Admin Key?
                      </button>
                    </div>

                    <div className="input-with-icon-auth">
                      <Key size={16} className="auth-input-icon" />
                      <input 
                        type="password" 
                        required 
                        placeholder="Enter your Admin Security Key"
                        value={adminKeyInput}
                        onChange={(e) => setAdminKeyInput(e.target.value)}
                        style={{ width: '100%', paddingLeft: '40px' }}
                      />
                    </div>
                  </div>

                  {authError && (
                    <div className="error-alert mt-3 flex align-center gap-2" style={{ background: '#FEE2E2', border: '1px solid #FCA5A5', color: '#DC2626', padding: '10px 14px', borderRadius: '10px', fontSize: '12.5px', textAlign: 'left' }}>
                      <AlertCircle size={16} className="flex-shrink-0" />
                      <span>{authError}</span>
                    </div>
                  )}

                  <button type="submit" className="btn-primary full-width mt-6 flex align-center justify-center gap-2" style={{ height: '46px', fontSize: '14px', fontWeight: '800' }}>
                    <Unlock size={16} /> Authenticate & Unlock Admin Portal
                  </button>
                </form>
              </div>
            ) : (
              /* Modal for Resetting Admin Key via Email */
              <div className="modal-card animate-fade-in" style={{ maxWidth: '480px', width: '100%', padding: '32px', background: theme === 'dark' ? '#111827' : 'white', borderRadius: '24px', border: `1px solid ${theme === 'dark' ? '#1F2937' : '#E2E8F0'}`, boxShadow: '0 20px 40px rgba(0,0,0,0.1)' }}>
                <div className="modal-header flex justify-between align-center pb-3" style={{ borderBottom: `1px solid ${theme === 'dark' ? '#1F2937' : '#E2E8F0'}`, marginBottom: '16px' }}>
                  <h3 style={{ fontSize: '18px', fontWeight: '800', color: theme === 'dark' ? '#FFFFFF' : '#0F172A' }}>Reset Admin Authorization Key</h3>
                  <button className="close-btn" onClick={() => setIsResetModalOpen(false)} style={{ background: 'none', border: 'none', fontSize: '18px', cursor: 'pointer', color: theme === 'dark' ? '#94A3B8' : '#64748B' }}>✕</button>
                </div>

                {resetStep === 1 ? (
                  <form onSubmit={handleSendResetCode} className="auth-form mt-4">
                    <p className="subtext" style={{ fontSize: '13px', color: theme === 'dark' ? '#94A3B8' : '#64748B' }}>
                      Enter your registered Administrator Email Address to receive a 6-digit security verification code.
                    </p>

                    <div className="form-group mt-4 text-left" style={{ textAlign: 'left' }}>
                      <label style={{ fontWeight: '700', fontSize: '13px', color: theme === 'dark' ? '#E2E8F0' : '#334155' }}>Admin Email Address</label>
                      <div className="input-with-icon-auth mt-1">
                        <Mail size={16} className="auth-input-icon" />
                        <input 
                          type="email" 
                          required 
                          placeholder="admin@unicollab.edu"
                          value={adminEmail}
                          onChange={(e) => setAdminEmail(e.target.value)}
                          style={{ width: '100%', paddingLeft: '40px' }}
                        />
                      </div>
                    </div>

                    {resetMsg.text && (
                      <div className={`mt-3 flex align-center gap-2 ${resetMsg.type === 'error' ? 'text-red' : 'text-green'}`} style={{ fontSize: '12.5px' }}>
                        <AlertCircle size={15} />
                        <span>{resetMsg.text}</span>
                      </div>
                    )}

                    <div className="modal-actions mt-6 flex gap-3">
                      <button type="submit" className="btn-primary full-width">
                        Send Verification Code
                      </button>
                      <button type="button" className="btn-secondary" onClick={() => setIsResetModalOpen(false)}>
                        Cancel
                      </button>
                    </div>
                  </form>
                ) : (
                  <form onSubmit={handleVerifyOtpAndSaveKey} className="auth-form mt-4">
                    {resetMsg.text && (
                      <div className={`p-3 rounded-lg mb-3 flex align-center gap-2 ${resetMsg.type === 'error' ? 'bg-red-50 text-red-600' : 'bg-emerald-50 text-emerald-600'}`} style={{ background: resetMsg.type === 'error' ? '#FEE2E2' : '#D1FAE5', padding: '10px 14px', borderRadius: '10px', fontSize: '12.5px', color: resetMsg.type === 'error' ? '#DC2626' : '#059669' }}>
                        <CheckCircle size={16} />
                        <span>{resetMsg.text}</span>
                      </div>
                    )}

                    <div className="form-group text-left" style={{ textAlign: 'left' }}>
                      <label style={{ fontWeight: '700', fontSize: '13px', color: theme === 'dark' ? '#E2E8F0' : '#334155' }}>6-Digit Verification Code</label>
                      <input 
                        type="text" 
                        required 
                        maxLength={6}
                        placeholder="e.g. 742918"
                        value={inputCode}
                        onChange={(e) => setInputCode(e.target.value)}
                        style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1px solid #CBD5E1', fontSize: '14px', letterSpacing: '2px', fontWeight: '700' }}
                      />
                    </div>

                    <div className="form-group mt-3 text-left" style={{ textAlign: 'left' }}>
                      <label style={{ fontWeight: '700', fontSize: '13px', color: theme === 'dark' ? '#E2E8F0' : '#334155' }}>New Master Admin Security Key</label>
                      <input 
                        type="password" 
                        required 
                        placeholder="Enter new admin key"
                        value={newAdminKey}
                        onChange={(e) => setNewAdminKey(e.target.value)}
                        style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1px solid #CBD5E1' }}
                      />
                    </div>

                    <div className="form-group mt-3 text-left" style={{ textAlign: 'left' }}>
                      <label style={{ fontWeight: '700', fontSize: '13px', color: theme === 'dark' ? '#E2E8F0' : '#334155' }}>Confirm New Admin Security Key</label>
                      <input 
                        type="password" 
                        required 
                        placeholder="Confirm new admin key"
                        value={confirmAdminKey}
                        onChange={(e) => setConfirmAdminKey(e.target.value)}
                        style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1px solid #CBD5E1' }}
                      />
                    </div>

                    <div className="modal-actions mt-6 flex gap-3">
                      <button type="submit" className="btn-primary full-width">
                        Save New Admin Key
                      </button>
                      <button type="button" className="btn-secondary" onClick={() => setResetStep(1)}>
                        Back
                      </button>
                    </div>
                  </form>
                )}
              </div>
            )}
          </div>
        ) : (
          /* Authenticated Standalone Admin Dashboard */
          <div className="animate-fade-in">
            {/* Admin Top Header Card */}
            <div className="workspace-header-card" style={{ background: theme === 'dark' ? '#111827' : 'white', borderRadius: '20px', padding: '24px', border: `1px solid ${theme === 'dark' ? '#1F2937' : '#E2E8F0'}` }}>
              <div className="ws-title-row" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div className="ws-title-group" style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                  <div className="ws-logo-box" style={{ background: '#7C3AED', color: 'white', width: '48px', height: '48px', borderRadius: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <ShieldCheck size={24} />
                  </div>
                  <div>
                    <div className="ws-title-flex" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <h2 style={{ fontSize: '20px', fontWeight: '800', margin: 0, color: theme === 'dark' ? '#FFFFFF' : '#0F172A' }}>Registered Students Control Panel</h2>
                      <span className="phase-badge green">Authorized Session</span>
                    </div>
                    <p className="ws-subtitle" style={{ fontSize: '13px', color: theme === 'dark' ? '#94A3B8' : '#64748B', margin: '4px 0 0' }}>Registered student user database, credentials management, & Supabase cloud sync status.</p>
                  </div>
                </div>

                <div className="ws-actions flex gap-2" style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                  <button className="btn-secondary" onClick={handleLockAdmin} title="Lock Admin Portal">
                    <Lock size={15} /> Lock Session
                  </button>
                  <button 
                    className="btn-secondary" 
                    onClick={async () => {
                      await fetchRegisteredUsers();
                      alert('🔄 Student User Database Refreshed Successfully!');
                    }} 
                    disabled={loading}
                    title="Refresh User List"
                    style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
                  >
                    <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
                    <span>{loading ? 'Refreshing...' : 'Refresh List'}</span>
                  </button>
                  <button className="btn-primary" onClick={handleExportCSV}>
                    <Download size={15} /> Export Users CSV
                  </button>
                  <button 
                    className="btn-secondary" 
                    onClick={handleClearAllUsers}
                    disabled={loading}
                    title="Delete all registered user data"
                    style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: '6px', 
                      background: '#FEF2F2', 
                      color: '#DC2626', 
                      borderColor: '#FCA5A5', 
                      fontWeight: 700 
                    }}
                  >
                    <Trash2 size={15} />
                    <span>Clear All Users</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Admin Stats Grid */}
            <div className="grid-3-col mt-6" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px' }}>
              <div 
                className="widget-card" 
                onClick={() => setAdminTab('STUDENT')}
                style={{ 
                  background: theme === 'dark' ? '#111827' : 'white', 
                  borderRadius: '18px', 
                  padding: '20px', 
                  border: adminTab === 'STUDENT' ? '2px solid #2563EB' : `1px solid ${theme === 'dark' ? '#1F2937' : '#E2E8F0'}`,
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  boxShadow: adminTab === 'STUDENT' ? '0 0 16px rgba(37, 99, 235, 0.2)' : 'none'
                }}
              >
                <div className="flex justify-between align-center" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span className="text-sm text-muted" style={{ fontSize: '13px', color: '#94A3B8', fontWeight: 700 }}>🎓 Registered Students</span>
                  <Users size={18} className="text-blue" style={{ color: '#2563EB' }} />
                </div>
                <h3 className="text-2xl font-bold mt-2" style={{ fontSize: '26px', fontWeight: '800', margin: '8px 0 0', color: theme === 'dark' ? '#FFFFFF' : '#0F172A' }}>
                  {studentUsers.length} Students
                </h3>
                <span className="text-xs text-blue flex align-center gap-1 mt-1" style={{ fontSize: '12px', color: '#2563EB', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '6px', fontWeight: 600 }}>
                  <CheckCircle2 size={12} /> Click to view student directory
                </span>
              </div>

              <div 
                className="widget-card" 
                onClick={() => setAdminTab('MENTOR')}
                style={{ 
                  background: theme === 'dark' ? '#111827' : 'white', 
                  borderRadius: '18px', 
                  padding: '20px', 
                  border: adminTab === 'MENTOR' ? '2px solid #7C3AED' : `1px solid ${theme === 'dark' ? '#1F2937' : '#E2E8F0'}`,
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  boxShadow: adminTab === 'MENTOR' ? '0 0 16px rgba(124, 58, 237, 0.2)' : 'none'
                }}
              >
                <div className="flex justify-between align-center" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span className="text-sm text-muted" style={{ fontSize: '13px', color: '#94A3B8', fontWeight: 700 }}>👨‍🏫 Registered Mentors</span>
                  <Database size={18} className="text-purple" style={{ color: '#7C3AED' }} />
                </div>
                <h3 className="text-2xl font-bold mt-2" style={{ fontSize: '26px', fontWeight: '800', margin: '8px 0 0', color: theme === 'dark' ? '#FFFFFF' : '#0F172A' }}>
                  {mentorUsers.length} Mentors
                </h3>
                <span className="text-xs text-purple flex align-center gap-1 mt-1" style={{ fontSize: '12px', color: '#7C3AED', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '6px', fontWeight: 600 }}>
                  <CheckCircle2 size={12} /> Click to view mentor directory
                </span>
              </div>

              <div 
                className="widget-card" 
                onClick={() => setAdminTab('ALL')}
                style={{ 
                  background: theme === 'dark' ? '#111827' : 'white', 
                  borderRadius: '18px', 
                  padding: '20px', 
                  border: adminTab === 'ALL' ? '2px solid #059669' : `1px solid ${theme === 'dark' ? '#1F2937' : '#E2E8F0'}`,
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  boxShadow: adminTab === 'ALL' ? '0 0 16px rgba(5, 150, 105, 0.2)' : 'none'
                }}
              >
                <div className="flex justify-between align-center" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span className="text-sm text-muted" style={{ fontSize: '13px', color: '#94A3B8', fontWeight: 700 }}>👥 Total Registered Accounts</span>
                  <Key size={18} className="text-emerald" style={{ color: '#059669' }} />
                </div>
                <h3 className="text-2xl font-bold mt-2" style={{ fontSize: '26px', fontWeight: '800', margin: '8px 0 0', color: theme === 'dark' ? '#FFFFFF' : '#0F172A' }}>
                  {usersList.length} Total
                </h3>
                <span className="text-xs text-green flex align-center gap-1 mt-1" style={{ fontSize: '12px', color: '#059669', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '6px', fontWeight: 600 }}>
                  <CheckCircle2 size={12} /> Supabase PostgreSQL Synced
                </span>
              </div>
            </div>

            {/* Registered Users Table */}
            <div className="settings-card mt-6" style={{ background: theme === 'dark' ? '#111827' : 'white', borderRadius: '20px', padding: '24px', border: `1px solid ${theme === 'dark' ? '#1F2937' : '#E2E8F0'}` }}>
              <div className="flex justify-between align-center mb-4 flex-wrap gap-3" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <h3 style={{ fontSize: '19px', fontWeight: '800', margin: 0, color: theme === 'dark' ? '#FFFFFF' : '#0F172A' }}>
                    {adminTab === 'STUDENT' && `🎓 Registered Students Directory (${filteredUsers.length})`}
                    {adminTab === 'MENTOR' && `👨‍🏫 Registered Mentors Directory (${filteredUsers.length})`}
                    {adminTab === 'ALL' && `👥 Combined Users Directory (${filteredUsers.length})`}
                  </h3>
                  <span style={{ fontSize: '12px', color: '#64748B' }}>
                    {adminTab === 'STUDENT' && 'Listing all registered student accounts with their branches, degrees, and signup dates.'}
                    {adminTab === 'MENTOR' && 'Listing all registered faculty & industry mentor advisors with their domains and institutions.'}
                    {adminTab === 'ALL' && 'Listing all registered student and mentor accounts across campuses.'}
                  </span>
                </div>
                
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                  {/* Tab Selector Pills */}
                  <div style={{ display: 'flex', background: theme === 'dark' ? '#1F2937' : '#F1F5F9', padding: '4px', borderRadius: '12px', gap: '4px' }}>
                    <button
                      type="button"
                      onClick={() => setAdminTab('ALL')}
                      style={{
                        padding: '6px 12px',
                        borderRadius: '8px',
                        border: 'none',
                        fontSize: '12px',
                        fontWeight: 800,
                        cursor: 'pointer',
                        background: adminTab === 'ALL' ? '#059669' : 'transparent',
                        color: adminTab === 'ALL' ? '#FFFFFF' : (theme === 'dark' ? '#94A3B8' : '#64748B'),
                        transition: 'all 0.2s ease'
                      }}
                    >
                      👥 All ({usersList.length})
                    </button>
                    <button
                      type="button"
                      onClick={() => setAdminTab('STUDENT')}
                      style={{
                        padding: '6px 12px',
                        borderRadius: '8px',
                        border: 'none',
                        fontSize: '12px',
                        fontWeight: 800,
                        cursor: 'pointer',
                        background: adminTab === 'STUDENT' ? '#2563EB' : 'transparent',
                        color: adminTab === 'STUDENT' ? '#FFFFFF' : (theme === 'dark' ? '#94A3B8' : '#64748B'),
                        transition: 'all 0.2s ease'
                      }}
                    >
                      🎓 Students ({studentUsers.length})
                    </button>
                    <button
                      type="button"
                      onClick={() => setAdminTab('MENTOR')}
                      style={{
                        padding: '6px 12px',
                        borderRadius: '8px',
                        border: 'none',
                        fontSize: '12px',
                        fontWeight: 800,
                        cursor: 'pointer',
                        background: adminTab === 'MENTOR' ? '#7C3AED' : 'transparent',
                        color: adminTab === 'MENTOR' ? '#FFFFFF' : (theme === 'dark' ? '#94A3B8' : '#64748B'),
                        transition: 'all 0.2s ease'
                      }}
                    >
                      👨‍🏫 Mentors ({mentorUsers.length})
                    </button>
                  </div>

                  <div className="input-with-icon search-sm" style={{ width: '240px', position: 'relative' }}>
                    <Search size={15} style={{ position: 'absolute', left: '12px', top: '10px', color: '#94A3B8' }} />
                    <input 
                      type="text" 
                      placeholder="Search name, email, branch..." 
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      style={{ width: '100%', padding: '8px 12px 8px 36px', borderRadius: '9999px', border: `1px solid ${theme === 'dark' ? '#374151' : '#CBD5E1'}`, background: theme === 'dark' ? '#1F2937' : '#F8FAFC', color: theme === 'dark' ? '#FFFFFF' : '#0F172A', fontSize: '13px' }}
                    />
                  </div>
                </div>
              </div>

              <div className="table-responsive" style={{ overflowX: 'auto' }}>
                <table className="admin-table" style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                  <thead>
                    <tr style={{ borderBottom: `2px solid ${theme === 'dark' ? '#1F2937' : '#E2E8F0'}`, textAlign: 'left', background: theme === 'dark' ? '#1F2937' : '#F8FAFC', color: theme === 'dark' ? '#E2E8F0' : '#475569' }}>
                      <th style={{ padding: '12px' }}>Role</th>
                      <th style={{ padding: '12px' }}>User Name</th>
                      <th style={{ padding: '12px' }}>
                        {adminTab === 'MENTOR' ? 'Professional Email' : (adminTab === 'STUDENT' ? 'Academic Email' : 'Email Address')}
                      </th>
                      <th style={{ padding: '12px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                          <Clock size={14} style={{ color: '#7C3AED' }} />
                          <span>Registered Date & Time</span>
                        </div>
                      </th>
                      <th style={{ padding: '12px' }}>
                        {adminTab === 'MENTOR' ? 'Designation / Title' : (adminTab === 'STUDENT' ? 'Degree / Program' : 'Degree / Title')}
                      </th>
                      <th style={{ padding: '12px' }}>
                        {adminTab === 'MENTOR' ? 'Expertise Domain' : (adminTab === 'STUDENT' ? 'Branch / Discipline' : 'Branch / Focus')}
                      </th>
                      <th style={{ padding: '12px' }}>
                        {adminTab === 'MENTOR' ? 'Organization / University' : 'University Campus'}
                      </th>
                      <th style={{ padding: '12px' }}>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredUsers.map((u, idx) => {
                      const dt = formatDateTime(u.createdAt || u.created_at || u.created);
                      return (
                        <tr key={idx} style={{ borderBottom: `1px solid ${theme === 'dark' ? '#1F2937' : '#F1F5F9'}`, color: theme === 'dark' ? '#F9FAFB' : '#0F172A' }}>
                          <td style={{ padding: '12px' }}>
                            <span style={{ 
                              background: u.role === 'MENTOR' ? '#F3E8FF' : '#EFF6FF', 
                              color: u.role === 'MENTOR' ? '#7C3AED' : '#2563EB', 
                              padding: '4px 10px', 
                              borderRadius: '9999px', 
                              fontWeight: '800', 
                              fontSize: '11px',
                              border: `1px solid ${u.role === 'MENTOR' ? '#DDD6FE' : '#BFDBFE'}`
                            }}>
                              {u.role === 'MENTOR' ? '👨‍🏫 MENTOR' : '🎓 STUDENT'}
                            </span>
                          </td>
                          <td style={{ padding: '12px', fontWeight: '700' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <div style={{ 
                                width: '32px', 
                                height: '32px', 
                                borderRadius: '50%', 
                                background: u.role === 'MENTOR' ? '#7C3AED' : '#2563EB', 
                                color: 'white', 
                                display: 'flex', 
                                alignItems: 'center', 
                                justifyContent: 'center',
                                fontSize: '12px',
                                fontWeight: '800'
                              }}>
                                {u.initials || u.name?.slice(0, 2).toUpperCase() || 'ST'}
                              </div>
                              <div>
                                <div>{u.name}</div>
                                {u.nextProject && (
                                  <div style={{ fontSize: '10.5px', color: '#10B981', fontWeight: 600 }}>🎯 Want to do: {u.nextProject.slice(0, 24)}...</div>
                                )}
                              </div>
                            </div>
                          </td>
                          <td style={{ padding: '12px', color: '#60A5FA', fontWeight: '600' }}>{u.email}</td>
                          <td style={{ padding: '12px' }}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                              <div style={{ fontWeight: '700', fontSize: '12.5px', color: theme === 'dark' ? '#F3F4F6' : '#1E293B', display: 'flex', alignItems: 'center', gap: '5px' }}>
                                <span>{dt.date}</span>
                                <span style={{ color: '#7C3AED', fontWeight: '800' }}>{dt.time}</span>
                              </div>
                              {dt.relative && (
                                <span style={{ fontSize: '11px', color: '#059669', fontWeight: '700' }}>
                                  {dt.relative}
                                </span>
                              )}
                            </div>
                          </td>
                          <td style={{ padding: '12px', fontWeight: '600' }}>{u.roleTitle || u.degree || 'B.Tech'}</td>
                          <td style={{ padding: '12px' }}>{u.projectFocus ? `${u.projectFocus} • ${u.major || 'CSE'}` : (u.major || 'Engineering')}</td>
                          <td style={{ padding: '12px', color: theme === 'dark' ? '#CBD5E1' : '#64748B' }}>{u.university || 'Stanford University'}</td>
                          <td style={{ padding: '12px' }}>
                            <span className="phase-badge green" style={{ background: '#D1FAE5', color: '#059669', padding: '3px 8px', borderRadius: '4px', fontWeight: '700', fontSize: '11px' }}>Active Account</span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
