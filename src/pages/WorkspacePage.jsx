import React, { useState } from 'react';
import { apiClient } from '../services/apiClient';
import { 
  Share2, 
  Video, 
  Search, 
  Filter, 
  CheckCircle2, 
  Clock, 
  MessageSquare, 
  Layers
} from 'lucide-react';

export default function WorkspacePage() {
  const [activeTab, setActiveTab] = useState('Kanban Board');
  const [tasks, setTasks] = useState([
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
  ]);

  const moveTask = (taskId, newCol) => {
    setTasks(prev => prev.map(t => t.id === taskId ? { ...t, column: newCol } : t));
  };

  const addTask = (col) => {
    const title = prompt('Enter task title:');
    if (!title) return;
    const newTask = {
      id: Date.now(),
      column: col,
      title,
      desc: 'Newly created task item.',
      priority: 'MEDIUM',
      comments: 0,
      date: 'Today'
    };
    setTasks(prev => [...prev, newTask]);
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
              <input type="text" placeholder="Search tasks..." />
            </div>

            <div className="toolbar-actions">
              <button className="btn-sm-outline"><Filter size={14} /> Filter</button>
              <span className="text-sm text-muted">Group by: <strong>Priority</strong></span>
              <span className="text-sm text-muted">Displaying {tasks.length} tasks</span>
            </div>
          </div>

          {/* Columns Grid */}
          <div className="kanban-columns-grid mt-4">
            {columns.map((col) => {
              const colTasks = tasks.filter(t => t.column === col.id);
              return (
                <div key={col.id} className="kanban-col">
                  <div className="col-header">
                    <div className="col-title-flex">
                      <span className="col-dot" style={{ background: col.color }}></span>
                      <h4>{col.title}</h4>
                      <span className="task-count">{colTasks.length}</span>
                    </div>
                    <button className="add-task-icon-btn" onClick={() => addTask(col.id)}>+</button>
                  </div>

                  <div className="task-cards-stack">
                    {colTasks.map((t) => (
                      <div key={t.id} className="task-card">
                        <div className="task-card-top">
                          <span className={`priority-badge ${t.priority.toLowerCase()}`}>{t.priority}</span>
                        </div>
                        <h4 className="task-title">{t.title}</h4>
                        <p className="task-desc">{t.desc}</p>

                        <div className="task-meta">
                          <span className="meta-item"><MessageSquare size={13} /> {t.comments}</span>
                          <span className="meta-item"><Clock size={13} /> {t.date}</span>
                        </div>

                        {/* Move Task Quick Select */}
                        <div className="move-task-row">
                          <span className="move-task-label">Move to:</span>
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
          <div className="section-title-row">
            <h3>FinTrack Mobile Team Members</h3>
            <span className="text-xs text-muted font-bold">3 Active Members</span>
          </div>

          <div className="tm-workspace-grid mt-4">
            <div className="tm-workspace-card">
              <div className="tm-ws-avatar-row">
                <div className="avatar-circle blue">AT</div>
                <span className="online-dot-badge"></span>
              </div>
              <h4 className="tm-ws-name">Alex Thompson</h4>
              <p className="tm-ws-role">Project Lead & Full Stack</p>
              <span className="tm-ws-dept">Computer Science • Senior</span>
              <button className="btn-sm-primary full-width mt-3" onClick={() => alert('Opening direct message with Alex')}>
                Message Lead
              </button>
            </div>

            <div className="tm-workspace-card">
              <div className="tm-ws-avatar-row">
                <div className="avatar-circle green">SC</div>
                <span className="online-dot-badge"></span>
              </div>
              <h4 className="tm-ws-name">Sarah Chen</h4>
              <p className="tm-ws-role">Backend Engineer</p>
              <span className="tm-ws-dept">Computer Science • Junior</span>
              <button className="btn-sm-primary full-width mt-3" onClick={() => alert('Opening direct message with Sarah')}>
                Message Engineer
              </button>
            </div>

            <div className="tm-workspace-card">
              <div className="tm-ws-avatar-row">
                <div className="avatar-circle purple">MJ</div>
                <span className="online-dot-badge"></span>
              </div>
              <h4 className="tm-ws-name">Marcus Johnson</h4>
              <p className="tm-ws-role">UI/UX Design Lead</p>
              <span className="tm-ws-dept">Digital Media • Senior</span>
              <button className="btn-sm-primary full-width mt-3" onClick={() => alert('Opening direct message with Marcus')}>
                Message Designer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
