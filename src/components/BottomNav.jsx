import React from 'react';
import { 
  LayoutDashboard, 
  Users, 
  Layers, 
  MessageSquare, 
  User
} from 'lucide-react';

export default function BottomNav({ currentPage, setCurrentPage }) {
  const tabs = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'find-teammates', label: 'Teammates', icon: Users },
    { id: 'workspace', label: 'Workspace', icon: Layers },
    { id: 'messages', label: 'Messages', icon: MessageSquare, isLive: true },
    { id: 'profile', label: 'Profile', icon: User }
  ];

  return (
    <nav className="mobile-bottom-nav">
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = currentPage === tab.id;

        return (
          <button
            key={tab.id}
            onClick={() => setCurrentPage(tab.id)}
            className={`mobile-bottom-nav-item ${isActive ? 'active' : ''}`}
            aria-label={tab.label}
          >
            <div className="mobile-nav-icon-box">
              <Icon size={20} className="mobile-nav-icon" />
              {tab.isLive && (
                <span className="mobile-nav-badge-dot" />
              )}
            </div>
            <span className="mobile-nav-label">{tab.label}</span>
          </button>
        );
      })}
    </nav>
  );
}
