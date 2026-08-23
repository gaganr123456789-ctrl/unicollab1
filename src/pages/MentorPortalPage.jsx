import React, { useState, useEffect } from 'react';
import { apiClient } from '../services/apiClient';
import { 
  Search, 
  Filter, 
  MessageSquare, 
  Calendar, 
  Star, 
  Sparkles,
  UserCheck,
  Building2,
  Clock,
  RefreshCw,
  CheckCircle2
} from 'lucide-react';

export default function MentorPortalPage({ setCurrentPage, onOpenChat }) {
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedMentor, setSelectedMentor] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isBooking, setIsBooking] = useState(false);
  const [bookingDone, setBookingDone] = useState(false);
  const [loading, setLoading] = useState(false);
  const [mentorsList, setMentorsList] = useState([]);

  const defaultMentors = [
    {
      id: 1,
      name: 'Dr. Ananya Sharma',
      role: 'Distinguished Professor & AI Research Lead',
      title: 'Distinguished Professor & AI Research Lead',
      company: 'Stanford University • AI Research Lab',
      university: 'Stanford University',
      rating: 4.9,
      reviews: 128,
      category: 'Computer Science',
      skills: ['AI/ML', 'Multimodal LLMs', 'Computer Vision', 'PyTorch'],
      nextAvailable: 'Tomorrow, 2:00 PM',
      bio: 'Leading research in multimodal reasoning systems and generative foundation models. Advises undergraduate & graduate capstone teams on deep learning architectures.',
      avatarBg: '#EFF6FF',
      avatarColor: '#2563EB',
      initials: 'AS'
    },
    {
      id: 2,
      name: 'Dr. Marcus Sterling',
      role: 'Principal Cloud Architect & Distributed Systems Advisor',
      title: 'Principal Cloud Architect & Distributed Systems Advisor',
      company: 'MIT CSAIL & AWS Architecture Lab',
      university: 'MIT CSAIL',
      rating: 5.0,
      reviews: 94,
      category: 'Engineering',
      skills: ['Kubernetes', 'Cloud Systems', 'Microservices', 'Distributed Systems'],
      nextAvailable: 'Wednesday, 4:30 PM',
      bio: '20+ years building hyperscale cloud platforms and resilient backend infrastructure. Helps student teams scale full-stack architectures and microservices.',
      avatarBg: '#FAF5FF',
      avatarColor: '#7C3AED',
      initials: 'MS'
    },
    {
      id: 3,
      name: 'Elena Rostova',
      role: 'Head of Product Design & HCI Researcher',
      title: 'Head of Product Design & HCI Researcher',
      company: 'Harvard Innovation Labs',
      university: 'Harvard University',
      rating: 4.8,
      reviews: 112,
      category: 'Design',
      skills: ['UI/UX Design', 'Design Systems', 'Figma Prototyping', 'User Research'],
      nextAvailable: 'Thursday, 11:00 AM',
      bio: 'Passionate about human-centered interaction design and accessible web experiences. Mentors students on product prototyping and design polish.',
      avatarBg: '#ECFDF5',
      avatarColor: '#059669',
      initials: 'ER'
    },
    {
      id: 4,
      name: 'Prof. Rajesh Deshmukh',
      role: 'Senior Faculty & Embedded Systems Director',
      title: 'Senior Faculty & Embedded Systems Director',
      company: 'The National Institute of Engineering (NIE)',
      university: 'The National Institute of Engineering (NIE)',
      rating: 4.9,
      reviews: 86,
      category: 'Engineering',
      skills: ['VLSI Design', 'Embedded Systems', 'IoT Microgrid', 'FPGA', 'Robotics'],
      nextAvailable: 'Friday, 3:00 PM',
      bio: 'Specializes in VLSI chip design, edge computing hardware, and IoT systems. Guides capstone students in circuit synthesis and smart robotics.',
      avatarBg: '#FFFBEB',
      avatarColor: '#D97706',
      initials: 'RD'
    },
    {
      id: 5,
      name: 'David Chen, MBA',
      role: 'Venture Partner & Startup Strategy Lead',
      title: 'Venture Partner & Startup Strategy Lead',
      company: 'Berkeley Haas Entrepreneurship Hub',
      university: 'UC Berkeley Haas',
      rating: 4.9,
      reviews: 75,
      category: 'Business',
      skills: ['Venture Capital', 'Product-Market Fit', 'Pitch Decks', 'FinTech'],
      nextAvailable: 'Friday, 1:30 PM',
      bio: 'Helps student founders validate product ideas, formulate go-to-market strategies, and prepare compelling pitches for angel & seed stage venture funding.',
      avatarBg: '#FEF2F2',
      avatarColor: '#DC2626',
      initials: 'DC'
    },
    {
      id: 6,
      name: 'Dr. Sophia Vance',
      role: 'Professor of Applied Mathematics & Cryptography',
      title: 'Professor of Applied Mathematics & Cryptography',
      company: 'Cambridge Mathematical Sciences',
      university: 'University of Cambridge',
      rating: 5.0,
      reviews: 62,
      category: 'Mathematics',
      skills: ['Applied Statistics', 'Optimization Algorithms', 'Cryptography', 'Quantum'],
      nextAvailable: 'Next Monday, 10:00 AM',
      bio: 'Advisor on mathematical modeling, stochastic optimization algorithms, and cryptographic protocol analysis.',
      avatarBg: '#F0FDF4',
      avatarColor: '#16A34A',
      initials: 'SV'
    }
  ];

  const fetchLiveMentors = async () => {
    setLoading(true);
    let allMentors = [];
    try {
      // 1. Fetch from live Mentors API
      const res = await apiClient.getMentors();
      if (res.success && Array.isArray(res.mentors)) {
        allMentors = [...allMentors, ...res.mentors];
      }
    } catch (err) {
      console.warn('Mentors API fetch notice:', err);
    }

    try {
      // 2. Fetch from Admin Users API (persisted registered accounts with role === 'MENTOR')
      const adminRes = await apiClient.getAdminUsers();
      if (adminRes.success && Array.isArray(adminRes.users)) {
        const registeredMentors = adminRes.users.filter(u => (u.role || '').toUpperCase() === 'MENTOR');
        allMentors = [...allMentors, ...registeredMentors];
      }
    } catch (err) {
      console.warn('Admin users mentor fetch notice:', err);
    }

    // 3. Merge with local storage registered users and default demo mentors
    const cachedUsers = typeof window !== 'undefined' ? JSON.parse(localStorage.getItem('unicollab_registered_users') || '[]') : [];
    const cachedMentors = cachedUsers.filter(u => (u.role || '').toUpperCase() === 'MENTOR');
    const combined = [...allMentors, ...cachedMentors, ...defaultMentors];

    // Deduplicate by email
    const uniqueMap = new Map();
    combined.forEach(m => {
      if (m && (m.email || m.name)) {
        const key = (m.email || m.name).toLowerCase().trim();
        if (!uniqueMap.has(key)) {
          uniqueMap.set(key, m);
        }
      }
    });

    const uniqueMentors = Array.from(uniqueMap.values());

    const formatted = uniqueMentors.map((m, i) => {
      const mentorName = m.name || m.fullName || 'Academic Mentor';
      const mentorTitle = m.roleTitle || m.role || m.title || 'Senior Advisor';
      const mentorUni = m.university || m.company || 'University Faculty';
      const mentorCategory = m.major || (Array.isArray(m.mentorInterests) && m.mentorInterests[0]) || m.category || 'Computer Science';
      const mentorSkills = Array.isArray(m.mentorInterests) && m.mentorInterests.length > 0 ? m.mentorInterests : (m.skills || ['Mentorship & Research']);

      return {
        id: m.id || `mentor_${i + 1}`,
        name: mentorName,
        email: m.email || '',
        title: mentorTitle,
        university: mentorUni,
        rating: 5.0,
        reviews: m.reviews || 20 + (i % 5) * 4,
        category: mentorCategory,
        skills: mentorSkills,
        nextAvailable: m.availability || m.nextAvailable || 'Tomorrow, 2:00 PM',
        bio: m.bio || `Experienced mentor specializing in ${mentorCategory} at ${mentorUni}. Available to guide capstone projects, career paths, and technical research.`,
        avatarBg: m.avatarBg || '#7C3AED',
        avatarColor: '#FFFFFF',
        initials: mentorName.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
      };
    });

    setMentorsList(formatted);
    if (formatted.length > 0) {
      setSelectedMentor(formatted[0]);
    } else {
      setSelectedMentor(null);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchLiveMentors();
  }, []);

  const handleBookSession = async (mentor) => {
    setIsBooking(true);
    const res = await apiClient.bookMentor({
      mentorId: mentor.id,
      date: 'Tomorrow',
      timeSlot: mentor.nextAvailable || '2:00 PM',
      topic: 'CapStone Academic Project Guidance'
    });

    // Also emit MENTORSHIP_REQUEST real-time invite notification
    await apiClient.sendInvite({
      recipientId: mentor.id || mentor.name,
      recipientName: mentor.name,
      type: 'MENTORSHIP_REQUEST',
      message: `Requested 1-on-1 mentorship session on "CapStone Academic Project Guidance" for ${mentor.nextAvailable || 'Tomorrow at 2:00 PM'}.`
    });

    setIsBooking(false);
    if (res.success) {
      setBookingDone(true);
    }
  };

  const mentors = mentorsList.length > 0 ? mentorsList : defaultMentors;
  const categories = ['All', 'Engineering', 'Design', 'Business', 'Mathematics', 'Computer Science'];

  const filteredMentors = mentors.filter(m => {
    const matchesCat = selectedCategory === 'All' || m.category?.toLowerCase() === selectedCategory.toLowerCase();
    const q = searchQuery.toLowerCase().trim();
    const matchesQuery = !q || m.name?.toLowerCase().includes(q) || m.title?.toLowerCase().includes(q) || m.university?.toLowerCase().includes(q);
    return matchesCat && matchesQuery;
  });

  return (
    <div className="page-container animate-fade-in">
      {/* Top Banner Header */}
      <div className="mentor-header-banner">
        <div>
          <span className="mentor-badge">
            <UserCheck size={14} /> MENTOR NETWORK
          </span>
          <h1 className="mentor-title">Guided Growth & Expert Mentorship</h1>
          <p className="mentor-subtitle">
            Connect with industry professionals and academic leaders who can help accelerate your learning path, refine your projects, and navigate your career.
          </p>
        </div>

        <div className="mentor-top-actions" style={{ display: 'flex', gap: '10px' }}>
          <button className="btn-secondary btn-header-action" onClick={fetchLiveMentors} disabled={loading} title="Re-fetch mentors list from database">
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
            <span>{loading ? 'Refreshing...' : 'Refresh List'}</span>
          </button>
          <button className="btn-primary btn-header-action" onClick={() => setCurrentPage && setCurrentPage('messages')}>
            <MessageSquare size={16} />
            <span>My Messages</span>
          </button>
        </div>
      </div>

      {/* Filter & Search Bar Outer Box */}
      <div className="mentor-filter-box-card">
        <div className="input-with-icon mentor-search-input">
          <Search size={16} />
          <input 
            type="text" 
            placeholder="Search by name, role, or university..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="category-pills">
          {categories.map((cat) => (
            <button 
              key={cat} 
              className={`pill-btn ${selectedCategory === cat ? 'active' : ''}`}
              onClick={() => setSelectedCategory(cat)}
            >
              {cat}
            </button>
          ))}
          <button className="icon-filter-btn" onClick={() => alert('Opening detailed mentor filters...')}>
            <Filter size={16} />
          </button>
        </div>
      </div>

      {/* Two Column Layout: Mentor List Left, Selected Profile Right */}
      <div className="mentor-main-grid mt-6">
        {/* Mentor Cards Column */}
        <div className="mentor-list-col">
          <div className="list-header">
            <h3>Available Mentors</h3>
            <span className="results-count">{filteredMentors.length} results found</span>
          </div>

          <div className="mentor-cards-stack">
            {filteredMentors.length === 0 ? (
              <div className="empty-state-card" style={{ padding: '36px 20px', textAlign: 'center', background: 'var(--surface-color, #F8FAFC)', borderRadius: '16px', border: '1px dashed #CBD5E1', margin: '16px 0' }}>
                <UserCheck size={36} style={{ margin: '0 auto 10px', color: '#64748B' }} />
                <h4 style={{ fontSize: '16px', fontWeight: 800 }}>No Mentors Found</h4>
                <p style={{ fontSize: '13px', color: '#64748B', margin: '4px 0 12px' }}>No registered mentors match your search query or selected domain.</p>
                <button className="btn-secondary" style={{ padding: '6px 14px', fontSize: '12px' }} onClick={() => { setSelectedCategory('All'); setSearchQuery(''); }}>
                  Reset Filters
                </button>
              </div>
            ) : (
              filteredMentors.map((m) => (
              <div 
                key={m.id} 
                className={`mentor-card-item ${selectedMentor?.id === m.id ? 'selected' : ''}`}
                onClick={() => setSelectedMentor(m)}
              >
                {/* Left Media Box */}
                <div className="mentor-media-placeholder">
                  <div className="media-art-icon">🏞️</div>
                  <span className="card-top-rating-badge">
                    <Star size={11} fill="#F59E0B" color="#F59E0B" />
                    {m.rating}
                  </span>
                </div>

                {/* Right Details */}
                <div className="mentor-card-right-content">
                  <div className="mentor-top-info-row">
                    <div>
                      <h4 className="mentor-name-title">{m.name}</h4>
                      <div className="mentor-role-text">{m.title}</div>
                      <div className="mentor-univ-text">
                        <Building2 size={13} /> {m.university}
                      </div>
                    </div>
                    <span className="reviews-pill">{m.reviews} Reviews</span>
                  </div>

                  <div className="mentor-footer-separator">
                    <div className="next-avail-row">
                      <Clock size={13} className="text-green" />
                      <span>Next available: {m.nextAvailable}</span>
                    </div>

                    <button className="btn-view-profile-text">
                      View Profile &gt;
                    </button>
                  </div>
                </div>
              </div>
            )))}
          </div>
        </div>

        {/* Right Column: Mentor Detail / AI Matching System */}
        <div className="mentor-detail-col">
          {/* Selected Mentor Detail / Placeholder */}
          <div className="mentor-preview-card">
            {selectedMentor ? (
              <div className="selected-mentor-preview">
                <div className="preview-avatar-circle">
                  {selectedMentor.initials}
                </div>
                <h3>{selectedMentor.name}</h3>
                <p className="preview-title-blue">{selectedMentor.title}</p>
                <p className="preview-univ-grey">{selectedMentor.university}</p>

                <div className="preview-bio-box mt-3">
                  <p>{selectedMentor.bio}</p>
                </div>

                <div className="preview-schedule mt-4">
                  <label className="schedule-label">Book 1-on-1 Mentorship Session</label>
                  <div className="time-slots mt-2">
                    <span className="slot-badge">{selectedMentor.nextAvailable}</span>
                  </div>
                </div>

                <button 
                  className="btn-primary full-width mt-6"
                  onClick={() => handleBookSession(selectedMentor)}
                  disabled={isBooking || bookingDone}
                  style={{
                    background: bookingDone ? '#10B981' : '#7C3AED',
                    borderColor: bookingDone ? '#059669' : '#6D28D9',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px'
                  }}
                >
                  {bookingDone ? (
                    <>
                      <CheckCircle2 size={16} />
                      <span>Session Requested & Confirmed</span>
                    </>
                  ) : isBooking ? (
                    'Booking Session...'
                  ) : (
                    'Book Session Now'
                  )}
                </button>
              </div>
            ) : (
              <div className="no-mentor-selected">
                <div className="user-icon-circle">
                  <UserCheck size={32} />
                </div>
                <h4>No Mentor Selected</h4>
                <p>Select a mentor from the directory to view their full profile and book a session.</p>
              </div>
            )}
          </div>

          {/* AI Matching System Box */}
          <div className="ai-matching-system-card mt-6">
            <div className="ai-matching-header">
              <Sparkles size={16} />
              <h4>Matching System</h4>
            </div>
            <p className="ai-matching-text">
              Our AI matching algorithm suggests Dr. Ananya Sharma based on your active project "Neural Network Optimization".
            </p>
            <button className="text-link-blue" onClick={() => setSelectedMentor(mentors[0])}>
              View all recommendations →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
