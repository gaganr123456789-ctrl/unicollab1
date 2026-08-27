import React, { useState, useEffect } from 'react';
import { Search, Bell, Sun, Moon, Clock, Menu, X, User, Settings, LogOut, ChevronDown } from 'lucide-react';

export default function Header({ currentPage, setCurrentPage, userProfile, theme, setTheme, isMobileNavOpen, onToggleMobileNav }) {
  const [time, setTime] = useState(new Date());
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const liveDateStr = time.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  const liveTimeStr = time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });

  const pageTitles = {
    'dashboard': 'Dashboard',
    'find-teammates': 'Find Teammates',
    'workspace': 'Team Workspace',
    'mentor-portal': 'Mentor Portal',
    'ai-assistant': 'AI Assistant',
    'resource-library': 'Resource Library',
    'hackathons': 'Hackathon Hub',
    'messages': 'Messages & Chat',
    'profile': 'Student Profile',
    'notifications': 'Notifications',
    'settings': 'Account Settings'
  };

  const name = userProfile?.name || (userProfile?.email ? userProfile.email.split('@')[0] : 'Student Member');
  const initials = userProfile?.initials || name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || 'ST';
  const major = userProfile?.major || userProfile?.degree || 'Engineering';
  const uni = userProfile?.university || 'Campus Network';

  const handleDropdownNavigate = (pageId) => {
    setCurrentPage(pageId);
    setIsProfileDropdownOpen(false);
  };

  return (
    <header className="dash-header">
      <div className="dash-breadcrumb flex align-center gap-2">
        <button 
          className="mobile-menu-btn" 
          onClick={onToggleMobileNav}
          title="Toggle Navigation Menu"
          aria-label="Toggle Navigation Menu"
        >
          {isMobileNavOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
        <span className="breadcrumb-path" onClick={() => setCurrentPage('landing')}>Home</span>
        <span className="breadcrumb-separator">/</span>
        <span className="breadcrumb-current">{pageTitles[currentPage] || 'Dashboard'}</span>
      </div>

      <div className="dash-header-actions">
        {/* Real-time System Date & Clock Badge */}
        <div className="header-time-badge" title="Live system date & time according to your laptop">
          <Clock size={14} className="text-blue" />
          <span className="live-time-text">{liveTimeStr}</span>
          <span className="live-date-text">{liveDateStr}</span>
        </div>

        <div className="header-search-bar">
          <Search size={16} className="search-icon" />
          <input 
            type="text" 
            placeholder="Search projects, students, skills..." 
            aria-label="Search projects, students, skills"
          />
        </div>

        {/* Theme Switcher Button */}
        <button 
          className="icon-btn theme-toggle-btn" 
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`}
          aria-label={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`}
        >
          {theme === 'dark' ? <Sun size={18} className="theme-icon sun" /> : <Moon size={18} className="theme-icon moon" />}
        </button>

        <button 
          className="icon-btn" 
          onClick={() => handleDropdownNavigate('notifications')} 
          title="View Notifications"
          aria-label="View Notifications"
        >
          <Bell size={18} />
          <span className="notification-dot"></span>
        </button>

        {/* User Profile Badge with Interactive Mobile-Friendly Dropdown Menu */}
        <div className="header-user-menu-wrapper">
          <div 
            className="user-profile-badge" 
            onClick={() => setIsProfileDropdownOpen(!isProfileDropdownOpen)}
            title="Account Menu (Profile, Settings, Notifications, Sign Out)"
          >
            <div className="avatar-circle">
              {userProfile?.avatarUrl ? (
                <img src={userProfile.avatarUrl} alt="Avatar" className="avatar-circle-img" />
              ) : (
                initials
              )}
            </div>
            <div className="user-info">
              <span className="user-name">{name}</span>
              <span className="user-role">{major} • {uni}</span>
            </div>
            <ChevronDown size={14} className="profile-arrow-icon" />
          </div>

          {/* Quick Access Profile Popup Menu */}
          {isProfileDropdownOpen && (
            <>
              <div className="dropdown-overlay-transparent" onClick={() => setIsProfileDropdownOpen(false)}></div>
              <div className="header-profile-dropdown-menu animate-fade-in">
                <div className="dropdown-user-header">
                  <strong>{name}</strong>
                  <span className="dropdown-sub-text">{major} • {uni}</span>
                </div>
                <div className="dropdown-divider"></div>
                <button className="dropdown-menu-item" onClick={() => handleDropdownNavigate('profile')}>
                  <User size={16} /> Student Profile
                </button>
                <button className="dropdown-menu-item" onClick={() => handleDropdownNavigate('notifications')}>
                  <Bell size={16} /> Notifications
                </button>
                <button className="dropdown-menu-item" onClick={() => handleDropdownNavigate('settings')}>
                  <Settings size={16} /> Account Settings
                </button>
                <div className="dropdown-divider"></div>
                <button className="dropdown-menu-item danger" onClick={() => {
                  if (typeof window !== 'undefined') {
                    localStorage.removeItem('unicollab_token');
                    localStorage.removeItem('unicollab_user');
                    localStorage.removeItem('unicollab_sso_provider');
                  }
                  handleDropdownNavigate('landing');
                }}>
                  <LogOut size={16} /> Sign Out
                </button>
              </div>
            </>
          )}
        </div>

        {/* Prominent Code Morphicx Logo Emblem Badge from Image 2 */}
        <div className="header-badge-wrapper" title="Designed by Code Morphicx">
          <img 
            src="/assets/badge.png" 
            alt="Code Morphicx Official Logo" 
            className="header-badge-highlighted" 
            onError={(e) => { e.target.style.display = 'none'; }}
          />
        </div>
      </div>
    </header>
  );
}
