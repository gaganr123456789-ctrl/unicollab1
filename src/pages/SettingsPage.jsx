import React, { useState } from 'react';
import { apiClient } from '../services/apiClient.js';
import { 
  User, 
  Bell, 
  GraduationCap, 
  Shield, 
  Palette, 
  Save, 
  Eye, 
  EyeOff,
  CheckCircle2
} from 'lucide-react';

export default function SettingsPage({ userProfile, setUserProfile, setCurrentPage, theme, setTheme }) {
  const [activeTab, setActiveTab] = useState('account');
  const [savedSuccess, setSavedSuccess] = useState(false);

  // Account Settings Form State
  const [name, setName] = useState(userProfile?.name || (userProfile?.email ? userProfile.email.split('@')[0] : 'Student Member'));
  const [email, setEmail] = useState(userProfile?.email || 'student@university.edu');
  const [phone, setPhone] = useState(userProfile?.phone || '');
  const [gender, setGender] = useState(userProfile?.gender || 'Student');
  const [age, setAge] = useState(userProfile?.age || '21');

  // Password State
  const [currentPass, setCurrentPass] = useState('');
  const [newPass, setNewPass] = useState('');
  const [showPass, setShowPass] = useState(false);

  // Academic & Collaboration Settings State
  const [university, setUniversity] = useState(userProfile?.university || 'Stanford University');
  const [major, setMajor] = useState(userProfile?.major || 'Computer Science');
  const [gradYear, setGradYear] = useState('2027');
  const [availability, setAvailability] = useState('Open to Team Invites');
  const [skills, setSkills] = useState(['React', 'TypeScript', 'Node.js', 'Python', 'UI/UX Design']);
  const [newSkill, setNewSkill] = useState('');

  // Notification Preferences State
  const [notifTeamInvites, setNotifTeamInvites] = useState(true);
  const [notifDirectMessages, setNotifDirectMessages] = useState(true);
  const [notifHackathons, setNotifHackathons] = useState(true);
  const [notifWeeklyDigest, setNotifWeeklyDigest] = useState(false);

  // Privacy & Security State
  const [profileVisibility, setProfileVisibility] = useState('University Only');
  const [showOnlineStatus, setShowOnlineStatus] = useState(true);
  const [twoFactorAuth, setTwoFactorAuth] = useState(false);

  React.useEffect(() => {
    if (userProfile) {
      setName(userProfile.name || (userProfile.email ? userProfile.email.split('@')[0] : ''));
      setEmail(userProfile.email || '');
      setPhone(userProfile.phone || '');
      setGender(userProfile.gender || 'Student');
      setAge(userProfile.age || '');
      setUniversity(userProfile.university || '');
      setMajor(userProfile.major || userProfile.degree || '');
      if (Array.isArray(userProfile.skills) && userProfile.skills.length > 0) {
        setSkills(userProfile.skills);
      }
    }
  }, [userProfile]);

  const handleSaveSettings = async (e) => {
    e.preventDefault();
    const initials = name ? name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) : 'ST';
    
    const updatedUser = {
      ...userProfile,
      name: name,
      age: age,
      phone: phone,
      gender: gender,
      major: major,
      university: university,
      skills: skills,
      degree: userProfile?.degree?.startsWith('B.Tech') ? `B.Tech ${major}` : (userProfile?.degree || `B.Tech ${major}`),
      initials: initials
    };

    // 1. Update React app state
    if (setUserProfile) {
      setUserProfile(updatedUser);
    }

    // 2. Persist active user session locally
    if (typeof window !== 'undefined') {
      localStorage.setItem('unicollab_user', JSON.stringify(updatedUser));

      // 3. Update registered users database cache
      const cachedUsers = JSON.parse(localStorage.getItem('unicollab_registered_users') || '[]');
      const targetEmail = (userProfile?.email || '').toLowerCase().trim();
      const updatedCache = cachedUsers.map(u => {
        if ((targetEmail && u.email?.toLowerCase().trim() === targetEmail) || (userProfile?.id && String(u.id) === String(userProfile.id))) {
          return { ...u, ...updatedUser };
        }
        return u;
      });
      localStorage.setItem('unicollab_registered_users', JSON.stringify(updatedCache));
    }

    // 4. Update Backend API / Cloud Database
    try {
      await apiClient.updateProfile(updatedUser);
    } catch (err) {
      console.warn('Backend settings sync warning:', err);
    }

    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  const handleAddSkill = (e) => {
    e.preventDefault();
    if (newSkill.trim() && !skills.includes(newSkill.trim())) {
      setSkills([...skills, newSkill.trim()]);
      setNewSkill('');
    }
  };

  const handleRemoveSkill = (skillToRemove) => {
    setSkills(skills.filter(s => s !== skillToRemove));
  };

  const navItems = [
    { id: 'account', label: 'Account & Security', icon: User },
    { id: 'academic', label: 'Academic & Skills', icon: GraduationCap },
    { id: 'notifications', label: 'Notification Preferences', icon: Bell },
    { id: 'privacy', label: 'Privacy & Visibility', icon: Shield },
    { id: 'appearance', label: 'Appearance & Theme', icon: Palette },
  ];

  return (
    <div className="page-container animate-fade-in">
      {/* Settings Top Header Banner */}
      <div className="dash-top-bar">
        <div>
          <h1 className="dash-title">Account Settings</h1>
          <p className="dash-subtitle">
            Manage your UniCollab student profile, security, and notification preferences.
          </p>
        </div>

        <div className="dash-actions">
          {savedSuccess && (
            <div className="saved-toast-badge">
              <CheckCircle2 size={16} /> Changes Saved!
            </div>
          )}
          <button className="btn-primary" onClick={handleSaveSettings}>
            <Save size={16} />
            <span>Save All Changes</span>
          </button>
        </div>
      </div>

      {/* Main Settings Layout Grid */}
      <div className="settings-layout-grid mt-6">
        {/* Left Navigation Sidebar */}
        <aside className="settings-nav-card">
          <div className="settings-nav-list">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  className={`settings-nav-btn ${isActive ? 'active' : ''}`}
                  onClick={() => setActiveTab(item.id)}
                >
                  <Icon size={18} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </div>

          <div className="settings-quick-profile-box mt-6">
            <div className="quick-avatar-circle">
              {userProfile?.avatarUrl ? (
                <img src={userProfile.avatarUrl} alt="Avatar" className="avatar-circle-img" />
              ) : (
                userProfile?.initials || 'AR'
              )}
            </div>
            <div className="quick-user-info">
              <h5>{name}</h5>
              <p>{major} • {university}</p>
            </div>
            <button className="btn-secondary full-width mt-3 text-xs" onClick={() => setCurrentPage('profile')}>
              View Public Profile
            </button>
          </div>
        </aside>

        {/* Right Settings Content Section */}
        <main className="settings-content-card">
          <form onSubmit={handleSaveSettings}>
            {/* TAB 1: ACCOUNT & SECURITY */}
            {activeTab === 'account' && (
              <div className="settings-tab-pane animate-fade-in">
                <div className="pane-header">
                  <h3>Personal Information</h3>
                  <p>Update your personal identity details and contact information.</p>
                </div>

                <div className="form-group-stack mt-4">
                  <div className="form-row-2col">
                    <div className="form-group">
                      <label>Full Name</label>
                      <input 
                        type="text" 
                        required 
                        value={name} 
                        onChange={(e) => setName(e.target.value)} 
                        placeholder="e.g. Alex Rivera"
                      />
                    </div>

                    <div className="form-group">
                      <label>Academic Email</label>
                      <input 
                        type="email" 
                        required 
                        value={email} 
                        onChange={(e) => setEmail(e.target.value)} 
                        placeholder="name@university.edu"
                      />
                    </div>
                  </div>

                  <div className="form-row-2col">
                    <div className="form-group">
                      <label>Phone Number</label>
                      <input 
                        type="tel" 
                        value={phone} 
                        onChange={(e) => setPhone(e.target.value)} 
                        placeholder="+91 98765 43210"
                      />
                    </div>

                    <div className="form-row-2col">
                      <div className="form-group">
                        <label>Age</label>
                        <input 
                          type="number" 
                          min="16"
                          max="99"
                          value={age} 
                          onChange={(e) => setAge(e.target.value)} 
                        />
                      </div>

                      <div className="form-group">
                        <label>Gender</label>
                        <select 
                          className="select-input-auth"
                          value={gender}
                          onChange={(e) => setGender(e.target.value)}
                        >
                          <option value="Male">Male</option>
                          <option value="Female">Female</option>
                          <option value="Non-binary">Non-binary</option>
                          <option value="Prefer not to say">Prefer not to say</option>
                        </select>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Password Section */}
                <div className="pane-header mt-8 border-top pt-6">
                  <h3>Security & Password</h3>
                  <p>Manage your account password and security credentials.</p>
                </div>

                <div className="form-group-stack mt-4">
                  <div className="form-group">
                    <label>Current Password</label>
                    <div className="input-password-wrapper">
                      <input 
                        type={showPass ? "text" : "password"} 
                        value={currentPass} 
                        onChange={(e) => setCurrentPass(e.target.value)} 
                        placeholder="••••••••"
                      />
                      <button 
                        type="button" 
                        className="eye-btn" 
                        onClick={() => setShowPass(!showPass)}
                      >
                        {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  </div>

                  <div className="form-row-2col">
                    <div className="form-group">
                      <label>New Password</label>
                      <input 
                        type={showPass ? "text" : "password"} 
                        value={newPass} 
                        onChange={(e) => setNewPass(e.target.value)} 
                        placeholder="At least 8 characters"
                      />
                    </div>

                    <div className="form-group">
                      <label>Two-Factor Authentication (2FA)</label>
                      <div className="setting-toggle-box">
                        <div>
                          <strong>Enable SMS / Authenticator App 2FA</strong>
                          <p className="text-xs text-muted">Add an extra layer of security when logging in.</p>
                        </div>
                        <label className="toggle-switch">
                          <input 
                            type="checkbox" 
                            checked={twoFactorAuth} 
                            onChange={(e) => setTwoFactorAuth(e.target.checked)} 
                          />
                          <span className="toggle-slider"></span>
                        </label>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 2: ACADEMIC & SKILLS */}
            {activeTab === 'academic' && (
              <div className="settings-tab-pane animate-fade-in">
                <div className="pane-header">
                  <h3>Academic Profile</h3>
                  <p>Configure your institution, major, and graduation roadmap.</p>
                </div>

                <div className="form-group-stack mt-4">
                  <div className="form-row-2col">
                    <div className="form-group">
                      <label>University / Institution</label>
                      <input 
                        type="text" 
                        required 
                        value={university} 
                        onChange={(e) => setUniversity(e.target.value)} 
                      />
                    </div>

                    <div className="form-group">
                      <label>Department / Major</label>
                      <input 
                        type="text" 
                        required 
                        value={major} 
                        onChange={(e) => setMajor(e.target.value)} 
                      />
                    </div>
                  </div>

                  <div className="form-row-2col">
                    <div className="form-group">
                      <label>Expected Graduation Year</label>
                      <select 
                        className="select-input-auth"
                        value={gradYear}
                        onChange={(e) => setGradYear(e.target.value)}
                      >
                        <option value="2025">2025</option>
                        <option value="2026">2026</option>
                        <option value="2027">2027</option>
                        <option value="2028">2028</option>
                        <option value="2029">2029</option>
                      </select>
                    </div>

                    <div className="form-group">
                      <label>Teammate Status</label>
                      <select 
                        className="select-input-auth"
                        value={availability}
                        onChange={(e) => setAvailability(e.target.value)}
                      >
                        <option value="Open to Team Invites">Open to Team Invites</option>
                        <option value="Actively Recruiting Teammates">Actively Recruiting Teammates</option>
                        <option value="Available for Mentorship">Available for Mentorship</option>
                        <option value="Busy / Not Looking">Busy / Not Looking</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Skills Tags Section */}
                <div className="pane-header mt-8 border-top pt-6">
                  <h3>Skills & Technologies</h3>
                  <p>Add skills to help our AI match you with relevant projects and teammates.</p>
                </div>

                <div className="skills-manager-box mt-4">
                  <div className="skills-chip-wrap mb-4">
                    {skills.map((skill) => (
                      <span key={skill} className="settings-skill-chip">
                        {skill}
                        <button type="button" onClick={() => handleRemoveSkill(skill)}>✕</button>
                      </span>
                    ))}
                  </div>

                  <div className="add-skill-row flex gap-3">
                    <input 
                      type="text" 
                      placeholder="Add a new skill (e.g. Docker, GraphQL, Figma)..." 
                      value={newSkill} 
                      onChange={(e) => setNewSkill(e.target.value)} 
                    />
                    <button type="button" className="btn-secondary flex-shrink-0" onClick={handleAddSkill}>
                      + Add Skill
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 3: NOTIFICATION PREFERENCES */}
            {activeTab === 'notifications' && (
              <div className="settings-tab-pane animate-fade-in">
                <div className="pane-header">
                  <h3>Notification Preferences</h3>
                  <p>Choose when and how UniCollab alerts you about activities.</p>
                </div>

                <div className="toggle-list-stack mt-6">
                  <div className="setting-toggle-box">
                    <div>
                      <strong>Team Invites & Match Alerts</strong>
                      <p className="text-xs text-muted">Receive alerts when students invite you to join their project team.</p>
                    </div>
                    <label className="toggle-switch">
                      <input 
                        type="checkbox" 
                        checked={notifTeamInvites} 
                        onChange={(e) => setNotifTeamInvites(e.target.checked)} 
                      />
                      <span className="toggle-slider"></span>
                    </label>
                  </div>

                  <div className="setting-toggle-box mt-4">
                    <div>
                      <strong>Direct Messages & Team Chat</strong>
                      <p className="text-xs text-muted">Notify me when teammates or mentors send new messages.</p>
                    </div>
                    <label className="toggle-switch">
                      <input 
                        type="checkbox" 
                        checked={notifDirectMessages} 
                        onChange={(e) => setNotifDirectMessages(e.target.checked)} 
                      />
                      <span className="toggle-slider"></span>
                    </label>
                  </div>

                  <div className="setting-toggle-box mt-4">
                    <div>
                      <strong>Hackathon Hub & Deadline Reminders</strong>
                      <p className="text-xs text-muted">Get reminder alerts before hackathon submission deadlines.</p>
                    </div>
                    <label className="toggle-switch">
                      <input 
                        type="checkbox" 
                        checked={notifHackathons} 
                        onChange={(e) => setNotifHackathons(e.target.checked)} 
                      />
                      <span className="toggle-slider"></span>
                    </label>
                  </div>

                  <div className="setting-toggle-box mt-4">
                    <div>
                      <strong>Weekly Academic Research Digest</strong>
                      <p className="text-xs text-muted">Receive a weekly email summary of trending campus projects.</p>
                    </div>
                    <label className="toggle-switch">
                      <input 
                        type="checkbox" 
                        checked={notifWeeklyDigest} 
                        onChange={(e) => setNotifWeeklyDigest(e.target.checked)} 
                      />
                      <span className="toggle-slider"></span>
                    </label>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 4: PRIVACY & VISIBILITY */}
            {activeTab === 'privacy' && (
              <div className="settings-tab-pane animate-fade-in">
                <div className="pane-header">
                  <h3>Privacy & Profile Visibility</h3>
                  <p>Control who can view your profile and contact you.</p>
                </div>

                <div className="form-group-stack mt-6">
                  <div className="form-group">
                    <label>Profile Visibility</label>
                    <select 
                      className="select-input-auth"
                      value={profileVisibility}
                      onChange={(e) => setProfileVisibility(e.target.value)}
                    >
                      <option value="Public">Public (Visible to all students & mentors)</option>
                      <option value="University Only">University Only (Only students in my campus)</option>
                      <option value="Team Only">Team Only (Only my active teammates)</option>
                    </select>
                  </div>

                  <div className="setting-toggle-box mt-4">
                    <div>
                      <strong>Show Online Activity Status</strong>
                      <p className="text-xs text-muted">Display a green online indicator dot on your profile avatar.</p>
                    </div>
                    <label className="toggle-switch">
                      <input 
                        type="checkbox" 
                        checked={showOnlineStatus} 
                        onChange={(e) => setShowOnlineStatus(e.target.checked)} 
                      />
                      <span className="toggle-slider"></span>
                    </label>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 5: APPEARANCE & THEME */}
            {activeTab === 'appearance' && (
              <div className="settings-tab-pane animate-fade-in">
                <div className="pane-header">
                  <h3>Appearance & Theme</h3>
                  <p>Customize how UniCollab looks on your screen.</p>
                </div>

                <div className="theme-selection-grid mt-6">
                  <div 
                    className={`theme-card ${theme === 'light' ? 'active' : ''}`}
                    onClick={() => setTheme('light')}
                  >
                    <div className="theme-preview-box light-preview">
                      <div className="preview-header"></div>
                      <div className="preview-body">
                        <div className="preview-sidebar"></div>
                        <div className="preview-content"></div>
                      </div>
                    </div>
                    <div className="theme-card-footer">
                      <strong>Light Mode</strong>
                      <p className="text-xs text-muted">Clean & bright interface</p>
                    </div>
                  </div>

                  <div 
                    className={`theme-card ${theme === 'dark' ? 'active' : ''}`}
                    onClick={() => setTheme('dark')}
                  >
                    <div className="theme-preview-box dark-preview">
                      <div className="preview-header"></div>
                      <div className="preview-body">
                        <div className="preview-sidebar"></div>
                        <div className="preview-content"></div>
                      </div>
                    </div>
                    <div className="theme-card-footer">
                      <strong>Dark Mode</strong>
                      <p className="text-xs text-muted">Sleek, low-light dark aesthetic</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Bottom Save Action Row */}
            <div className="settings-footer-actions mt-8 border-top pt-6 flex justify-between align-center">
              <span className="text-xs text-muted">Last updated: Today</span>
              <div className="flex gap-3">
                <button type="button" className="btn-secondary" onClick={() => setCurrentPage('profile')}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  <Save size={16} /> Save Settings
                </button>
              </div>
            </div>
          </form>
        </main>
      </div>
    </div>
  );
}
