import React, { useState, useEffect } from 'react';
import { apiClient } from '../services/apiClient';
import { io } from 'socket.io-client';
import InviteTeammateModal from '../components/InviteTeammateModal';
import { 
  Share2, 
  Video, 
  Search, 
  Filter, 
  CheckCircle2, 
  Clock, 
  MessageSquare, 
  Layers,
  Edit2,
  Trash2,
  Plus,
  UserPlus,
  Users
} from 'lucide-react';

const INITIAL_KANBAN_TASKS = [
  {
    id: 1,
    column: 'todo',
    title: 'Setup CI/CD Pipeline',
    desc: 'Configure GitHub Actions for automated deployment.',
    priority: 'HIGH',
    comments: 3,
    date: 'Oct 24'
  },
  {
    id: 2,
    column: 'todo',
    title: 'User Research Synthesis',
    desc: 'Analyze interview transcripts from first testing round.',
    priority: 'MEDIUM',
    comments: 4,
    date: 'Oct 28'
  },
  {
    id: 3,
    column: 'in_progress',
    title: 'Mobile Navigation Polish',
    desc: 'Fixing spacing issues on the hamburger menu.',
    priority: 'MEDIUM',
    comments: 2,
    date: 'Oct 22'
  },
  {
    id: 4,
    column: 'in_progress',
    title: 'REST API Authentication System',
    desc: 'Backend Node.js & Express REST endpoints.',
    priority: 'HIGH',
    comments: 5,
    date: 'Oct 26'
  },
  {
    id: 5,
    column: 'review',
    title: 'Database Schema Finalization',
    desc: 'Final check of the ER diagram before migration.',
    priority: 'HIGH',
    comments: 5,
    date: 'Oct 19'
  },
  {
    id: 6,
    column: 'completed',
    title: 'Project Kickoff Meeting',
    desc: 'Internal wiki page setup and initial roadmap.',
    priority: 'LOW',
    comments: 8,
    date: 'Oct 10'
  }
];

