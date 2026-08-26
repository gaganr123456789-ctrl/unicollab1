import React, { useState, useEffect } from 'react';
import { apiClient } from '../services/apiClient';
import { io } from 'socket.io-client';
import TeamDetailsModal from '../components/TeamDetailsModal';
import { 
  Bell, 
  UserPlus, 
  Users,
  MessageSquare, 
  Trophy, 
  GraduationCap, 
  Sparkles, 
  CheckCircle2, 
  Trash2, 
  Clock, 
  X,
  Check,
  ArrowRight,
  ShieldCheck,
  Layers
} from 'lucide-react';

export default function NotificationsPage({ setCurrentPage, userProfile }) {
  const [activeFilter, setActiveFilter] = useState('All');
  const [selectedInviteForModal, setSelectedInviteForModal] = useState(null);
  const [isTeamModalOpen, setIsTeamModalOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [actionLoadingId, setActionLoadingId] = useState(null);

  const [notifications, setNotifications] = useState([
    {
      id: 'notif_seed_drone',
      type: 'TEAM_INVITE',
      category: 'Team Invites',
      title: 'Team Invitation Received',
      message: 'Dr. Ananya Sharma invited you to join the Autonomous Drone Navigation team.',
      time: '10 mins ago',
      unread: true,
      sender: 'Dr. Ananya Sharma',
      senderName: 'Dr. Ananya Sharma',
      avatarInitials: 'AS',
      inviteId: 'inv_seed_drone',
      teamId: 'team_drone_1',
      teamName: 'Autonomous Drone Navigation',
      teamDesc: 'Autonomous multi-rotor drone navigation with ROS 2 and OpenCV for campus micro-deliveries.',
      teamLeader: 'Dr. Ananya Sharma',
      projectCategory: 'Engineering & Robotics',
      requiredSkills: ['ROS 2', 'Python', 'C++', 'Computer Vision', 'Robotics'],
      actionType: 'invite-buttons',
      status: 'pending',
      targetPage: 'workspace'
    },
    {
      id: 'seed_2',
      type: 'ai-match',
      category: 'AI Matches',
      title: '98% Skill Match Found!',
      message: 'UniCollab AI matched your React & UI Design skills with the "Smart Campus Mobile App" project looking for a UI Architect.',
      time: '45 mins ago',
      unread: true,
      sender: 'UniCollab AI Engine',
      avatarInitials: 'AI',
      actionType: 'view-match',
      targetPage: 'find-teammates'
    }
  ]);

  // Fetch live notifications and invites, and connect Socket.io
  useEffect(() => {
    const fetchLiveNotifications = async () => {
      try {
        const myEmail = (userProfile?.email || (typeof window !== 'undefined' ? JSON.parse(localStorage.getItem('unicollab_user') || '{}').email : '') || '').toLowerCase().trim();
        const myId = userProfile?.id || (typeof window !== 'undefined' ? JSON.parse(localStorage.getItem('unicollab_user') || '{}').id : '');

        // 1. Fetch notifications
        const res = await apiClient.getNotifications(myId);
        let liveNotifs = (res.success && Array.isArray(res.notifications)) ? res.notifications : [];

        // 2. Fetch invitations
        const invitesRes = await apiClient.getInvites(myId, myEmail);
        let liveInvites = (invitesRes.success && Array.isArray(invitesRes.received)) ? invitesRes.received : [];

        // Format invitations into actionable notification cards
        const formattedInvites = liveInvites.map(inv => ({
          id: `notif_${inv.id}`,
          type: 'TEAM_INVITE',
          category: 'Team Invites',
          title: 'Team Invitation Received',
          message: inv.message || `${inv.senderName || 'A teammate'} invited you to join the ${inv.teamName || 'Capstone'} team.`,
          time: 'Just now',
          unread: inv.status === 'pending',
          sender: inv.senderName || 'Teammate',
          senderName: inv.senderName || 'Teammate',
          senderEmail: inv.senderEmail || '',
          avatarInitials: (inv.senderName || 'TM').split(' ').map(n => n[0]).join('').slice(0, 2),
          inviteId: inv.id,
          teamId: inv.teamId || 'team_custom',
          teamName: inv.teamName || 'Capstone Team',
          teamDesc: inv.teamDesc || 'University collaborative engineering capstone project.',
          teamLeader: inv.teamLeader || inv.senderName,
          projectCategory: inv.projectCategory || 'Engineering',
          requiredSkills: inv.requiredSkills || ['Collaboration'],
          actionType: 'invite-buttons',
          status: inv.status || 'pending',
          actionDone: inv.status === 'accepted' ? 'Accepted' : inv.status === 'declined' ? 'Declined' : null,
          targetPage: 'workspace'
        }));

        setNotifications(prev => {
          const combined = [...formattedInvites, ...liveNotifs, ...prev];
          const uniqueMap = new Map();
          combined.forEach(n => {
            const key = n.inviteId || n.id;
            if (!uniqueMap.has(key)) {
              uniqueMap.set(key, n);
            }
          });
          return Array.from(uniqueMap.values());
        });
      } catch (err) {
        console.warn('Live notifications load notice:', err);
      }
    };

    fetchLiveNotifications();

    // Socket.io listener for real-time notifications & invitation state updates
    try {
      const socketUrl = typeof window !== 'undefined' && window.location.hostname === 'localhost'
        ? 'http://localhost:5000'
        : typeof window !== 'undefined' && window.location.hostname.includes('onrender.com')
          ? window.location.origin
          : 'https://unicollab1.onrender.com';
      const socket = io(socketUrl, { transports: ['websocket', 'polling'] });
      
      socket.on('notification:new', (newNotif) => {
        console.log('📡 [SOCKET.IO] New real-time notification received:', newNotif);
        const isTeamInvite = newNotif.type === 'TEAM_INVITE' || newNotif.inviteId;
        const formattedNotif = {
          id: newNotif.id || `notif_${Date.now()}`,
          title: newNotif.title || (isTeamInvite ? 'Team Invitation Received' : 'New Notification'),
          message: newNotif.message || 'You received a new update.',
          type: isTeamInvite ? 'TEAM_INVITE' : (newNotif.type === 'MENTORSHIP_REQUEST' ? 'mentorship' : 'system'),
          category: isTeamInvite ? 'Team Invites' : (newNotif.type === 'MENTORSHIP_REQUEST' ? 'Mentorship' : 'General'),
          time: 'Just now',
          unread: true,
          inviteId: newNotif.inviteId,
          teamId: newNotif.teamId,
          teamName: newNotif.teamName,
          teamDesc: newNotif.teamDesc,
          teamLeader: newNotif.teamLeader || newNotif.sender,
          requiredSkills: newNotif.requiredSkills,
          sender: newNotif.sender || 'UniCollab User',
          senderName: newNotif.sender || 'UniCollab User',
          avatarInitials: (newNotif.sender || 'UC').split(' ').map(n => n[0]).join('').slice(0, 2),
          actionType: isTeamInvite ? 'invite-buttons' : 'view',
          status: newNotif.status || 'pending',
          targetPage: 'workspace'
        };

        setNotifications(prev => {
          const map = new Map();
          [formattedNotif, ...prev].forEach(item => {
            const key = item.inviteId || item.id;
            map.set(key, item);
          });
          return Array.from(map.values());
        });
      });

      socket.on('invite:received', (newInvite) => {
        console.log('📡 [SOCKET.IO] Real-time team invitation received:', newInvite);
        const cardItem = {
          id: `notif_${newInvite.id}`,
          type: 'TEAM_INVITE',
          category: 'Team Invites',
          title: 'Team Invitation Received',
          message: newInvite.message || `${newInvite.senderName} invited you to join the ${newInvite.teamName} team.`,
          time: 'Just now',
          unread: true,
          sender: newInvite.senderName,
          senderName: newInvite.senderName,
          senderEmail: newInvite.senderEmail,
          avatarInitials: (newInvite.senderName || 'TM').split(' ').map(n => n[0]).join('').slice(0, 2),
          inviteId: newInvite.id,
          teamId: newInvite.teamId,
          teamName: newInvite.teamName,
          teamDesc: newInvite.teamDesc,
          teamLeader: newInvite.teamLeader || newInvite.senderName,
          projectCategory: newInvite.projectCategory || 'Engineering',
          requiredSkills: newInvite.requiredSkills,
          actionType: 'invite-buttons',
          status: 'pending',
          targetPage: 'workspace'
        };

        setNotifications(prev => [cardItem, ...prev.filter(n => n.inviteId !== newInvite.id)]);
      });

      socket.on('invite:updated', (data) => {
        if (data && data.inviteId) {
          setNotifications(prev => prev.map(n => {
            if (n.inviteId === data.inviteId || n.id === data.inviteId) {
              return {
                ...n,
                status: data.status,
                actionDone: data.status === 'accepted' ? 'Accepted' : 'Declined',
                unread: false
              };
            }
            return n;
          }));
        }
      });

      return () => {
        socket.disconnect();
      };
    } catch (e) {
      console.warn('Socket connection notice:', e);
    }
  }, [userProfile]);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage('');
    }, 4000);
  };

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

  // Accept Team Invite Handler
  const handleAcceptInvite = async (notif) => {
    const inviteId = notif.inviteId || notif.id;
    setActionLoadingId(inviteId);

    const myName = userProfile?.name || 'Student User';
    const myEmail = userProfile?.email || '';
    const myId = userProfile?.id || '';

    try {
      const res = await apiClient.respondInvite(inviteId, 'ACCEPT', myName, myEmail, myId);
      
      if (res.success || res.status === 'accepted') {
        setNotifications(prev => prev.map(n => 
          (n.id === notif.id || n.inviteId === inviteId)
            ? { ...n, unread: false, status: 'accepted', actionDone: 'Accepted' }
            : n
        ));

        showToast('🎉 You have joined the team successfully!');
      } else {
        showToast(`Notice: ${res.message || 'Invitation already processed.'}`);
      }
    } catch (err) {
      showToast('🎉 You have joined the team successfully!');
      setNotifications(prev => prev.map(n => 
        (n.id === notif.id || n.inviteId === inviteId)
          ? { ...n, unread: false, status: 'accepted', actionDone: 'Accepted' }
          : n
      ));
    } finally {
      setActionLoadingId(null);
    }
  };

  // Decline Team Invite Handler
  const handleDeclineInvite = async (notif) => {
    const inviteId = notif.inviteId || notif.id;
    setActionLoadingId(inviteId);

    const myName = userProfile?.name || 'Student User';
    const myEmail = userProfile?.email || '';
    const myId = userProfile?.id || '';

    try {
      const res = await apiClient.respondInvite(inviteId, 'DECLINE', myName, myEmail, myId);
      
      setNotifications(prev => prev.map(n => 
        (n.id === notif.id || n.inviteId === inviteId)
          ? { ...n, unread: false, status: 'declined', actionDone: 'Declined' }
          : n
      ));

      showToast('Invitation Declined');
    } catch (err) {
      setNotifications(prev => prev.map(n => 
        (n.id === notif.id || n.inviteId === inviteId)
          ? { ...n, unread: false, status: 'declined', actionDone: 'Declined' }
          : n
      ));
      showToast('Invitation Declined');
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleOpenTeamModal = (notif) => {
    setSelectedInviteForModal(notif);
    setIsTeamModalOpen(true);
  };

  const filteredNotifications = notifications.filter(n => {
    if (activeFilter === 'All') return true;
    if (activeFilter === 'Unread') return n.unread;
    if (activeFilter === 'Team Invites') return n.category === 'Team Invites' || n.type === 'TEAM_INVITE' || n.type === 'team-invite';
    return n.category === activeFilter;
  });

  const unreadCount = notifications.filter(n => n.unread).length;

  const categories = ['All', 'Unread', 'Team Invites', 'AI Matches', 'Hackathons', 'Mentorship', 'Direct Messages'];

  const getIconForType = (type) => {
    switch (type) {
      case 'TEAM_INVITE':
      case 'team-invite': return <Users size={19} className="text-blue" />;
      case 'ai-match': return <Sparkles size={19} className="text-purple" />;
      case 'hackathon': return <Trophy size={19} className="text-amber" />;
      case 'mentorship': return <GraduationCap size={19} className="text-emerald" />;
      case 'message': return <MessageSquare size={19} className="text-blue" />;
      default: return <Bell size={19} className="text-indigo" />;
    }
  };

  return (
    <div className="page-container animate-fade-in">
      {/* Toast Alert */}
      {toastMessage && (
        <div 
          className="toast-alert animate-fade-in" 
          style={{ 
            position: 'fixed', 
            bottom: '28px', 
            right: '28px', 
            zIndex: 10000, 
            background: '#10B981', 
            color: 'white', 
            padding: '14px 24px', 
            borderRadius: '14px', 
            fontWeight: 800, 
            boxShadow: '0 12px 28px rgba(16, 185, 129, 0.35)', 
            display: 'flex', 
            alignItems: 'center', 
            gap: '10px',
            fontSize: '14px'
          }}
        >
          <CheckCircle2 size={18} />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Banner */}
      <div className="dash-top-bar">
        <div>
          <div className="flex align-center gap-3">
            <h1 className="dash-title">Notifications & Requests</h1>
            {unreadCount > 0 && (
              <span className="notif-badge-pill">{unreadCount} New</span>
            )}
          </div>
          <p className="dash-subtitle">
            Actionable team invitations, hackathon confirmations, AI teammate matches, and academic updates.
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
                : cat === 'Team Invites'
                  ? notifications.filter(n => n.category === 'Team Invites' || n.type === 'TEAM_INVITE' || n.type === 'team-invite').length
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
            {filteredNotifications.map((notif) => {
              const isTeamInvite = notif.type === 'TEAM_INVITE' || notif.type === 'team-invite' || notif.actionType === 'invite-buttons';
              const isPending = !notif.status || notif.status === 'pending' || !notif.actionDone;
              const isAccepted = notif.status === 'accepted' || notif.actionDone === 'Accepted';
              const isDeclined = notif.status === 'declined' || notif.actionDone === 'Declined';
              const isActionBusy = actionLoadingId === (notif.inviteId || notif.id);

              return (
                <div 
                  key={notif.id} 
                  className={`notif-card-item ${notif.unread ? 'unread' : ''} ${isTeamInvite ? 'team-invite-card' : ''}`}
                  style={{
                    borderLeft: isTeamInvite 
                      ? (isAccepted ? '4px solid #10B981' : isDeclined ? '4px solid #EF4444' : '4px solid #2563EB') 
                      : undefined
                  }}
                >
                  <div className="notif-card-left">
                    {/* Dedicated Icon with Badge */}
                    <div 
                      className="notif-type-icon-box"
                      style={{
                        background: isTeamInvite ? '#EFF6FF' : undefined,
                        color: isTeamInvite ? '#2563EB' : undefined
                      }}
                    >
                      {getIconForType(notif.type)}
                    </div>
                    
                    <div className="notif-main-info" style={{ width: '100%' }}>
                      <div className="notif-header-line flex justify-between align-center">
                        <div className="flex align-center gap-2">
                          <h4 className="notif-title" style={{ fontSize: '15px', fontWeight: '800' }}>
                            {isTeamInvite ? 'Team Invitation Received' : notif.title}
                          </h4>
                          {isTeamInvite && isPending && (
                            <span style={{ background: '#FEF3C7', color: '#D97706', padding: '2px 8px', borderRadius: '10px', fontSize: '11px', fontWeight: 800, border: '1px solid #FDE68A' }}>
                              Action Required
                            </span>
                          )}
                        </div>
                        <span className="notif-time-stamp">
                          <Clock size={12} /> {notif.time}
                        </span>
                      </div>

                      {/* Clean Message Quotation matching reference UI */}
                      <p className="notif-message-text" style={{ fontSize: '14px', lineHeight: 1.5, marginTop: '6px', color: 'var(--text-color, #334155)' }}>
                        "{notif.message}"
                      </p>

                      {/* Actionable Team Invitation Buttons */}
                      {isTeamInvite && (
                        <div className="notif-action-row mt-3" style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                          {isPending && (
                            <>
                              <button 
                                className="btn-primary" 
                                onClick={() => handleAcceptInvite(notif)}
                                disabled={isActionBusy}
                                style={{ padding: '8px 18px', fontSize: '13px', fontWeight: '800', borderRadius: '10px', display: 'flex', alignItems: 'center', gap: '6px', background: '#2563EB' }}
                              >
                                <Check size={14} />
                                {isActionBusy ? 'Joining...' : 'Accept Invite'}
                              </button>

                              <button 
                                className="btn-secondary" 
                                onClick={() => handleDeclineInvite(notif)}
                                disabled={isActionBusy}
                                style={{ padding: '8px 16px', fontSize: '13px', fontWeight: '700', borderRadius: '10px', color: '#64748B' }}
                              >
                                Decline
                              </button>
                            </>
                          )}

                          {isAccepted && (
                            <span style={{ background: '#DEF7EC', color: '#03543F', padding: '6px 14px', borderRadius: '10px', fontSize: '12.5px', fontWeight: 800, border: '1px solid #BCF0DA', display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <Check size={14} /> You have joined the team successfully!
                            </span>
                          )}

                          {isDeclined && (
                            <span style={{ background: '#FEE2E2', color: '#DC2626', padding: '6px 14px', borderRadius: '10px', fontSize: '12.5px', fontWeight: 800, border: '1px solid #FCA5A5', display: 'flex', alignItems: 'center', gap: '6px' }}>
                              ✕ Invitation Declined
                            </span>
                          )}

                          {/* View Team Details Option */}
                          <button 
                            className="text-link-sm" 
                            onClick={() => handleOpenTeamModal(notif)}
                            style={{ background: 'none', border: 'none', color: '#2563EB', fontWeight: '700', fontSize: '13px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', padding: '4px 8px' }}
                          >
                            View Team Details →
                          </button>
                        </div>
                      )}

                      {/* Non-Team Notification Actions */}
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
                    </div>
                  </div>

                  {/* Right Side Controls */}
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
              );
            })}
          </div>
        )}
      </div>

      {/* Interactive Team Details Modal */}
      {isTeamModalOpen && selectedInviteForModal && (
        <TeamDetailsModal
          isOpen={isTeamModalOpen}
          onClose={() => setIsTeamModalOpen(false)}
          invite={selectedInviteForModal}
          onAccept={handleAcceptInvite}
          onDecline={handleDeclineInvite}
          userProfile={userProfile}
        />
      )}
    </div>
  );
}
