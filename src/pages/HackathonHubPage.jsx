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
  User
} from 'lucide-react';

export default function HackathonHubPage({ setCurrentPage, userProfile }) {
  const [activeTab, setActiveTab] = useState('About Event');
  const [countdown, setCountdown] = useState({ days: 4, hours: 12, mins: 45, secs: 29 });
  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false);
  const [registeredData, setRegisteredData] = useState(null);

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown(prev => {
        if (prev.secs > 0) return { ...prev, secs: prev.secs - 1 };
        return { ...prev, secs: 59, mins: prev.mins > 0 ? prev.mins - 1 : 59 };
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const handleRegisterSuccess = (data) => {
    setRegisteredData(data);
  };

  return (
    <div className="page-container animate-fade-in">
      {/* Hackathon Registration Modal */}
      <HackathonRegisterModal
        isOpen={isRegisterModalOpen}
        onClose={() => setIsRegisterModalOpen(false)}
        hackathonTitle="Global Innovation Hackathon 2026"
        userProfile={userProfile}
        onSuccess={handleRegisterSuccess}
      />

      {/* Main Hackathon Event Banner */}
      <div className="hackathon-hero-banner">
        <div className="hero-banner-content">
          <div className="hero-tags">
            <span className="h-badge blue">REGISTRATION OPEN</span>
            <span className="h-badge purple">HYBRID EVENT</span>
            {registeredData && (
              <span className="h-badge green flex align-center gap-1">
                <CheckCircle2 size={13} /> REGISTERED ({registeredData.teamName})
              </span>
            )}
          </div>

          <h1 className="h-title">Global Innovation Hackathon 2026</h1>
          <p className="h-desc">
            Join 500+ developers, designers, and entrepreneurs to solve real-world challenges in AI, Sustainability, and FinTech.
          </p>

          {registeredData && (
            <div className="registration-success-banner-inline mt-4">
              <CheckCircle2 size={18} className="text-emerald" />
              <div>
                <strong>Registered Team: {registeredData.teamName}</strong> • USN: {registeredData.usn} • ID: {registeredData.registrationId}
              </div>
            </div>
          )}
        </div>

        {/* Floating Countdown Registration Box */}
        <div className="countdown-box">
          <span className="countdown-label">REGISTRATION ENDS IN</span>
          <div className="countdown-digits">
            <div className="digit-unit">
              <span className="num">{String(countdown.days).padStart(2, '0')}</span>
              <span className="label">DAYS</span>
            </div>
            <div className="digit-unit">
              <span className="num">{String(countdown.hours).padStart(2, '0')}</span>
              <span className="label">HOURS</span>
            </div>
            <div className="digit-unit">
              <span className="num">{String(countdown.mins).padStart(2, '0')}</span>
              <span className="label">MINS</span>
            </div>
            <div className="digit-unit">
              <span className="num">{String(countdown.secs).padStart(2, '0')}</span>
              <span className="label">SECS</span>
            </div>
          </div>

          <button 
            className={`btn-primary full-width mt-4 ${registeredData ? 'btn-success-active' : ''}`} 
            onClick={() => setIsRegisterModalOpen(true)}
          >
            {registeredData ? 'View / Edit Registration' : 'Register Now'}
          </button>
        </div>
      </div>

      {/* Key Info Bar (4 Metrics) */}
      <div className="hackathon-info-bar mt-6">
        <div className="info-bar-item">
          <div className="info-icon"><Calendar size={18} /></div>
          <div>
            <span className="info-label">DATE</span>
            <span className="info-val">Nov 15-17, 2024</span>
          </div>
        </div>

        <div className="info-bar-item">
          <div className="info-icon"><MapPin size={18} /></div>
          <div>
            <span className="info-label">LOCATION</span>
            <span className="info-val">Campus Central Hub</span>
          </div>
        </div>

        <div className="info-bar-item">
          <div className="info-icon"><Users size={18} /></div>
          <div>
            <span className="info-label">PARTICIPANTS</span>
            <span className="info-val">450 / 600</span>
          </div>
        </div>

        <div className="info-bar-item">
          <div className="info-icon"><Globe size={18} /></div>
          <div>
            <span className="info-label">LANGUAGE</span>
            <span className="info-val">English / Spanish</span>
          </div>
        </div>
      </div>

      {/* Main Grid: Details Left, Sidebar Right */}
      <div className="hackathon-main-grid mt-6">
        {/* Left Content Column */}
        <div className="hackathon-content-col">
          {/* Tabs */}
          <div className="h-tabs-bar">
            {['About Event', 'Schedule', 'Rules & FAQ'].map((t) => (
              <button 
                key={t}
                className={`h-tab ${activeTab === t ? 'active' : ''}`}
                onClick={() => setActiveTab(t)}
              >
                {t}
              </button>
            ))}
          </div>

          {activeTab === 'About Event' && (
            <div className="h-tab-content mt-6">
              <h3>Unleash Your Creativity</h3>
              <p className="mt-2 text-slate leading-relaxed">
                The Global Innovation Hackathon is UniCollab's flagship annual event, bringing together the brightest minds across multiple disciplines. This year, we're focusing on the intersection of artificial intelligence and social impact.
              </p>
              <p className="mt-2 text-slate leading-relaxed">
                Whether you're a first-time coder or a seasoned software engineer, this event is designed to push your boundaries. We provide the tools, the mentors, and the pizza - you bring the ideas and the grit.
              </p>

              <div className="h-features-grid mt-6">
                <div className="h-feature-box">
                  <div className="h-feat-icon blue"><Zap size={20} /></div>
                  <div>
                    <h4>Rapid Prototyping</h4>
                    <p>Build functional MVPs using our pre-configured development environments.</p>
                  </div>
                </div>

                <div className="h-feature-box">
                  <div className="h-feat-icon green"><ShieldCheck size={20} /></div>
                  <div>
                    <h4>Expert Mentorship</h4>
                    <p>Direct access to industry professionals from top-tier tech companies.</p>
                  </div>
                </div>
              </div>

              {/* Prize Pool Section */}
              <div className="prize-pool-section mt-8">
                <div className="section-title-icon">
                  <Trophy size={20} className="text-blue" />
                  <h3>Prize Pool</h3>
                </div>

                <div className="prize-cards-grid mt-4">
                  {/* 1st Place */}
                  <div className="prize-card gold">
                    <div className="prize-trophy-icon"><Trophy size={22} color="#2563EB" /></div>
                    <span className="place-label">1st Place</span>
                    <h2 className="prize-amount">$5,000</h2>
                    <p className="prize-sub">Grand Prize + NVIDIA Jetson Nano Dev Kit</p>
                  </div>

                  {/* 2nd Place */}
                  <div className="prize-card silver">
                    <div className="prize-trophy-icon"><Trophy size={22} color="#7C3AED" /></div>
                    <span className="place-label">2nd Place</span>
                    <h2 className="prize-amount">$2,500</h2>
                    <p className="prize-sub">Secondary Prize + 1yr AWS Credits</p>
                  </div>

                  {/* 3rd Place */}
                  <div className="prize-card bronze">
                    <div className="prize-trophy-icon"><Trophy size={22} color="#0EA5E9" /></div>
                    <span className="place-label">3rd Place</span>
                    <h2 className="prize-amount">$1,000</h2>
                    <p className="prize-sub">Third Prize + UniCollab Pro Life-time</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'Schedule' && (
            <div className="h-tab-content mt-6">
              <h3>Hackathon Schedule</h3>
              <div className="schedule-timeline mt-4">
                <div className="schedule-item">
                  <div className="time-badge">Day 1 • 5:00 PM</div>
                  <div>
                    <h4>Opening Ceremony & Keynote</h4>
                    <p>Welcome address, theme reveal, and team formation mixer.</p>
                  </div>
                </div>

                <div className="schedule-item">
                  <div className="time-badge">Day 2 • 10:00 AM</div>
                  <div>
                    <h4>Mentorship Office Hours</h4>
                    <p>Get feedback from industry mentors on architecture and UI.</p>
                  </div>
                </div>

                <div className="schedule-item">
                  <div className="time-badge">Day 3 • 2:00 PM</div>
                  <div>
                    <h4>Project Submission & Live Pitches</h4>
                    <p>Final project submission deadline followed by top 5 live pitches.</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'Rules & FAQ' && (
            <div className="h-tab-content mt-6">
              <h3>Rules & Frequently Asked Questions</h3>
              <div className="faq-list mt-4">
                <div className="faq-item">
                  <h4>Who can participate?</h4>
                  <p>All currently enrolled undergraduate and graduate students worldwide with a valid .edu email.</p>
                </div>
                <div className="faq-item mt-4">
                  <h4>What is the max team size?</h4>
                  <p>Teams can consist of 1 to 4 students. If you don't have a team, use our "Find a Team" feature!</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right Sidebar Column */}
        <div className="hackathon-sidebar-col">
          {/* Registration Status Widget */}
          <div className="widget-card">
            <div className="widget-header-title flex align-center gap-2">
              <Target size={18} className="text-blue" />
              <h4 className="widget-title no-margin">Registration Status</h4>
            </div>
            
            <div className="capacity-bar-group mt-3">
              <div className="capacity-label">
                <span>CAPACITY</span>
                <span className="bold">75% FULL</span>
              </div>
              <div className="capacity-track">
                <div className="capacity-fill" style={{ width: '75%' }}></div>
              </div>
            </div>

            <div className="widget-actions mt-4">
              <button 
                className={`btn-primary full-width ${registeredData ? 'btn-success-active' : ''}`} 
                onClick={() => setIsRegisterModalOpen(true)}
              >
                {registeredData ? 'View / Edit Registration' : 'Join Competition'}
              </button>
              <button className="btn-secondary full-width mt-2" onClick={() => setCurrentPage('find-teammates')}>
                <UserPlus size={15} /> Find a Team
              </button>
            </div>

            <div className="social-share-row mt-4">
              <button className="btn-icon-text" onClick={() => alert('Event link copied to clipboard!')}>
                <Share2 size={14} /> SHARE
              </button>
              <button className="btn-icon-text" onClick={() => alert('Event added to your Google/Apple Calendar!')}>
                <Calendar size={14} /> ADD CALENDAR
              </button>
            </div>
          </div>

          {/* Featured Mentors Widget */}
          <div className="widget-card mt-6">
            <div className="widget-header-row">
              <h4>Featured Mentors</h4>
              <button className="text-link-blue" onClick={() => setCurrentPage('mentor-portal')}>VIEW ALL</button>
            </div>

            <div className="mentor-mini-list mt-4">
              <div className="mentor-mini-item">
                <div className="avatar-circle blue">
                  <User size={16} />
                </div>
                <div className="mentor-mini-info">
                  <h5>Dr. Ananya Sharma</h5>
                  <p>AI RESEARCHER</p>
                </div>
                <ChevronRight size={16} className="text-muted" />
              </div>

              <div className="mentor-mini-item">
                <div className="avatar-circle blue">
                  <User size={16} />
                </div>
                <div className="mentor-mini-info">
                  <h5>Prof. Rajesh Verma</h5>
                  <p>SR. SOFTWARE ENGINEER</p>
                </div>
                <ChevronRight size={16} className="text-muted" />
              </div>

              <div className="mentor-mini-item">
                <div className="avatar-circle blue">
                  <User size={16} />
                </div>
                <div className="mentor-mini-info">
                  <h5>Priya Nair</h5>
                  <p>PRODUCT DESIGNER</p>
                </div>
                <ChevronRight size={16} className="text-muted" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer Bar */}
      <div className="hackathon-footer-row mt-12">
        <div className="footer-left">
          <button className="text-link-grey" onClick={() => setCurrentPage('dashboard')}>
            &larr; Back to Listings
          </button>
          <span className="divider">|</span>
          <span className="copyright-text">&copy; 2026 UniCollab</span>
        </div>
        <div className="footer-right">
          <button className="btn-footer-secondary" onClick={() => alert('Opening support desk...')}>
            Contact Support
          </button>
          <button className="btn-footer-secondary" onClick={() => alert('Opening sponsorship inquiry form...')}>
            Sponsorship Inquiry
          </button>
        </div>
      </div>
    </div>
  );
}
