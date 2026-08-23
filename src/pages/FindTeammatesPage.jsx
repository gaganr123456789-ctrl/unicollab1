import React, { useState, useEffect } from 'react';
import { apiClient } from '../services/apiClient';
import { 
  Search, 
  MessageSquare, 
  UserPlus, 
  Star, 
  MapPin, 
  Briefcase, 
  SlidersHorizontal, 
  GraduationCap, 
  Check, 
  Clock, 
  Sparkles, 
  ShieldCheck, 
  UserCheck 
} from 'lucide-react';

export default function FindTeammatesPage({ onOpenChat, userProfile }) {
  const [searchKeyword, setSearchKeyword] = useState('');
  const [selectedMajors, setSelectedMajors] = useState([]);
  const [selectedSkills, setSelectedSkills] = useState([]);
  const [sortBy, setSortBy] = useState('Best Match');
  const [isAiMatching, setIsAiMatching] = useState(false);
  const [allTeammatesList, setAllTeammatesList] = useState([]);
  const [loading, setLoading] = useState(true);

  // Connection Lifecycle State
  const [connectionsData, setConnectionsData] = useState({
    accepted: [],
    incomingPending: [],
    outgoingPending: []
  });
  const [actionLoadingId, setActionLoadingId] = useState(null);

  const engineeringBranches = [
    'Computer Science & Engineering (CSE)',
    'Information Technology (IT)',
    'Artificial Intelligence & Data Science (AI & DS)',
    'Electronics & Communication (ECE)',
    'Electrical & Electronics (EEE)',
    'Mechanical Engineering (ME)',
    'Civil Engineering (CE)',
    'Aerospace & Aeronautical Engineering',
    'Biotechnology & Biomedical',
    'Chemical & Materials Engineering',
    'Business Admin & Management',
    'Digital Media & UI/UX Design'
  ];

  // Fetch all connections for logged in user
  const fetchConnections = async () => {
    const myEmail = (userProfile?.email || (typeof window !== 'undefined' ? JSON.parse(localStorage.getItem('unicollab_user') || '{}').email : '') || '').toLowerCase().trim();
    const myId = userProfile?.id || (typeof window !== 'undefined' ? JSON.parse(localStorage.getItem('unicollab_user') || '{}').id : '');

    try {
      const res = await apiClient.getConnections(myEmail, myId);
      if (res && res.success) {
        setConnectionsData({
          accepted: res.connections || [],
          incomingPending: res.incomingPending || [],
          outgoingPending: res.outgoingPending || []
        });
      }
    } catch (e) {
      console.warn('Failed to fetch connections:', e);
    }
  };

  // Dynamically load all registered students across API, Database, and Local storage, strictly excluding the logged in student
  const loadRegisteredTeammates = async () => {
    setLoading(true);
    let apiUsers = [];
    const myEmail = (userProfile?.email || (typeof window !== 'undefined' ? JSON.parse(localStorage.getItem('unicollab_user') || '{}').email : '') || '').toLowerCase().trim();
    const myId = userProfile?.id || (typeof window !== 'undefined' ? JSON.parse(localStorage.getItem('unicollab_user') || '{}').id : '');
    const myName = (userProfile?.name || (typeof window !== 'undefined' ? JSON.parse(localStorage.getItem('unicollab_user') || '{}').name : '') || '').toLowerCase().trim();

    try {
      // 1. Fetch from Teammates API (Server-side excluded database records)
      const res = await apiClient.getTeammates('', '', '', myEmail, myId);
      if (res.success && Array.isArray(res.teammates)) {
        apiUsers = [...apiUsers, ...res.teammates];
      }
    } catch (e) {
      console.warn('API teammates fetch notice:', e);
    }

    try {
      // 2. Fetch from Admin Users API (persisted registered database records)
      const adminRes = await apiClient.getAdminUsers();
      if (adminRes.success && Array.isArray(adminRes.users)) {
        apiUsers = [...apiUsers, ...adminRes.users];
      }
    } catch (e) {
      console.warn('Admin users fetch notice:', e);
    }

    // 3. Merge with local storage registered users
    const cachedUsers = typeof window !== 'undefined' ? JSON.parse(localStorage.getItem('unicollab_registered_users') || '[]') : [];
    const allCombined = [...apiUsers, ...cachedUsers];

    // Deduplicate by email
    const uniqueMap = new Map();
    allCombined.forEach(u => {
      if (u && (u.email || u.name)) {
        const emailKey = (u.email || u.name).toLowerCase().trim();
        if (!uniqueMap.has(emailKey)) {
          uniqueMap.set(emailKey, u);
        }
      }
    });

    const uniqueRawUsers = Array.from(uniqueMap.values());

    // Filter out: Current User, Mentors, Admins
    const studentPeers = uniqueRawUsers.filter(u => {
      const uEmail = (u.email || '').toLowerCase().trim();
      const uName = (u.name || u.fullName || '').toLowerCase().trim();
      const uId = u.id;
      const uRole = (u.role || '').toUpperCase();

      // Exclude logged in user
      if (myEmail && uEmail && uEmail === myEmail) return false;
      if (myId && uId && String(uId) === String(myId)) return false;
      if (myName && uName && uName === myName) return false;

      // Exclude Admin & Mentor accounts from teammates (Mentors belong in Mentor Portal)
      if (uRole === 'ADMIN' || uRole === 'MENTOR') return false;

      return true;
    });

    // Transform student peers into Teammate profile cards
    const formattedCards = studentPeers.map((u, i) => {
      const rawEmail = (u.email || '').toLowerCase().trim();
      const emailPrefix = rawEmail.split('@')[0] || 'student';
      const formattedNameFromEmail = emailPrefix
        .replace(/[\._\d]+/g, ' ')
        .trim()
        .split(' ')
        .filter(Boolean)
        .map(w => w.charAt(0).toUpperCase() + w.slice(1))
        .join(' ');

      const userName = (u.name && u.name.trim()) || (u.fullName && u.fullName.trim()) || formattedNameFromEmail || 'Student Developer';
      const rawDegree = u.degree || '';
      const rawMajor = u.major || '';
      
      let userMajor = rawMajor;
      if (!userMajor || userMajor === 'Engineering') {
        userMajor = rawDegree ? rawDegree.replace(/^B\.Tech\s+|^B\.Sc\s+|^M\.Tech\s+\/\s+M\.S\.\s+/i, '').trim() : 'Computer Science & Engineering (CSE)';
      }
      if (!userMajor) userMajor = 'Computer Science & Engineering (CSE)';

      const userUni = u.university || 'Campus Network';
      const userInitials = userName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || 'ST';
      const userDegree = rawDegree && rawDegree !== 'B.Tech' && rawDegree !== 'Industry Professional'
        ? rawDegree
        : `B.Tech ${userMajor}`;

      const skillsList = Array.isArray(u.skills) && u.skills.length > 0
        ? u.skills
        : (userMajor.includes('ECE') || userMajor.includes('Electronics')
            ? ['Embedded Systems', 'VLSI Design', 'IoT', 'MATLAB', 'C++']
            : (userMajor.includes('AI') || userMajor.includes('Data')
                ? ['Python', 'Machine Learning', 'TensorFlow', 'PyTorch', 'Data Science']
                : ['React', 'Node.js', 'Python', 'TypeScript', 'TailwindCSS']));

      return {
        id: u.id || `peer_${i + 1}`,
        email: rawEmail,
        name: userName,
        major: userMajor,
        degree: userDegree,
        year: u.year || '3rd Year',
        rating: 4.8 + (i % 3) * 0.1,
        bio: u.bio || `Student in ${userMajor} at ${userUni}. Passionate about high-impact capstone projects and research.`,
        skills: skillsList,
        projectsCount: u.projectsCount || 4 + (i % 3),
        location: userUni,
        avatarBg: u.avatarBg || '#EFF6FF',
        avatarColor: u.avatarColor || '#2563EB',
        initials: userInitials,
        isNewUser: true
      };
    });

    setAllTeammatesList(formattedCards);
    setLoading(false);
  };

  useEffect(() => {
    loadRegisteredTeammates();
    fetchConnections();

    // Socket.IO real-time connection status listener
    let socket = null;
    try {
      if (typeof window !== 'undefined' && window.io) {
        const socketUrl = window.location.hostname === 'localhost' ? 'http://localhost:5000' : window.location.origin;
        socket = window.io(socketUrl);
        const myEmail = (userProfile?.email || '').toLowerCase().trim();
        if (myEmail) {
          socket.emit('register_user', { email: myEmail, name: userProfile?.name });
        }
        socket.on('connection:request', () => fetchConnections());
        socket.on('connection:accepted', () => fetchConnections());
        socket.on('connection:update', () => fetchConnections());
      }
    } catch (e) {
      console.warn('Socket connection listener notice:', e);
    }

    return () => {
      if (socket) socket.disconnect();
    };
  }, []);

  // Determine Connection Status for each Teammate Card
  const getCandidateConnectionState = (candidate) => {
    const myEmail = (userProfile?.email || (typeof window !== 'undefined' ? JSON.parse(localStorage.getItem('unicollab_user') || '{}').email : '') || '').toLowerCase().trim();
    const myId = userProfile?.id || (typeof window !== 'undefined' ? JSON.parse(localStorage.getItem('unicollab_user') || '{}').id : '');

    const targetEmail = (candidate.email || '').toLowerCase().trim();
    const targetName = (candidate.name || '').toLowerCase().trim();
    const targetId = candidate.id;

    // 1. Check ACCEPTED connections
    const isAccepted = connectionsData.accepted.some(c => {
      const sEmail = (c.senderEmail || '').toLowerCase().trim();
      const rEmail = (c.receiverEmail || '').toLowerCase().trim();
      const sName = (c.senderName || '').toLowerCase().trim();
      const rName = (c.receiverName || '').toLowerCase().trim();

      return (
        (targetEmail && (sEmail === targetEmail || rEmail === targetEmail)) ||
        (targetName && (sName === targetName || rName === targetName)) ||
        (targetId && (c.senderId === targetId || c.receiverId === targetId))
      );
    });
    if (isAccepted) return 'CONNECTED';

    // 2. Check INCOMING pending requests
    const incomingReq = connectionsData.incomingPending.find(c => {
      const sEmail = (c.senderEmail || '').toLowerCase().trim();
      const sName = (c.senderName || '').toLowerCase().trim();
      return (targetEmail && sEmail === targetEmail) || (targetName && sName === targetName) || (targetId && c.senderId === targetId);
    });
    if (incomingReq) return { status: 'PENDING_RECEIVED', reqId: incomingReq.id };

    // 3. Check OUTGOING pending requests
    const isOutgoing = connectionsData.outgoingPending.some(c => {
      const rEmail = (c.receiverEmail || '').toLowerCase().trim();
      const rName = (c.receiverName || '').toLowerCase().trim();
      return (targetEmail && rEmail === targetEmail) || (targetName && rName === targetName) || (targetId && c.receiverId === targetId);
    });
    if (isOutgoing) return 'PENDING_SENT';

    return 'NOT_CONNECTED';
  };

  // Connection Actions
  const handleSendConnection = async (candidate) => {
    const myEmail = (userProfile?.email || (typeof window !== 'undefined' ? JSON.parse(localStorage.getItem('unicollab_user') || '{}').email : '') || '').toLowerCase().trim();
    const myId = userProfile?.id || (typeof window !== 'undefined' ? JSON.parse(localStorage.getItem('unicollab_user') || '{}').id : 'usr_me');
    const myName = userProfile?.name || 'Student';

    const targetEmail = (candidate.email || candidate.id || candidate.name).toLowerCase().trim();
    const cardKey = candidate.id || candidate.email || candidate.name;
    setActionLoadingId(cardKey);

    const res = await apiClient.sendConnectionRequest({
      senderId: myId,
      senderEmail: myEmail,
      senderName: myName,
      receiverId: candidate.id,
      receiverEmail: targetEmail,
      receiverName: candidate.name,
      message: `Hi ${candidate.name}, let's connect and collaborate on capstone projects!`
    });

    setActionLoadingId(null);
    if (res.success) {
      await fetchConnections();
    }
  };

  const handleAcceptConnection = async (candidate, reqId) => {
    const myEmail = (userProfile?.email || (typeof window !== 'undefined' ? JSON.parse(localStorage.getItem('unicollab_user') || '{}').email : '') || '').toLowerCase().trim();
    const myId = userProfile?.id || (typeof window !== 'undefined' ? JSON.parse(localStorage.getItem('unicollab_user') || '{}').id : 'usr_me');

    const targetEmail = (candidate.email || candidate.id || candidate.name).toLowerCase().trim();
    const cardKey = candidate.id || candidate.email || candidate.name;
    setActionLoadingId(cardKey);

    const res = await apiClient.acceptConnection(reqId || 'accept', {
      userEmail: myEmail,
      userId: myId,
      targetEmail,
      targetName: candidate.name
    });

    setActionLoadingId(null);
    if (res.success) {
      await fetchConnections();
    }
  };

  const handleRejectConnection = async (candidate, reqId) => {
    const cardKey = candidate.id || candidate.email || candidate.name;
    setActionLoadingId(cardKey);
    await apiClient.rejectConnection(reqId || 'reject');
    setActionLoadingId(null);
    await fetchConnections();
  };

  const teammates = allTeammatesList;

  // Dynamic Filtering by Search Keyword, Selected Majors, and Selected Skills
  const filteredTeammates = teammates.filter(t => {
    // Search Keyword Filter
    if (searchKeyword.trim()) {
      const q = searchKeyword.toLowerCase().trim();
      const matchesKeyword = 
        t.name.toLowerCase().includes(q) ||
        t.major.toLowerCase().includes(q) ||
        t.bio.toLowerCase().includes(q) ||
        (Array.isArray(t.skills) && t.skills.some(s => s.toLowerCase().includes(q)));
      
      if (!matchesKeyword) return false;
    }

    // Selected Majors Filter
    if (selectedMajors.length > 0) {
      const matchesMajor = selectedMajors.some(m => 
        t.major.toLowerCase().includes(m.toLowerCase()) || m.toLowerCase().includes(t.major.toLowerCase())
      );
      if (!matchesMajor) return false;
    }

    // Selected Skills Filter
    if (selectedSkills.length > 0) {
      const matchesSkill = selectedSkills.some(sk => 
        t.skills.some(s => s.toLowerCase().includes(sk.toLowerCase()))
      );
      if (!matchesSkill) return false;
    }

    return true;
  });

  const sortedTeammates = [...filteredTeammates].sort((a, b) => {
    if (sortBy === 'Highest Rating') return b.rating - a.rating;
    if (sortBy === 'Most Projects') return b.projectsCount - a.projectsCount;
    return a.id - b.id;
  });

  const handleToggleMajor = (major) => {
    setSelectedMajors(prev => 
      prev.includes(major) ? prev.filter(m => m !== major) : [...prev, major]
    );
  };

  const handleToggleSkill = (skill) => {
    setSelectedSkills(prev => 
      prev.includes(skill) ? prev.filter(s => s !== skill) : [...prev, skill]
    );
  };

  return (
    <div className="page-container animate-fade-in">
      <div className="teammates-layout">
        {/* Left Filter Panel ("Refine Search") */}
        <aside className="filter-panel">
          <div className="filter-header flex justify-between align-center">
            <div className="flex align-center gap-2">
              <div className="filter-icon-badge">
                <SlidersHorizontal size={15} />
              </div>
              <h3>Refine Search</h3>
            </div>
            <button 
              className="btn-reset-filter"
              onClick={() => {
                setSearchKeyword('');
                setSelectedMajors([]);
                setSelectedSkills([]);
              }}
            >
              Reset
            </button>
          </div>

          {/* Search Keyword */}
          <div className="filter-section mt-4">
            <label className="filter-label">SEARCH KEYWORD</label>
            <div className="input-with-icon search-pill-filter">
              <Search size={15} className="search-filter-icon" />
              <input 
                type="text" 
                placeholder="Search by name or skill..."
                value={searchKeyword}
                onChange={(e) => setSearchKeyword(e.target.value)}
              />
            </div>
          </div>

          {/* Major / Discipline */}
          <div className="filter-section mt-4">
            <label className="filter-label">MAJOR / ENGINEERING DISCIPLINE</label>
            <div className="checkbox-group">
              {engineeringBranches.map((m) => {
                const isChecked = selectedMajors.includes(m);
                return (
                  <label key={m} className={`custom-checkbox-row ${isChecked ? 'checked' : ''}`}>
                    <input 
                      type="checkbox" 
                      className="custom-checkbox-input"
                      checked={isChecked}
                      onChange={() => handleToggleMajor(m)}
                    />
                    <span className="checkbox-custom-box">
                      {isChecked && <Check size={12} className="check-svg" />}
                    </span>
                    <span className="checkbox-text">{m}</span>
                  </label>
                );
              })}
            </div>
          </div>

          {/* Skills & Expertise */}
          <div className="filter-section mt-4">
            <label className="filter-label">SKILLS & EXPERTISE</label>
            <div className="checkbox-group">
              {['React', 'TypeScript', 'UI Design', 'Python', 'Machine Learning', 'Public Speaking', 'Data Analysis', 'Project Management'].map((s) => {
                const isChecked = selectedSkills.includes(s);
                return (
                  <label key={s} className={`custom-checkbox-row ${isChecked ? 'checked' : ''}`}>
                    <input 
                      type="checkbox" 
                      className="custom-checkbox-input"
                      checked={isChecked}
                      onChange={() => handleToggleSkill(s)}
                    />
                    <span className="checkbox-custom-box">
                      {isChecked && <Check size={12} className="check-svg" />}
                    </span>
                    <span className="checkbox-text">{s}</span>
                  </label>
                );
              })}
            </div>
          </div>

          {/* Availability */}
          <div className="filter-section mt-4">
            <label className="filter-label">AVAILABILITY STATUS</label>
            <div className="availability-options flex flex-col gap-2">
              <label className="custom-radio-row">
                <input type="radio" name="avail" defaultChecked className="custom-radio-input" />
                <span className="radio-custom-dot"></span>
                <span className="radio-text">High Availability</span>
              </label>
              <label className="custom-radio-row">
                <input type="radio" name="avail" className="custom-radio-input" />
                <span className="radio-custom-dot"></span>
                <span className="radio-text">Open to Invites</span>
                <span className="dot-indicator green"></span>
              </label>
              <label className="custom-radio-row">
                <input type="radio" name="avail" className="custom-radio-input" />
                <span className="radio-custom-dot"></span>
                <span className="radio-text">Low Availability</span>
                <span className="dot-indicator grey"></span>
              </label>
            </div>
          </div>
        </aside>

        {/* Main Content Area */}
        <main className="teammates-main">
          <div className="teammates-header">
            <div>
              <h2>Find Potential Teammates</h2>
              <p className="subtext">Discover {sortedTeammates.length} registered students matching your criteria</p>
            </div>
            <div className="sort-dropdown flex align-center gap-2">
              <button 
                className="btn-secondary btn-header-action" 
                onClick={async () => {
                  if (typeof window !== 'undefined') {
                    localStorage.removeItem('unicollab_registered_users');
                  }
                  await loadRegisteredTeammates();
                }}
                style={{ padding: '6px 12px', fontSize: '12px', borderRadius: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}
                title="Re-fetch teammates list from database"
              >
                <span>Refresh</span>
              </button>
              <span className="text-xs text-muted font-bold">Sort by:</span>
              <div className="custom-sort-btn-wrapper">
                <select 
                  className="custom-sort-btn"
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                >
                  <option value="Best Match">🎯 Best Match</option>
                  <option value="Highest Rating">⭐ Highest Rating</option>
                  <option value="Most Projects">💼 Most Projects</option>
                </select>
              </div>
            </div>
          </div>

          {/* Teammate Cards Grid / Loading / Empty State */}
          {loading ? (
            <div className="empty-state-box p-8 text-center" style={{ padding: '48px 24px', textAlign: 'center', background: 'var(--surface-color, #F8FAFC)', borderRadius: '16px', border: '1px dashed #CBD5E1', margin: '24px 0' }}>
              <div className="spinner" style={{ margin: '0 auto 16px', width: '32px', height: '32px', border: '3px solid #E2E8F0', borderTopColor: '#2563EB', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
              <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#64748B' }}>Loading registered student teammates...</h3>
            </div>
          ) : sortedTeammates.length === 0 ? (
            <div className="empty-state-box p-8 text-center" style={{ padding: '48px 24px', textAlign: 'center', background: 'var(--surface-color, #F8FAFC)', borderRadius: '16px', border: '1px dashed #CBD5E1', margin: '24px 0' }}>
              <GraduationCap size={44} style={{ margin: '0 auto 12px', color: '#3B82F6' }} />
              <h3 style={{ fontSize: '18px', fontWeight: 800 }}>No other teammates found yet</h3>
              <p style={{ fontSize: '13px', color: '#64748B', margin: '4px 0 16px' }}>
                No other teammates found yet — invite your classmates to join!
              </p>
              <button className="btn-primary" onClick={() => { setSearchKeyword(''); setSelectedMajors([]); setSelectedSkills([]); }}>
                Reset All Filters
              </button>
            </div>
          ) : (
            <div className="teammates-grid">
              {sortedTeammates.map((tm, idx) => (
              <div key={tm.id} className="teammate-card">
                <div className="card-top-row">
                  <div className="avatar-wrapper">
                    <div className="tm-avatar-circle">
                      <div className="avatar-head"></div>
                      <div className="avatar-body"></div>
                    </div>
                    <span className={`status-dot ${idx % 3 === 0 ? 'orange' : idx % 3 === 1 ? 'yellow' : 'green'}`}></span>
                  </div>
                  <span className="card-rating-text">{tm.rating}</span>
                </div>

                <h3 className="tm-name">{tm.name}</h3>
                <p className="tm-dept">
                  <GraduationCap size={13} className="inline-icon" /> {tm.major} • {tm.year}
                </p>
                <p className="tm-bio">{tm.bio}</p>

                <div className="tm-skills-label">CORE SKILLS</div>
                <div className="tm-skill-pills">
                  {tm.skills.map((sk, i) => (
                    <span key={i} className="skill-pill">{sk}</span>
                  ))}
                  <span className="skill-pill muted">+1 more</span>
                </div>

                <div className="tm-meta-row">
                  <span><Briefcase size={13} /> {tm.projectsCount} Projects</span>
                  <span><MapPin size={13} /> {tm.location}</span>
                </div>

                <div className="tm-actions-row" style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '16px' }}>
                  {(() => {
                    const connState = getCandidateConnectionState(tm);
                    const cardKey = tm.id || tm.email || tm.name;
                    const isBusy = actionLoadingId === cardKey;

                    if (connState === 'CONNECTED') {
                      return (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', width: '100%' }}>
                          <button 
                            className="btn-card-message" 
                            style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', background: '#2563EB', color: 'white', fontWeight: 800 }}
                            onClick={() => {
                              if (onOpenChat) {
                                onOpenChat(tm);
                              }
                            }}
                          >
                            <MessageSquare size={14} />
                            Message
                          </button>
                          <span style={{ background: '#DEF7EC', color: '#03543F', padding: '6px 10px', borderRadius: '8px', fontSize: '11px', fontWeight: 800, border: '1px solid #BCF0DA', display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <Check size={12} /> Connected
                          </span>
                        </div>
                      );
                    }

                    if (connState === 'PENDING_SENT') {
                      return (
                        <button 
                          className="btn-card-invite invited" 
                          disabled 
                          style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', background: '#FEF3C7', color: '#D97706', border: '1px solid #FDE68A', fontWeight: 800 }}
                        >
                          <Clock size={13} />
                          Request Pending...
                        </button>
                      );
                    }

                    if (typeof connState === 'object' && connState.status === 'PENDING_RECEIVED') {
                      return (
                        <div style={{ display: 'flex', gap: '6px', width: '100%' }}>
                          <button 
                            className="btn-primary" 
                            onClick={() => handleAcceptConnection(tm, connState.reqId)}
                            disabled={isBusy}
                            style={{ flex: 1, padding: '7px 10px', fontSize: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px', fontWeight: 800 }}
                          >
                            <Check size={13} /> {isBusy ? '...' : 'Accept Request'}
                          </button>
                          <button 
                            className="btn-secondary" 
                            onClick={() => handleRejectConnection(tm, connState.reqId)}
                            disabled={isBusy}
                            style={{ padding: '7px 10px', fontSize: '12px' }}
                            title="Decline"
                          >
                            ✕
                          </button>
                        </div>
                      );
                    }

                    return (
                      <button 
                        className="btn-primary" 
                        onClick={() => handleSendConnection(tm)}
                        disabled={isBusy}
                        style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', padding: '8px 14px', borderRadius: '10px', fontWeight: 800, fontSize: '13px' }}
                      >
                        <UserPlus size={14} />
                        {isBusy ? 'Connecting...' : 'Connect'}
                      </button>
                    );
                  })()}
                </div>
              </div>
            ))}
          </div>
        )}

          {/* Suggested by AI Section */}
          <div className="suggested-ai-section mt-8">
            <h3 className="section-title-sm">Suggested by AI</h3>
            
            <div className="ai-matchmaker-card mt-3">
              <div className="matchmaker-header">
                <div className="matchmaker-icon-box">
                  <Star size={16} className="text-blue" />
                </div>
                <div className="matchmaker-titles">
                  <h4>Matchmaker</h4>
                  <span className="sub-insight">Insight</span>
                  <p className="subtitle-muted">Based on your recent project</p>
                </div>
                <span className="matchmaker-percent-badge">88% Match</span>
              </div>

              <p className="matchmaker-quote mt-3">
                "You're missing a UI/UX designer for your Mobile App project. Marcus Johnson has high availability and matching design skills."
              </p>

              <button className="btn-matchmaker-analysis mt-4" onClick={() => alert('Opening AI Matchmaker Analysis...')}>
                View Analysis
              </button>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
