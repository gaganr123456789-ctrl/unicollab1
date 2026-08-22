import React, { useState, useEffect } from 'react';
import HackathonRegisterModal from '../components/HackathonRegisterModal';
import AiRecommendationsModal from '../components/AiRecommendationsModal';
import CreateProjectModal from '../components/CreateProjectModal';
import { 
  FolderKanban, 
  UserPlus, 
  Clock, 
  Plus, 
  Activity, 
  Sparkles,
  Calendar,
  Trophy,
  MessageSquare,
  GitCommit,
  Bot
} from 'lucide-react';

export default function DashboardPage({ setCurrentPage, userProfile }) {
  const firstName = userProfile?.name ? userProfile.name.split(' ')[0] : 'Alex';
  const [selectedHackathonTitle, setSelectedHackathonTitle] = useState('');
  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false);
  const [isAiModalOpen, setIsAiModalOpen] = useState(false);
  const [isCreateProjectOpen, setIsCreateProjectOpen] = useState(false);
  const [registeredHackathons, setRegisteredHackathons] = useState({});

  const [currentDateTime, setCurrentDateTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentDateTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const formattedDate = currentDateTime.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric'
  });

  const formattedTime = currentDateTime.toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });

  const handleOpenRegister = (title) => {
    setSelectedHackathonTitle(title);
    setIsRegisterModalOpen(true);
  };

  const handleRegisterSuccess = (data) => {
    setRegisteredHackathons(prev => ({
      ...prev,
      [data.hackathonTitle]: data
    }));
  };

  return (
    <div className="page-container animate-fade-in">
      {/* Create Project Modal */}
      <CreateProjectModal
        isOpen={isCreateProjectOpen}
        onClose={() => setIsCreateProjectOpen(false)}
        userProfile={userProfile}
        setCurrentPage={setCurrentPage}
      />

      {/* AI Recommendations Modal */}
      <AiRecommendationsModal
        isOpen={isAiModalOpen}
        onClose={() => setIsAiModalOpen(false)}
        setCurrentPage={setCurrentPage}
      />

      {/* Hackathon Registration Modal */}
      <HackathonRegisterModal
        isOpen={isRegisterModalOpen}
        onClose={() => setIsRegisterModalOpen(false)}
        hackathonTitle={selectedHackathonTitle}
        userProfile={userProfile}
        onSuccess={handleRegisterSuccess}
      />
      {/* Dashboard Top Banner */}
      <div className="dash-top-bar">
        <div>
          <h1 className="dash-title">Welcome back, {firstName}! 👋</h1>
          <p className="dash-subtitle flex align-center gap-2">
            <span>{formattedDate}</span>
            <span className="text-blue font-bold">({formattedTime})</span>
            <span>• You have 3 tasks due today.</span>
          </p>
        </div>
        <div className="dash-actions">
          <button className="btn-secondary" onClick={() => alert('Viewing Recent Activity Log')}>
            <Activity size={16} />
            <span>Activity Log</span>
          </button>
          <button className="btn-primary" onClick={() => setIsCreateProjectOpen(true)}>
            <Plus size={16} />
            <span>New Project</span>
          </button>
        </div>
      </div>

      {/* 3 Metric Cards */}
      <div className="metrics-grid">
        <div className="metric-card">
          <div className="metric-header">
            <span className="metric-label">ACTIVE PROJECTS</span>
            <div className="metric-icon-box blue">
              <FolderKanban size={18} />
            </div>
          </div>
          <div className="metric-value-row">
            <span className="metric-number">04</span>
            <span className="metric-badge green">+1 vs last month</span>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-header">
            <span className="metric-label">TEAMMATE INVITES</span>
            <div className="metric-icon-box purple">
              <UserPlus size={18} />
            </div>
          </div>
          <div className="metric-value-row">
            <span className="metric-number">12</span>
            <span className="metric-badge green">+3 vs last month</span>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-header">
            <span className="metric-label">DAYS TO DEADLINE</span>
            <div className="metric-icon-box orange">
              <Clock size={18} />
            </div>
          </div>
          <div className="metric-value-row">
            <span className="metric-number">02</span>
            <span className="metric-badge red">-1 vs last month</span>
          </div>
        </div>
      </div>

      {/* Two Column Layout: Main Content Left, Sidebar Widgets Right */}
      <div className="dash-content-grid">
        {/* Left Column */}
        <div className="dash-main-col">
          {/* Ongoing Projects Section */}
          <div className="section-block">
            <div className="section-block-header">
              <h3>Ongoing Projects</h3>
              <button className="text-link" onClick={() => setCurrentPage('projects')}>View All Projects</button>
            </div>

            <div className="ongoing-projects-grid">
              {/* Project Card 1 */}
              <div className="project-widget-card">
                <div className="project-card-header">
                  <span className="dept-tag">Design</span>
                  <span className="more-dots">• • •</span>
                </div>

                <div className="project-card-img-placeholder design">
                  <div className="placeholder-art">🎨</div>
                </div>

                <h4 className="project-card-title">UniCollab Pro UI/UX</h4>
                <div className="due-row">
                  <Clock size={13} />
                  <span>Due Tonight</span>
                </div>

                <div className="progress-bar-container">
                  <div className="progress-bar-label">
                    <span>Progress</span>
                    <span className="bold">65%</span>
                  </div>
                  <div className="progress-track">
                    <div className="progress-fill" style={{ width: '65%' }}></div>
                  </div>
                </div>

                <div className="project-card-footer">
                  <div className="avatar-group">
                    <div className="avatar">AT</div>
                    <div className="avatar">SC</div>
                    <div className="avatar">+2</div>
                  </div>
                  <button className="text-btn-blue" onClick={() => setCurrentPage('workspace')}>
                    View Workspace &gt;
                  </button>
                </div>
              </div>

              {/* Project Card 2 */}
              <div className="project-widget-card">
                <div className="project-card-header">
                  <span className="dept-tag green">Data Science</span>
                  <span className="more-dots">• • •</span>
                </div>

                <div className="project-card-img-placeholder data">
                  <div className="placeholder-art">📊</div>
                </div>

                <h4 className="project-card-title">EcoTrack Analytics</h4>
                <div className="due-row">
                  <Clock size={13} />
                  <span>Due Oct 12</span>
                </div>

                <div className="progress-bar-container">
                  <div className="progress-bar-label">
                    <span>Progress</span>
                    <span className="bold">41%</span>
                  </div>
                  <div className="progress-track">
                    <div className="progress-fill green" style={{ width: '41%' }}></div>
                  </div>
                </div>

                <div className="project-card-footer">
                  <div className="avatar-group">
                    <div className="avatar">AT</div>
                    <div className="avatar">MJ</div>
                  </div>
                  <button className="text-btn-blue" onClick={() => setCurrentPage('workspace')}>
                    View Workspace &gt;
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Recent Activity */}
          <div className="section-block mt-6">
            <h3 className="section-block-title">Recent Activity</h3>
            <div className="activity-list">
              <div className="activity-item">
                <div className="activity-icon-circle blue">
                  <GitCommit size={15} />
                </div>
                <div className="activity-info">
                  <p><strong>Prof. Rajesh Verma</strong> pushed 12 commits to <span className="blue-text">EcoTrack Backend</span></p>
                  <span className="activity-time">2 hours ago</span>
                </div>
              </div>

              <div className="activity-item">
                <div className="activity-icon-circle purple">
                  <Bot size={15} />
                </div>
                <div className="activity-info">
                  <p><strong>AI Assistant</strong> found a potential match for <span className="blue-text">Sustainable Tech Hackathon</span></p>
                  <span className="activity-time">5 hours ago</span>
                </div>
              </div>

              <div className="activity-item">
                <div className="activity-icon-circle green">
                  <MessageSquare size={15} />
                </div>
                <div className="activity-info">
                  <p><strong>Jessica Wong</strong> left a comment on <span className="blue-text">Design Milestone 2</span></p>
                  <span className="activity-time">Yesterday</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column / Widgets */}
        <div className="dash-side-col">
          {/* AI Powered Recommendation Widget */}
          <div className="ai-recommendation-card">
            <div className="ai-badge-header">
              <Sparkles size={14} />
              <span>AI POWERED</span>
            </div>
            <h4 className="ai-rec-title">Suggested for You</h4>
            <p className="ai-rec-desc">Based on your React and UI Design skills, we found 3 new matches.</p>

            <div className="ai-match-items">
              <div className="ai-match-item" onClick={() => setIsAiModalOpen(true)}>
                <div>
                  <div className="match-name">Smart Campus App</div>
                  <div className="match-sub">UI Designer • Featured</div>
                </div>
                <span className="match-score">98% Match</span>
              </div>

              <div className="ai-match-item" onClick={() => setIsAiModalOpen(true)}>
                <div>
                  <div className="match-name">EcoTrack Dashboard</div>
                  <div className="match-sub">React Developer</div>
                </div>
                <span className="match-score green">94% Match</span>
              </div>
            </div>

            <button className="btn-ai-full" onClick={() => setIsAiModalOpen(true)}>
              View All Recommendations
            </button>
          </div>

          {/* Upcoming Deadlines Widget */}
          <div className="widget-card mt-6">
            <div className="widget-header">
              <Calendar size={16} />
              <h4>Upcoming Deadlines</h4>
            </div>

            <div className="deadlines-list">
              <div className="deadline-item red">
                <div className="deadline-dot"></div>
                <div>
                  <div className="deadline-title">Final Design Submission</div>
                  <div className="deadline-meta">UniCollab Pro • Today 11:59 PM</div>
                </div>
              </div>

              <div className="deadline-item orange">
                <div className="deadline-dot"></div>
                <div>
                  <div className="deadline-title">Backend API Sync</div>
                  <div className="deadline-meta">EcoTrack • Tomorrow 10:00 AM</div>
                </div>
              </div>

              <div className="deadline-item">
                <div className="deadline-dot"></div>
                <div>
                  <div className="deadline-title">User Interview Summary</div>
                  <div className="deadline-meta">Smart Campus • Oct 5, 2026</div>
                </div>
              </div>
            </div>

            <button className="widget-footer-btn" onClick={() => setCurrentPage('workspace')}>View All Schedule</button>
          </div>

          {/* Featured Hackathons Widget */}
          <div className="widget-card mt-6">
            <div className="widget-header">
              <Trophy size={16} className="text-yellow" />
              <h4>Featured Hackathons</h4>
            </div>

            <div className="hackathon-items">
              <div className="hackathon-item">
                <div>
                  <div className="hack-title">AI for Good</div>
                  <div className="hack-meta">Virtual • $10k Prize</div>
                </div>
                <button 
                  className={`btn-sm-outline ${registeredHackathons['AI for Good'] ? 'btn-success-active' : ''}`} 
                  onClick={() => handleOpenRegister('AI for Good')}
                >
                  {registeredHackathons['AI for Good'] ? 'Registered ✅' : 'Join'}
                </button>
              </div>

              <div className="hackathon-item">
                <div>
                  <div className="hack-title">EduHack 2.0</div>
                  <div className="hack-meta">Hybrid • Internship Prizes</div>
                </div>
                <button 
                  className={`btn-sm-outline ${registeredHackathons['EduHack 2.0'] ? 'btn-success-active' : ''}`} 
                  onClick={() => handleOpenRegister('EduHack 2.0')}
                >
                  {registeredHackathons['EduHack 2.0'] ? 'Registered ✅' : 'Join'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
