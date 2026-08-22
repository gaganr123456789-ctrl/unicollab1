import React, { useState } from 'react';
import { X, Sparkles, CheckCircle2, Users, ArrowRight, Send } from 'lucide-react';

export default function AiRecommendationsModal({ isOpen, onClose, setCurrentPage }) {
  const [connectedIds, setConnectedIds] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('All');

  if (!isOpen) return null;

  const matches = [
    {
      id: 1,
      title: 'Smart Campus Mobile App',
      role: 'UI/UX Designer',
      matchScore: 98,
      category: 'Mobile Dev',
      description: 'Building a next-gen campus navigation and event tracking mobile application for university students.',
      matchedSkills: ['UI Design', 'Figma', 'Prototyping'],
      teamLead: 'Sarah Chen',
      spots: '2 / 5 spots left',
      status: 'High Demand'
    },
    {
      id: 2,
      title: 'EcoTrack Analytics Dashboard',
      role: 'React Frontend Engineer',
      matchScore: 94,
      category: 'Web App',
      description: 'Real-time dashboard for IoT carbon footprint sensors placed across university buildings.',
      matchedSkills: ['React', 'JavaScript', 'CSS3'],
      teamLead: 'Marcus Johnson',
      spots: '1 / 4 spots left',
      status: 'Popular'
    },
    {
      id: 3,
      title: 'AI Health Companion',
      role: 'Full-Stack Developer',
      matchScore: 91,
      category: 'AI / ML',
      description: 'Personalized mental wellness recommendation engine utilizing lightweight LLM agents.',
      matchedSkills: ['React', 'Node.js', 'AI Integration'],
      teamLead: 'Dr. Ananya Sharma',
      spots: '3 / 6 spots left',
      status: 'Featured'
    },
    {
      id: 4,
      title: 'Global Innovation Hackathon Team',
      role: 'Frontend Lead',
      matchScore: 89,
      category: 'Hackathon',
      description: 'Competitive team preparing for the 48-hour FinTech & Sustainability track.',
      matchedSkills: ['React', 'Tailwind', 'Git'],
      teamLead: 'Alex Rivera',
      spots: '1 / 4 spots left',
      status: 'Closing Soon'
    },
    {
      id: 5,
      title: 'Robotics Vision Module',
      role: 'UI Systems Engineer',
      matchScore: 85,
      category: 'Engineering',
      description: 'Web-based telemetry UI control panel for autonomous rover testing.',
      matchedSkills: ['React', 'WebSockets', 'UI Design'],
      teamLead: 'David Kim',
      spots: '2 / 4 spots left',
      status: 'New'
    }
  ];

  const handleConnect = (id) => {
    if (!connectedIds.includes(id)) {
      setConnectedIds([...connectedIds, id]);
    }
  };

  const filteredMatches = selectedCategory === 'All' 
    ? matches 
    : matches.filter(m => m.category === selectedCategory);

  return (
    <div className="modal-backdrop animate-fade-in" onClick={onClose}>
      <div className="modal-content modal-lg" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '780px' }}>
        
        {/* Header */}
        <div className="modal-header-banner" style={{ background: 'linear-gradient(135deg, #0F172A 0%, #1E1B4B 50%, #2563EB 100%)' }}>
          <div className="modal-header-info">
            <div className="h-badge blue inline-flex align-center gap-1">
              <Sparkles size={14} /> AI MATCHMAKING ENGINE
            </div>
            <h2 className="modal-title mt-1">Recommended Matches for You</h2>
            <p className="modal-sub">Matched based on your React, UI Design, and Full-Stack background.</p>
          </div>
          <button className="btn-close-modal" onClick={onClose} aria-label="Close modal">
            <X size={20} />
          </button>
        </div>

        {/* Filter Pills */}
        <div className="ai-modal-filter-bar">
          <span className="text-xs bold text-slate">FILTER BY:</span>
          {['All', 'Mobile Dev', 'Web App', 'AI / ML', 'Hackathon'].map((cat) => (
            <button 
              key={cat}
              className={`cat-pill ${selectedCategory === cat ? 'active' : ''}`}
              onClick={() => setSelectedCategory(cat)}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Body */}
        <div className="modal-body" style={{ maxHeight: '65vh', overflowY: 'auto' }}>
          <div className="ai-matches-list">
            {filteredMatches.map((m) => {
              const isConnected = connectedIds.includes(m.id);
              return (
                <div key={m.id} className="ai-match-card-full">
                  <div className="ai-match-card-header">
                    <div>
                      <div className="flex align-center gap-2">
                        <h4 className="match-card-title">{m.title}</h4>
                        <span className="h-badge purple text-xs">{m.status}</span>
                      </div>
                      <span className="match-card-role">{m.role} • Led by {m.teamLead}</span>
                    </div>

                    <div className="match-badge-box">
                      <span className="match-percent">{m.matchScore}% Match</span>
                    </div>
                  </div>

                  <p className="match-card-desc mt-2">{m.description}</p>

                  <div className="match-skills-row mt-3">
                    <span className="text-xs text-slate bold">SKILLS MATCHED:</span>
                    <div className="skills-tags-wrap">
                      {m.matchedSkills.map(s => (
                        <span key={s} className="skill-tag-pill">{s}</span>
                      ))}
                    </div>
                  </div>

                  <div className="ai-match-card-footer mt-4">
                    <span className="spots-text flex align-center gap-1">
                      <Users size={14} className="text-blue" /> {m.spots}
                    </span>

                    <div className="flex gap-2">
                      <button 
                        className={`btn-sm-primary ${isConnected ? 'btn-success-active' : ''}`}
                        onClick={() => handleConnect(m.id)}
                      >
                        {isConnected ? (
                          <>
                            <CheckCircle2 size={14} /> Request Sent
                          </>
                        ) : (
                          <>
                            <Send size={14} /> Connect & Apply
                          </>
                        )}
                      </button>

                      {setCurrentPage && (
                        <button 
                          className="btn-sm-outline"
                          onClick={() => {
                            onClose();
                            setCurrentPage('projects');
                          }}
                        >
                          View Details <ArrowRight size={13} />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="modal-footer flex justify-between align-center">
          <span className="text-xs text-slate">AI engine updates recommendations daily based on active projects.</span>
          <button className="btn-secondary" onClick={onClose}>
            Close
          </button>
        </div>

      </div>
    </div>
  );
}
