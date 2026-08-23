import React from 'react';
import { 
  LayoutDashboard, 
  Users, 
  Layers, 
  GraduationCap, 
  Bot, 
  BookOpen, 
  Trophy, 
  MessageSquare,
  User,
  ShieldCheck,
  Bell,
  Settings,
  LogOut
} from 'lucide-react';

export default function Sidebar({ currentPage, setCurrentPage, isMobileNavOpen, onCloseMobileNav }) {
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'find-teammates', label: 'Find Teammates', icon: Users },
    { id: 'workspace', label: 'Team Workspace', icon: Layers },
    { id: 'mentor-portal', label: 'Mentor Portal', icon: GraduationCap },
    { id: 'ai-assistant', label: 'AI Assistant', icon: Bot },
    { id: 'resource-library', label: 'Resource Library', icon: BookOpen },
    { id: 'hackathons', label: 'Hackathon Hub', icon: Trophy },
    { id: 'messages', label: 'Messages', icon: MessageSquare },
  ];

  const bottomItems = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'admin', label: 'Admin Portal', icon: ShieldCheck },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  const handleNavClick = (id) => {
    setCurrentPage(id);
    if (onCloseMobileNav) onCloseMobileNav();
  };

  return (
    <>
      {isMobileNavOpen && (
        <div className="sidebar-overlay-backdrop" onClick={onCloseMobileNav}></div>
      )}
      <aside className={`app-sidebar ${isMobileNavOpen ? 'mobile-open' : ''}`}>
        <div className="sidebar-brand" onClick={() => handleNavClick('landing')} style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px' }}>
          <img 
            src="/code-morphicx-logo.jpg" 
            alt="Code Morphicx Official Logo" 
            className="sidebar-morphicx-rounded-logo animate-pulse-gentle" 
            style={{ 
              width: '40px', 
              height: '40px', 
              borderRadius: '12px', 
              objectFit: 'cover', 
              border: '2px solid #2563EB', 
              boxShadow: '0 0 12px rgba(37, 99, 235, 0.3)',
              flexShrink: 0 
            }} 
          />
          <div className="sidebar-brand-text-col" style={{ display: 'flex', flexDirection: 'column' }}>
            <span className="sidebar-logo-text" style={{ fontSize: '18px', fontWeight: 800 }}>UniCollab</span>
            <span className="sidebar-sub-brand" style={{ fontSize: '11px', fontWeight: 700, color: '#64748B' }}>
              Designed by <strong style={{ color: '#2563EB', fontWeight: 800 }}>Code Morphicx</strong>
            </span>
          </div>
        </div>

        <nav className="sidebar-nav">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentPage === item.id;
            return (
              <button
                key={item.id}
                className={`sidebar-link ${isActive ? 'active' : ''}`}
                onClick={() => handleNavClick(item.id)}
                style={{ position: 'relative' }}
              >
                <Icon size={18} />
                <span style={{ flex: 1 }}>{item.label}</span>
                {item.id === 'messages' && (
                  <span style={{
                    background: '#2563EB',
                    color: 'white',
                    fontSize: '10px',
                    fontWeight: 800,
                    padding: '1px 6px',
                    borderRadius: '9999px',
                    marginLeft: 'auto'
                  }}>
                    Live
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        <div className="sidebar-bottom-nav">
          {bottomItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentPage === item.id;
            return (
              <button
                key={item.id}
                className={`sidebar-link ${isActive ? 'active' : ''}`}
                onClick={() => handleNavClick(item.id)}
              >
                <Icon size={18} />
                <span>{item.label}</span>
              </button>
            );
          })}
          
          <button className="sidebar-link logout-link" onClick={() => handleNavClick('landing')}>
            <LogOut size={18} />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>
    </>
  );
}
