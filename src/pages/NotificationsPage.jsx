import React, { useState, useEffect } from 'react';
import { apiClient } from '../services/apiClient';
import { io } from 'socket.io-client';
import { 
  Bell, 
  UserPlus, 
  MessageSquare, 
  Trophy, 
  GraduationCap, 
  Sparkles, 
  CheckCircle2, 
  Trash2, 
  Clock, 
  X,
  Check
} from 'lucide-react';

export default function NotificationsPage({ setCurrentPage }) {
  const [activeFilter, setActiveFilter] = useState('All');
  const [notifications, setNotifications] = useState([
    {
      id: 'seed_1',
      type: 'team-invite',
      category: 'Team Invites',
      title: 'Team Invitation Received',
      message: 'Dr. Ananya Sharma invited you to join the Autonomous Drone Navigation research project team as Lead Full-Stack Developer.',
      time: '10 minutes ago',
      unread: true,
      sender: 'Dr. Ananya Sharma',
      avatarInitials: 'AS',
      actionType: 'invite-buttons',
      targetPage: 'workspace'
    },
    {
      id: 'seed_2',
      type: 'ai-match',
      category: 'AI Matches',
      title: '98% Skill Match Found!',
      message: 'UniCollab AI matched your React & UI Design skills with the "Smart Campus Mobile App" project looking for a UI Architect.',
      time: '45 minutes ago',
      unread: true,
      sender: 'UniCollab AI Engine',
      avatarInitials: 'AI',
      actionType: 'view-match',
      targetPage: 'find-teammates'
    }
  ]);

  // Fetch live notifications and connect Socket.io
  useEffect(() => {
    const fetchLiveNotifications = async () => {
      try {
        const res = await apiClient.getNotifications();
        if (res.success && Array.isArray(res.notifications) && res.notifications.length > 0) {
          setNotifications(prev => {
            const combined = [...res.notifications, ...prev];
            return Array.from(new Map(combined.map(n => [n.id, n])).values());
          });
        }
      } catch (err) {
        console.warn('Live notifications load error:', err);
      }
    };
    fetchLiveNotifications();

    // Socket.io listener for real-time notifications
    try {
      const socketUrl = typeof window !== 'undefined' && window.location.hostname === 'localhost'
        ? 'http://localhost:5000'
        : typeof window !== 'undefined' && window.location.hostname.includes('onrender.com')
          ? window.location.origin
          : 'https://unicollab1.onrender.com';
      const socket = io(socketUrl, { transports: ['websocket', 'polling'] });
      
      socket.on('notification:new', (newNotif) => {
        console.log('📡 [SOCKET.IO] New real-time notification received:', newNotif);
        const formattedNotif = {
          id: newNotif.id || `notif_${Date.now()}`,
          title: newNotif.title || 'New Notification',
          message: newNotif.message || 'You received a new update.',
          type: newNotif.type === 'MENTORSHIP_REQUEST' ? 'mentorship' : 'team-invite',
          category: newNotif.type === 'MENTORSHIP_REQUEST' ? 'Mentorship' : 'Team Invites',
          time: 'Just now',
          unread: true,
          inviteId: newNotif.inviteId,
          sender: newNotif.sender || 'UniCollab User',
          avatarInitials: (newNotif.sender || 'UC').split(' ').map(n => n[0]).join('').slice(0, 2),
          actionType: newNotif.inviteId ? 'invite-buttons' : 'view'
        };

        setNotifications(prev => [formattedNotif, ...prev]);
      });

      return () => {
        socket.disconnect();
      };
    } catch (e) {
      console.warn('Socket connection warning:', e);
    }
  }, []);

  const handleMarkAllRead = () => {
    setNotifications(notifications.map(n => ({ ...n, unread: false })));
  };

  const handleClearAll = () => {
    setNotifications([]);
  };

  const handleToggleRead = (id) => {
    setNotifications(notifications.map(n => n.id === id ? { ...n, unread: !n.unread } : n));
  };

  const handleDeleteNotification = (id) => {
    setNotifications(notifications.filter(n => n.id !== id));
  };

  const handleAcceptInvite = async (notif) => {
    const inviteId = notif.inviteId || notif.id;
    const res = await apiClient.respondInvite(inviteId, 'ACCEPT');
    
    setNotifications(notifications.map(n => n.id === notif.id ? { ...n, unread: false, actionDone: 'Accepted' } : n));
    if (setCurrentPage) {
      setCurrentPage('workspace');
    }
  };

  const handleDeclineInvite = async (notif) => {
    const inviteId = notif.inviteId || notif.id;
    const res = await apiClient.respondInvite(inviteId, 'DECLINE');

    setNotifications(notifications.map(n => n.id === notif.id ? { ...n, unread: false, actionDone: 'Declined' } : n));
  };

  const filteredNotifications = notifications.filter(n => {
    if (activeFilter === 'All') return true;
    if (activeFilter === 'Unread') return n.unread;
    return n.category === activeFilter;
  });

  const unreadCount = notifications.filter(n => n.unread).length;

  const categories = ['All', 'Unread', 'Team Invites', 'AI Matches', 'Hackathons', 'Mentorship', 'Direct Messages'];

  const getIconForType = (type) => {
    switch (type) {
      case 'team-invite': return <UserPlus size={18} className="text-blue" />;
      case 'ai-match': return <Sparkles size={18} className="text-purple" />;
      case 'hackathon': return <Trophy size={18} className="text-amber" />;
      case 'mentorship': return <GraduationCap size={18} className="text-emerald" />;
      case 'message': return <MessageSquare size={18} className="text-blue" />;
      default: return <Bell size={18} className="text-indigo" />;
    }
  };

  return (
    <div className="page-container animate-fade-in">
      {/* Top Banner */}
      <div className="dash-top-bar">
        <div>
          <div className="flex align-center gap-3">
            <h1 className="dash-title">Notifications</h1>
            {unreadCount > 0 && (
              <span className="notif-badge-pill">{unreadCount} New</span>
            )}
          </div>
          <p className="dash-subtitle">
            Stay updated with team invites, hackathon deadlines, AI matches, and mentorship session confirmations.
          </p>
        </div>

        <div className="dash-actions">
          <button className="btn-secondary" onClick={handleMarkAllRead} disabled={unreadCount === 0}>
            <CheckCircle2 size={16} />
            <span>Mark All as Read</span>
          </button>
          <button className="btn-secondary" onClick={handleClearAll} disabled={notifications.length === 0}>
            <Trash2 size={16} />
            <span>Clear All</span>
          </button>
        </div>
      </div>

      {/* Filter Tabs Row */}
      <div className="notif-filter-bar mt-6">
        <div className="notif-tabs-scroll">
          {categories.map((cat) => {
            const count = cat === 'Unread' 
              ? unreadCount 
              : cat === 'All' 
                ? notifications.length 
                : notifications.filter(n => n.category === cat).length;

            return (
              <button
                key={cat}
                className={`notif-tab-btn ${activeFilter === cat ? 'active' : ''}`}
                onClick={() => setActiveFilter(cat)}
              >
                <span>{cat}</span>
                <span className="tab-count-tag">{count}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Notifications Stream Feed */}
      <div className="notif-stream-container mt-6">
        {filteredNotifications.length === 0 ? (
          <div className="notif-empty-state">
            <div className="empty-icon-circle">
              <Bell size={32} />
            </div>
            <h4>No Notifications Found</h4>
            <p>You're all caught up! Check back later for new team invites and campus updates.</p>
          </div>
        ) : (
          <div className="notif-list-stack">
            {filteredNotifications.map((notif) => (
              <div key={notif.id} className={`notif-card-item ${notif.unread ? 'unread' : ''}`}>
                <div className="notif-card-left">
                  <div className="notif-type-icon-box">
                    {getIconForType(notif.type)}
                  </div>
                  
                  <div className="notif-main-info">
                    <div className="notif-header-line">
                      <h4 className="notif-title">{notif.title}</h4>
                      <span className="notif-time-stamp">
                        <Clock size={12} /> {notif.time}
                      </span>
                    </div>

                    <p className="notif-message-text">{notif.message}</p>

                    {/* Contextual Action Buttons */}
                    {notif.type === 'team-invite' && (
                      <div className="notif-action-row mt-3">
                        {notif.actionDone ? (
                          <span className="badge-accepted">✓ {notif.actionDone}</span>
                        ) : (
                          <>
                            <button className="btn-sm-primary" onClick={() => handleAcceptInvite(notif)}>
                              Accept Invite
                            </button>
                            <button className="btn-sm-secondary" onClick={() => handleDeclineInvite(notif)}>
                              Decline
                            </button>
                          </>
                        )}
                        <button className="text-link-sm" onClick={() => setCurrentPage(notif.targetPage)}>
                          View Team Details →
                        </button>
                      </div>
                    )}

                    {notif.type === 'ai-match' && (
                      <div className="notif-action-row mt-3">
                        <button className="btn-sm-primary" onClick={() => setCurrentPage('find-teammates')}>
                          View AI Teammate Matches →
                        </button>
                      </div>
                    )}

                    {notif.type === 'hackathon' && (
                      <div className="notif-action-row mt-3">
                        <button className="btn-sm-primary" onClick={() => setCurrentPage('hackathons')}>
                          Go to Hackathon Hub →
                        </button>
                      </div>
                    )}

                    {(notif.type === 'mentorship' || notif.type === 'message') && (
                      <div className="notif-action-row mt-3">
                        <button className="btn-sm-primary" onClick={() => setCurrentPage('messages')}>
                          Open Chat & Messages →
                        </button>
                      </div>
                    )}

                    {notif.type === 'workspace' && (
                      <div className="notif-action-row mt-3">
                        <button className="btn-sm-primary" onClick={() => setCurrentPage('workspace')}>
                          Open Team Workspace Board →
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Right Side Options */}
                <div className="notif-card-right">
                  <button 
                    className="notif-icon-opt" 
                    onClick={() => handleToggleRead(notif.id)}
                    title={notif.unread ? "Mark as read" : "Mark as unread"}
                  >
                    <CheckCircle2 size={16} className={notif.unread ? "text-blue" : "text-muted"} />
                  </button>

                  <button 
                    className="notif-icon-opt hover-red" 
                    onClick={() => handleDeleteNotification(notif.id)}
                    title="Delete notification"
                  >
                    <X size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
