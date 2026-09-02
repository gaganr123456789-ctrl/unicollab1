import React, { useState, useEffect, useRef } from 'react';
import { 
  Search, 
  Bell, 
  Sun, 
  Moon, 
  Clock, 
  Menu, 
  X, 
  User, 
  Settings, 
  LogOut, 
  ChevronDown, 
  Wifi, 
  WifiOff, 
  RefreshCw,
  Loader2,
  Users,
  Folder,
  Trophy,
  GraduationCap,
  ArrowRight
} from 'lucide-react';
import { socketService } from '../services/socketService';
import { apiClient } from '../services/apiClient';

export default function Header({ 
  currentPage, 
  setCurrentPage, 
  userProfile, 
  theme, 
  setTheme, 
  isMobileNavOpen, 
  onToggleMobileNav,
  searchQuery,
  setSearchQuery 
}) {
  const [time, setTime] = useState(new Date());
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState(() => {
    return socketService.connected ? 'connected' : 'connecting';
  });

  // Global Search Bar State
  const [searchTerm, setSearchTerm] = useState(searchQuery || '');
  const [searchResults, setSearchResults] = useState([]);
  const [groupedResults, setGroupedResults] = useState({ students: [], projects: [], hackathons: [], mentors: [] });
  const [totalMatches, setTotalMatches] = useState(0);
  const [isSearching, setIsSearching] = useState(false);
  const [isSearchDropdownOpen, setIsSearchDropdownOpen] = useState(false);

  const searchContainerRef = useRef(null);
  const searchDebounceRef = useRef(null);

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    // Ensure socket connection initialized
    socketService.connect(userProfile);

    const unsub = socketService.on('connection_change', (data) => {
      setConnectionStatus(data.status);
    });

    return () => unsub();
  }, [userProfile?.id, userProfile?.email]);

  // Sync external query prop
  useEffect(() => {
    if (searchQuery !== undefined && searchQuery !== searchTerm) {
      setSearchTerm(searchQuery);
    }
  }, [searchQuery]);

  // Handle outside click to close search dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target)) {
        setIsSearchDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Debounced search query
  const performSearch = async (queryText) => {
    const trimmed = (queryText || '').trim();
    if (!trimmed) {
      setSearchResults([]);
      setGroupedResults({ students: [], projects: [], hackathons: [], mentors: [] });
      setTotalMatches(0);
      setIsSearching(false);
      setIsSearchDropdownOpen(false);
      return;
    }

    setIsSearching(true);
    setIsSearchDropdownOpen(true);

    try {
      const data = await apiClient.globalSearch(trimmed);
      if (data.success) {
        setSearchResults(data.results || []);
        setGroupedResults(data.grouped || { students: [], projects: [], hackathons: [], mentors: [] });
        setTotalMatches(data.total || 0);
      } else {
        setSearchResults([]);
        setGroupedResults({ students: [], projects: [], hackathons: [], mentors: [] });
        setTotalMatches(0);
      }
    } catch (err) {
      console.warn('Search query error:', err);
    } finally {
      setIsSearching(false);
    }
  };

  const handleSearchInputChange = (e) => {
    const val = e.target.value;
    setSearchTerm(val);
    if (setSearchQuery) setSearchQuery(val);

    if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
    searchDebounceRef.current = setTimeout(() => {
      performSearch(val);
    }, 300);
  };

  const handleSearchKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      setIsSearchDropdownOpen(false);
      if (setSearchQuery) setSearchQuery(searchTerm);
      setCurrentPage('search');
    } else if (e.key === 'Escape') {
      setIsSearchDropdownOpen(false);
    }
  };

  const handleClearSearch = () => {
    setSearchTerm('');
    if (setSearchQuery) setSearchQuery('');
    setSearchResults([]);
    setGroupedResults({ students: [], projects: [], hackathons: [], mentors: [] });
    setTotalMatches(0);
    setIsSearchDropdownOpen(false);
  };

  const handleSelectResult = (item) => {
    setIsSearchDropdownOpen(false);
    if (item?.targetPage) {
      setCurrentPage(item.targetPage);
    }
  };

  const handleViewAllResults = () => {
    setIsSearchDropdownOpen(false);
    if (setSearchQuery) setSearchQuery(searchTerm);
    setCurrentPage('search');
  };

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
    'settings': 'Account Settings',
    'search': 'Search Results'
  };

  const name = userProfile?.name || (userProfile?.email ? userProfile.email.split('@')[0] : 'Student Member');
  const initials = userProfile?.initials || (name ? name.split(' ').filter(Boolean).map(n => n[0] || '').join('').toUpperCase().slice(0, 2) : 'ST') || 'ST';
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
        {/* Real-time Socket Connection Status Pill */}
        {connectionStatus === 'connected' ? (
          <div 
            className="header-live-sync-badge connected"
            title="Real-time WebSockets connected. Live chat & Kanban synchronization active."
          >
            <span className="live-sync-indicator-dot"></span>
            <span className="live-sync-label">Live Sync</span>
          </div>
        ) : connectionStatus === 'reconnecting' || connectionStatus === 'connecting' ? (
          <div 
            className="header-live-sync-badge reconnecting"
            title="Reconnecting to real-time server..."
          >
            <RefreshCw size={13} className="spin-icon" />
            <span className="live-sync-label">Reconnecting...</span>
          </div>
        ) : (
          <button 
            type="button"
            className="header-live-sync-badge offline"
            onClick={() => socketService.connect(userProfile)}
            title="Connection dropped. Click to reconnect immediately!"
          >
            <span className="live-sync-indicator-dot red"></span>
            <span className="live-sync-label">Offline • Reconnect</span>
          </button>
        )}

        {/* Real-time System Date & Clock Badge */}
        <div className="header-time-badge" title="Live system date & time according to your laptop">
          <Clock size={14} className="text-blue" />
          <span className="live-time-text">{liveTimeStr}</span>
          <span className="time-badge-divider">•</span>
          <span className="live-date-text">{liveDateStr}</span>
        </div>

        {/* Real-Time Global Search Bar with Live Dropdown */}
        <div className="header-search-bar" ref={searchContainerRef}>
          <Search size={16} className="search-icon" />
          <input 
            type="text" 
            placeholder="Search projects, students, skills..." 
            aria-label="Search projects, students, skills"
            value={searchTerm}
            onChange={handleSearchInputChange}
            onKeyDown={handleSearchKeyDown}
            onFocus={() => {
              if (searchTerm.trim()) setIsSearchDropdownOpen(true);
            }}
          />
          {searchTerm && (
            <button 
              type="button" 
              className="search-clear-btn" 
              onClick={handleClearSearch}
              title="Clear search"
            >
              <X size={14} />
            </button>
          )}
          {isSearching && (
            <div className="search-loading-indicator">
              <Loader2 size={14} className="spin-icon" />
            </div>
          )}

          {/* Live Search Results Dropdown Menu */}
          {isSearchDropdownOpen && searchTerm.trim() && (
            <div className="header-search-dropdown animate-fade-in">
              <div className="search-dropdown-header">
                <span className="search-dropdown-header-title">
                  {totalMatches > 0 ? `Found ${totalMatches} match${totalMatches === 1 ? '' : 'es'}` : 'Search Results'}
                </span>
                <span className="search-dropdown-hint">Press Enter to view all</span>
              </div>

              <div className="search-dropdown-body">
                {isSearching ? (
                  <div className="search-dropdown-loading">
                    <Loader2 size={20} className="spin-icon text-blue" />
                    <span>Searching database...</span>
                  </div>
                ) : totalMatches === 0 ? (
                  <div className="search-dropdown-empty">
                    <span>No results found for "<strong>{searchTerm}</strong>"</span>
                    <p className="search-dropdown-empty-sub">Try searching for a skill (React, Python), student name, or project title.</p>
                  </div>
                ) : (
                  <>
                    {/* Students / Teammates Group */}
                    {groupedResults.students.length > 0 && (
                      <div className="search-dropdown-group">
                        <div className="search-dropdown-group-title">
                          <Users size={13} /> Students & Teammates ({groupedResults.students.length})
                        </div>
                        {groupedResults.students.slice(0, 3).map((st) => (
                          <div 
                            key={`st_${st.id}`} 
                            className="search-dropdown-item"
                            onClick={() => handleSelectResult(st)}
                          >
                            <div className="search-item-avatar" style={{ background: st.avatarBg || '#2563EB' }}>
                              {(st.title || 'ST').split(' ').map(n => n[0]).join('').slice(0, 2)}
                            </div>
                            <div className="search-item-info">
                              <span className="search-item-title">{st.title}</span>
                              <span className="search-item-sub">{st.subtitle}</span>
                              {st.skills && st.skills.length > 0 && (
                                <div className="search-item-skills">
                                  {st.skills.slice(0, 3).map((sk, skIdx) => (
                                    <span key={skIdx} className="search-chip-tiny">{sk}</span>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Projects Group */}
                    {groupedResults.projects.length > 0 && (
                      <div className="search-dropdown-group">
                        <div className="search-dropdown-group-title">
                          <Folder size={13} /> Projects ({groupedResults.projects.length})
                        </div>
                        {groupedResults.projects.slice(0, 3).map((pr) => (
                          <div 
                            key={`pr_${pr.id}`} 
                            className="search-dropdown-item"
                            onClick={() => handleSelectResult(pr)}
                          >
                            <div className="search-item-icon-box project">
                              <Folder size={16} />
                            </div>
                            <div className="search-item-info">
                              <span className="search-item-title">{pr.title}</span>
                              <span className="search-item-sub">{pr.subtitle} • {pr.lead}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Hackathons Group */}
                    {groupedResults.hackathons.length > 0 && (
                      <div className="search-dropdown-group">
                        <div className="search-dropdown-group-title">
                          <Trophy size={13} /> Hackathons ({groupedResults.hackathons.length})
                        </div>
                        {groupedResults.hackathons.slice(0, 2).map((hk) => (
                          <div 
                            key={`hk_${hk.id}`} 
                            className="search-dropdown-item"
                            onClick={() => handleSelectResult(hk)}
                          >
                            <div className="search-item-icon-box hackathon">
                              <Trophy size={16} />
                            </div>
                            <div className="search-item-info">
                              <span className="search-item-title">{hk.title}</span>
                              <span className="search-item-sub">{hk.subtitle}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Mentors Group */}
                    {groupedResults.mentors.length > 0 && (
                      <div className="search-dropdown-group">
                        <div className="search-dropdown-group-title">
                          <GraduationCap size={13} /> Research Mentors ({groupedResults.mentors.length})
                        </div>
                        {groupedResults.mentors.slice(0, 2).map((mn) => (
                          <div 
                            key={`mn_${mn.id}`} 
                            className="search-dropdown-item"
                            onClick={() => handleSelectResult(mn)}
                          >
                            <div className="search-item-icon-box mentor">
                              <GraduationCap size={16} />
                            </div>
                            <div className="search-item-info">
                              <span className="search-item-title">{mn.title}</span>
                              <span className="search-item-sub">{mn.subtitle}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </>
                )}
              </div>

              {totalMatches > 0 && (
                <button 
                  type="button" 
                  className="search-dropdown-footer-btn"
                  onClick={handleViewAllResults}
                >
                  <span>View all {totalMatches} results on Search Page</span>
                  <ArrowRight size={14} />
                </button>
              )}
            </div>
          )}
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
              <span className="user-department">{major}</span>
              {uni && <span className="user-campus">{uni}</span>}
            </div>
            <ChevronDown size={14} className="profile-arrow-icon" />
          </div>

          {/* Quick Access Profile Popup Menu */}
          {isProfileDropdownOpen && (
            <>
              <div className="dropdown-overlay-transparent" onClick={() => setIsProfileDropdownOpen(false)}></div>
              <div className="header-profile-dropdown-menu animate-fade-in">
                <div className="dropdown-user-header">
                  <strong className="dropdown-user-name">{name}</strong>
                  <span className="dropdown-sub-dept">{major}</span>
                  {uni && <span className="dropdown-sub-uni">{uni}</span>}
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
