import React, { useState } from 'react';
import { 
  Camera, 
  Share2, 
  Edit3, 
  Globe, 
  Plus, 
  Trophy, 
  Award, 
  CheckCircle2, 
  Clock, 
  Code,
  User,
  MapPin,
  Calendar,
  Zap,
  Users,
  GraduationCap,
  GitBranch,
  Star
} from 'lucide-react';

const Github = ({ size = 15 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4" />
    <path d="M9 18c-4.51 2-5-2-7-2" />
  </svg>
);

const Linkedin = ({ size = 15 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
    <rect width="4" height="12" x="2" y="9" />
    <circle cx="4" cy="4" r="2" />
  </svg>
);

const Twitter = ({ size = 15 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z" />
  </svg>
);

export default function ProfilePage({ userProfile, setUserProfile }) {
  const [activeTab, setActiveTab] = useState('Portfolio');
  const [isEditing, setIsEditing] = useState(false);
  const [isEditingAbout, setIsEditingAbout] = useState(false);

  // Edit modal local states
  const [editName, setEditName] = useState(userProfile?.name || 'Alex Rivera');
  const [editAge, setEditAge] = useState(userProfile?.age || '21');
  const [editPhone, setEditPhone] = useState(userProfile?.phone || '+91 98765 43210');
  const [editGender, setEditGender] = useState(userProfile?.gender || 'Male');
  const [editMajor, setEditMajor] = useState(userProfile?.major || 'Computer Science');

  // About Section local states
  const [aboutBio, setAboutBio] = useState('Senior Computer Science student at Stanford with a passion for building scalable web applications and AI-driven tools. I love working in collaborative environments and contributing to open-source projects. Currently focused on UniCollab to help students find perfect project teammates.');
  const [website, setWebsite] = useState('alexrivera.dev');
  const [github, setGithub] = useState('github.com/arivera');
  const [linkedin, setLinkedin] = useState('linkedin.com/in/alex-rivera');
  const [twitter, setTwitter] = useState('@arivera_codes');

  // Live GitHub Repos Fetcher State
  const [ghUsername, setGhUsername] = useState('vercel');
  const [ghRepos, setGhRepos] = useState([]);
  const [loadingRepos, setLoadingRepos] = useState(false);

  const fetchLiveGithubRepos = async (username) => {
    if (!username) return;
    setLoadingRepos(true);
    try {
      const res = await fetch(`https://api.github.com/users/${username}/repos?sort=updated&per_page=6`);
      if (res.ok) {
        const data = await res.json();
        setGhRepos(data);
      }
    } catch (err) {
      console.error('GitHub API error', err);
    } finally {
      setLoadingRepos(false);
    }
  };

  const name = userProfile?.name || (userProfile?.email ? userProfile.email.split('@')[0] : 'Student Member');
  const initials = userProfile?.initials || name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || 'ST';
  const major = userProfile?.major || userProfile?.degree || 'Engineering';
  const age = userProfile?.age || '21';

  const handleAvatarUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (setUserProfile) {
          setUserProfile(prev => ({
            ...prev,
            avatarUrl: reader.result
          }));
        }
        alert('Profile photo updated successfully!');
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveAbout = (e) => {
    e.preventDefault();
    setIsEditingAbout(false);
    alert('About section updated successfully!');
  };

  const selectedProjects = [
    {
      id: 1,
      title: 'UniCollab Platform',
      desc: 'A collaborative environment for students to build real-world experience through team projects.',
      tags: ['React', 'PostgreSQL', 'Tailwind']
    },
    {
      id: 2,
      title: 'DataStream Analytics',
      desc: 'Real-time data visualization dashboard for tracking academic research metrics across departments.',
      tags: ['D3.js', 'Python', 'Redux']
    },
    {
      id: 3,
      title: 'Quantum Search Engine',
      desc: 'An experimental search algorithm utilizing quantum computing simulations to improve query indexing.',
      tags: ['Next.js', 'OpenAI', 'Supabase']
    },
    {
      id: 4,
      title: 'Social Connect API',
      desc: 'Microservice architecture for managing social connections and messaging within campus hubs.',
      tags: ['Go', 'Redis', 'Docker']
    }
  ];

  const skills = [
    { name: 'React / Next.js', percent: 92 },
    { name: 'TypeScript', percent: 88 },
    { name: 'Tailwind CSS', percent: 95 },
    { name: 'Node.js / Express', percent: 75 },
    { name: 'PostgreSQL', percent: 68 },
    { name: 'Python / Django', percent: 60 }
  ];

  const gitCommits = [
    { msg: 'feat: implement real-time WebSocket chat stream for UniCollab', repo: 'arivera/unicollab-frontend', time: '3 hours ago' },
    { msg: 'fix: resolve PostgreSQL connection pool timeout issue', repo: 'arivera/social-connect-api', time: 'Yesterday' },
    { msg: 'docs: add comprehensive API documentation & OpenAPI specs', repo: 'arivera/datastream-analytics', time: '3 days ago' },
    { msg: 'refactor: optimize D3.js chart rendering performance', repo: 'arivera/datastream-analytics', time: '5 days ago' }
  ];

  const mentorshipHistory = [
    {
      mentor: 'Dr. Ananya Sharma',
      role: 'Senior AI Research Lead at Stanford',
      topic: 'AI Model Optimization & Transformer Architectures',
      date: 'Oct 18, 2026',
      rating: 5.0
    },
    {
      mentor: 'Prof. Rajesh Verma',
      role: 'UX Design Director',
      topic: 'Design Systems & High-Fidelity Figma Prototyping',
      date: 'Sep 28, 2026',
      rating: 4.9
    },
    {
      mentor: 'Priya Nair',
      role: 'Full Stack Architect',
      topic: 'Microservices Scaling & Redis Caching Strategies',
      date: 'Aug 14, 2026',
      rating: 5.0
    }
  ];

  const handleSaveProfile = (e) => {
    e.preventDefault();
    const newInitials = editName ? editName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) : 'AR';
    if (setUserProfile) {
      setUserProfile(prev => ({
        ...prev,
        name: editName,
        age: editAge,
        phone: editPhone,
        gender: editGender,
        major: editMajor,
        initials: newInitials
      }));
    }
    setIsEditing(false);
    alert('Profile updated successfully! Top right profile badge updated.');
  };

  return (
    <div className="page-container animate-fade-in">
      {/* Top Cover Banner */}
      <div className="profile-cover-banner">
        <button className="btn-edit-cover-glass" onClick={() => alert('Change cover image')}>
          <Edit3 size={13} /> Edit Cover
        </button>
      </div>

      {/* Header Profile Box */}
      <div className="profile-header-card">
        <div className="profile-header-flex">
          <div className="profile-avatar-wrapper">
            <div className="profile-avatar-large">
              {userProfile?.avatarUrl ? (
                <img src={userProfile.avatarUrl} alt="Profile" className="profile-avatar-img" />
              ) : (
                initials
              )}
            </div>
            
            {/* Camera Overlay Icon to Upload Profile Photo */}
            <label className="avatar-camera-btn" title="Change Profile Photo">
              <Camera size={14} />
              <input 
                type="file" 
                accept="image/*" 
                style={{ display: 'none' }}
                onChange={handleAvatarUpload}
              />
            </label>

            <span className="profile-online-dot"></span>
          </div>

          <div className="profile-name-details">
            <h2>{name}</h2>
            <p className="profile-subtitle">
              <span><Code size={14} /> {major} Major</span> • <span><MapPin size={14} /> San Francisco, CA</span> • <span><Calendar size={14} /> Age {age}</span>
            </p>
          </div>

          <div className="profile-header-actions">
            <button className="btn-secondary" onClick={() => alert('Profile link copied to clipboard!')}>
              <Share2 size={15} /> Share
            </button>
            <button className="btn-primary" onClick={() => setIsEditing(true)}>
              <Edit3 size={15} /> Edit Profile
            </button>
          </div>
        </div>
      </div>

      {/* Inline Modal for Edit Profile */}
      {isEditing && (
        <div className="modal-backdrop">
          <div className="modal-card animate-fade-in" style={{ maxWidth: '500px' }}>
            <div className="modal-header">
              <h3>Edit Profile Details</h3>
              <button className="close-btn" onClick={() => setIsEditing(false)}>✕</button>
            </div>
            <form onSubmit={handleSaveProfile} className="auth-form mt-4">
              <div className="form-group">
                <label>Full Name</label>
                <input 
                  type="text" 
                  required 
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                />
              </div>

              <div className="form-row-2col">
                <div className="form-group">
                  <label>Age</label>
                  <input 
                    type="number" 
                    required 
                    min="16"
                    max="99"
                    value={editAge}
                    onChange={(e) => setEditAge(e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <label>Gender</label>
                  <select 
                    className="select-input-auth"
                    value={editGender}
                    onChange={(e) => setEditGender(e.target.value)}
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Non-binary">Non-binary</option>
                    <option value="Prefer not to say">Prefer not to say</option>
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label>Phone Number</label>
                <input 
                  type="tel" 
                  required 
                  value={editPhone}
                  onChange={(e) => setEditPhone(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label>Department / Major</label>
                <select 
                  className="select-input-auth"
                  value={editMajor}
                  onChange={(e) => setEditMajor(e.target.value)}
                >
                  <option value="B.Tech Computer Science & Engineering (CSE)">B.Tech Computer Science & Engineering (CSE)</option>
                  <option value="B.Tech Information Technology (IT)">B.Tech Information Technology (IT)</option>
                  <option value="B.Tech Electronics & Communication (ECE)">B.Tech Electronics & Communication (ECE)</option>
                  <option value="B.Tech Artificial Intelligence & Data Science (AI & DS)">B.Tech Artificial Intelligence & Data Science (AI & DS)</option>
                  <option value="B.Tech Electrical & Electronics Engineering (EEE)">B.Tech Electrical & Electronics Engineering (EEE)</option>
                  <option value="B.Tech Mechanical Engineering (ME)">B.Tech Mechanical Engineering (ME)</option>
                  <option value="B.Tech Civil Engineering (CE)">B.Tech Civil Engineering (CE)</option>
                  <option value="B.Tech Robotics & Automation">B.Tech Robotics & Automation</option>
                  <option value="B.Tech Biotechnology">B.Tech Biotechnology</option>
                  <option value="B.Sc Computer Science / IT">B.Sc Computer Science / IT</option>
                  <option value="BCA / MCA">BCA / MCA</option>
                  <option value="M.Tech / M.S. Computer Science">M.Tech / M.S. Computer Science</option>
                  <option value="MBA / Management Studies">MBA / Management Studies</option>
                  <option value="Other Degree / Branch">Other Degree / Branch</option>
                </select>
              </div>

              <div className="modal-actions mt-4 flex gap-3">
                <button type="submit" className="btn-primary full-width">
                  Save & Update Top Header Profile
                </button>
                <button type="button" className="btn-secondary" onClick={() => setIsEditing(false)}>
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal for Edit About Section */}
      {isEditingAbout && (
        <div className="modal-backdrop">
          <div className="modal-card animate-fade-in" style={{ maxWidth: '540px' }}>
            <div className="modal-header">
              <h3>Edit About & Bio</h3>
              <button className="close-btn" onClick={() => setIsEditingAbout(false)}>✕</button>
            </div>
            <form onSubmit={handleSaveAbout} className="auth-form mt-4">
              <div className="form-group">
                <label>Bio Summary</label>
                <textarea 
                  rows={4}
                  className="form-textarea-auth"
                  value={aboutBio}
                  onChange={(e) => setAboutBio(e.target.value)}
                  placeholder="Tell others about your background, interests, and project goals..."
                />
              </div>

              <div className="form-group">
                <label>Personal Website</label>
                <input 
                  type="text" 
                  value={website}
                  onChange={(e) => setWebsite(e.target.value)}
                  placeholder="e.g. alexrivera.dev"
                />
              </div>

              <div className="form-row-2col">
                <div className="form-group">
                  <label>GitHub</label>
                  <input 
                    type="text" 
                    value={github}
                    onChange={(e) => setGithub(e.target.value)}
                    placeholder="github.com/username"
                  />
                </div>

                <div className="form-group">
                  <label>LinkedIn</label>
                  <input 
                    type="text" 
                    value={linkedin}
                    onChange={(e) => setLinkedin(e.target.value)}
                    placeholder="linkedin.com/in/username"
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Twitter / X</label>
                <input 
                  type="text" 
                  value={twitter}
                  onChange={(e) => setTwitter(e.target.value)}
                  placeholder="@username"
                />
              </div>

              <div className="modal-actions mt-4 flex gap-3">
                <button type="submit" className="btn-primary full-width">
                  Save About Section
                </button>
                <button type="button" className="btn-secondary" onClick={() => setIsEditingAbout(false)}>
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Main Grid: Left Details Sidebar, Right Projects & Activity */}
      <div className="profile-main-grid mt-6">
        {/* Left Column Sidebar */}
        <aside className="profile-left-col">
          {/* About Section */}
          <div className="profile-box">
            <div className="box-header-row flex align-center gap-2" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <h4 style={{ margin: 0 }}>About</h4>
              <button 
                className="add-icon-btn" 
                onClick={() => setIsEditingAbout(true)}
                title="Edit About Section"
                style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', padding: '4px 8px', borderRadius: '8px' }}
              >
                <Edit3 size={15} />
              </button>
            </div>

            <p className="about-text mt-2">
              {aboutBio}
            </p>

            <div className="social-links-list mt-4">
              <div className="social-item"><Globe size={15} /> <span>{website}</span></div>
              <div className="social-item"><Github size={15} /> <span>{github}</span></div>
              <div className="social-item"><Linkedin size={15} /> <span>{linkedin}</span></div>
              <div className="social-item"><Twitter size={15} /> <span>{twitter}</span></div>
            </div>
          </div>

          {/* Skills Section */}
          <div className="profile-box mt-6">
            <div className="box-header-row">
              <h4>Skills</h4>
              <button className="add-icon-btn"><Plus size={16} /></button>
            </div>

            <div className="skills-bars-stack mt-4">
              {skills.map((s, idx) => (
                <div key={idx} className="skill-progress-item">
                  <div className="skill-label-row">
                    <span className="skill-name">{s.name}</span>
                    <span className="skill-percent">{s.percent}%</span>
                  </div>
                  <div className="skill-track">
                    <div className="skill-fill" style={{ width: `${s.percent}%` }}></div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Achievements */}
          <div className="profile-box mt-6">
            <h4>Achievements</h4>
            <div className="achievements-list mt-4">
              <div className="achievement-item">
                <div className="achieve-icon gold"><Trophy size={16} /></div>
                <div>
                  <h5>Hackathon Winner 2023</h5>
                  <p>UniHack Global</p>
                </div>
              </div>

              <div className="achievement-item">
                <div className="achieve-icon green"><Zap size={16} /></div>
                <div>
                  <h5>Top Contributor</h5>
                  <p>OpenSource Hub</p>
                </div>
              </div>

              <div className="achievement-item">
                <div className="achieve-icon green"><CheckCircle2 size={16} /></div>
                <div>
                  <h5>Certified Developer</h5>
                  <p>AWS Academy</p>
                </div>
              </div>

              <div className="achievement-item">
                <div className="achieve-icon purple"><Award size={16} /></div>
                <div>
                  <h5>Dean's List</h5>
                  <p>Computer Science</p>
                </div>
              </div>
            </div>
          </div>

          {/* Stats Highlight Card */}
          <div className="profile-stats-card mt-6">
            <div className="stat-box-item">
              <span className="stat-lbl"><Users size={14} /> COLLABORATIONS</span>
              <span className="stat-num">42</span>
            </div>
            <div className="stat-box-item">
              <span className="stat-lbl"><Clock size={14} /> PROJECTS FINISHED</span>
              <span className="stat-num">18</span>
            </div>
            <div className="stat-box-item">
              <span className="stat-lbl"><GraduationCap size={14} /> MENTOR SESSIONS</span>
              <span className="stat-num">12</span>
            </div>
            <div className="stat-box-item">
              <span className="stat-lbl"><GitBranch size={14} /> OPEN SOURCE</span>
              <span className="stat-num">150+</span>
            </div>
          </div>
        </aside>

        {/* Right Main Content */}
        <main className="profile-right-col">
          {/* Main Navigation Tabs */}
          <div className="profile-tabs-row">
            <div className="profile-tabs">
              {['Portfolio', 'GitHub Activity', 'Mentorship'].map((t) => (
                <button 
                  key={t}
                  className={`prof-tab ${activeTab === t ? 'active' : ''}`}
                  onClick={() => setActiveTab(t)}
                >
                  {t}
                </button>
              ))}
            </div>

            <div className="tab-filters">
              <button className="btn-sm-outline">Filter</button>
              <button className="btn-sm-outline">Sort By</button>
            </div>
          </div>

          {activeTab === 'Portfolio' && (
            <div className="portfolio-content mt-6">
              <div className="section-title-row">
                <h3>Selected Projects</h3>
                <button className="text-link-blue" onClick={() => alert('Viewing all student projects')}>View All</button>
              </div>

              {/* 4 Selected Projects Grid */}
              <div className="portfolio-grid mt-4">
                {selectedProjects.map((p) => (
                  <div key={p.id} className="portfolio-card">
                    <div className="port-img-placeholder">
                      <div className="media-art-icon">🏞️</div>
                    </div>

                    <h4 className="port-title">{p.title}</h4>
                    <p className="port-desc">{p.desc}</p>

                    <div className="port-tags">
                      {p.tags.map((tg, i) => (
                        <span key={i} className="port-tag">{tg}</span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              {/* Recent Activity */}
              <div className="profile-activity-section mt-8">
                <h3>Recent Activity</h3>
                <div className="prof-activity-list mt-4">
                  <div className="prof-act-item">
                    <div className="prof-act-icon green"><CheckCircle2 size={16} /></div>
                    <div>
                      <p>Completed the <strong>UniCollab User Onboarding</strong> project task.</p>
                      <span className="time">2 hours ago</span>
                    </div>
                  </div>

                  <div className="prof-act-item">
                    <div className="prof-act-icon blue"><Plus size={16} /></div>
                    <div>
                      <p>Added <strong>Quantum Search Engine</strong> to your portfolio.</p>
                      <span className="time">Yesterday</span>
                    </div>
                  </div>

                  <div className="prof-act-item">
                    <div className="prof-act-icon purple"><Users size={16} /></div>
                    <div>
                      <p>Collaborated with <strong>Dr. Ananya Sharma</strong> on a new project.</p>
                      <span className="time">3 days ago</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'GitHub Activity' && (
            <div className="github-content mt-6">
              <div className="section-title-row">
                <h3>GitHub Commit & Live Repos</h3>
                <span className="text-sm text-muted">Connected to GitHub REST API</span>
              </div>

              {/* GitHub Search & Fetch Bar */}
              <div className="flex gap-2 mt-3 align-center">
                <input 
                  type="text" 
                  className="select-input-auth" 
                  placeholder="Enter GitHub username (e.g. vercel, facebook, octocat)"
                  value={ghUsername}
                  onChange={(e) => setGhUsername(e.target.value)}
                  style={{ maxWidth: '320px' }}
                />
                <button className="btn-sm-primary" onClick={() => fetchLiveGithubRepos(ghUsername)}>
                  {loadingRepos ? 'Fetching...' : 'Fetch Live Repos 🚀'}
                </button>
              </div>

              {/* Live GitHub Repos Grid */}
              {ghRepos.length > 0 && (
                <div className="gh-repos-grid mt-4 grid-2col gap-3">
                  {ghRepos.map((repo) => (
                    <div key={repo.id} className="portfolio-card p-3">
                      <div className="flex justify-between align-center">
                        <h4 className="port-title text-sm">{repo.name}</h4>
                        <span className="badge blue text-xs">⭐ {repo.stargazers_count}</span>
                      </div>
                      <p className="port-desc text-xs mt-1">{repo.description || 'Public repository'}</p>
                      <div className="flex justify-between align-center mt-3">
                        <span className="text-xs text-muted">Language: {repo.language || 'JavaScript'}</span>
                        <a href={repo.html_url} target="_blank" rel="noreferrer" className="text-xs text-blue bold">
                          View Code →
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Heatmap visual chart */}
              <div className="github-heatmap-card mt-6">
                <div className="heatmap-grid-weeks">
                  {Array.from({ length: 52 }).map((_, w) => (
                    <div key={w} className="heatmap-col">
                      {Array.from({ length: 7 }).map((_, d) => {
                        const level = (w + d) % 5;
                        return (
                          <span 
                            key={d} 
                            className={`heat-square level-${level}`}
                            title={`Activity on week ${w+1}, day ${d+1}`}
                          ></span>
                        );
                      })}
                    </div>
                  ))}
                </div>
                <div className="heatmap-legend mt-3">
                  <span className="text-xs text-muted">Less</span>
                  <span className="heat-square level-0"></span>
                  <span className="heat-square level-1"></span>
                  <span className="heat-square level-2"></span>
                  <span className="heat-square level-3"></span>
                  <span className="heat-square level-4"></span>
                  <span className="text-xs text-muted">More</span>
                </div>
              </div>

              {/* Commit feed */}
              <div className="commit-feed mt-6">
                <h4>Recent Commit Log</h4>
                <div className="commit-list mt-3">
                  {gitCommits.map((c, i) => (
                    <div key={i} className="commit-item-row">
                      <GitBranch size={16} className="text-blue" />
                      <div>
                        <p className="commit-msg">{c.msg}</p>
                        <span className="commit-repo">{c.repo} • {c.time}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'Mentorship' && (
            <div className="mentorship-content mt-6">
              <div className="section-title-row">
                <h3>Completed Mentorship Sessions</h3>
                <span className="text-sm bold text-blue">12 Hours Mentored</span>
              </div>

              <div className="mentor-sessions-stack mt-4">
                {mentorshipHistory.map((m, i) => (
                  <div key={i} className="mentor-history-card">
                    <div className="mentor-hist-avatar">
                      <User size={20} />
                    </div>
                    <div className="mentor-hist-info">
                      <h4>{m.topic}</h4>
                      <p className="mentor-hist-name">With <strong>{m.mentor}</strong> ({m.role})</p>
                      <span className="mentor-hist-date">{m.date}</span>
                    </div>
                    <div className="mentor-hist-rating">
                      <Star size={14} fill="#F59E0B" color="#F59E0B" />
                      <span>{m.rating}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Footer Bar */}
      <div className="profile-footer-bar mt-12">
        <div className="footer-left-brand">
          <Award size={16} className="text-blue" />
          <span className="brand-bold">UniCollab Pro</span>
        </div>

        <div className="footer-mid-links">
          <span>Privacy Policy</span>
          <span>Terms of Service</span>
          <span>Community Guidelines</span>
          <span>Help Center</span>
        </div>

        <div className="footer-right-socials">
          <Github size={15} />
          <Twitter size={15} />
          <Linkedin size={15} />
        </div>
      </div>
    </div>
  );
}
