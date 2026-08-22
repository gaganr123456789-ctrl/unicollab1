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
      title: 'Senior AI Research Lead',
      university: 'Stanford University',
      rating: 4.9,
      reviews: 124,
      category: 'Computer Science',
      nextAvailable: 'Tomorrow, 2:00 PM',
      bio: 'Pioneer in Transformer architecture and deep learning applications. Guiding students in AI ethics and model deployment.',
      avatarBg: '#EFF6FF',
      avatarColor: '#2563EB',
      initials: 'AS'
    },
    {
      id: 2,
      name: 'Prof. Rajesh Verma',
      title: 'UX Design Director',
      university: 'RISD Alumni',
      rating: 4.8,
      reviews: 89,
      category: 'Design',
      nextAvailable: 'Friday, 10:00 AM',
      bio: 'Product designer with 10+ years shaping top consumer apps. Specializing in UI design systems and user research.',
      avatarBg: '#F3E8FF',
      avatarColor: '#7C3AED',
      initials: 'RV'
    },
    {
      id: 3,
      name: 'Priya Nair',
      title: 'Full Stack Architect',
      university: 'MIT',
      rating: 5.0,
      reviews: 56,
      category: 'Engineering',
      nextAvailable: 'Monday, 9:00 AM',
      bio: 'Cloud architecture expert and open-source contributor. Mentoring on microservices, GraphQL, and scalable web apps.',
      avatarBg: '#ECFDF5',
      avatarColor: '#059669',
      initials: 'PN'
    },
    {
      id: 4,
      name: 'Dr. Vikramaditya Kulkarni',
      title: 'Data Science Consultant',
      university: 'Oxford University',
      rating: 4.7,
      reviews: 210,
      category: 'Mathematics',
      nextAvailable: 'Oct 15, 11:30 AM',
      bio: 'Statistical computing advisor helping university research labs analyze complex datasets and prepare publication papers.',
      avatarBg: '#FEF3C7',
      avatarColor: '#D97706',
      initials: 'VK'
    }
  ];

  const fetchLiveMentors = async () => {
    setLoading(true);
    try {
      const res = await apiClient.getMentors();
      if (res.success && Array.isArray(res.mentors) && res.mentors.length > 0) {
        const formatted = res.mentors.map((m, i) => ({
          id: m.id || i + 1,
          name: m.name || 'Academic Mentor',
          title: m.role || m.title || 'Senior Advisor',
          university: m.company || m.university || 'University Faculty',
          rating: m.rating || 4.9,
          reviews: m.reviews || 40 + i * 5,
          category: m.major || m.category || 'Computer Science',
          nextAvailable: m.availability || m.nextAvailable || 'Tomorrow, 2:00 PM',
          bio: m.bio || 'Experienced academic mentor guiding capstone projects and research.',
          avatarBg: m.avatarBg || '#EFF6FF',
          avatarColor: m.avatarColor || '#2563EB',
          initials: (m.name || 'AM').split(' ').map(n => n[0]).join('').slice(0, 2)
        }));
        setMentorsList(formatted);
      } else {
        setMentorsList(defaultMentors);
      }
    } catch (err) {
      setMentorsList(defaultMentors);
    } finally {
      setLoading(false);
    }
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
