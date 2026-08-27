import React, { useState } from 'react';
import { apiClient } from '../services/apiClient';
import { 
  FolderPlus, 
  CheckCircle2, 
  Layers, 
  Clock, 
  Users, 
  Tag, 
  FileText,
  Sparkles
} from 'lucide-react';

export default function CreateProjectModal({ isOpen, onClose, userProfile, onProjectCreated, setCurrentPage }) {
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('SOFTWARE');
  const [level, setLevel] = useState('INTERMEDIATE');
  const [description, setDescription] = useState('');
  const [skillsInput, setSkillsInput] = useState('React, Node.js, Python');
  const [commitment, setCommitment] = useState('6-8 hrs/week');
  const [spots, setSpots] = useState('3 spots left');
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();

    setLoading(true);
    const finalTitle = (title || 'New Collaborative Project').trim();
    const finalDesc = (description || 'A new university student team project focused on innovation and collaboration.').trim();

    const res = await apiClient.createProject({
      title: finalTitle,
      description: finalDesc,
      desc: finalDesc,
      category: category,
      level: level,
      tags: skillsInput.split(',').map(s => s.trim()).filter(Boolean),
      commitment: commitment,
      spots: spots,
      lead: userProfile?.name || 'Alex Rivera'
    });
    setLoading(false);

    const createdProj = res.project || {
      id: `proj_${Date.now()}`,
      title: finalTitle,
      description: finalDesc,
      category: category,
      level: level,
      desc: finalDesc,
      tags: skillsInput.split(',').map(s => s.trim()).filter(Boolean),
      commitment: commitment,
      spots: spots,
      lead: userProfile?.name || 'Alex Rivera',
      createdAt: new Date().toISOString()
    };

    // Permanently save to localStorage for client-side persistence across reloads
    if (typeof window !== 'undefined') {
      try {
        const existing = JSON.parse(localStorage.getItem('unicollab_user_created_projects') || '[]');
        const updated = [createdProj, ...existing.filter(p => p.id !== createdProj.id)];
        localStorage.setItem('unicollab_user_created_projects', JSON.stringify(updated));
        localStorage.setItem('unicollab_active_workspace_project_id', createdProj.id);
      } catch (err) {
        console.warn('LocalStorage save error:', err);
      }
    }

    if (onProjectCreated) {
      onProjectCreated(createdProj);
    }

    setSubmitted(true);

    setTimeout(() => {
      setSubmitted(false);
      onClose();
      if (setCurrentPage) {
        setCurrentPage('workspace');
      }
    }, 1000);
  };

  return (
    <div className="modal-backdrop">
      <div className="modal-card animate-fade-in" style={{ maxWidth: '600px' }}>
        <div className="modal-header">
          <div className="flex align-center gap-2">
            <div className="icon-badge-blue">
              <FolderPlus size={20} />
            </div>
            <div>
              <h3>Post a New Project</h3>
              <p className="text-xs text-muted">Recruit student teammates & mentors across campus</p>
            </div>
          </div>
          <button className="close-btn" onClick={onClose}>✕</button>
        </div>

        {submitted ? (
          <div className="text-center py-8 animate-fade-in">
            <div className="success-icon-circle mx-auto mb-4">
              <CheckCircle2 size={48} className="text-emerald" />
            </div>
            <h3 className="text-xl font-bold text-slate">Project Created Successfully!</h3>
            <p className="text-sm text-muted mt-2">
              Your project <strong>"{title || 'New Project'}"</strong> is now live. Redirecting to Team Workspace...
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="form-group-stack mt-2">
            <div className="form-group">
              <label className="form-label">
                <FileText size={14} /> Project Title *
              </label>
              <input 
                type="text" 
                required 
                placeholder="e.g. Smart Campus IoT Micro-Grid"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>

            <div className="form-row-2col">
              <div className="form-group">
                <label className="form-label">
                  <Layers size={14} /> Category / Discipline
                </label>
                <select 
                  className="select-input-auth"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                >
                  <option value="SOFTWARE">Software Engineering</option>
                  <option value="RESEARCH">Data & Research</option>
                  <option value="ENGINEERING">Robotics & Hardware</option>
                  <option value="DESIGN">UI/UX Design</option>
                  <option value="BUSINESS">Business & Strategy</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">
                  <Sparkles size={14} /> Difficulty Level
                </label>
                <select 
                  className="select-input-auth"
                  value={level}
                  onChange={(e) => setLevel(e.target.value)}
                >
                  <option value="BEGINNER">Beginner (1st/2nd Year)</option>
                  <option value="INTERMEDIATE">Intermediate (Capstone)</option>
                  <option value="ADVANCED">Advanced (Research/Grad)</option>
                </select>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">
                <FileText size={14} /> Project Description & Goals *
              </label>
              <textarea 
                rows={3}
                required
                className="form-textarea-auth"
                placeholder="Describe your project, team goals, and what problem you are solving..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label className="form-label">
                <Tag size={14} /> Required Skills & Tech Stack (comma separated)
              </label>
              <input 
                type="text" 
                placeholder="React, TypeScript, Node.js, Figma..."
                value={skillsInput}
                onChange={(e) => setSkillsInput(e.target.value)}
              />
            </div>

            <div className="form-row-2col">
              <div className="form-group">
                <label className="form-label">
                  <Clock size={14} /> Weekly Time Commitment
                </label>
                <select 
                  className="select-input-auth"
                  value={commitment}
                  onChange={(e) => setCommitment(e.target.value)}
                >
                  <option value="4-6 hrs/week">4-6 hrs/week</option>
                  <option value="6-8 hrs/week">6-8 hrs/week</option>
                  <option value="8-10 hrs/week">8-10 hrs/week</option>
                  <option value="10-15 hrs/week">10-15 hrs/week</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">
                  <Users size={14} /> Open Teammate Spots
                </label>
                <select 
                  className="select-input-auth"
                  value={spots}
                  onChange={(e) => setSpots(e.target.value)}
                >
                  <option value="1/3 spots left">1 Spot Left</option>
                  <option value="2/4 spots left">2 Spots Left</option>
                  <option value="3 spots left">3 Spots Left</option>
                  <option value="4 spots left">4 Spots Left</option>
                </select>
              </div>
            </div>

            <div className="modal-actions mt-6 flex gap-3 justify-end">
              <button type="button" className="btn-secondary" onClick={onClose}>
                Cancel
              </button>
              <button type="submit" className="btn-primary">
                Publish Project & Recruit
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
