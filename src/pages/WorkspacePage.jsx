import React, { useState, useEffect, useRef } from 'react';
import { apiClient } from '../services/apiClient';
import { socketService } from '../services/socketService';
import InviteTeammateModal from '../components/InviteTeammateModal';
import CreateProjectModal from '../components/CreateProjectModal';
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
  Users,
  ChevronDown,
  FolderPlus,
  Sparkles,
  RefreshCw,
  GripVertical
} from 'lucide-react';

const getDynamicDate = (daysAgo = 0) => {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

const getInitialTasks = () => [
  {
    id: 1,
    column: 'todo',
    title: 'Setup CI/CD Pipeline',
    desc: 'Configure GitHub Actions for automated deployment.',
    priority: 'HIGH',
    comments: 3,
    date: getDynamicDate(0)
  },
  {
    id: 2,
    column: 'todo',
    title: 'User Research Synthesis',
    desc: 'Analyze interview transcripts from first testing round.',
    priority: 'MEDIUM',
    comments: 4,
    date: getDynamicDate(1)
  },
  {
    id: 3,
    column: 'in_progress',
    title: 'Mobile Navigation Polish',
    desc: 'Fixing spacing issues on the hamburger menu.',
    priority: 'MEDIUM',
    comments: 2,
    date: getDynamicDate(2)
  },
  {
    id: 4,
    column: 'in_progress',
    title: 'REST API Authentication System',
    desc: 'Backend Node.js & Express REST endpoints.',
    priority: 'HIGH',
    comments: 5,
    date: getDynamicDate(3)
  },
  {
    id: 5,
    column: 'review',
    title: 'Database Schema Finalization',
    desc: 'Final check of the ER diagram before migration.',
    priority: 'HIGH',
    comments: 5,
    date: getDynamicDate(4)
  },
  {
    id: 6,
    column: 'completed',
    title: 'Project Kickoff Meeting',
    desc: 'Internal wiki page setup and initial roadmap.',
    priority: 'LOW',
    comments: 8,
    date: getDynamicDate(5)
  }
];

export default function WorkspacePage({ userProfile, onOpenChat, setCurrentPage }) {
  const [activeTab, setActiveTab] = useState('Kanban Board');
  const [searchQuery, setSearchQuery] = useState('');
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [isCreateProjectOpen, setIsCreateProjectOpen] = useState(false);
  const [isProjectDropdownOpen, setIsProjectDropdownOpen] = useState(false);
  
  // Real User Projects state scoped to logged-in user
  const [userProjects, setUserProjects] = useState([]);
  const [selectedProject, setSelectedProject] = useState(null);
  const [loadingProjects, setLoadingProjects] = useState(true);

  // Modern UI Task Creation/Edit Modal State
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [taskModalMode, setTaskModalMode] = useState('create');
  const [editingTask, setEditingTask] = useState(null);
  const [taskFormTitle, setTaskFormTitle] = useState('');
  const [taskFormDesc, setTaskFormDesc] = useState('');
  const [taskFormPriority, setTaskFormPriority] = useState('MEDIUM');
  const [taskFormCol, setTaskFormCol] = useState('todo');

  // Drag and Drop States
  const [draggedTaskId, setDraggedTaskId] = useState(null);
  const [dragOverColId, setDragOverColId] = useState(null);

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
          if (Array.isArray(parsed) && parsed.length > 0) {
            return parsed.map((t, i) => ({
              ...t,
              date: (!t.date || t.date.includes('Oct ') || t.date.includes('Nov ')) 
                ? getDynamicDate(i % 6) 
                : t.date
            }));
          }
        } catch (e) {}
      }
    }
    return getInitialTasks();
  });

  // Save to LocalStorage whenever tasks update
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('unicollab_kanban_tasks', JSON.stringify(tasks));
    }
  }, [tasks]);

  // Load real projects belonging to the logged-in user (from Backend DB + LocalStorage)
  const loadUserProjects = async () => {
    setLoadingProjects(true);
    try {
      // 1. Read locally cached user-created projects
      let localProjects = [];
      if (typeof window !== 'undefined') {
        try {
          localProjects = JSON.parse(localStorage.getItem('unicollab_user_created_projects') || '[]');
        } catch (e) {}
      }

      // 2. Fetch from Backend API
      const res = await apiClient.getMyProjects();
      const serverProjects = (res.success && Array.isArray(res.projects)) ? res.projects : [];

      // Combine and deduplicate
      const map = new Map();
      [...serverProjects, ...localProjects].forEach(p => {
        if (p && (p.id || p.title)) {
          const key = p.id || p.title;
          map.set(key, p);
        }
      });

      let allProjects = Array.from(map.values());

      if (allProjects.length === 0) {
        const starterProject = {
          id: 'proj_starter_fintrack',
          title: 'FinTrack Mobile',
          description: 'Internal FinTech collaboration platform for senior capstone project.',
          desc: 'Internal FinTech collaboration platform for senior capstone project.',
          category: 'FINTECH / MOBILE',
          status: 'Active Phase'
        };
        allProjects = [starterProject];
      }

      setUserProjects(allProjects);

      // Restore previously selected active project or pick newest
      const savedActiveId = typeof window !== 'undefined' ? localStorage.getItem('unicollab_active_workspace_project_id') : null;
      const matched = allProjects.find(p => p.id === savedActiveId || p.title === savedActiveId);
      const activeProj = matched || allProjects[0];
      setSelectedProject(activeProj);

      if (activeProj?.id) {
        socketService.joinProject(activeProj.id);
      }

    } catch (err) {
      console.warn('[Workspace] Error loading projects:', err);
    } finally {
      setLoadingProjects(false);
    }
  };

  useEffect(() => {
    loadUserProjects();
  }, [userProfile?.id, userProfile?.email]);

  // Join socket project room whenever active project changes
  useEffect(() => {
    if (selectedProject?.id) {
      socketService.joinProject(selectedProject.id);
      return () => {
        socketService.leaveProject(selectedProject.id);
      };
    }
  }, [selectedProject?.id]);

  // Load from Backend API and Listen for real-time Kanban & Workspace events
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

    // Connect socket and register listeners
    socketService.connect(userProfile);
    const unsubs = [];

    // Real-time Kanban Task Moved sync from peer tabs / users
    unsubs.push(socketService.on('kanban:task_moved', (data) => {
      if (!data || !data.taskId) return;
      console.log('⚡ [Real-time Kanban Sync] Received task_moved:', data);
      setTasks(prev => {
        const existing = prev.find(t => String(t.id) === String(data.taskId));
        if (!existing) {
          if (data.task) return [...prev, { ...data.task, column: data.toColumn }];
          return prev;
        }
        if (existing.column === data.toColumn) return prev;
        return prev.map(t => String(t.id) === String(data.taskId) ? { ...t, column: data.toColumn } : t);
      });
    }));

    // Real-time Kanban Task Created sync
    unsubs.push(socketService.on('kanban:task_created', (data) => {
      if (!data || !data.task) return;
      console.log('⚡ [Real-time Kanban Sync] Received task_created:', data.task);
      setTasks(prev => {
        if (prev.some(t => String(t.id) === String(data.task.id))) return prev;
        return [...prev, data.task];
      });
    }));

    // Real-time Kanban Task Deleted sync
    unsubs.push(socketService.on('kanban:task_deleted', (data) => {
      if (!data || !data.taskId) return;
      console.log('⚡ [Real-time Kanban Sync] Received task_deleted:', data.taskId);
      setTasks(prev => prev.filter(t => String(t.id) !== String(data.taskId)));
    }));

    // Member joined
    unsubs.push(socketService.on('team:member_joined', (data) => {
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
    }));

    // Project created
    unsubs.push(socketService.on('project:created', (newProj) => {
      if (newProj) {
        setUserProjects(prev => {
          if (prev.some(p => p.id === newProj.id)) return prev;
          return [newProj, ...prev];
        });
      }
    }));

    return () => {
      unsubs.forEach(u => u());
    };
  }, [userProfile?.id]);

  const handleSelectProject = (proj) => {
    setSelectedProject(proj);
    if (typeof window !== 'undefined' && proj) {
      localStorage.setItem('unicollab_active_workspace_project_id', proj.id);
    }
    setIsProjectDropdownOpen(false);
  };

  const handleProjectCreated = (newProj) => {
    console.log('[Workspace] Project created callback:', newProj);
    setUserProjects(prev => [newProj, ...prev.filter(p => p.id !== newProj.id)]);
    setSelectedProject(newProj);
    if (typeof window !== 'undefined' && newProj) {
      localStorage.setItem('unicollab_active_workspace_project_id', newProj.id);
    }
    setIsProjectDropdownOpen(false);
  };

  // Move Task with Instant Optimistic UI + Real-time Socket Broadcast + Rollback Protection
  const moveTask = (taskId, newCol) => {
    let prevCol = null;
    const targetTask = tasks.find(t => String(t.id) === String(taskId));
    if (!targetTask || targetTask.column === newCol) return;
    prevCol = targetTask.column;

    // 1. Optimistic local state update (feels instantaneous)
    setTasks(prev => prev.map(t => String(t.id) === String(taskId) ? { ...t, column: newCol } : t));

    // 2. Emit real-time socket event for other connected clients
    const currentProjId = selectedProject?.id || 'proj_starter_fintrack';
    socketService.emitTaskMoved({
      projectId: currentProjId,
      taskId,
      fromColumn: prevCol,
      toColumn: newCol,
      task: { ...targetTask, column: newCol }
    }, (res) => {
      if (res && res.success === false) {
        // Rollback if server rejects
        console.warn('Task move rejected by server, rolling back:', res.message);
        setTasks(prev => prev.map(t => String(t.id) === String(taskId) ? { ...t, column: prevCol } : t));
      }
    });

    // 3. Background API persist
    try {
      apiClient.updateTaskPosition(taskId, newCol).catch(() => {});
    } catch (e) {}
  };

  const openCreateTaskModal = (colId = 'todo') => {
    setTaskModalMode('create');
    setEditingTask(null);
    setTaskFormTitle('');
    setTaskFormDesc('');
    setTaskFormPriority('MEDIUM');
    setTaskFormCol(colId);
    setIsTaskModalOpen(true);
  };

  const openEditTaskModal = (task) => {
    setTaskModalMode('edit');
    setEditingTask(task);
    setTaskFormTitle(task.title || '');
    setTaskFormDesc(task.desc || '');
    setTaskFormPriority(task.priority || 'MEDIUM');
    setTaskFormCol(task.column || 'todo');
    setIsTaskModalOpen(true);
  };

  const handleSaveTask = async (e) => {
    e.preventDefault();
    if (!taskFormTitle.trim()) return;
    const currentProjId = selectedProject?.id || 'proj_starter_fintrack';

    if (taskModalMode === 'create') {
      const newTask = {
        id: Date.now(),
        column: taskFormCol,
        title: taskFormTitle.trim(),
        desc: taskFormDesc.trim() || 'Task deliverable item.',
        priority: taskFormPriority,
        comments: 0,
        date: getDynamicDate(0)
      };

      setTasks(prev => [...prev, newTask]);

      // Socket broadcast to other tabs
      socketService.emitTaskCreated({
        projectId: currentProjId,
        task: newTask
      });

      try {
        await apiClient.createTask(newTask);
      } catch (e) {}
    } else if (editingTask) {
      const updated = {
        ...editingTask,
        title: taskFormTitle.trim(),
        desc: taskFormDesc.trim() || 'Task deliverable item.',
        priority: taskFormPriority,
        column: taskFormCol
      };

      setTasks(prev => prev.map(t => t.id === editingTask.id ? updated : t));

      socketService.emitTaskMoved({
        projectId: currentProjId,
        taskId: editingTask.id,
        fromColumn: editingTask.column,
        toColumn: taskFormCol,
        task: updated
      });
    }

    setIsTaskModalOpen(false);
  };

  const deleteTask = (taskId) => {
    const currentProjId = selectedProject?.id || 'proj_starter_fintrack';
    setTasks(prev => prev.filter(t => String(t.id) !== String(taskId)));
    
    // Broadcast delete to other tabs
    socketService.emitTaskDeleted({
      projectId: currentProjId,
      taskId
    });
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
    a.download = `${(selectedProject?.title || 'workspace').replace(/\s+/g, '_').toLowerCase()}_tasks.csv`;
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
      {/* Workspace Header with Project Selector */}
      <div className="workspace-header-card">
        <div className="ws-title-row flex justify-between align-center" style={{ flexWrap: 'wrap', gap: '16px' }}>
          <div className="ws-title-group" style={{ display: 'flex', alignItems: 'flex-start', gap: '16px', flex: 1, minWidth: '300px' }}>
            <div className="ws-logo-box" style={{ background: '#EFF6FF', color: '#2563EB', borderRadius: '14px', width: '46px', height: '46px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Layers size={22} />
            </div>
            
            <div style={{ flex: 1, minWidth: 0 }}>
              <div className="ws-title-flex" style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                {/* Project Selector Dropdown */}
                <div style={{ position: 'relative' }}>
                  <button 
                    onClick={() => setIsProjectDropdownOpen(!isProjectDropdownOpen)}
                    style={{ 
                      background: 'transparent', 
                      border: '1px solid var(--border-color, #CBD5E1)', 
                      padding: '6px 14px', 
                      borderRadius: '12px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      cursor: 'pointer',
                      fontSize: '18px',
                      fontWeight: 800,
                      color: 'inherit'
                    }}
                    title="Click to switch between your projects"
                  >
                    <span>Project: {selectedProject?.title || 'FinTrack Mobile'}</span>
                    <ChevronDown size={16} style={{ transition: 'transform 0.2s', transform: isProjectDropdownOpen ? 'rotate(180deg)' : 'none' }} />
                  </button>

                  {/* Dropdown Menu */}
                  {isProjectDropdownOpen && (
                    <div style={{
                      position: 'absolute',
                      top: '100%',
                      left: 0,
                      marginTop: '6px',
                      width: '320px',
                      background: 'var(--surface-color, #FFFFFF)',
                      border: '1px solid var(--border-color, #E2E8F0)',
                      borderRadius: '14px',
                      boxShadow: '0 10px 25px rgba(0,0,0,0.12)',
                      zIndex: 100,
                      padding: '8px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '4px'
                    }}>
                      <div style={{ padding: '6px 10px', fontSize: '11.5px', fontWeight: 800, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                        Your Workspace Projects ({userProjects.length})
                      </div>

                      {userProjects.map((p) => (
                        <button
                          key={p.id}
                          onClick={() => handleSelectProject(p)}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            padding: '10px 12px',
                            borderRadius: '10px',
                            border: 'none',
                            background: selectedProject?.id === p.id ? 'rgba(37, 99, 235, 0.08)' : 'transparent',
                            color: selectedProject?.id === p.id ? '#2563EB' : 'inherit',
                            fontWeight: selectedProject?.id === p.id ? 800 : 600,
                            fontSize: '13px',
                            cursor: 'pointer',
                            textAlign: 'left'
                          }}
                        >
                          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {p.title}
                          </span>
                          {selectedProject?.id === p.id && (
                            <span style={{ fontSize: '11px', background: '#2563EB', color: 'white', padding: '2px 6px', borderRadius: '6px' }}>Active</span>
                          )}
                        </button>
                      ))}

                      <div style={{ borderTop: '1px solid var(--border-color, #E2E8F0)', marginTop: '4px', paddingTop: '6px' }}>
                        <button
                          onClick={() => {
                            setIsProjectDropdownOpen(false);
                            setIsCreateProjectOpen(true);
                          }}
                          style={{
                            width: '100%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '6px',
                            padding: '9px 12px',
                            borderRadius: '10px',
                            border: '1px dashed #2563EB',
                            background: 'rgba(37, 99, 235, 0.04)',
                            color: '#2563EB',
                            fontWeight: 800,
                            fontSize: '12.5px',
                            cursor: 'pointer'
                          }}
                        >
                          <FolderPlus size={15} /> + Create New Project
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                <span className="phase-badge green" style={{ padding: '4px 10px', borderRadius: '8px', fontSize: '11.5px', fontWeight: 800 }}>
                  {selectedProject?.status || 'Active Phase'}
                </span>

                <span className="dept-tag blue" style={{ fontSize: '11px', padding: '4px 8px', borderRadius: '8px', fontWeight: 700 }}>
                  {selectedProject?.category || 'SOFTWARE'}
                </span>
              </div>

              <p className="ws-subtitle" style={{ margin: '6px 0 0 0', fontSize: '13px', color: '#64748B' }}>
                {selectedProject?.description || selectedProject?.desc || 'Internal university team collaboration platform for senior capstone project.'}
              </p>
            </div>
          </div>

          <div className="ws-actions flex gap-2" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button className="btn-secondary" onClick={() => setIsCreateProjectOpen(true)} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', fontWeight: 700 }}>
              <FolderPlus size={15} /> + New Project
            </button>
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
              const isColOver = dragOverColId === col.id;
              return (
                <div 
                  key={col.id} 
                  className={`kanban-col ${isColOver ? 'drag-target-active' : ''}`}
                  onDragOver={(e) => {
                    e.preventDefault();
                    e.dataTransfer.dropEffect = 'move';
                    if (dragOverColId !== col.id) setDragOverColId(col.id);
                  }}
                  onDragLeave={(e) => {
                    if (e.currentTarget.contains(e.relatedTarget)) return;
                    if (dragOverColId === col.id) setDragOverColId(null);
                  }}
                  onDrop={(e) => {
                    e.preventDefault();
                    setDragOverColId(null);
                    const taskIdStr = e.dataTransfer.getData('text/plain') || draggedTaskId;
                    if (taskIdStr !== null && taskIdStr !== undefined) {
                      const numericId = Number(taskIdStr) || taskIdStr;
                      moveTask(numericId, col.id);
                    }
                    setDraggedTaskId(null);
                  }}
                  style={{
                    border: isColOver ? `2px dashed ${col.color}` : '2px solid transparent',
                    borderRadius: '16px',
                    transition: 'all 0.15s ease',
                    boxShadow: isColOver ? `0 0 16px ${col.color}30` : 'none'
                  }}
                >
                  <div className="col-header">
                    <div className="col-title-flex">
                      <span className="col-dot" style={{ background: col.color }}></span>
                      <h4>{col.title}</h4>
                      <span className="task-count">{colTasks.length}</span>
                    </div>
                    <button className="add-task-icon-btn" onClick={() => openCreateTaskModal(col.id)} title="Add Task">+</button>
                  </div>

                  <div className="task-cards-stack" style={{ minHeight: '120px' }}>
                    {colTasks.map((t) => {
                      const isDraggingThis = draggedTaskId === t.id;
                      return (
                        <div 
                          key={t.id} 
                          className={`task-card ${isDraggingThis ? 'is-dragging' : ''}`}
                          draggable={true}
                          onDragStart={(e) => {
                            setDraggedTaskId(t.id);
                            e.dataTransfer.setData('text/plain', String(t.id));
                            e.dataTransfer.effectAllowed = 'move';
                          }}
                          onDragEnd={() => {
                            setDraggedTaskId(null);
                            setDragOverColId(null);
                          }}
                          style={{
                            cursor: 'grab',
                            opacity: isDraggingThis ? 0.45 : 1,
                            transform: isDraggingThis ? 'scale(0.98)' : 'none',
                            transition: 'opacity 0.15s ease, transform 0.15s ease'
                          }}
                        >
                          <div className="task-card-top flex justify-between align-center">
                            <span className={`priority-badge ${t.priority.toLowerCase()}`}>{t.priority}</span>
                            <div className="task-card-actions flex align-center gap-2">
                              <button 
                                onClick={(e) => { e.stopPropagation(); openEditTaskModal(t); }} 
                                className="task-action-btn edit-btn" 
                                title="Edit Task"
                                aria-label="Edit Task"
                              >
                                <Edit2 size={13.5} />
                              </button>
                              <button 
                                onClick={(e) => { e.stopPropagation(); deleteTask(t.id); }} 
                                className="task-action-btn delete-btn" 
                                title="Delete Task"
                                aria-label="Delete Task"
                              >
                                <Trash2 size={13.5} />
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
                      );
                    })}
                  </div>

                  <button className="btn-add-task-full" onClick={() => openCreateTaskModal(col.id)}>
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

          <div className="timeline-roadmap-vertical mt-4">
            <div className="roadmap-step completed">
              <div className="step-node-circle completed">
                <CheckCircle2 size={16} />
              </div>
              <div className="step-content-box">
                <div className="step-top-badge-row">
                  <span className="step-status-pill green">COMPLETED</span>
                  <span className="step-date">Completed {getDynamicDate(10)}, {new Date().getFullYear()}</span>
                </div>
                <h4 className="step-title">Milestone 1: Architecture, Core Schemas & API Stubs</h4>
                <p className="step-desc">
                  Defined PostgreSQL database schemas in Prisma, generated JWT authentication, and validated REST routes.
                </p>
                <div className="step-meta-footer mt-3">
                  <span className="meta-lead">Lead: Sarah Chen</span>
                  <span className="meta-progress green">100% Finalized</span>
                </div>
              </div>
            </div>

            <div className="roadmap-step in_progress">
              <div className="step-node-circle active">
                <Clock size={16} />
              </div>
              <div className="step-content-box">
                <div className="step-top-badge-row">
                  <span className="step-status-pill blue">IN PROGRESS</span>
                  <span className="step-date">Target: {getDynamicDate(-5)}, {new Date().getFullYear()}</span>
                </div>
                <h4 className="step-title">Milestone 2: Real-time Messaging & Kanban Workspace Sync</h4>
                <p className="step-desc">
                  Integrating Socket.io event loop for instantaneous chat alerts and team board card movements.
                </p>
                <div className="step-meta-footer mt-3">
                  <span className="meta-lead">Lead: Marcus Johnson</span>
                  <span className="meta-progress blue">Phase 2 • 65% Completed</span>
                </div>
              </div>
            </div>

            <div className="roadmap-step pending">
              <div className="step-node-circle pending">
                <span className="node-number">3</span>
              </div>
              <div className="step-content-box">
                <div className="step-top-badge-row">
                  <span className="step-status-pill grey">UPCOMING</span>
                  <span className="step-date">Scheduled {getDynamicDate(-20)}, {new Date().getFullYear()}</span>
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
              <h3>{selectedProject?.title || 'FinTrack Mobile'} Team Members</h3>
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

      {/* Modern Create / Edit Task Modal */}
      {isTaskModalOpen && (
        <div className="modal-backdrop animate-fade-in" style={{ zIndex: 9999 }}>
          <div className="modal-card animate-fade-in" style={{ maxWidth: '500px', width: '100%', borderRadius: '24px', padding: '30px' }}>
            <div className="modal-header flex justify-between align-center pb-3" style={{ borderBottom: '1px solid var(--border-color, #E2E8F0)', marginBottom: '20px' }}>
              <div className="flex align-center gap-3">
                <div style={{ width: '42px', height: '42px', borderRadius: '12px', background: '#EFF6FF', color: '#2563EB', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Layers size={22} />
                </div>
                <div>
                  <h3 style={{ fontSize: '18px', fontWeight: '800', margin: 0 }}>
                    {taskModalMode === 'create' ? 'Create New Task' : 'Edit Workspace Task'}
                  </h3>
                  <p style={{ fontSize: '12px', color: '#64748B', margin: '2px 0 0' }}>
                    Deliverable for {selectedProject?.title || 'Active Project'}
                  </p>
                </div>
              </div>
              <button className="close-btn" onClick={() => setIsTaskModalOpen(false)} style={{ background: 'none', border: 'none', fontSize: '18px', cursor: 'pointer', color: '#94A3B8' }}>✕</button>
            </div>

            <form onSubmit={handleSaveTask} className="form-group-stack">
              <div className="form-group mb-3">
                <label style={{ fontSize: '13px', fontWeight: '700', marginBottom: '6px', display: 'block' }}>Task Title *</label>
                <input
                  type="text"
                  placeholder="e.g. Setup Authentication & JWT Refresh flow"
                  value={taskFormTitle}
                  onChange={(e) => setTaskFormTitle(e.target.value)}
                  required
                  autoFocus
                  style={{ width: '100%', padding: '10px 14px', borderRadius: '12px', border: '1px solid #CBD5E1', fontSize: '13.5px' }}
                />
              </div>

              <div className="form-group mb-3">
                <label style={{ fontSize: '13px', fontWeight: '700', marginBottom: '6px', display: 'block' }}>Description (Optional)</label>
                <textarea
                  rows="3"
                  placeholder="Details, requirements, or acceptance criteria..."
                  value={taskFormDesc}
                  onChange={(e) => setTaskFormDesc(e.target.value)}
                  style={{ width: '100%', padding: '10px 14px', borderRadius: '12px', border: '1px solid #CBD5E1', fontSize: '13.5px', resize: 'vertical' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
                <div className="form-group">
                  <label style={{ fontSize: '13px', fontWeight: '700', marginBottom: '6px', display: 'block' }}>Column Stage</label>
                  <select
                    value={taskFormCol}
                    onChange={(e) => setTaskFormCol(e.target.value)}
                    style={{ width: '100%', padding: '10px 12px', borderRadius: '12px', border: '1px solid #CBD5E1', fontSize: '13px', background: 'white' }}
                  >
                    {columns.map(c => (
                      <option key={c.id} value={c.id}>{c.title}</option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label style={{ fontSize: '13px', fontWeight: '700', marginBottom: '6px', display: 'block' }}>Priority</label>
                  <div style={{ display: 'flex', gap: '6px' }}>
                    {['LOW', 'MEDIUM', 'HIGH'].map(p => (
                      <button
                        key={p}
                        type="button"
                        onClick={() => setTaskFormPriority(p)}
                        style={{
                          flex: 1,
                          padding: '9px 0',
                          borderRadius: '10px',
                          border: taskFormPriority === p ? '2px solid #2563EB' : '1px solid #E2E8F0',
                          background: taskFormPriority === p ? 'rgba(37, 99, 235, 0.1)' : 'transparent',
                          color: taskFormPriority === p ? '#2563EB' : 'inherit',
                          fontWeight: 800,
                          fontSize: '11.5px',
                          cursor: 'pointer'
                        }}
                      >
                        {p}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => setIsTaskModalOpen(false)}
                  style={{ flex: 1, padding: '11px', borderRadius: '12px', fontWeight: 700 }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-primary"
                  style={{ flex: 2, padding: '11px', borderRadius: '12px', fontWeight: 800 }}
                >
                  {taskModalMode === 'create' ? '+ Add Task to Board' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Invite Teammate Modal */}
      {isInviteModalOpen && (
        <InviteTeammateModal
          isOpen={isInviteModalOpen}
          onClose={() => setIsInviteModalOpen(false)}
          userProfile={userProfile}
          defaultTeamName={selectedProject?.title || "FinTrack Mobile"}
          onInviteSent={(inv) => {
            alert(`Team invitation sent for ${selectedProject?.title || 'project'}!`);
          }}
        />
      )}

      {/* Create Project Modal */}
      {isCreateProjectOpen && (
        <CreateProjectModal
          isOpen={isCreateProjectOpen}
          onClose={() => setIsCreateProjectOpen(false)}
          userProfile={userProfile}
          onProjectCreated={handleProjectCreated}
          setCurrentPage={setCurrentPage}
        />
      )}
    </div>
  );
}
