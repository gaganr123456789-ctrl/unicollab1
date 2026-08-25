import React, { useState, useEffect } from 'react';
import { 
  Users, 
  UserCheck, 
  Check, 
  X, 
  Clock, 
  ShieldCheck, 
  Award, 
  Tag, 
  Briefcase, 
  Layers, 
  ArrowLeft,
  GraduationCap
} from 'lucide-react';
import { apiClient } from '../services/apiClient';

export default function TeamDetailsModal({ isOpen, onClose, invite, onAccept, onDecline, userProfile }) {
  const [teamData, setTeamData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    if (!isOpen || !invite) return;

    const fetchTeamInfo = async () => {
      setLoading(true);
      try {
        if (invite.teamId) {
          const res = await apiClient.getTeamDetails(invite.teamId);
          if (res.success && res.team) {
            setTeamData(res.team);
          }
        }
      } catch (err) {
        console.warn('Failed to fetch detailed team info:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchTeamInfo();
  }, [isOpen, invite]);

  if (!isOpen || !invite) return null;

  const teamName = invite.teamName || teamData?.name || 'Autonomous Drone Navigation';
  const teamDesc = invite.teamDesc || teamData?.description || 'Autonomous multi-rotor drone navigation with ROS 2 and OpenCV for campus micro-deliveries.';
  const teamLeader = invite.teamLeader || invite.senderName || teamData?.leadName || 'Dr. Ananya Sharma';
  const projectCategory = invite.projectCategory || teamData?.category || 'Engineering & Robotics';
  const requiredSkills = (invite.requiredSkills && invite.requiredSkills.length > 0)
    ? invite.requiredSkills
    : (teamData?.requiredSkills || ['ROS 2', 'Python', 'C++', 'Computer Vision', 'Robotics']);

  const members = (teamData?.members && teamData.members.length > 0)
    ? teamData.members
    : [
        { name: teamLeader, role: 'Team Lead', email: invite.senderEmail || 'lead@stanford.edu' },
        { name: 'Sarah Chen', role: 'Software Architect', email: 'sarah@stanford.edu' },
        { name: 'Marcus Johnson', role: 'Hardware & Sensors', email: 'marcus@stanford.edu' }
      ];

  const isPending = !invite.status || invite.status === 'pending' || !invite.actionDone;
  const isAccepted = invite.status === 'accepted' || invite.actionDone === 'Accepted';
  const isDeclined = invite.status === 'declined' || invite.actionDone === 'Declined';

  const handleModalAccept = async () => {
    setActionLoading(true);
    await onAccept(invite);
    setActionLoading(false);
    onClose();
  };

  const handleModalDecline = async () => {
    setActionLoading(true);
    await onDecline(invite);
    setActionLoading(false);
    onClose();
  };

  return (
    <div className="modal-backdrop animate-fade-in" style={{ zIndex: 9999 }}>
      <div 
        className="modal-card animate-fade-in" 
        style={{ 
          maxWidth: '620px', 
          width: '100%', 
          borderRadius: '24px', 
          padding: '0', 
          overflow: 'hidden',
          boxShadow: '0 24px 48px rgba(0,0,0,0.18)',
          background: 'var(--surface-color, #ffffff)',
          border: '1px solid var(--border-color, #E2E8F0)'
        }}
      >
        {/* Top Header Banner */}
        <div style={{ background: 'linear-gradient(135deg, #1E40AF 0%, #2563EB 50%, #3B82F6 100%)', padding: '28px 32px', color: 'white', position: 'relative' }}>
          <button 
            onClick={onClose} 
            style={{ 
              position: 'absolute', 
              top: '20px', 
              right: '20px', 
              background: 'rgba(255,255,255,0.2)', 
              border: 'none', 
              color: 'white', 
              width: '32px', 
              height: '32px', 
              borderRadius: '50%', 
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '16px',
              fontWeight: 'bold'
            }}
          >
            ✕
          </button>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
            <span style={{ background: 'rgba(255,255,255,0.25)', backdropFilter: 'blur(8px)', padding: '4px 12px', borderRadius: '12px', fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              {projectCategory}
            </span>
            <span style={{ background: '#DEF7EC', color: '#03543F', padding: '4px 10px', borderRadius: '12px', fontSize: '11px', fontWeight: 800 }}>
              ● Active Capstone Team
            </span>
          </div>

          <h2 style={{ fontSize: '22px', fontWeight: '800', margin: '0 0 6px', color: '#ffffff' }}>
            {teamName}
          </h2>
          <p style={{ fontSize: '13px', opacity: 0.9, margin: 0, lineHeight: 1.5, color: '#E0E7FF' }}>
            Invitation sent by <strong>{teamLeader}</strong>
          </p>
        </div>

        {/* Modal Body */}
        <div style={{ padding: '28px 32px', maxHeight: '65vh', overflowY: 'auto' }}>
          {/* Team Mission / Description */}
          <div style={{ marginBottom: '24px' }}>
            <h4 style={{ fontSize: '13px', fontWeight: '800', color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Layers size={14} className="text-blue" /> Team Objective & Overview
            </h4>
            <p style={{ fontSize: '14px', lineHeight: 1.6, color: 'var(--text-color, #1E293B)', background: 'var(--bg-subtle, #F8FAFC)', padding: '14px 18px', borderRadius: '14px', border: '1px solid var(--border-color, #E2E8F0)' }}>
              {teamDesc}
            </p>
          </div>

          {/* Team Leader Profile */}
          <div style={{ marginBottom: '24px' }}>
            <h4 style={{ fontSize: '13px', fontWeight: '800', color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <ShieldCheck size={14} className="text-emerald" /> Project Leader
            </h4>
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px', background: 'var(--bg-subtle, #F8FAFC)', padding: '12px 16px', borderRadius: '14px', border: '1px solid var(--border-color, #E2E8F0)' }}>
              <div style={{ width: '42px', height: '42px', borderRadius: '50%', background: '#EFF6FF', color: '#2563EB', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '800', fontSize: '15px' }}>
                {teamLeader.split(' ').map(n => n[0]).join('').slice(0, 2)}
              </div>
              <div>
                <h5 style={{ fontSize: '14px', fontWeight: '800', margin: 0, color: 'var(--text-color, #0F172A)' }}>{teamLeader}</h5>
                <span style={{ fontSize: '12px', color: '#64748B' }}>Primary Inviter • Capstone Coordinator</span>
              </div>
            </div>
          </div>

          {/* Current Team Members */}
          <div style={{ marginBottom: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
              <h4 style={{ fontSize: '13px', fontWeight: '800', color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.5px', margin: 0, display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Users size={14} className="text-purple" /> Current Active Members ({members.length})
              </h4>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '10px' }}>
              {members.map((m, idx) => (
                <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '10px', background: 'var(--bg-subtle, #F8FAFC)', padding: '10px 14px', borderRadius: '12px', border: '1px solid var(--border-color, #E2E8F0)' }}>
                  <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: idx === 0 ? '#EFF6FF' : idx === 1 ? '#DEF7EC' : '#FAF5FF', color: idx === 0 ? '#2563EB' : idx === 1 ? '#03543F' : '#7C3AED', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: '800' }}>
                    {(m.name || 'Member').split(' ').map(n => n[0]).join('').slice(0, 2)}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: '13px', fontWeight: '700', color: 'var(--text-color, #0F172A)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {m.name || 'Student Member'}
                    </div>
                    <span style={{ fontSize: '11px', color: '#64748B' }}>{m.role || 'Contributor'}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Required Skills Tags */}
          <div>
            <h4 style={{ fontSize: '13px', fontWeight: '800', color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Tag size={14} className="text-amber" /> Required Skills & Stack
            </h4>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              {requiredSkills.map((sk, idx) => (
                <span 
                  key={idx} 
                  style={{ 
                    background: '#EFF6FF', 
                    color: '#2563EB', 
                    border: '1px solid #BFDBFE', 
                    padding: '5px 12px', 
                    borderRadius: '20px', 
                    fontSize: '12px', 
                    fontWeight: 700 
                  }}
                >
                  {sk}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Modal Footer Actions */}
        <div style={{ background: 'var(--bg-subtle, #F8FAFC)', padding: '20px 32px', borderTop: '1px solid var(--border-color, #E2E8F0)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
          <button 
            type="button" 
            className="btn-secondary" 
            onClick={onClose}
            style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', fontWeight: '700', borderRadius: '12px' }}
          >
            <ArrowLeft size={14} /> Return to Notifications
          </button>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            {isPending && (
              <>
                <button 
                  type="button" 
                  className="btn-secondary" 
                  onClick={handleModalDecline}
                  disabled={actionLoading}
                  style={{ borderRadius: '12px', fontSize: '13px', fontWeight: '700', color: '#DC2626' }}
                >
                  Decline
                </button>
                <button 
                  type="button" 
                  className="btn-primary" 
                  onClick={handleModalAccept}
                  disabled={actionLoading}
                  style={{ borderRadius: '12px', fontSize: '13px', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '6px', background: '#2563EB', padding: '10px 20px' }}
                >
                  <Check size={15} /> {actionLoading ? 'Joining...' : 'Accept Invite'}
                </button>
              </>
            )}

            {isAccepted && (
              <span style={{ background: '#DEF7EC', color: '#03543F', padding: '8px 16px', borderRadius: '12px', fontSize: '13px', fontWeight: 800, border: '1px solid #BCF0DA', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Check size={14} /> You have joined this team
              </span>
            )}

            {isDeclined && (
              <span style={{ background: '#FEE2E2', color: '#DC2626', padding: '8px 16px', borderRadius: '12px', fontSize: '13px', fontWeight: 800, border: '1px solid #FCA5A5', display: 'flex', alignItems: 'center', gap: '6px' }}>
                ✕ Invitation Declined
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
