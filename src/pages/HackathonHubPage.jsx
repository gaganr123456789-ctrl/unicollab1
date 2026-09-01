import React, { useState, useEffect } from 'react';
import HackathonRegisterModal from '../components/HackathonRegisterModal';
import { 
  Trophy, 
  Calendar, 
  MapPin, 
  Users, 
  Globe, 
  Share2, 
  CheckCircle2, 
  ChevronRight,
  Target,
  UserPlus,
  Zap,
  ShieldCheck,
  User,
  Search,
  ExternalLink,
  Clock,
  Sparkles,
  Info,
  X,
  Award
} from 'lucide-react';
import { apiClient } from '../services/apiClient';

export default function HackathonHubPage({ setCurrentPage, userProfile, theme }) {
  const [hackathons, setHackathons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDomain, setSelectedDomain] = useState('ALL');
  
  // Modals & Active hackathon
  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false);
  const [selectedHackathonForReg, setSelectedHackathonForReg] = useState(null);
  const [detailsModalHackathon, setDetailsModalHackathon] = useState(null);
  const [registeredDataMap, setRegisteredDataMap] = useState({});

  // Countdown timer for featured event
  const [countdown, setCountdown] = useState({ days: 4, hours: 12, mins: 45, secs: 29 });

  const fetchHackathonsList = async () => {
    try {
      setLoading(true);
      const res = await apiClient.getHackathons();
      if (res && res.success && Array.isArray(res.hackathons)) {
        // Filter out drafts or deleted hackathons - only show published
        const publishedOnly = res.hackathons.filter(h => h.status === 'published' || !h.status);
        setHackathons(publishedOnly);
      }
    } catch (e) {
      console.warn('Failed to load published hackathons:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHackathonsList();

    // Check cached registrations to show "Registered" badge
    if (typeof window !== 'undefined') {
      const cached = JSON.parse(localStorage.getItem('unicollab_hackathon_registrations') || '[]');
      const regMap = {};
      cached.forEach(r => {
        if (r.hackathonTitle) regMap[r.hackathonTitle] = r;
        if (r.hackathonId) regMap[r.hackathonId] = r;
      });
      setRegisteredDataMap(regMap);
    }

    const timer = setInterval(() => {
      setCountdown(prev => {
        if (prev.secs > 0) return { ...prev, secs: prev.secs - 1 };
        return { ...prev, secs: 59, mins: prev.mins > 0 ? prev.mins - 1 : 59 };
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const handleRegisterClick = (hackathon) => {
    if (hackathon.registrationLink && hackathon.registrationLink.startsWith('http')) {
      window.open(hackathon.registrationLink, '_blank', 'noopener,noreferrer');
    } else {
      setSelectedHackathonForReg(hackathon);
      setIsRegisterModalOpen(true);
    }
  };

  const handleRegisterSuccess = (data) => {
    if (selectedHackathonForReg) {
      setRegisteredDataMap(prev => ({
        ...prev,
        [selectedHackathonForReg.title || selectedHackathonForReg.name]: data,
        [selectedHackathonForReg.id]: data
      }));
    }
  };

  // Filtered Hackathons
  const filteredHackathons = hackathons.filter(h => {
    if (selectedDomain !== 'ALL') {
      const techArr = Array.isArray(h.technologies) ? h.technologies : String(h.technologies || '').split(',');
      const match = techArr.some(t => t.toLowerCase().includes(selectedDomain.toLowerCase()));
      if (!match) return false;
    }
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase().trim();
    return (
      (h.title && h.title.toLowerCase().includes(q)) ||
      (h.organizer && h.organizer.toLowerCase().includes(q)) ||
      (h.description && h.description.toLowerCase().includes(q)) ||
      (h.location && h.location.toLowerCase().includes(q))
    );
  });

  const featuredHackathon = hackathons[0] || {
    id: '301',
    title: 'Global Student AI Innovation Hackathon 2026',
    organizer: 'Stanford AI Lab & UniCollab Developer Network',
    description: 'Join 1,000+ top developers, designers, and students worldwide to build breakthrough generative AI applications.',
    dateDisplay: 'Nov 15 - 17, 2026',
    deadlineDisplay: 'Nov 10, 2026',
    location: 'Online (Global Virtual)',
    prizePool: '$25,000 USD',
    technologies: ['AI/ML', 'PyTorch', 'React', 'Cloud'],
    bannerUrl: 'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?auto=format&fit=crop&w=1200&q=80'
  };

  const isFeaturedRegistered = !!(registeredDataMap[featuredHackathon.title] || registeredDataMap[featuredHackathon.id]);

  return (
    <div className="page-container animate-fade-in" style={{ paddingBottom: '60px' }}>
      {/* Hackathon Registration Modal */}
      {selectedHackathonForReg && (
        <HackathonRegisterModal
          isOpen={isRegisterModalOpen}
          onClose={() => {
            setIsRegisterModalOpen(false);
            setSelectedHackathonForReg(null);
          }}
          hackathonId={selectedHackathonForReg.id}
          hackathonTitle={selectedHackathonForReg.title || selectedHackathonForReg.name}
          userProfile={userProfile}
          onSuccess={handleRegisterSuccess}
        />
      )}

      {/* Featured Spotlight Banner */}
      <div 
        className="hackathon-hero-banner" 
        style={{
          backgroundImage: `linear-gradient(rgba(15, 23, 42, 0.82), rgba(15, 23, 42, 0.92)), url(${featuredHackathon.bannerUrl || 'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?auto=format&fit=crop&w=1200&q=80'})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          borderRadius: '24px',
          padding: '36px',
          position: 'relative',
          overflow: 'hidden',
          boxShadow: '0 20px 40px rgba(0,0,0,0.2)'
        }}
      >
        <div className="hero-banner-content" style={{ maxWidth: '640px' }}>
          <div className="hero-tags" style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '14px' }}>
            <span className="h-badge blue" style={{ background: '#2563EB', color: '#FFFFFF', padding: '4px 10px', borderRadius: '6px', fontSize: '11px', fontWeight: 800 }}>
              🏆 FEATURED CHALLENGE
            </span>
            <span className="h-badge purple" style={{ background: '#7C3AED', color: '#FFFFFF', padding: '4px 10px', borderRadius: '6px', fontSize: '11px', fontWeight: 800 }}>
              {featuredHackathon.location || 'Online (Global)'}
            </span>
            {isFeaturedRegistered && (
              <span className="h-badge green flex align-center gap-1" style={{ background: '#059669', color: '#FFFFFF', padding: '4px 10px', borderRadius: '6px', fontSize: '11px', fontWeight: 800, display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                <CheckCircle2 size={13} /> REGISTERED
              </span>
            )}
          </div>

          <div style={{ fontSize: '12px', color: '#93C5FD', fontWeight: 700, letterSpacing: '0.5px', textTransform: 'uppercase', marginBottom: '4px' }}>
            {featuredHackathon.organizer}
          </div>

          <h1 className="h-title" style={{ fontSize: '30px', fontWeight: 900, color: '#FFFFFF', margin: '0 0 12px', lineHeight: 1.25 }}>
            {featuredHackathon.title}
          </h1>

          <p className="h-desc" style={{ fontSize: '14px', color: '#CBD5E1', margin: '0 0 20px', lineHeight: 1.5 }}>
            {featuredHackathon.description}
          </p>

          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            <button 
              type="button"
              className={`btn-primary ${isFeaturedRegistered ? 'btn-success-active' : ''}`}
              onClick={() => handleRegisterClick(featuredHackathon)}
              style={{
                background: isFeaturedRegistered ? '#059669' : 'linear-gradient(135deg, #2563EB, #1D4ED8)',
                color: 'white',
                border: 'none',
                padding: '12px 24px',
                borderRadius: '12px',
                fontWeight: 800,
                fontSize: '14px',
                cursor: 'pointer',
                boxShadow: '0 4px 14px rgba(37, 99, 235, 0.4)',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              {isFeaturedRegistered ? '✓ Registered (Manage Team)' : 'Register for Hackathon 🚀'}
            </button>

            <button
              type="button"
              onClick={() => setDetailsModalHackathon(featuredHackathon)}
              style={{
                background: 'rgba(255, 255, 255, 0.12)',
                backdropFilter: 'blur(8px)',
                color: '#FFFFFF',
                border: '1px solid rgba(255, 255, 255, 0.25)',
                padding: '12px 20px',
                borderRadius: '12px',
                fontWeight: 700,
                fontSize: '14px',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              <Info size={16} /> View Details
            </button>
          </div>
        </div>

        {/* Floating Countdown Box */}
        <div className="countdown-box-v2" style={{ background: '#0F172A', border: '1px solid #334155', borderRadius: '18px', padding: '20px', boxShadow: '0 20px 40px rgba(0, 0, 0, 0.4)', width: '320px', maxWidth: '100%' }}>
          <span className="countdown-title-v2" style={{ color: '#F59E0B', fontWeight: 900, fontSize: '11px', letterSpacing: '1.2px', display: 'block', textAlign: 'center', marginBottom: '12px', textTransform: 'uppercase' }}>
            REGISTRATION CLOSES IN
          </span>
          <div className="countdown-grid-v2" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px' }}>
            {/* DAYS */}
            <div className="cd-digit-card" style={{ background: '#1E293B', border: '1px solid #334155', borderRadius: '12px', padding: '10px 4px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
              <span className="cd-digit-number" style={{ fontSize: '24px', fontWeight: 900, color: '#FFFFFF', background: 'transparent', display: 'block', lineHeight: 1.1, textShadow: '0 2px 4px rgba(0,0,0,0.5)' }}>
                {String(countdown.days).padStart(2, '0')}
              </span>
              <span className="cd-digit-label" style={{ fontSize: '10px', color: '#94A3B8', fontWeight: 800, marginTop: '6px', display: 'block', letterSpacing: '0.5px' }}>
                DAYS
              </span>
            </div>

            {/* HOURS */}
            <div className="cd-digit-card" style={{ background: '#1E293B', border: '1px solid #334155', borderRadius: '12px', padding: '10px 4px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
              <span className="cd-digit-number" style={{ fontSize: '24px', fontWeight: 900, color: '#FFFFFF', background: 'transparent', display: 'block', lineHeight: 1.1, textShadow: '0 2px 4px rgba(0,0,0,0.5)' }}>
                {String(countdown.hours).padStart(2, '0')}
              </span>
              <span className="cd-digit-label" style={{ fontSize: '10px', color: '#94A3B8', fontWeight: 800, marginTop: '6px', display: 'block', letterSpacing: '0.5px' }}>
                HOURS
              </span>
            </div>

            {/* MINS */}
            <div className="cd-digit-card" style={{ background: '#1E293B', border: '1px solid #334155', borderRadius: '12px', padding: '10px 4px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
              <span className="cd-digit-number" style={{ fontSize: '24px', fontWeight: 900, color: '#FFFFFF', background: 'transparent', display: 'block', lineHeight: 1.1, textShadow: '0 2px 4px rgba(0,0,0,0.5)' }}>
                {String(countdown.mins).padStart(2, '0')}
              </span>
              <span className="cd-digit-label" style={{ fontSize: '10px', color: '#94A3B8', fontWeight: 800, marginTop: '6px', display: 'block', letterSpacing: '0.5px' }}>
                MINS
              </span>
            </div>

            {/* SECS */}
            <div className="cd-digit-card" style={{ background: '#1E293B', border: '1px solid #334155', borderRadius: '12px', padding: '10px 4px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
              <span className="cd-digit-number highlight" style={{ fontSize: '24px', fontWeight: 900, color: '#38BDF8', background: 'transparent', display: 'block', lineHeight: 1.1, textShadow: '0 2px 4px rgba(0,0,0,0.5)' }}>
                {String(countdown.secs).padStart(2, '0')}
              </span>
              <span className="cd-digit-label" style={{ fontSize: '10px', color: '#94A3B8', fontWeight: 800, marginTop: '6px', display: 'block', letterSpacing: '0.5px' }}>
                SECS
              </span>
            </div>
          </div>

          <div style={{ marginTop: '16px', paddingTop: '12px', borderTop: '1px solid #334155', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '12px', color: '#94A3B8' }}>
            <span style={{ fontWeight: 600 }}>Prize Pool:</span>
            <strong style={{ color: '#F59E0B', fontSize: '14px', fontWeight: 900 }}>{featuredHackathon.prizePool || '$25,000 USD'}</strong>
          </div>
        </div>
      </div>

      {/* Search & Domain Filter Bar */}
      <div style={{ marginTop: '36px', marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h2 style={{ fontSize: '22px', fontWeight: 900, margin: 0, color: theme === 'dark' ? '#FFFFFF' : '#0F172A' }}>
            🏆 University & Global Hackathons
          </h2>
          <p style={{ fontSize: '13px', color: '#64748B', margin: '4px 0 0' }}>
            Compete, build innovative software, win prizes, and connect with fellow student engineers
          </p>
        </div>

        {/* Search Bar */}
        <div style={{ position: 'relative', width: '280px' }}>
          <Search size={16} style={{ position: 'absolute', left: '12px', top: '11px', color: '#94A3B8' }} />
          <input 
            type="text" 
            placeholder="Search hackathons, organizer, tech..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ width: '100%', padding: '9px 14px 9px 38px', borderRadius: '9999px', border: `1px solid ${theme === 'dark' ? '#334155' : '#CBD5E1'}`, background: theme === 'dark' ? '#1E293B' : '#FFFFFF', color: theme === 'dark' ? '#FFFFFF' : '#0F172A', fontSize: '13px' }}
          />
        </div>
      </div>

      {/* Domain Pills */}
      <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '12px', marginBottom: '20px' }}>
        {['ALL', 'AI/ML', 'React', 'Cloud', 'Web3', 'Mobile', 'Full-Stack', 'Cybersecurity'].map(dom => (
          <button
            key={dom}
            type="button"
            onClick={() => setSelectedDomain(dom)}
            style={{
              padding: '6px 16px',
              borderRadius: '20px',
              border: `1px solid ${selectedDomain === dom ? '#2563EB' : (theme === 'dark' ? '#334155' : '#CBD5E1')}`,
              background: selectedDomain === dom ? '#2563EB' : (theme === 'dark' ? '#1E293B' : '#F8FAFC'),
              color: selectedDomain === dom ? '#FFFFFF' : (theme === 'dark' ? '#94A3B8' : '#64748B'),
              fontWeight: 700,
              fontSize: '12.5px',
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              transition: 'all 0.2s ease'
            }}
          >
            {dom === 'ALL' ? '🌟 All Domains' : dom}
          </button>
        ))}
      </div>

      {/* Hackathons Grid */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px 20px', color: '#64748B' }}>
          <Trophy size={40} style={{ color: '#F59E0B', margin: '0 auto 12px', animation: 'bounce 1s infinite' }} />
          <h4 style={{ fontSize: '16px', fontWeight: 700, margin: 0 }}>Loading Hackathons...</h4>
        </div>
      ) : filteredHackathons.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 20px', background: theme === 'dark' ? '#111827' : '#F8FAFC', borderRadius: '20px', border: `1px solid ${theme === 'dark' ? '#1F2937' : '#E2E8F0'}` }}>
          <Trophy size={44} style={{ color: '#F59E0B', margin: '0 auto 12px' }} />
          <h3 style={{ fontSize: '18px', fontWeight: 800, margin: 0, color: theme === 'dark' ? '#FFFFFF' : '#0F172A' }}>No Hackathons Found</h3>
          <p style={{ fontSize: '13px', color: '#64748B', margin: '6px 0 0' }}>Try clearing your search query or choosing another domain filter.</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '22px' }}>
          {filteredHackathons.map((h) => {
            const isReg = !!(registeredDataMap[h.title] || registeredDataMap[h.id]);
            const techList = Array.isArray(h.technologies) ? h.technologies : String(h.technologies || '').split(',');

            return (
              <div 
                key={h.id}
                className="hackathon-card animate-fade-in"
                style={{
                  background: theme === 'dark' ? '#111827' : '#FFFFFF',
                  border: `1px solid ${theme === 'dark' ? '#1F2937' : '#E2E8F0'}`,
                  borderRadius: '20px',
                  overflow: 'hidden',
                  display: 'flex',
                  flexDirection: 'column',
                  transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                  boxShadow: '0 4px 20px rgba(0, 0, 0, 0.04)'
                }}
              >
                {/* Banner Thumbnail */}
                <div style={{ position: 'relative', width: '100%', height: '170px', background: '#0F172A', overflow: 'hidden' }}>
                  <img 
                    src={h.bannerUrl || 'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?auto=format&fit=crop&w=1200&q=80'} 
                    alt={h.title}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    onError={(e) => { e.target.src = 'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?auto=format&fit=crop&w=1200&q=80'; }}
                  />

                  {/* Badges Over Banner */}
                  <div style={{ position: 'absolute', top: '12px', left: '12px', display: 'flex', gap: '6px' }}>
                    <span style={{
                      background: 'rgba(15, 23, 42, 0.85)',
                      backdropFilter: 'blur(6px)',
                      color: '#FFFFFF',
                      padding: '4px 10px',
                      borderRadius: '8px',
                      fontSize: '11px',
                      fontWeight: 800
                    }}>
                      {h.location || 'Online (Global)'}
                    </span>
                    {isReg && (
                      <span style={{
                        background: '#059669',
                        color: '#FFFFFF',
                        padding: '4px 10px',
                        borderRadius: '8px',
                        fontSize: '11px',
                        fontWeight: 800,
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px'
                      }}>
                        <CheckCircle2 size={12} /> Registered
                      </span>
                    )}
                  </div>

                  <div style={{ position: 'absolute', top: '12px', right: '12px' }}>
                    <span style={{
                      background: 'linear-gradient(135deg, #F59E0B, #D97706)',
                      color: '#FFFFFF',
                      padding: '4px 10px',
                      borderRadius: '8px',
                      fontSize: '11.5px',
                      fontWeight: 800,
                      boxShadow: '0 2px 8px rgba(0,0,0,0.3)'
                    }}>
                      🏆 {h.prizePool || '$10,000 USD'}
                    </span>
                  </div>
                </div>

                {/* Card Body */}
                <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', flex: 1 }}>
                  <div style={{ fontSize: '11.5px', color: '#64748B', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    {h.organizer}
                  </div>

                  <h3 style={{ fontSize: '17px', fontWeight: 800, margin: '6px 0 10px', color: theme === 'dark' ? '#FFFFFF' : '#0F172A', lineHeight: 1.35 }}>
                    {h.title}
                  </h3>

                  <p style={{ fontSize: '13px', color: theme === 'dark' ? '#94A3B8' : '#64748B', margin: '0 0 16px', lineHeight: 1.5, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                    {h.description}
                  </p>

                  {/* Metadata Chips */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '12.5px', color: theme === 'dark' ? '#CBD5E1' : '#475569', marginBottom: '16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Calendar size={14} style={{ color: '#2563EB' }} />
                      <span><strong>Event:</strong> {h.dateDisplay || 'Upcoming'}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Clock size={14} style={{ color: '#F59E0B' }} />
                      <span><strong>Deadline:</strong> {h.deadlineDisplay || 'Open'}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Users size={14} style={{ color: '#10B981' }} />
                      <span><strong>Team Size:</strong> {h.teamSize || '1 - 4 Members'}</span>
                    </div>
                  </div>

                  {/* Tech Tags */}
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '18px' }}>
                    {techList.slice(0, 4).map((t, idx) => (
                      <span
                        key={idx}
                        style={{
                          background: theme === 'dark' ? '#1F2937' : '#F1F5F9',
                          color: theme === 'dark' ? '#93C5FD' : '#2563EB',
                          fontSize: '11px',
                          fontWeight: 700,
                          padding: '3px 9px',
                          borderRadius: '6px'
                        }}
                      >
                        {typeof t === 'string' ? t.trim() : t}
                      </span>
                    ))}
                  </div>

                  {/* Buttons Row */}
                  <div style={{ marginTop: 'auto', paddingTop: '16px', borderTop: `1px solid ${theme === 'dark' ? '#1F2937' : '#F1F5F9'}`, display: 'grid', gridTemplateColumns: '1fr 1.2fr', gap: '10px' }}>
                    <button
                      type="button"
                      onClick={() => setDetailsModalHackathon(h)}
                      style={{
                        background: theme === 'dark' ? '#1F2937' : '#F8FAFC',
                        color: theme === 'dark' ? '#F8FAFC' : '#1E293B',
                        border: `1px solid ${theme === 'dark' ? '#374151' : '#CBD5E1'}`,
                        padding: '10px 14px',
                        borderRadius: '10px',
                        fontSize: '13px',
                        fontWeight: 700,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '6px'
                      }}
                    >
                      <Info size={14} /> Details
                    </button>

                    <button
                      type="button"
                      onClick={() => handleRegisterClick(h)}
                      style={{
                        background: isReg ? '#059669' : 'linear-gradient(135deg, #2563EB, #1D4ED8)',
                        color: '#FFFFFF',
                        border: 'none',
                        padding: '10px 14px',
                        borderRadius: '10px',
                        fontSize: '13px',
                        fontWeight: 800,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '6px',
                        boxShadow: '0 4px 12px rgba(37, 99, 235, 0.25)'
                      }}
                    >
                      {h.registrationLink && h.registrationLink.startsWith('http') ? (
                        <><span>Register</span> <ExternalLink size={13} /></>
                      ) : (
                        <span>{isReg ? 'Registered' : 'Register 🚀'}</span>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Hackathon Details Modal */}
      {detailsModalHackathon && (
        <div className="modal-backdrop" style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(15, 23, 42, 0.8)',
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
              maxWidth: '680px', 
              width: '100%', 
              background: theme === 'dark' ? '#0F172A' : '#FFFFFF',
              borderRadius: '24px',
              border: `1px solid ${theme === 'dark' ? '#1E293B' : '#E2E8F0'}`,
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.3)',
              overflow: 'hidden',
              maxHeight: '90vh',
              display: 'flex',
              flexDirection: 'column'
            }}
          >
            {/* Modal Banner */}
            <div style={{ position: 'relative', width: '100%', height: '200px', background: '#0F172A' }}>
              <img 
                src={detailsModalHackathon.bannerUrl || 'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?auto=format&fit=crop&w=1200&q=80'} 
                alt={detailsModalHackathon.title}
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
              <button 
                type="button" 
                onClick={() => setDetailsModalHackathon(null)}
                style={{
                  position: 'absolute',
                  top: '14px',
                  right: '14px',
                  background: 'rgba(15, 23, 42, 0.7)',
                  backdropFilter: 'blur(6px)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '50%',
                  width: '32px',
                  height: '32px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer'
                }}
              >
                <X size={16} />
              </button>

              <div style={{ position: 'absolute', bottom: '14px', left: '16px', right: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{
                  background: 'rgba(15, 23, 42, 0.85)',
                  backdropFilter: 'blur(4px)',
                  color: '#FFFFFF',
                  padding: '4px 10px',
                  borderRadius: '8px',
                  fontSize: '11.5px',
                  fontWeight: 800
                }}>
                  📍 {detailsModalHackathon.location || 'Online (Global)'}
                </span>

                <span style={{
                  background: 'linear-gradient(135deg, #F59E0B, #D97706)',
                  color: '#FFFFFF',
                  padding: '4px 12px',
                  borderRadius: '8px',
                  fontSize: '12px',
                  fontWeight: 800
                }}>
                  🏆 {detailsModalHackathon.prizePool || '$10,000 USD'}
                </span>
              </div>
            </div>

            {/* Modal Body */}
            <div style={{ padding: '24px', overflowY: 'auto', flex: 1 }}>
              <div style={{ fontSize: '12px', color: '#64748B', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Organized by {detailsModalHackathon.organizer}
              </div>

              <h2 style={{ fontSize: '22px', fontWeight: 900, margin: '6px 0 14px', color: theme === 'dark' ? '#FFFFFF' : '#0F172A' }}>
                {detailsModalHackathon.title}
              </h2>

              <p style={{ fontSize: '13.5px', color: theme === 'dark' ? '#CBD5E1' : '#475569', lineHeight: 1.6, margin: '0 0 20px' }}>
                {detailsModalHackathon.description}
              </p>

              {/* Grid of Key Info */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px', background: theme === 'dark' ? '#1E293B' : '#F8FAFC', padding: '16px', borderRadius: '14px', marginBottom: '20px' }}>
                <div>
                  <div style={{ fontSize: '11px', color: '#64748B', fontWeight: 700 }}>EVENT DATES</div>
                  <div style={{ fontSize: '13px', fontWeight: 800, color: theme === 'dark' ? '#FFFFFF' : '#0F172A', marginTop: '2px' }}>
                    {detailsModalHackathon.dateDisplay || 'Upcoming'}
                  </div>
                </div>

                <div>
                  <div style={{ fontSize: '11px', color: '#64748B', fontWeight: 700 }}>REGISTRATION DEADLINE</div>
                  <div style={{ fontSize: '13px', fontWeight: 800, color: '#F59E0B', marginTop: '2px' }}>
                    {detailsModalHackathon.deadlineDisplay || 'Open'}
                  </div>
                </div>

                <div>
                  <div style={{ fontSize: '11px', color: '#64748B', fontWeight: 700 }}>TEAM SIZE</div>
                  <div style={{ fontSize: '13px', fontWeight: 800, color: theme === 'dark' ? '#FFFFFF' : '#0F172A', marginTop: '2px' }}>
                    {detailsModalHackathon.teamSize || '1 - 4 Members'}
                  </div>
                </div>

                <div>
                  <div style={{ fontSize: '11px', color: '#64748B', fontWeight: 700 }}>ELIGIBILITY</div>
                  <div style={{ fontSize: '13px', fontWeight: 800, color: theme === 'dark' ? '#FFFFFF' : '#0F172A', marginTop: '2px' }}>
                    {detailsModalHackathon.eligibility || 'Open to all students'}
                  </div>
                </div>
              </div>

              {/* Technologies */}
              {detailsModalHackathon.technologies && (
                <div style={{ marginBottom: '18px' }}>
                  <h4 style={{ fontSize: '13px', fontWeight: 800, margin: '0 0 8px', color: theme === 'dark' ? '#FFFFFF' : '#0F172A' }}>
                    Focus Technologies & Tracks
                  </h4>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                    {(Array.isArray(detailsModalHackathon.technologies) ? detailsModalHackathon.technologies : String(detailsModalHackathon.technologies).split(',')).map((t, idx) => (
                      <span
                        key={idx}
                        style={{
                          background: theme === 'dark' ? '#1E293B' : '#EFF6FF',
                          color: '#2563EB',
                          fontSize: '12px',
                          fontWeight: 700,
                          padding: '4px 10px',
                          borderRadius: '8px'
                        }}
                      >
                        {typeof t === 'string' ? t.trim() : t}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Additional Info / Guidelines */}
              {detailsModalHackathon.additionalInfo && (
                <div style={{ marginBottom: '20px' }}>
                  <h4 style={{ fontSize: '13px', fontWeight: 800, margin: '0 0 8px', color: theme === 'dark' ? '#FFFFFF' : '#0F172A' }}>
                    Rules, Perks & Guidelines
                  </h4>
                  <div style={{ fontSize: '13px', color: theme === 'dark' ? '#94A3B8' : '#64748B', lineHeight: 1.6, whiteSpace: 'pre-line' }}>
                    {detailsModalHackathon.additionalInfo}
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div style={{ padding: '16px 24px', borderTop: `1px solid ${theme === 'dark' ? '#1E293B' : '#E2E8F0'}`, display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button
                type="button"
                onClick={() => setDetailsModalHackathon(null)}
                style={{
                  padding: '10px 18px',
                  borderRadius: '10px',
                  border: `1px solid ${theme === 'dark' ? '#334155' : '#CBD5E1'}`,
                  background: 'transparent',
                  color: theme === 'dark' ? '#CBD5E1' : '#64748B',
                  fontSize: '13px',
                  fontWeight: 700,
                  cursor: 'pointer'
                }}
              >
                Close
              </button>

              <button
                type="button"
                onClick={() => {
                  const target = detailsModalHackathon;
                  setDetailsModalHackathon(null);
                  handleRegisterClick(target);
                }}
                style={{
                  background: 'linear-gradient(135deg, #2563EB, #1D4ED8)',
                  color: '#FFFFFF',
                  border: 'none',
                  padding: '10px 22px',
                  borderRadius: '10px',
                  fontSize: '13px',
                  fontWeight: 800,
                  cursor: 'pointer',
                  boxShadow: '0 4px 12px rgba(37, 99, 235, 0.3)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                {detailsModalHackathon.registrationLink && detailsModalHackathon.registrationLink.startsWith('http') ? (
                  <><span>Register on Portal</span> <ExternalLink size={14} /></>
                ) : (
                  <span>Register Now 🚀</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