export default function WorkspacePage({ userProfile, onOpenChat }) {
  const [activeTab, setActiveTab] = useState('Kanban Board');
  const [searchQuery, setSearchQuery] = useState('');
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [teamMembers, setTeamMembers] = useState([
    { id: 'tm_3', name: 'Alex Thompson', role: 'Project Lead & Full Stack', email: 'alex.thompson@stanford.edu', dept: 'Computer Science • Senior', avatarBg: 'blue', initials: 'AT' },
    { id: 'tm_4', name: 'Sarah Chen', role: 'Backend Engineer', email: 'sarah.chen@stanford.edu', dept: 'Computer Science • Junior', avatarBg: 'green', initials: 'SC' },
    { id: 'tm_5', name: 'Marcus Johnson', role: 'UI/UX Design Lead', email: 'marcus.johnson@stanford.edu', dept: 'Digital Media • Senior', avatarBg: 'purple', initials: 'MJ' }
  ]);
  
  // Persistent Tasks State from LocalStorage with Server Sync
  const [tasks, setTasks] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('unicollab_kanban_tasks');
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed) && parsed.length > 0) return parsed;
        } catch (e) {}
      }
    }
    return INITIAL_KANBAN_TASKS;
  });

  // Save to LocalStorage whenever tasks update
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('unicollab_kanban_tasks', JSON.stringify(tasks));
    }
  }, [tasks]);

  // Load from Backend API and Listen for newly joined team members
  useEffect(() => {
    const fetchServerTasks = async () => {
      try {
        const res = await apiClient.getTasks();
        if (res.success && Array.isArray(res.tasks) && res.tasks.length > 0) {
          setTasks(prev => {
            const serverTasks = res.tasks.map(t => ({
              id: t.id,
              column: t.column || 'todo',
              title: t.title,
              desc: t.desc || t.description || 'Task deliverable.',
              priority: (t.priority || 'Medium').toUpperCase(),
              comments: t.comments || 0,
              date: t.date || 'Today'
            }));
            const map = new Map();
            [...serverTasks, ...prev].forEach(task => map.set(task.id, task));
            return Array.from(map.values());
          });
        }
      } catch (err) {
        console.warn('Task load notice:', err);
      }
    };
    fetchServerTasks();

    const fetchTeamRoster = async () => {
      try {
        const res = await apiClient.getTeamDetails('team_fintrack_2');
        if (res.success && res.team && Array.isArray(res.team.members) && res.team.members.length > 0) {
          setTeamMembers(res.team.members.map(m => ({
            id: m.id || m.userId,
            name: m.name || 'Team Member',
            role: m.role || 'Contributor',
            email: m.email || '',
            dept: m.degree || 'Engineering • Collaborator',
            avatarBg: 'blue',
            initials: (m.name || 'TM').split(' ').map(n => n[0]).join('').slice(0, 2)
          })));
        }
      } catch (e) {}
    };
    fetchTeamRoster();

    // Socket listener for new team members
    try {
      const socketUrl = typeof window !== 'undefined' && window.location.hostname === 'localhost'
        ? 'http://localhost:5000'
        : typeof window !== 'undefined' && window.location.hostname.includes('onrender.com')
          ? window.location.origin
          : 'https://unicollab1.onrender.com';
      const socket = io(socketUrl, { transports: ['websocket', 'polling'] });

      socket.on('team:member_joined', (data) => {
        if (data && data.memberName) {
          setTeamMembers(prev => {
            if (prev.some(m => m.name === data.memberName)) return prev;
            return [...prev, {
              id: `tm_${Date.now()}`,
              name: data.memberName,
              role: 'Collaborator (New)',
              email: '',
              dept: 'Engineering • Collaborator',
              avatarBg: 'green',
              initials: data.memberName.split(' ').map(n => n[0]).join('').slice(0, 2)
            }];
          });
        }
      });

      return () => socket.disconnect();
    } catch (e) {}
  }, []);

  const moveTask = (taskId, newCol) => {
    setTasks(prev => prev.map(t => t.id === taskId ? { ...t, column: newCol } : t));
  };

  const addTask = async (col) => {
    const title = prompt('Enter task title:');
    if (!title || !title.trim()) return;
    const desc = prompt('Enter task description (optional):') || 'Task deliverable item.';
    const priority = prompt('Enter priority (HIGH / MEDIUM / LOW):', 'MEDIUM')?.toUpperCase() || 'MEDIUM';

    const newTask = {
      id: Date.now(),
      column: col,
      title: title.trim(),
      desc: desc.trim(),
      priority: ['HIGH', 'MEDIUM', 'LOW'].includes(priority) ? priority : 'MEDIUM',
      comments: 0,
      date: 'Today'
    };

    setTasks(prev => [...prev, newTask]);

    try {
      await apiClient.createTask(newTask);
    } catch (e) {}
  };

  const editTask = (task) => {
    const newTitle = prompt('Edit task title:', task.title);
    if (!newTitle || !newTitle.trim()) return;
    const newDesc = prompt('Edit description:', task.desc) || task.desc;
    const newPriority = prompt('Edit priority (HIGH / MEDIUM / LOW):', task.priority)?.toUpperCase() || task.priority;

    setTasks(prev => prev.map(t => t.id === task.id ? {
      ...t,
      title: newTitle.trim(),
      desc: newDesc.trim(),
      priority: ['HIGH', 'MEDIUM', 'LOW'].includes(newPriority) ? newPriority : t.priority
    } : t));
  };

  const deleteTask = (taskId) => {
    if (confirm('Are you sure you want to delete this task?')) {
      setTasks(prev => prev.filter(t => t.id !== taskId));
    }
  };

  const columns = [
    { id: 'todo', title: 'Backlog / To Do', color: '#64748B' },
    { id: 'in_progress', title: 'In Progress', color: '#2563EB' },
    { id: 'review', title: 'Peer Review', color: '#7C3AED' },
    { id: 'completed', title: 'Completed', color: '#10B981' }
  ];

  const handleExportCSV = () => {
    const headers = "ID,Title,Description,Priority,Column,Date\n";
    const rows = tasks.map(t => `"${t.id}","${t.title.replace(/"/g, '""')}","${t.desc.replace(/"/g, '""')}","${t.priority}","${t.column}","${t.date}"`).join("\n");
    const blob = new Blob([headers + rows], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'unicollab_workspace_tasks.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  const filteredTasks = tasks.filter(t => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase().trim();
    return t.title.toLowerCase().includes(q) || t.desc.toLowerCase().includes(q) || t.priority.toLowerCase().includes(q);
  });

  return (
    <div className="page-container animate-fade-in">
      {/* Workspace Header */}
      <div className="workspace-header-card">
        <div className="ws-title-row">
          <div className="ws-title-group">
            <div className="ws-logo-box">
              <Layers size={20} />
            </div>
            <div>
              <div className="ws-title-flex">
                <h2>Project: FinTrack Mobile</h2>
                <span className="phase-badge green">Active Phase</span>
              </div>
              <p className="ws-subtitle">Internal FinTech collaboration platform for senior capstone project.</p>
            </div>
          </div>

          <div className="ws-actions flex gap-2">
            <button className="btn-secondary" onClick={handleExportCSV} title="Download CSV task report">
              📊 Export CSV
            </button>
            <button className="btn-secondary" onClick={() => alert('Share space link copied!')}>
              <Share2 size={16} /> Share Space
            </button>
            <button className="btn-primary" onClick={() => alert('Starting Zoom/Huddle meeting...')}>
              <Video size={16} /> Start Meeting
            </button>
          </div>
        </div>

        {/* Tab & Progress Row */}
        <div className="ws-nav-progress-row mt-4">
          <div className="ws-tabs">
            {['Kanban Board', 'Timeline', 'Teammates'].map((tab) => (
              <button 
                key={tab} 
                className={`ws-tab ${activeTab === tab ? 'active' : ''}`}
                onClick={() => setActiveTab(tab)}
              >
                {tab}
              </button>
            ))}
          </div>

          <div className="ws-progress-inline">
            <span>Progress <strong>68%</strong></span>
            <div className="ws-progress-bar">
              <div className="ws-progress-fill" style={{ width: '68%' }}></div>
            </div>
          </div>
        </div>
      </div>

      {activeTab === 'Kanban Board' && (
        <div className="kanban-area mt-6">
          {/* Toolbar */}
          <div className="kanban-toolbar">
            <div className="input-with-icon search-sm">
              <Search size={15} />
              <input 
                type="text" 
                placeholder="Search tasks..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            <div className="toolbar-actions">
              <button className="btn-sm-outline" onClick={() => setSearchQuery('')}><Filter size={14} /> Clear Filter</button>
              <span className="text-sm text-muted">Displaying <strong>{filteredTasks.length}</strong> tasks (Auto-saved)</span>
            </div>
          </div>

          {/* Columns Grid */}
          <div className="kanban-columns-grid mt-4">
            {columns.map((col) => {
              const colTasks = filteredTasks.filter(t => t.column === col.id);
              return (
                <div key={col.id} className="kanban-col">
                  <div className="col-header">
                    <div className="col-title-flex">
                      <span className="col-dot" style={{ background: col.color }}></span>
                      <h4>{col.title}</h4>
                      <span className="task-count">{colTasks.length}</span>
                    </div>
                    <button className="add-task-icon-btn" onClick={() => addTask(col.id)} title="Add Task">+</button>
                  </div>

                  <div className="task-cards-stack">
                    {colTasks.map((t) => (
                      <div key={t.id} className="task-card">
                        <div className="task-card-top flex justify-between align-center">
                          <span className={`priority-badge ${t.priority.toLowerCase()}`}>{t.priority}</span>
                          <div className="flex gap-1">
                            <button onClick={() => editTask(t)} className="icon-btn-micro" title="Edit task">
                              <Edit2 size={12} />
                            </button>
                            <button onClick={() => deleteTask(t.id)} className="icon-btn-micro text-danger" title="Delete task">
                              <Trash2 size={12} />
                            </button>
                          </div>
                        </div>
                        <h4 className="task-title">{t.title}</h4>
                        <p className="task-desc">{t.desc}</p>

                        <div className="task-meta">
                          <span className="meta-item"><MessageSquare size={13} /> {t.comments}</span>
                          <span className="meta-item"><Clock size={13} /> {t.date}</span>
                        </div>

                        {/* Move Task Quick Select */}
                        <div className="move-task-row">
                          <span className="move-task-label">Move:</span>
                          {columns.filter(c => c.id !== col.id).map(c => (
                            <button 
                              key={c.id} 
                              className="move-pill-btn"
                              onClick={() => moveTask(t.id, c.id)}
                            >
                              {c.title.split(' ')[0]}
                            </button>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>

                  <button className="btn-add-task-full" onClick={() => addTask(col.id)}>
                    + Add Task
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {activeTab === 'Timeline' && (
        <div className="timeline-view mt-6">
          <div className="timeline-header-row flex justify-between align-center">
            <div>
              <h3>Project Timeline & Milestones</h3>
              <p className="subtext">Track progress, deliverables, and upcoming release phases</p>
            </div>
            <button className="btn-sm-primary" onClick={() => alert('Opening milestone creation form...')}>
              + Add Milestone
            </button>
          </div>

          <div className="timeline-roadmap-card mt-6">
            <div className="roadmap-track-line"></div>

            {/* Step 1: Milestone 1 (Completed) */}
            <div className="roadmap-step done">
              <div className="step-node-circle done">
                <CheckCircle2 size={18} />
              </div>
              <div className="step-content-box">
                <div className="step-top-badge-row">
                  <span className="step-status-pill green">COMPLETED</span>
                  <span className="step-date">Oct 15, 2026</span>
                </div>
                <h4 className="step-title">Milestone 1: Prototype & High-Fidelity Wireframes</h4>
                <p className="step-desc">
                  Finalized Figma design system, core user flow diagrams, and student dashboard interactive prototype.
                </p>
                <div className="step-meta-footer mt-3">
                  <span className="meta-lead">Lead: Marcus Johnson (UI/UX)</span>
                  <span className="meta-progress green">100% Delivered</span>
                </div>
              </div>
            </div>

            {/* Step 2: Milestone 2 (In Progress) */}
            <div className="roadmap-step active">
              <div className="step-node-circle active">
                <Clock size={18} />
              </div>
              <div className="step-content-box active-border">
                <div className="step-top-badge-row">
                  <span className="step-status-pill blue">IN PROGRESS</span>
                  <span className="step-date">Due Oct 30, 2026</span>
                </div>
                <h4 className="step-title">Milestone 2: REST API & Mobile Navigation Integration</h4>
                <p className="step-desc">
                  Integrating authentication endpoints, task export service, and live WebSocket notification updates.
                </p>
                <div className="step-progress-row mt-3">
                  <div className="progress-info">
                    <span>Overall Completion</span>
                    <strong>68%</strong>
                  </div>
                  <div className="progress-track">
                    <div className="progress-fill" style={{ width: '68%' }}></div>
                  </div>
                </div>
                <div className="step-meta-footer mt-3">
                  <span className="meta-lead">Lead: Sarah Chen (Backend) & Alex Thompson (Lead)</span>
                </div>
              </div>
            </div>

            {/* Step 3: Milestone 3 (Scheduled) */}
            <div className="roadmap-step pending">
              <div className="step-node-circle pending">
                <span className="node-number">3</span>
              </div>
              <div className="step-content-box">
                <div className="step-top-badge-row">
                  <span className="step-status-pill grey">UPCOMING</span>
                  <span className="step-date">Scheduled Nov 15, 2026</span>
                </div>
                <h4 className="step-title">Milestone 3: Beta Testing, Security Audit & Demo Release</h4>
                <p className="step-desc">
                  University Capstone Showcase submission, load testing, and student beta testing feedback collection.
                </p>
                <div className="step-meta-footer mt-3">
                  <span className="meta-lead">Lead: Entire Capstone Team</span>
                  <span className="meta-progress grey">Phase 3</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'Teammates' && (
        <div className="teammates-view mt-6">
          <div className="section-title-row flex justify-between align-center" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h3>FinTrack Mobile Team Members</h3>
              <span className="text-xs text-muted font-bold">{teamMembers.length} Active Members</span>
            </div>
            <button 
              className="btn-primary" 
              onClick={() => setIsInviteModalOpen(true)}
              style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', fontWeight: '800', borderRadius: '12px' }}
            >
              <UserPlus size={15} /> + Invite Classmate
            </button>
          </div>

          <div className="tm-workspace-grid mt-4" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '16px' }}>
            {teamMembers.map((tm) => (
              <div key={tm.id} className="tm-workspace-card" style={{ background: 'var(--surface-color, white)', borderRadius: '18px', padding: '20px', border: '1px solid var(--border-color, #E2E8F0)' }}>
                <div className="tm-ws-avatar-row flex justify-between align-center">
                  <div style={{ width: '44px', height: '44px', borderRadius: '50%', background: '#EFF6FF', color: '#2563EB', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '800', fontSize: '16px' }}>
                    {tm.initials || tm.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                  </div>
                  <span style={{ background: '#DEF7EC', color: '#03543F', padding: '3px 8px', borderRadius: '8px', fontSize: '11px', fontWeight: 800 }}>● Active</span>
                </div>
                <h4 className="tm-ws-name mt-3" style={{ fontSize: '16px', fontWeight: '800', margin: '8px 0 2px' }}>{tm.name}</h4>
                <p className="tm-ws-role" style={{ fontSize: '13px', color: '#2563EB', fontWeight: '700', margin: 0 }}>{tm.role}</p>
                <span className="tm-ws-dept" style={{ fontSize: '12px', color: '#64748B', display: 'block', margin: '4px 0 14px' }}>{tm.dept || 'Engineering'}</span>
                
                <button 
                  className="btn-sm-primary full-width" 
                  onClick={() => {
                    if (onOpenChat) {
                      onOpenChat({ name: tm.name, email: tm.email });
                    } else {
                      alert(`Opening chat with ${tm.name}...`);
                    }
                  }}
                  style={{ width: '100%', borderRadius: '10px', fontWeight: '700' }}
                >
                  Message Member
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Invite Teammate Modal */}
      {isInviteModalOpen && (
        <InviteTeammateModal
          isOpen={isInviteModalOpen}
          onClose={() => setIsInviteModalOpen(false)}
          userProfile={userProfile}
          defaultTeamName="FinTrack Mobile"
          onInviteSent={(inv) => {
            alert(`Team invitation sent for FinTrack Mobile!`);
          }}
        />
      )}
    </div>
  );
}
