import React, { useState } from 'react';
import { apiClient } from '../services/apiClient';
import { 
  Folder, 
  Clock, 
  Users, 
  UserCheck, 
  Tag, 
  Send, 
  CheckCircle2, 
  ArrowRight, 
  X, 
  Sparkles,
  Layers
} from 'lucide-react';

export default function ProjectDetailModal({ project, isOpen, onClose, setCurrentPage, userProfile }) {
  const [applying, setApplying] = useState(false);
  const [applied, setApplied] = useState(false);
  const [applyMessage, setApplyMessage] = useState('');

  if (!isOpen || !project) return null;

  const handleApply = async () => {
    setApplying(true);
    const applicantName = userProfile?.name || 'Alex Rivera';
    const res = await apiClient.applyToProject(
      project.id, 
      applicantName, 
      applyMessage || `Hi! I would love to join ${project.title} as a developer.`
    );
    setApplying(false);
    setApplied(true);
  };

  const projectTags = Array.isArray(project.tags) 
    ? project.tags 
    : typeof project.tags === 'string'
      ? project.tags.split(',')
      : ['React', 'Node.js', 'Engineering'];

  return (
    <div className="modal-backdrop">
      <div className="modal-card animate-fade-in" style={{ maxWidth: '680px', width: '90%' }}>
        <div className="modal-header">
          <div className="flex align-center gap-2">
            <div className="icon-badge-blue">
              <Folder size={22} />
            </div>
            <div>
              <div className="badge-tags mb-1" style={{ display: 'flex', gap: '6px' }}>
                <span className="cat-badge">{project.category || 'SOFTWARE'}</span>
                <span className="level-badge">{project.level || 'INTERMEDIATE'}</span>
              </div>
              <h2 style={{ fontSize: '20px', fontWeight: 800, margin: 0, color: '#0F172A' }}>{project.title}</h2>
            </div>
          </div>
          <button className="close-btn" onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px' }}>
            <X size={20} />
          </button>
        </div>

        <div className="modal-body py-4" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Lead & Meta Row */}
          <div style={{
            background: '#F8FAFC',
            border: '1px solid #E2E8F0',
            borderRadius: '12px',
            padding: '14px 18px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '12px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{
                width: '40px',
                height: '40px',
                borderRadius: '50%',
                background: '#EFF6FF',
                color: '#2563EB',
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '15px'
              }}>
                {(project.lead || project.author || 'Alex Rivera').split(' ').map(n => n[0]).join('').slice(0, 2)}
              </div>
              <div>
                <span style={{ fontSize: '12px', color: '#64748B', display: 'block' }}>Project Lead</span>
                <strong style={{ fontSize: '14px', color: '#1E293B' }}>{project.lead || project.author || 'Alex Rivera'}</strong>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '16px', fontSize: '13px', color: '#475569' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Clock size={14} className="text-blue" />
                {project.commitment || '6-8 hrs/week'}
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Users size={14} className="text-blue" />
                {project.spots || '3 spots left'}
              </span>
            </div>
          </div>

          {/* Description */}
          <div>
            <h4 style={{ fontSize: '14px', fontWeight: 700, color: '#334155', marginBottom: '8px' }}>Project Overview</h4>
            <p style={{ fontSize: '14px', color: '#475569', lineHeight: 1.6 }}>
              {project.description || project.desc || 'A collaborative student innovation project focused on building real-world software & engineering solutions.'}
            </p>
          </div>

          {/* Tech Stack Tags */}
          <div>
            <h4 style={{ fontSize: '14px', fontWeight: 700, color: '#334155', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Tag size={14} /> Core Tech Stack & Skills Required
            </h4>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              {projectTags.map((t, idx) => (
                <span key={idx} style={{
                  background: '#EFF6FF',
                  color: '#2563EB',
                  border: '1px solid #BFDBFE',
                  padding: '4px 12px',
                  borderRadius: '20px',
                  fontSize: '12.5px',
                  fontWeight: 600
                }}>
                  {t.trim()}
                </span>
              ))}
            </div>
          </div>

          {/* Application Form / Status */}
          <div style={{
            borderTop: '1px solid #E2E8F0',
            paddingTop: '16px',
            marginTop: '8px'
          }}>
            {applied ? (
              <div style={{
                background: '#ECFDF5',
                border: '1px solid #A7F3D0',
                color: '#065F46',
                borderRadius: '12px',
                padding: '14px',
                textAlign: 'center',
                fontWeight: 600,
                fontSize: '14px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px'
              }}>
                <CheckCircle2 size={18} />
                <span>Application Submitted! The Project Lead has been notified.</span>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <label style={{ fontSize: '13px', fontWeight: 700, color: '#334155' }}>
                  Interested in joining this team?
                </label>
                <textarea
                  placeholder="Optional: Introduce yourself and mention your relevant experience..."
                  value={applyMessage}
                  onChange={(e) => setApplyMessage(e.target.value)}
                  style={{
                    width: '100%',
                    borderRadius: '10px',
                    border: '1px solid #CBD5E1',
                    padding: '10px 12px',
                    fontSize: '13.5px',
                    minHeight: '60px',
                    fontFamily: 'inherit'
                  }}
                />
                <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '6px' }}>
                  <button
                    className="btn-secondary"
                    onClick={() => {
                      onClose();
                      if (setCurrentPage) setCurrentPage('workspace');
                    }}
                    style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
                  >
                    <span>View Workspace</span>
                    <ArrowRight size={14} />
                  </button>

                  <button
                    className="btn-primary"
                    onClick={handleApply}
                    disabled={applying}
                    style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
                  >
                    <Send size={14} />
                    <span>{applying ? 'Submitting...' : 'Apply to Join Team'}</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
