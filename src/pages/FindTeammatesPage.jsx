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
  Sparkles
} from 'lucide-react';

export default function FindTeammatesPage({ onOpenChat, userProfile }) {
  const [searchKeyword, setSearchKeyword] = useState('');
  const [selectedMajors, setSelectedMajors] = useState([]);
  const [selectedSkills, setSelectedSkills] = useState([]);
  const [sortBy, setSortBy] = useState('Best Match');
  const [isAiMatching, setIsAiMatching] = useState(false);
  const [allTeammatesList, setAllTeammatesList] = useState([]);
  const [pendingInvites, setPendingInvites] = useState([]);
  const [invitingId, setInvitingId] = useState(null);
  const [loading, setLoading] = useState(true);

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
        id: u.id || `reg_user_${i}`,
        name: userName,
        email: u.email || '',
        rating: (4.8 + (i % 3) * 0.1).toFixed(1),
        major: userMajor,
        degree: userDegree,
        year: u.year || 'Senior',
        bio: u.bio || `Passionate student specializing in ${userMajor} at ${userUni}. Open to project collaborations and hackathon teams.`,
        skills: skillsList,
        projectsCount: u.projectsCount || 5 + (i % 4),
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

    // Fetch sent pending invites
    const fetchSentInvites = async () => {
      try {
        const res = await apiClient.getSentInvites();
        if (res.success && Array.isArray(res.pendingRecipients)) {
          setPendingInvites(res.pendingRecipients);
        }
      } catch (e) {
        console.warn('Failed to load sent invites', e);
      }
    };
    fetchSentInvites();
  }, []);

  const handleSendInvite = async (candidate) => {
    const candidateId = candidate.id || candidate.name;
    setInvitingId(candidateId);

    const res = await apiClient.sendInvite({
      recipientId: candidateId,
      recipientName: candidate.name,
      type: 'TEAM_INVITE',
      message: `Hi ${candidate.name}, I would love to collaborate with you on a capstone project!`
    });

    setInvitingId(null);

    if (res.success) {
      setPendingInvites(prev => Array.from(new Set([...prev, candidateId])));
    } else {
      if (res.message && res.message.includes('already pending')) {
        setPendingInvites(prev => Array.from(new Set([...prev, candidateId])));
      }
    }
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

                <div className="tm-actions-row">
                  <button 
                    className="btn-card-message" 
                    onClick={() => {
                      if (onOpenChat) {
                        onOpenChat(tm);
                      }
                    }}
                  >
                    <MessageSquare size={13} />
                    Message
                  </button>
                  {pendingInvites.includes(tm.id || tm.name) ? (
                    <button className="btn-card-invite invited" disabled style={{ background: '#ECFDF5', color: '#059669', border: '1px solid #A7F3D0', fontWeight: 800 }}>
                      <Check size={13} />
                      Invited
                    </button>
                  ) : (
                    <button 
                      className="btn-card-invite" 
                      onClick={() => handleSendInvite(tm)}
                      disabled={invitingId === (tm.id || tm.name)}
                    >
                      <UserPlus size={13} />
                      {invitingId === (tm.id || tm.name) ? 'Sending...' : 'Invite'}
                    </button>
                  )}
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
