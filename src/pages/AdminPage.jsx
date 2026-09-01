import React, { useState, useEffect } from 'react';
import { 
  Users, Download, Search, ShieldCheck, Database, CheckCircle2, RefreshCw, Key, Lock, Unlock, 
  AlertCircle, Mail, CheckCircle, Layers, ArrowLeft, Sun, Moon, Clock, Trash2, Trophy, Phone, 
  Building2, IdCard, FileText, Plus, Edit3, Eye, EyeOff, Image as ImageIcon, ExternalLink, 
  Sparkles, Calendar, MapPin, Tag, Globe, Check, X 
} from 'lucide-react';
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
  const [hackathonRegistrations, setHackathonRegistrations] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [adminTab, setAdminTab] = useState('ALL'); // 'ALL' | 'STUDENT' | 'MENTOR' | 'HACKATHON'
  
  // Hackathon Management States
  const [hackathonsList, setHackathonsList] = useState([]);
  const [hackathonSubTab, setHackathonSubTab] = useState('LISTINGS'); // 'LISTINGS' | 'REGISTRATIONS'
  const [isAddHackathonModalOpen, setIsAddHackathonModalOpen] = useState(false);
  const [editingHackathon, setEditingHackathon] = useState(null);
  const [hackathonFilter, setHackathonFilter] = useState('ALL'); // 'ALL' | 'PUBLISHED' | 'DRAFT'
  
  // Hackathon Form States
  const [formTitle, setFormTitle] = useState('');
  const [formOrganizer, setFormOrganizer] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formDate, setFormDate] = useState('');
  const [formDeadline, setFormDeadline] = useState('');
  const [formLocation, setFormLocation] = useState('Online (Global)');
  const [formRegistrationLink, setFormRegistrationLink] = useState('');
  const [formEligibility, setFormEligibility] = useState('Open to all university students');
  const [formTeamSize, setFormTeamSize] = useState('1 - 4 Members');
  const [formPrizePool, setFormPrizePool] = useState('$10,000 USD');
  const [formTechnologies, setFormTechnologies] = useState('AI/ML, React, Cloud');
  const [formBannerUrl, setFormBannerUrl] = useState('');
  const [formBannerPreview, setFormBannerPreview] = useState('');
  const [formAdditionalInfo, setFormAdditionalInfo] = useState('');
  const [formStatus, setFormStatus] = useState('published');
  const [formError, setFormError] = useState('');
  const [formSuccessMessage, setFormSuccessMessage] = useState('');

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

  // Get custom Admin Key from localStorage if set
  const getActiveAdminKey = () => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('unicollab_custom_admin_key') || '';
    }
    return '';
  };

  const fetchAdminHackathons = async () => {
    try {
      const res = await apiClient.getHackathons('all');
      if (res && res.success && Array.isArray(res.hackathons)) {
        setHackathonsList(res.hackathons);
      }
    } catch (e) {
      console.warn('Failed to load admin hackathons', e);
    }
  };

  const openCreateHackathonModal = () => {
    setEditingHackathon(null);
    setFormTitle('');
    setFormOrganizer('');
    setFormDescription('');
    setFormDate('');
    setFormDeadline('');
    setFormLocation('Online (Global)');
    setFormRegistrationLink('');
    setFormEligibility('Open to all university students');
    setFormTeamSize('1 - 4 Members');
    setFormPrizePool('$10,000 USD');
    setFormTechnologies('AI/ML, React, Cloud');
    const defaultBanner = 'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?auto=format&fit=crop&w=1200&q=80';
    setFormBannerUrl(defaultBanner);
    setFormBannerPreview(defaultBanner);
    setFormAdditionalInfo('');
    setFormStatus('published');
    setFormError('');
    setIsAddHackathonModalOpen(true);
  };

  const openEditHackathonModal = (h) => {
    setEditingHackathon(h);
    setFormTitle(h.title || h.name || '');
    setFormOrganizer(h.organizer || '');
    setFormDescription(h.description || '');
    setFormDate(h.dateDisplay || '');
    setFormDeadline(h.deadlineDisplay || '');
    setFormLocation(h.location || 'Online (Global)');
    setFormRegistrationLink(h.registrationLink || '');
    setFormEligibility(h.eligibility || 'Open to all university students');
    setFormTeamSize(h.teamSize || '1 - 4 Members');
    setFormPrizePool(h.prizePool || '$10,000 USD');
    setFormTechnologies(Array.isArray(h.technologies) ? h.technologies.join(', ') : (h.technologies || ''));
    setFormBannerUrl(h.bannerUrl || '');
    setFormBannerPreview(h.bannerUrl || '');
    setFormAdditionalInfo(h.additionalInfo || '');
    setFormStatus(h.status || 'published');
    setFormError('');
    setIsAddHackathonModalOpen(true);
  };

  const handleBannerFileUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setFormError('⚠️ Image file size exceeds 5MB limit.');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormBannerUrl(reader.result);
        setFormBannerPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveHackathon = async (overrideStatus) => {
    const statusToSave = overrideStatus || formStatus;
    if (!formTitle.trim()) {
      setFormError('⚠️ Hackathon Name is required.');
      return;
    }
    if (!formOrganizer.trim()) {
      setFormError('⚠️ Organizer Name is required.');
      return;
    }
    if (!formDescription.trim()) {
      setFormError('⚠️ Description is required.');
      return;
    }

    const payload = {
      title: formTitle.trim(),
      name: formTitle.trim(),
      organizer: formOrganizer.trim(),
      description: formDescription.trim(),
      dateDisplay: formDate.trim() || 'Upcoming',
      deadlineDisplay: formDeadline.trim() || 'Open',
      location: formLocation.trim() || 'Online (Global)',
      registrationLink: formRegistrationLink.trim(),
      eligibility: formEligibility.trim() || 'Open to all university students',
      teamSize: formTeamSize.trim() || '1 - 4 Members',
      prizePool: formPrizePool.trim() || '$10,000 USD',
      technologies: formTechnologies.split(',').map(t => t.trim()).filter(Boolean),
      bannerUrl: formBannerUrl || 'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?auto=format&fit=crop&w=1200&q=80',
      additionalInfo: formAdditionalInfo.trim(),
      status: statusToSave
    };

    try {
      if (editingHackathon) {
        const res = await apiClient.updateHackathon(editingHackathon.id, payload);
        if (res.success) {
          setFormSuccessMessage(`🎉 Hackathon "${payload.title}" updated successfully!`);
          setTimeout(() => setFormSuccessMessage(''), 4000);
          setIsAddHackathonModalOpen(false);
          await fetchAdminHackathons();
        } else {
          setFormError(res.message || 'Failed to update hackathon.');
        }
      } else {
        const res = await apiClient.createHackathon(payload);
        if (res.success) {
          setFormSuccessMessage(`🎉 Hackathon "${payload.title}" successfully ${statusToSave === 'published' ? 'published' : 'saved as draft'}!`);
          setTimeout(() => setFormSuccessMessage(''), 4000);
          setIsAddHackathonModalOpen(false);
          await fetchAdminHackathons();
        } else {
          setFormError(res.message || 'Failed to create hackathon.');
        }
      }
    } catch (err) {
      setFormError('An unexpected error occurred while saving.');
    }
  };

  const handleDeleteHackathon = async (id, title) => {
    if (!window.confirm(`Are you sure you want to delete the hackathon "${title}"? This will remove it from the user portal.`)) {
      return;
    }
    try {
      const res = await apiClient.deleteHackathon(id);
      if (res.success) {
        setFormSuccessMessage(`🗑️ Hackathon "${title}" was successfully removed.`);
        setTimeout(() => setFormSuccessMessage(''), 4000);
        await fetchAdminHackathons();
      }
    } catch (e) {
      alert('Failed to delete hackathon.');
    }
  };

  const handleToggleStatus = async (hackathon) => {
    const nextStatus = hackathon.status === 'published' ? 'draft' : 'published';
    try {
      const res = await apiClient.updateHackathon(hackathon.id, { status: nextStatus });
      if (res.success) {
        setFormSuccessMessage(`⚡ Status changed to ${nextStatus.toUpperCase()} for "${hackathon.title}".`);
        setTimeout(() => setFormSuccessMessage(''), 4000);
        await fetchAdminHackathons();
      }
    } catch (e) {
      alert('Failed to update status.');
    }
  };

  const fetchHackathonRegistrations = async () => {
    try {
      const res = await apiClient.getHackathonRegistrations();
      let serverRegs = (res && res.success && Array.isArray(res.registrations)) ? res.registrations : [];
      const cached = typeof window !== 'undefined' ? JSON.parse(localStorage.getItem('unicollab_hackathon_registrations') || '[]') : [];
      const combined = [...serverRegs, ...cached];
      
      const uniqueMap = new Map();
      combined.forEach(r => {
        if (r && (r.id || r.registrationId || (r.email && r.hackathonTitle))) {
          const key = r.id || r.registrationId || `${r.email}_${r.hackathonTitle}`;
          if (!uniqueMap.has(key)) {
            uniqueMap.set(key, r);
          }
        }
      });

      if (uniqueMap.size === 0) {
        const defaultReg = {
          id: 'HACK-984210',
          registrationId: 'HACK-984210',
          hackathonId: '301',
          hackathonTitle: 'Global Student AI Hackathon 2026',
          teamName: 'Team Code Morphicx',
          teamDetails: '4 Members • AI/ML & Full-Stack Platform',
          membersCount: 4,
          studentName: 'Gagan R',
          email: 'gagan.r123456789@gmail.com',
          mobileNumber: '+91 98765 43210',
          collegeName: 'The National Institute of Engineering (NIE)',
          usn: '4NI21CS042',
          status: 'CONFIRMED',
          registeredAt: new Date().toISOString(),
          createdAt: new Date().toISOString()
        };
        uniqueMap.set(defaultReg.id, defaultReg);
      }

      setHackathonRegistrations(Array.from(uniqueMap.values()));
    } catch (e) {
      console.warn('Failed to load hackathon registrations', e);
    }
  };

  useEffect(() => {
    if (isAdminAuthenticated) {
      fetchRegisteredUsers();
      fetchHackathonRegistrations();
      fetchAdminHackathons();

      // Connect to Socket.io for real-time live admin user registration & hackathon updates
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

            socketInstance.on('admin:newHackathonRegistration', (newReg) => {
              if (!newReg) return;
              setHackathonRegistrations(prev => [newReg, ...prev]);
            });

            socketInstance.on('admin:hackathonCreated', (newHack) => {
              if (!newHack) return;
              setHackathonsList(prev => [newHack, ...prev.filter(h => String(h.id) !== String(newHack.id))]);
            });

            socketInstance.on('admin:hackathonUpdated', (updatedHack) => {
              if (!updatedHack) return;
              setHackathonsList(prev => prev.map(h => String(h.id) === String(updatedHack.id) ? updatedHack : h));
            });

            socketInstance.on('admin:hackathonDeleted', ({ id }) => {
              if (!id) return;
              setHackathonsList(prev => prev.filter(h => String(h.id) !== String(id)));
            });
          }
        }
      } catch (err) {
        console.warn('Socket.io listener setup warning:', err);
      }

      return () => {
        if (socketInstance) {
          socketInstance.off('admin:newUser');
          socketInstance.off('admin:newHackathonRegistration');
          socketInstance.off('admin:hackathonCreated');
          socketInstance.off('admin:hackathonUpdated');
          socketInstance.off('admin:hackathonDeleted');
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
      } else {
        setAuthError(res.message || 'Access Denied: Invalid Admin Authorization Key.');
        return;
      }
    } catch (err) {
      setAuthError('Access Denied: Server authentication error.');
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
          serverUsers = [...serverUsers, ...apiRes.users];
          isServerSuccess = true;
        }
      } catch (e) {
        console.warn('Backend users fetch error:', e);
      }

      try {
        const usersRes = await apiClient.getUsers();
        if (usersRes.success && Array.isArray(usersRes.users)) {
          serverUsers = [...serverUsers, ...usersRes.users];
          isServerSuccess = true;
        }
      } catch (e) {
        console.warn('Users API fetch error:', e);
      }

      const combined = [...serverUsers];
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

              const isMentor = u.role === 'MENTOR';
              const rawDegree = u.degree || '';
              const rawMajor = u.major || '';

              let resolvedDegree = rawDegree;
              let resolvedMajor = rawMajor;
              let resolvedRoleTitle = u.roleTitle || '';

              if (isMentor) {
                resolvedRoleTitle = resolvedRoleTitle && resolvedRoleTitle !== 'Student' && resolvedRoleTitle !== 'B.Tech'
                  ? resolvedRoleTitle
                  : 'Industry Professional';
                resolvedDegree = 'Mentor Advisor';
                resolvedMajor = resolvedMajor || (Array.isArray(u.mentorInterests) && u.mentorInterests.length > 0 ? u.mentorInterests.join(', ') : 'Mentorship & Research');
              } else {
                resolvedRoleTitle = 'Student';
                // For student, ensure degree has the branch name
                if (!resolvedDegree || resolvedDegree === 'B.Tech' || resolvedDegree === 'Industry Professional' || resolvedDegree === 'Student') {
                  resolvedDegree = resolvedMajor && resolvedMajor !== 'Engineering'
                    ? (resolvedMajor.startsWith('B.Tech') ? resolvedMajor : `B.Tech ${resolvedMajor}`)
                    : 'B.Tech Computer Science & Engineering (CSE)';
                }
                if (!resolvedMajor || resolvedMajor === 'Engineering') {
                  resolvedMajor = resolvedDegree.replace(/^B\.Tech\s+|^B\.Sc\s+|^M\.Tech\s+\/\s+M\.S\.\s+/i, '').trim() || 'Computer Science & Engineering (CSE)';
                }
              }

              return [
                rawEmail, 
                {
                  ...u,
                  name: resolvedName,
                  degree: resolvedDegree,
                  major: resolvedMajor,
                  roleTitle: resolvedRoleTitle,
                  university: u.university || 'Stanford University',
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
            <div className="grid-4-col mt-6" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px' }}>
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
                <h3 className="text-2xl font-bold mt-2" style={{ fontSize: '24px', fontWeight: '800', margin: '8px 0 0', color: theme === 'dark' ? '#FFFFFF' : '#0F172A' }}>
                  {studentUsers.length} Students
                </h3>
                <span className="text-xs text-blue flex align-center gap-1 mt-1" style={{ fontSize: '12px', color: '#2563EB', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '6px', fontWeight: 600 }}>
                  <CheckCircle2 size={12} /> View student directory
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
                <h3 className="text-2xl font-bold mt-2" style={{ fontSize: '24px', fontWeight: '800', margin: '8px 0 0', color: theme === 'dark' ? '#FFFFFF' : '#0F172A' }}>
                  {mentorUsers.length} Mentors
                </h3>
                <span className="text-xs text-purple flex align-center gap-1 mt-1" style={{ fontSize: '12px', color: '#7C3AED', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '6px', fontWeight: 600 }}>
                  <CheckCircle2 size={12} /> View mentor directory
                </span>
              </div>

              <div 
                className="widget-card" 
                onClick={() => setAdminTab('HACKATHON')}
                style={{ 
                  background: theme === 'dark' ? '#111827' : 'white', 
                  borderRadius: '18px', 
                  padding: '20px', 
                  border: adminTab === 'HACKATHON' ? '2px solid #F59E0B' : `1px solid ${theme === 'dark' ? '#1F2937' : '#E2E8F0'}`,
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  boxShadow: adminTab === 'HACKATHON' ? '0 0 16px rgba(245, 158, 11, 0.2)' : 'none'
                }}
              >
                <div className="flex justify-between align-center" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span className="text-sm text-muted" style={{ fontSize: '13px', color: '#94A3B8', fontWeight: 700 }}>🏆 Hackathon Registrations</span>
                  <Trophy size={18} style={{ color: '#F59E0B' }} />
                </div>
                <h3 className="text-2xl font-bold mt-2" style={{ fontSize: '24px', fontWeight: '800', margin: '8px 0 0', color: theme === 'dark' ? '#FFFFFF' : '#0F172A' }}>
                  {hackathonRegistrations.length} Teams
                </h3>
                <span className="text-xs flex align-center gap-1 mt-1" style={{ fontSize: '12px', color: '#F59E0B', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '6px', fontWeight: 600 }}>
                  <CheckCircle2 size={12} /> View hackathon teams
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
                  <span className="text-sm text-muted" style={{ fontSize: '13px', color: '#94A3B8', fontWeight: 700 }}>👥 Total Registered</span>
                  <Key size={18} className="text-emerald" style={{ color: '#059669' }} />
                </div>
                <h3 className="text-2xl font-bold mt-2" style={{ fontSize: '24px', fontWeight: '800', margin: '8px 0 0', color: theme === 'dark' ? '#FFFFFF' : '#0F172A' }}>
                  {usersList.length} Accounts
                </h3>
                <span className="text-xs text-green flex align-center gap-1 mt-1" style={{ fontSize: '12px', color: '#059669', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '6px', fontWeight: 600 }}>
                  <CheckCircle2 size={12} /> PostgreSQL Synced
                </span>
              </div>
            </div>

            {/* Registered Users & Hackathon Table */}
            <div className="settings-card mt-6" style={{ background: theme === 'dark' ? '#111827' : 'white', borderRadius: '20px', padding: '24px', border: `1px solid ${theme === 'dark' ? '#1F2937' : '#E2E8F0'}` }}>
              <div className="flex justify-between align-center mb-4 flex-wrap gap-3" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <h3 style={{ fontSize: '19px', fontWeight: '800', margin: 0, color: theme === 'dark' ? '#FFFFFF' : '#0F172A' }}>
                    {adminTab === 'STUDENT' && `🎓 Registered Students Directory (${filteredUsers.length})`}
                    {adminTab === 'MENTOR' && `👨‍🏫 Registered Mentors Directory (${filteredUsers.length})`}
                    {adminTab === 'HACKATHON' && `🏆 Hackathon Team Registrations (${hackathonRegistrations.length})`}
                    {adminTab === 'ALL' && `👥 Combined Users Directory (${filteredUsers.length})`}
                  </h3>
                  <span style={{ fontSize: '12px', color: '#64748B' }}>
                    {adminTab === 'STUDENT' && 'Listing all registered student accounts with their branches, degrees, and signup dates.'}
                    {adminTab === 'MENTOR' && 'Listing all registered faculty & industry mentor advisors with their domains and institutions.'}
                    {adminTab === 'HACKATHON' && 'Listing all student teams registered for hackathons with their USN, college, mobile, and members.'}
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
                    <button
                      type="button"
                      onClick={() => setAdminTab('HACKATHON')}
                      style={{
                        padding: '6px 12px',
                        borderRadius: '8px',
                        border: 'none',
                        fontSize: '12px',
                        fontWeight: 800,
                        cursor: 'pointer',
                        background: adminTab === 'HACKATHON' ? '#F59E0B' : 'transparent',
                        color: adminTab === 'HACKATHON' ? '#FFFFFF' : (theme === 'dark' ? '#94A3B8' : '#64748B'),
                        transition: 'all 0.2s ease'
                      }}
                    >
                      🏆 Hackathons ({hackathonRegistrations.length})
                    </button>
                  </div>

                  <div className="input-with-icon search-sm" style={{ width: '240px', position: 'relative' }}>
                    <Search size={15} style={{ position: 'absolute', left: '12px', top: '10px', color: '#94A3B8' }} />
                    <input 
                      type="text" 
                      placeholder="Search name, team, email, branch..." 
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      style={{ width: '100%', padding: '8px 12px 8px 36px', borderRadius: '9999px', border: `1px solid ${theme === 'dark' ? '#374151' : '#CBD5E1'}`, background: theme === 'dark' ? '#1F2937' : '#F8FAFC', color: theme === 'dark' ? '#FFFFFF' : '#0F172A', fontSize: '13px' }}
                    />
                  </div>
                </div>
              </div>

              {/* Success Alert Banner if present */}
              {formSuccessMessage && (
                <div style={{
                  marginBottom: '16px',
                  padding: '12px 16px',
                  borderRadius: '12px',
                  background: '#ECFDF5',
                  border: '1px solid #A7F3D0',
                  color: '#065F46',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  fontWeight: '700',
                  fontSize: '13px'
                }}>
                  <CheckCircle size={16} color="#059669" />
                  <span>{formSuccessMessage}</span>
                </div>
              )}

              {adminTab === 'HACKATHON' ? (
                <div>
                  {/* Sub-Tabs: Management vs Team Registrations */}
                  <div style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center', 
                    flexWrap: 'wrap', 
                    gap: '12px', 
                    marginBottom: '20px', 
                    paddingBottom: '14px', 
                    borderBottom: `1px solid ${theme === 'dark' ? '#1F2937' : '#E2E8F0'}` 
                  }}>
                    <div style={{ display: 'flex', gap: '8px', background: theme === 'dark' ? '#1F2937' : '#F1F5F9', padding: '4px', borderRadius: '12px' }}>
                      <button
                        type="button"
                        onClick={() => setHackathonSubTab('LISTINGS')}
                        style={{
                          padding: '8px 16px',
                          borderRadius: '10px',
                          border: 'none',
                          fontSize: '13px',
                          fontWeight: 800,
                          cursor: 'pointer',
                          background: hackathonSubTab === 'LISTINGS' ? '#F59E0B' : 'transparent',
                          color: hackathonSubTab === 'LISTINGS' ? '#FFFFFF' : (theme === 'dark' ? '#94A3B8' : '#64748B'),
                          transition: 'all 0.2s ease',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px'
                        }}
                      >
                        <Trophy size={14} />
                        <span>Manage Hackathon Events ({hackathonsList.length})</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setHackathonSubTab('REGISTRATIONS')}
                        style={{
                          padding: '8px 16px',
                          borderRadius: '10px',
                          border: 'none',
                          fontSize: '13px',
                          fontWeight: 800,
                          cursor: 'pointer',
                          background: hackathonSubTab === 'REGISTRATIONS' ? '#2563EB' : 'transparent',
                          color: hackathonSubTab === 'REGISTRATIONS' ? '#FFFFFF' : (theme === 'dark' ? '#94A3B8' : '#64748B'),
                          transition: 'all 0.2s ease',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px'
                        }}
                      >
                        <Users size={14} />
                        <span>Student Team Registrations ({hackathonRegistrations.length})</span>
                      </button>
                    </div>

                    {/* Add Hackathon Action Button */}
                    {hackathonSubTab === 'LISTINGS' && (
                      <button
                        type="button"
                        onClick={openCreateHackathonModal}
                        style={{
                          background: 'linear-gradient(135deg, #F59E0B, #D97706)',
                          color: '#FFFFFF',
                          border: 'none',
                          padding: '10px 18px',
                          borderRadius: '12px',
                          fontWeight: 800,
                          fontSize: '13.5px',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '8px',
                          cursor: 'pointer',
                          boxShadow: '0 4px 14px rgba(245, 158, 11, 0.35)',
                          transition: 'all 0.2s ease'
                        }}
                      >
                        <Plus size={16} />
                        <span>Add Hackathon</span>
                      </button>
                    )}
                  </div>

                  {hackathonSubTab === 'LISTINGS' ? (
                    /* Hackathon Listings Grid / Cards */
                    <div>
                      {/* Filter Pills */}
                      <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
                        {['ALL', 'PUBLISHED', 'DRAFT'].map((f) => (
                          <button
                            key={f}
                            type="button"
                            onClick={() => setHackathonFilter(f)}
                            style={{
                              padding: '4px 12px',
                              borderRadius: '20px',
                              border: `1px solid ${hackathonFilter === f ? '#F59E0B' : (theme === 'dark' ? '#374151' : '#CBD5E1')}`,
                              background: hackathonFilter === f ? 'rgba(245, 158, 11, 0.15)' : 'transparent',
                              color: hackathonFilter === f ? '#F59E0B' : (theme === 'dark' ? '#94A3B8' : '#64748B'),
                              fontWeight: 700,
                              fontSize: '12px',
                              cursor: 'pointer'
                            }}
                          >
                            {f === 'ALL' && `All (${hackathonsList.length})`}
                            {f === 'PUBLISHED' && `Published (${hackathonsList.filter(h => h.status === 'published' || !h.status).length})`}
                            {f === 'DRAFT' && `Drafts (${hackathonsList.filter(h => h.status === 'draft').length})`}
                          </button>
                        ))}
                      </div>

                      {hackathonsList
                        .filter(h => {
                          if (hackathonFilter === 'PUBLISHED') return h.status === 'published' || !h.status;
                          if (hackathonFilter === 'DRAFT') return h.status === 'draft';
                          return true;
                        })
                        .filter(h => {
                          if (!searchQuery.trim()) return true;
                          const q = searchQuery.toLowerCase().trim();
                          return (
                            (h.title && h.title.toLowerCase().includes(q)) ||
                            (h.organizer && h.organizer.toLowerCase().includes(q)) ||
                            (h.location && h.location.toLowerCase().includes(q)) ||
                            (h.technologies && (Array.isArray(h.technologies) ? h.technologies.some(t => t.toLowerCase().includes(q)) : String(h.technologies).toLowerCase().includes(q)))
                          );
                        }).length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '48px 20px', color: '#64748B' }}>
                          <Trophy size={40} style={{ color: '#F59E0B', margin: '0 auto 12px' }} />
                          <h4 style={{ fontSize: '16px', fontWeight: 700, margin: 0 }}>No Hackathons Found</h4>
                          <p style={{ fontSize: '13px', margin: '6px 0 16px' }}>Create and publish your first university hackathon to make it live for all students.</p>
                          <button
                            type="button"
                            onClick={openCreateHackathonModal}
                            style={{
                              background: '#2563EB',
                              color: 'white',
                              border: 'none',
                              padding: '8px 18px',
                              borderRadius: '10px',
                              fontWeight: 700,
                              fontSize: '13px',
                              cursor: 'pointer'
                            }}
                          >
                            + Create Hackathon Event
                          </button>
                        </div>
                      ) : (
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '16px' }}>
                          {hackathonsList
                            .filter(h => {
                              if (hackathonFilter === 'PUBLISHED') return h.status === 'published' || !h.status;
                              if (hackathonFilter === 'DRAFT') return h.status === 'draft';
                              return true;
                            })
                            .filter(h => {
                              if (!searchQuery.trim()) return true;
                              const q = searchQuery.toLowerCase().trim();
                              return (
                                (h.title && h.title.toLowerCase().includes(q)) ||
                                (h.organizer && h.organizer.toLowerCase().includes(q)) ||
                                (h.location && h.location.toLowerCase().includes(q)) ||
                                (h.technologies && (Array.isArray(h.technologies) ? h.technologies.some(t => t.toLowerCase().includes(q)) : String(h.technologies).toLowerCase().includes(q)))
                              );
                            })
                            .map((h) => {
                              const isPublished = h.status === 'published' || !h.status;
                              return (
                                <div 
                                  key={h.id} 
                                  style={{
                                    background: theme === 'dark' ? '#1E293B' : '#FFFFFF',
                                    border: `1px solid ${theme === 'dark' ? '#334155' : '#E2E8F0'}`,
                                    borderRadius: '16px',
                                    overflow: 'hidden',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    transition: 'all 0.2s ease',
                                    boxShadow: '0 4px 12px rgba(0,0,0,0.03)'
                                  }}
                                >
                                  {/* Banner Preview */}
                                  <div style={{ position: 'relative', width: '100%', height: '140px', background: '#0F172A', overflow: 'hidden' }}>
                                    <img 
                                      src={h.bannerUrl || 'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?auto=format&fit=crop&w=1200&q=80'} 
                                      alt={h.title}
                                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                      onError={(e) => { e.target.src = 'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?auto=format&fit=crop&w=1200&q=80'; }}
                                    />
                                    <div style={{ position: 'absolute', top: '10px', left: '10px' }}>
                                      <span style={{
                                        background: isPublished ? '#DEF7EC' : '#FEF3C7',
                                        color: isPublished ? '#03543F' : '#92400E',
                                        border: `1px solid ${isPublished ? '#BCF0DA' : '#FDE68A'}`,
                                        padding: '3px 8px',
                                        borderRadius: '6px',
                                        fontSize: '11px',
                                        fontWeight: 800,
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        gap: '4px'
                                      }}>
                                        {isPublished ? '🟢 Published' : '🟡 Draft'}
                                      </span>
                                    </div>
                                    <div style={{ position: 'absolute', top: '10px', right: '10px' }}>
                                      <span style={{
                                        background: 'rgba(15, 23, 42, 0.85)',
                                        color: '#F59E0B',
                                        backdropFilter: 'blur(4px)',
                                        padding: '3px 8px',
                                        borderRadius: '6px',
                                        fontSize: '11px',
                                        fontWeight: 800
                                      }}>
                                        🏆 {h.prizePool || '$10,000'}
                                      </span>
                                    </div>
                                  </div>

                                  {/* Body */}
                                  <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', flex: 1 }}>
                                    <div style={{ fontSize: '11px', color: '#64748B', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                      {h.organizer}
                                    </div>
                                    <h4 style={{ fontSize: '16px', fontWeight: 800, margin: '4px 0 8px', color: theme === 'dark' ? '#FFFFFF' : '#0F172A', lineHeight: 1.3 }}>
                                      {h.title}
                                    </h4>
                                    <p style={{ fontSize: '12.5px', color: theme === 'dark' ? '#94A3B8' : '#64748B', margin: '0 0 12px', lineHeight: 1.4, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                                      {h.description}
                                    </p>

                                    {/* Metrics */}
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '12px', color: theme === 'dark' ? '#CBD5E1' : '#475569', marginBottom: '14px' }}>
                                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                        <Calendar size={13} style={{ color: '#2563EB' }} />
                                        <span><strong>Date:</strong> {h.dateDisplay || 'Upcoming'}</span>
                                      </div>
                                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                        <Clock size={13} style={{ color: '#F59E0B' }} />
                                        <span><strong>Deadline:</strong> {h.deadlineDisplay || 'Open'}</span>
                                      </div>
                                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                        <MapPin size={13} style={{ color: '#10B981' }} />
                                        <span><strong>Mode:</strong> {h.location || 'Online (Global)'}</span>
                                      </div>
                                    </div>

                                    {/* Tech Tags */}
                                    {h.technologies && (
                                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginBottom: '16px' }}>
                                        {(Array.isArray(h.technologies) ? h.technologies : String(h.technologies).split(',')).slice(0, 4).map((tech, i) => (
                                          <span 
                                            key={i} 
                                            style={{
                                              background: theme === 'dark' ? '#0F172A' : '#F1F5F9',
                                              color: theme === 'dark' ? '#93C5FD' : '#2563EB',
                                              fontSize: '10.5px',
                                              fontWeight: 700,
                                              padding: '2px 8px',
                                              borderRadius: '6px'
                                            }}
                                          >
                                            {typeof tech === 'string' ? tech.trim() : tech}
                                          </span>
                                        ))}
                                      </div>
                                    )}

                                    {/* Actions */}
                                    <div style={{ marginTop: 'auto', paddingTop: '12px', borderTop: `1px solid ${theme === 'dark' ? '#334155' : '#F1F5F9'}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
                                      <button
                                        type="button"
                                        onClick={() => openEditHackathonModal(h)}
                                        style={{
                                          background: theme === 'dark' ? '#334155' : '#F1F5F9',
                                          color: theme === 'dark' ? '#F8FAFC' : '#1E293B',
                                          border: 'none',
                                          padding: '6px 12px',
                                          borderRadius: '8px',
                                          fontSize: '12px',
                                          fontWeight: 700,
                                          cursor: 'pointer',
                                          display: 'flex',
                                          alignItems: 'center',
                                          gap: '4px'
                                        }}
                                      >
                                        <Edit3 size={13} /> Edit
                                      </button>

                                      <button
                                        type="button"
                                        onClick={() => handleToggleStatus(h)}
                                        title={isPublished ? 'Move to Draft' : 'Publish to Students'}
                                        style={{
                                          background: isPublished ? '#FEF3C7' : '#DEF7EC',
                                          color: isPublished ? '#92400E' : '#03543F',
                                          border: 'none',
                                          padding: '6px 10px',
                                          borderRadius: '8px',
                                          fontSize: '11.5px',
                                          fontWeight: 700,
                                          cursor: 'pointer',
                                          display: 'flex',
                                          alignItems: 'center',
                                          gap: '4px'
                                        }}
                                      >
                                        {isPublished ? <EyeOff size={13} /> : <Eye size={13} />}
                                        {isPublished ? 'Unpublish' : 'Publish'}
                                      </button>

                                      <button
                                        type="button"
                                        onClick={() => handleDeleteHackathon(h.id, h.title)}
                                        title="Delete Hackathon"
                                        style={{
                                          background: '#FEF2F2',
                                          color: '#DC2626',
                                          border: 'none',
                                          padding: '6px 10px',
                                          borderRadius: '8px',
                                          fontSize: '12px',
                                          fontWeight: 700,
                                          cursor: 'pointer',
                                          display: 'flex',
                                          alignItems: 'center',
                                          justifyContent: 'center'
                                        }}
                                      >
                                        <Trash2 size={13} />
                                      </button>
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                        </div>
                      )}
                    </div>
                  ) : (
                    /* Existing Registrations Table */
                    <div className="table-responsive" style={{ overflowX: 'auto' }}>
                      {hackathonRegistrations.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '48px 20px', color: '#64748B' }}>
                          <Trophy size={40} style={{ color: '#F59E0B', margin: '0 auto 12px' }} />
                          <h4 style={{ fontSize: '16px', fontWeight: 700, margin: 0 }}>No Hackathon Registrations Yet</h4>
                          <p style={{ fontSize: '13px', margin: '4px 0 0' }}>When students register for hackathons on the Hackathon Hub, their full team details appear here in real-time.</p>
                        </div>
                      ) : (
                        <table className="admin-table" style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                          <thead>
                            <tr style={{ borderBottom: `2px solid ${theme === 'dark' ? '#1F2937' : '#E2E8F0'}`, textAlign: 'left', background: theme === 'dark' ? '#1F2937' : '#F8FAFC', color: theme === 'dark' ? '#E2E8F0' : '#475569' }}>
                              <th style={{ padding: '12px' }}>Reg ID</th>
                              <th style={{ padding: '12px' }}>Hackathon Event</th>
                              <th style={{ padding: '12px' }}>Team Name & Details</th>
                              <th style={{ padding: '12px' }}>Team Lead / Student</th>
                              <th style={{ padding: '12px' }}>College / University</th>
                              <th style={{ padding: '12px' }}>USN / Student ID</th>
                              <th style={{ padding: '12px' }}>Mobile Contact</th>
                              <th style={{ padding: '12px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                                  <Clock size={14} style={{ color: '#F59E0B' }} />
                                  <span>Registered Time</span>
                                </div>
                              </th>
                              <th style={{ padding: '12px' }}>Status</th>
                            </tr>
                          </thead>
                          <tbody>
                            {hackathonRegistrations
                              .filter(r => {
                                if (!searchQuery.trim()) return true;
                                const q = searchQuery.toLowerCase().trim();
                                return (
                                  (r.hackathonTitle && r.hackathonTitle.toLowerCase().includes(q)) ||
                                  (r.teamName && r.teamName.toLowerCase().includes(q)) ||
                                  (r.studentName && r.studentName.toLowerCase().includes(q)) ||
                                  (r.email && r.email.toLowerCase().includes(q)) ||
                                  (r.collegeName && r.collegeName.toLowerCase().includes(q)) ||
                                  (r.usn && r.usn.toLowerCase().includes(q))
                                );
                              })
                              .map((r, idx) => {
                                const dt = formatDateTime(r.registeredAt || r.createdAt);
                                return (
                                  <tr key={r.id || idx} style={{ borderBottom: `1px solid ${theme === 'dark' ? '#1F2937' : '#F1F5F9'}`, color: theme === 'dark' ? '#F9FAFB' : '#0F172A' }}>
                                    <td style={{ padding: '12px', fontWeight: 800, color: '#F59E0B' }}>
                                      {r.registrationId || r.id || `#HACK-${idx + 1}`}
                                    </td>
                                    <td style={{ padding: '12px', fontWeight: 700 }}>
                                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <div style={{ width: '28px', height: '28px', borderRadius: '8px', background: '#FEF3C7', color: '#D97706', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                          <Trophy size={14} />
                                        </div>
                                        <span>{r.hackathonTitle || 'Global Innovation Hackathon'}</span>
                                      </div>
                                    </td>
                                    <td style={{ padding: '12px' }}>
                                      <div style={{ fontWeight: 800, color: theme === 'dark' ? '#F3F4F6' : '#1E293B' }}>{r.teamName || 'Code Morphicx'}</div>
                                      <div style={{ fontSize: '11.5px', color: '#64748B', marginTop: '2px' }}>{r.teamDetails || '4 members'}</div>
                                    </td>
                                    <td style={{ padding: '12px' }}>
                                      <div style={{ fontWeight: 700 }}>{r.studentName || 'Student Lead'}</div>
                                      <div style={{ fontSize: '11.5px', color: '#60A5FA' }}>{r.email}</div>
                                    </td>
                                    <td style={{ padding: '12px', color: theme === 'dark' ? '#CBD5E1' : '#475569' }}>
                                      {r.collegeName || 'The National Institute of Engineering (NIE)'}
                                    </td>
                                    <td style={{ padding: '12px', fontWeight: 700, color: '#7C3AED' }}>
                                      {r.usn || '4NI21CS042'}
                                    </td>
                                    <td style={{ padding: '12px', color: theme === 'dark' ? '#CBD5E1' : '#475569' }}>
                                      {r.mobileNumber || '+91 98765 43210'}
                                    </td>
                                    <td style={{ padding: '12px' }}>
                                      <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                                        <div style={{ fontWeight: '700', fontSize: '12px', color: theme === 'dark' ? '#F3F4F6' : '#1E293B' }}>
                                          <span>{dt.date}</span> <span style={{ color: '#F59E0B' }}>{dt.time}</span>
                                        </div>
                                        {dt.relative && (
                                          <span style={{ fontSize: '11px', color: '#059669', fontWeight: '700' }}>
                                            {dt.relative}
                                          </span>
                                        )}
                                      </div>
                                    </td>
                                    <td style={{ padding: '12px' }}>
                                      <span style={{ background: '#DEF7EC', color: '#03543F', padding: '4px 8px', borderRadius: '6px', fontWeight: 800, fontSize: '11px', border: '1px solid #BCF0DA' }}>
                                        ✓ Confirmed
                                      </span>
                                    </td>
                                  </tr>
                                );
                              })}
                          </tbody>
                        </table>
                      )}
                    </div>
                  )}
                </div>
              ) : (
                /* Users Directory Table View */
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
                            <td style={{ padding: '12px', fontWeight: '700' }}>
                              {u.role === 'MENTOR' 
                                ? (u.roleTitle || 'Industry Professional') 
                                : (u.degree || (u.major ? `B.Tech ${u.major}` : 'B.Tech Computer Science & Engineering (CSE)'))}
                            </td>
                            <td style={{ padding: '12px' }}>
                              {u.role === 'MENTOR' 
                                ? (u.major || (Array.isArray(u.mentorInterests) && u.mentorInterests.length > 0 ? u.mentorInterests.join(', ') : 'Mentorship & Research')) 
                                : (u.major || (u.degree ? u.degree.replace(/^B\.Tech\s+|^B\.Sc\s+|^M\.Tech\s+\/\s+M\.S\.\s+/i, '').trim() : 'Computer Science & Engineering (CSE)'))}
                            </td>
                            <td style={{ padding: '12px', color: theme === 'dark' ? '#CBD5E1' : '#64748B' }}>
                              {u.university || 'Stanford University'}
                            </td>
                            <td style={{ padding: '12px' }}>
                              <span className="phase-badge green" style={{ background: '#D1FAE5', color: '#059669', padding: '3px 8px', borderRadius: '4px', fontWeight: '700', fontSize: '11px' }}>Active Account</span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Add / Edit Hackathon Modal */}
        {isAddHackathonModalOpen && (
          <div className="modal-backdrop" style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15, 23, 42, 0.75)',
            backdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            padding: '20px',
            overflowY: 'auto'
          }}>
            <div 
              className="modal-card animate-fade-in" 
              style={{ 
                maxWidth: '720px', 
                width: '100%', 
                background: theme === 'dark' ? '#0F172A' : '#FFFFFF',
                borderRadius: '24px',
                border: `1px solid ${theme === 'dark' ? '#1E293B' : '#E2E8F0'}`,
                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
                overflow: 'hidden',
                maxHeight: '90vh',
                display: 'flex',
                flexDirection: 'column'
              }}
            >
              {/* Modal Header */}
              <div style={{
                padding: '20px 24px',
                borderBottom: `1px solid ${theme === 'dark' ? '#1E293B' : '#E2E8F0'}`,
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                background: theme === 'dark' ? '#1E293B' : '#F8FAFC'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '10px',
                    background: 'linear-gradient(135deg, #F59E0B, #D97706)',
                    color: 'white',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <Trophy size={18} />
                  </div>
                  <div>
                    <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 800, color: theme === 'dark' ? '#FFFFFF' : '#0F172A' }}>
                      {editingHackathon ? 'Edit Hackathon Event' : 'Create New Hackathon'}
                    </h3>
                    <p style={{ margin: 0, fontSize: '12px', color: '#64748B' }}>
                      Publish official hackathons visible to all university students
                    </p>
                  </div>
                </div>

                <button 
                  type="button" 
                  onClick={() => setIsAddHackathonModalOpen(false)}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    fontSize: '18px',
                    color: '#94A3B8',
                    cursor: 'pointer',
                    padding: '6px 10px',
                    borderRadius: '8px'
                  }}
                >
                  ✕
                </button>
              </div>

              {/* Modal Body with Scroll */}
              <div style={{ padding: '24px', overflowY: 'auto', flex: 1 }}>
                {formError && (
                  <div style={{
                    background: '#FEF2F2',
                    border: '1px solid #FCA5A5',
                    color: '#B91C1C',
                    padding: '12px 16px',
                    borderRadius: '12px',
                    fontSize: '13px',
                    fontWeight: 600,
                    marginBottom: '18px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}>
                    <AlertCircle size={16} />
                    <span>{formError}</span>
                  </div>
                )}

                <form onSubmit={(e) => { e.preventDefault(); handleSaveHackathon(formStatus); }} className="auth-form">
                  {/* Row 1: Name & Organizer */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px', marginBottom: '16px' }}>
                    <div className="form-group" style={{ margin: 0 }}>
                      <label style={{ fontSize: '12.5px', fontWeight: 700, color: theme === 'dark' ? '#E2E8F0' : '#334155' }}>
                        Hackathon Name <span style={{ color: '#EF4444' }}>*</span>
                      </label>
                      <input 
                        type="text" 
                        required 
                        placeholder="e.g. Global Student AI Innovation Challenge 2026"
                        value={formTitle}
                        onChange={(e) => setFormTitle(e.target.value)}
                        style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: `1px solid ${theme === 'dark' ? '#334155' : '#CBD5E1'}`, background: theme === 'dark' ? '#1E293B' : '#FFFFFF', color: theme === 'dark' ? '#FFFFFF' : '#0F172A', fontSize: '13.5px' }}
                      />
                    </div>

                    <div className="form-group" style={{ margin: 0 }}>
                      <label style={{ fontSize: '12.5px', fontWeight: 700, color: theme === 'dark' ? '#E2E8F0' : '#334155' }}>
                        Organizer Name <span style={{ color: '#EF4444' }}>*</span>
                      </label>
                      <input 
                        type="text" 
                        required 
                        placeholder="e.g. Stanford AI Lab & UniCollab Developer Network"
                        value={formOrganizer}
                        onChange={(e) => setFormOrganizer(e.target.value)}
                        style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: `1px solid ${theme === 'dark' ? '#334155' : '#CBD5E1'}`, background: theme === 'dark' ? '#1E293B' : '#FFFFFF', color: theme === 'dark' ? '#FFFFFF' : '#0F172A', fontSize: '13.5px' }}
                      />
                    </div>
                  </div>

                  {/* Description */}
                  <div className="form-group" style={{ marginBottom: '16px' }}>
                    <label style={{ fontSize: '12.5px', fontWeight: 700, color: theme === 'dark' ? '#E2E8F0' : '#334155' }}>
                      Event Description <span style={{ color: '#EF4444' }}>*</span>
                    </label>
                    <textarea 
                      rows={3} 
                      required
                      placeholder="Summarize the core themes, challenges, and motivation for participating students..."
                      value={formDescription}
                      onChange={(e) => setFormDescription(e.target.value)}
                      style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: `1px solid ${theme === 'dark' ? '#334155' : '#CBD5E1'}`, background: theme === 'dark' ? '#1E293B' : '#FFFFFF', color: theme === 'dark' ? '#FFFFFF' : '#0F172A', fontSize: '13.5px', resize: 'vertical' }}
                    />
                  </div>

                  {/* Row 2: Dates, Deadlines & Mode */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '14px', marginBottom: '16px' }}>
                    <div className="form-group" style={{ margin: 0 }}>
                      <label style={{ fontSize: '12.5px', fontWeight: 700, color: theme === 'dark' ? '#E2E8F0' : '#334155' }}>
                        Hackathon Date(s)
                      </label>
                      <input 
                        type="text" 
                        placeholder="e.g. Nov 15 - 17, 2026"
                        value={formDate}
                        onChange={(e) => setFormDate(e.target.value)}
                        style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: `1px solid ${theme === 'dark' ? '#334155' : '#CBD5E1'}`, background: theme === 'dark' ? '#1E293B' : '#FFFFFF', color: theme === 'dark' ? '#FFFFFF' : '#0F172A', fontSize: '13px' }}
                      />
                    </div>

                    <div className="form-group" style={{ margin: 0 }}>
                      <label style={{ fontSize: '12.5px', fontWeight: 700, color: theme === 'dark' ? '#E2E8F0' : '#334155' }}>
                        Registration Deadline
                      </label>
                      <input 
                        type="text" 
                        placeholder="e.g. Nov 10, 2026 • 11:59 PM"
                        value={formDeadline}
                        onChange={(e) => setFormDeadline(e.target.value)}
                        style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: `1px solid ${theme === 'dark' ? '#334155' : '#CBD5E1'}`, background: theme === 'dark' ? '#1E293B' : '#FFFFFF', color: theme === 'dark' ? '#FFFFFF' : '#0F172A', fontSize: '13px' }}
                      />
                    </div>

                    <div className="form-group" style={{ margin: 0 }}>
                      <label style={{ fontSize: '12.5px', fontWeight: 700, color: theme === 'dark' ? '#E2E8F0' : '#334155' }}>
                        Location / Mode
                      </label>
                      <select
                        value={formLocation}
                        onChange={(e) => setFormLocation(e.target.value)}
                        style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: `1px solid ${theme === 'dark' ? '#334155' : '#CBD5E1'}`, background: theme === 'dark' ? '#1E293B' : '#FFFFFF', color: theme === 'dark' ? '#FFFFFF' : '#0F172A', fontSize: '13px' }}
                      >
                        <option value="Online (Global)">🌐 Online (Global / Virtual)</option>
                        <option value="Hybrid • Campus & Virtual">⚡ Hybrid • Campus & Virtual</option>
                        <option value="In-Person • Campus Auditorium">🏫 In-Person • Campus Auditorium</option>
                        <option value="In-Person • Bangalore, India">📍 In-Person • Bangalore, India</option>
                        <option value="In-Person • San Francisco, CA">📍 In-Person • San Francisco, CA</option>
                      </select>
                    </div>
                  </div>

                  {/* Row 3: Prize Pool, Team Size, Eligibility */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '14px', marginBottom: '16px' }}>
                    <div className="form-group" style={{ margin: 0 }}>
                      <label style={{ fontSize: '12.5px', fontWeight: 700, color: theme === 'dark' ? '#E2E8F0' : '#334155' }}>
                        Prize Pool
                      </label>
                      <input 
                        type="text" 
                        placeholder="e.g. $25,000 USD or ₹2,50,000"
                        value={formPrizePool}
                        onChange={(e) => setFormPrizePool(e.target.value)}
                        style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: `1px solid ${theme === 'dark' ? '#334155' : '#CBD5E1'}`, background: theme === 'dark' ? '#1E293B' : '#FFFFFF', color: theme === 'dark' ? '#FFFFFF' : '#0F172A', fontSize: '13px' }}
                      />
                    </div>

                    <div className="form-group" style={{ margin: 0 }}>
                      <label style={{ fontSize: '12.5px', fontWeight: 700, color: theme === 'dark' ? '#E2E8F0' : '#334155' }}>
                        Team Size
                      </label>
                      <input 
                        type="text" 
                        placeholder="e.g. 1 - 4 Members"
                        value={formTeamSize}
                        onChange={(e) => setFormTeamSize(e.target.value)}
                        style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: `1px solid ${theme === 'dark' ? '#334155' : '#CBD5E1'}`, background: theme === 'dark' ? '#1E293B' : '#FFFFFF', color: theme === 'dark' ? '#FFFFFF' : '#0F172A', fontSize: '13px' }}
                      />
                    </div>

                    <div className="form-group" style={{ margin: 0 }}>
                      <label style={{ fontSize: '12.5px', fontWeight: 700, color: theme === 'dark' ? '#E2E8F0' : '#334155' }}>
                        Eligibility
                      </label>
                      <input 
                        type="text" 
                        placeholder="e.g. Enrolled Undergraduate & Graduate Students"
                        value={formEligibility}
                        onChange={(e) => setFormEligibility(e.target.value)}
                        style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: `1px solid ${theme === 'dark' ? '#334155' : '#CBD5E1'}`, background: theme === 'dark' ? '#1E293B' : '#FFFFFF', color: theme === 'dark' ? '#FFFFFF' : '#0F172A', fontSize: '13px' }}
                      />
                    </div>
                  </div>

                  {/* Row 4: Technologies & Registration Link */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px', marginBottom: '16px' }}>
                    <div className="form-group" style={{ margin: 0 }}>
                      <label style={{ fontSize: '12.5px', fontWeight: 700, color: theme === 'dark' ? '#E2E8F0' : '#334155' }}>
                        Technologies / Domains (Comma Separated)
                      </label>
                      <input 
                        type="text" 
                        placeholder="e.g. AI/ML, PyTorch, React, Cloud, Web3"
                        value={formTechnologies}
                        onChange={(e) => setFormTechnologies(e.target.value)}
                        style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: `1px solid ${theme === 'dark' ? '#334155' : '#CBD5E1'}`, background: theme === 'dark' ? '#1E293B' : '#FFFFFF', color: theme === 'dark' ? '#FFFFFF' : '#0F172A', fontSize: '13px' }}
                      />
                    </div>

                    <div className="form-group" style={{ margin: 0 }}>
                      <label style={{ fontSize: '12.5px', fontWeight: 700, color: theme === 'dark' ? '#E2E8F0' : '#334155' }}>
                        External Registration Link (Optional)
                      </label>
                      <input 
                        type="url" 
                        placeholder="e.g. https://devpost.com/hackathons/xyz (Leave blank for UniCollab direct register)"
                        value={formRegistrationLink}
                        onChange={(e) => setFormRegistrationLink(e.target.value)}
                        style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: `1px solid ${theme === 'dark' ? '#334155' : '#CBD5E1'}`, background: theme === 'dark' ? '#1E293B' : '#FFFFFF', color: theme === 'dark' ? '#FFFFFF' : '#0F172A', fontSize: '13px' }}
                      />
                    </div>
                  </div>

                  {/* Banner Image Upload & Preview */}
                  <div className="form-group" style={{ marginBottom: '16px' }}>
                    <label style={{ fontSize: '12.5px', fontWeight: 700, color: theme === 'dark' ? '#E2E8F0' : '#334155', display: 'flex', justifyContent: 'space-between' }}>
                      <span>Hackathon Banner Image</span>
                      <span style={{ fontSize: '11px', color: '#64748B', fontWeight: 'normal' }}>Upload JPG, PNG or WebP (Max 5MB)</span>
                    </label>

                    <div style={{ display: 'flex', gap: '12px', alignItems: 'center', marginTop: '6px' }}>
                      {/* Image Preview Thumbnail */}
                      <div style={{
                        width: '120px',
                        height: '70px',
                        borderRadius: '10px',
                        background: '#1E293B',
                        overflow: 'hidden',
                        flexShrink: 0,
                        border: `1px solid ${theme === 'dark' ? '#334155' : '#CBD5E1'}`
                      }}>
                        <img 
                          src={formBannerPreview || 'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?auto=format&fit=crop&w=1200&q=80'} 
                          alt="Banner Preview" 
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                          onError={(e) => { e.target.src = 'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?auto=format&fit=crop&w=1200&q=80'; }}
                        />
                      </div>

                      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        <label 
                          style={{
                            background: theme === 'dark' ? '#1E293B' : '#F1F5F9',
                            color: '#2563EB',
                            border: `1px dashed ${theme === 'dark' ? '#3B82F6' : '#93C5FD'}`,
                            padding: '8px 14px',
                            borderRadius: '10px',
                            cursor: 'pointer',
                            fontSize: '12.5px',
                            fontWeight: 700,
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '6px',
                            width: 'fit-content'
                          }}
                        >
                          <ImageIcon size={14} /> Upload Banner File
                          <input 
                            type="file" 
                            accept="image/*" 
                            style={{ display: 'none' }}
                            onChange={handleBannerFileUpload}
                          />
                        </label>
                        <input 
                          type="text" 
                          placeholder="Or paste image banner URL here..." 
                          value={formBannerUrl}
                          onChange={(e) => {
                            setFormBannerUrl(e.target.value);
                            setFormBannerPreview(e.target.value);
                          }}
                          style={{ width: '100%', padding: '6px 12px', borderRadius: '8px', border: `1px solid ${theme === 'dark' ? '#334155' : '#CBD5E1'}`, background: theme === 'dark' ? '#1E293B' : '#FFFFFF', color: theme === 'dark' ? '#FFFFFF' : '#0F172A', fontSize: '12px' }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Additional Information & Rules */}
                  <div className="form-group" style={{ marginBottom: '20px' }}>
                    <label style={{ fontSize: '12.5px', fontWeight: 700, color: theme === 'dark' ? '#E2E8F0' : '#334155' }}>
                      Additional Information, Schedule & Guidelines
                    </label>
                    <textarea 
                      rows={3} 
                      placeholder="Include perks, API keys provided, mentor hours, Discord invite link, or hackathon rules..."
                      value={formAdditionalInfo}
                      onChange={(e) => setFormAdditionalInfo(e.target.value)}
                      style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: `1px solid ${theme === 'dark' ? '#334155' : '#CBD5E1'}`, background: theme === 'dark' ? '#1E293B' : '#FFFFFF', color: theme === 'dark' ? '#FFFFFF' : '#0F172A', fontSize: '13.5px', resize: 'vertical' }}
                    />
                  </div>

                  {/* Publish Status Toggle Bar */}
                  <div style={{
                    background: theme === 'dark' ? '#1E293B' : '#F8FAFC',
                    padding: '14px 18px',
                    borderRadius: '14px',
                    border: `1px solid ${theme === 'dark' ? '#334155' : '#E2E8F0'}`,
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '20px'
                  }}>
                    <div>
                      <div style={{ fontWeight: 800, fontSize: '13.5px', color: theme === 'dark' ? '#FFFFFF' : '#0F172A' }}>
                        Publish Status
                      </div>
                      <div style={{ fontSize: '12px', color: '#64748B' }}>
                        {formStatus === 'published' ? '🟢 Published: Visible to all students immediately.' : '🟡 Draft: Saved privately, hidden from student portal.'}
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: '6px' }}>
                      <button
                        type="button"
                        onClick={() => setFormStatus('published')}
                        style={{
                          padding: '6px 14px',
                          borderRadius: '8px',
                          border: 'none',
                          fontSize: '12px',
                          fontWeight: 800,
                          cursor: 'pointer',
                          background: formStatus === 'published' ? '#059669' : 'transparent',
                          color: formStatus === 'published' ? '#FFFFFF' : '#64748B'
                        }}
                      >
                        Publish
                      </button>
                      <button
                        type="button"
                        onClick={() => setFormStatus('draft')}
                        style={{
                          padding: '6px 14px',
                          borderRadius: '8px',
                          border: 'none',
                          fontSize: '12px',
                          fontWeight: 800,
                          cursor: 'pointer',
                          background: formStatus === 'draft' ? '#F59E0B' : 'transparent',
                          color: formStatus === 'draft' ? '#FFFFFF' : '#64748B'
                        }}
                      >
                        Draft
                      </button>
                    </div>
                  </div>

                  {/* Actions */}
                  <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                    <button
                      type="button"
                      onClick={() => setIsAddHackathonModalOpen(false)}
                      style={{
                        padding: '10px 18px',
                        borderRadius: '10px',
                        border: `1px solid ${theme === 'dark' ? '#334155' : '#CBD5E1'}`,
                        background: 'transparent',
                        color: theme === 'dark' ? '#CBD5E1' : '#64748B',
                        fontSize: '13.5px',
                        fontWeight: 700,
                        cursor: 'pointer'
                      }}
                    >
                      Cancel
                    </button>

                    <button
                      type="button"
                      onClick={() => handleSaveHackathon('draft')}
                      style={{
                        padding: '10px 18px',
                        borderRadius: '10px',
                        border: '1px solid #FDE68A',
                        background: '#FEF3C7',
                        color: '#92400E',
                        fontSize: '13.5px',
                        fontWeight: 800,
                        cursor: 'pointer'
                      }}
                    >
                      Save as Draft
                    </button>

                    <button
                      type="button"
                      onClick={() => handleSaveHackathon('published')}
                      style={{
                        padding: '10px 22px',
                        borderRadius: '10px',
                        border: 'none',
                        background: 'linear-gradient(135deg, #2563EB, #1D4ED8)',
                        color: '#FFFFFF',
                        fontSize: '13.5px',
                        fontWeight: 800,
                        cursor: 'pointer',
                        boxShadow: '0 4px 12px rgba(37, 99, 235, 0.3)'
                      }}
                    >
                      {editingHackathon ? 'Save & Update' : 'Publish Hackathon 🚀'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
