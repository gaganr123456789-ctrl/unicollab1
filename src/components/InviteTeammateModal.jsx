import React, { useState, useEffect } from 'react';
import { UserPlus, CheckCircle2, AlertCircle, X, Users, Layers, Mail, ShieldCheck } from 'lucide-react';
import { apiClient } from '../services/apiClient';

export default function InviteTeammateModal({ isOpen, onClose, userProfile, targetUser, defaultTeamName, onInviteSent }) {
  const [teams, setTeams] = useState([
    { id: 'team_drone_1', name: 'Autonomous Drone Navigation', category: 'Engineering & Robotics' },
    { id: 'team_fintrack_2', name: 'FinTrack Mobile', category: 'Software & FinTech' },
    { id: 'team_ecotrack_3', name: 'EcoTrack Sustainability', category: 'CleanTech & IoT' }
  ]);
  const [selectedTeamId, setSelectedTeamId] = useState('team_drone_1');
  const [customTeamName, setCustomTeamName] = useState(defaultTeamName || '');
  const [recipientEmail, setRecipientEmail] = useState(targetUser?.email || '');
  const [recipientName, setRecipientName] = useState(targetUser?.name || '');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState({ type: '', text: '' });
  const [registeredStudents, setRegisteredStudents] = useState([]);

  useEffect(() => {
    if (!isOpen) return;

    if (targetUser) {
      setRecipientEmail(targetUser.email || '');
      setRecipientName(targetUser.name || '');
    }

    if (defaultTeamName) {
      setCustomTeamName(defaultTeamName);
      const match = teams.find(t => t.name.toLowerCase() === defaultTeamName.toLowerCase());
      if (match) setSelectedTeamId(match.id);
    }

    // Load registered students for dropdown selection
    const loadStudents = async () => {
      try {
        const myEmail = (userProfile?.email || '').toLowerCase().trim();
        const res = await apiClient.getTeammates('', '', '', myEmail);
        if (res.success && Array.isArray(res.teammates)) {
          setRegisteredStudents(res.teammates);
        }
      } catch (e) {}
    };
    loadStudents();
  }, [isOpen, targetUser, defaultTeamName, userProfile]);

  if (!isOpen) return null;

  const handleStudentSelect = (e) => {
    const selectedEmail = e.target.value;
    setRecipientEmail(selectedEmail);
    const found = registeredStudents.find(s => s.email === selectedEmail);
    if (found) {
      setRecipientName(found.name);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!recipientEmail) {
      setFeedback({ type: 'error', text: 'Please select or enter the recipient student email.' });
      return;
    }

    const selectedTeam = teams.find(t => t.id === selectedTeamId);
    const finalTeamName = customTeamName || selectedTeam?.name || 'Capstone Project Team';
    const finalTeamId = selectedTeam ? selectedTeam.id : 'team_' + Date.now();

    setLoading(true);
    setFeedback({ type: '', text: '' });

    try {
      const myName = userProfile?.name || 'Student User';
      const myEmail = userProfile?.email || '';
      const myId = userProfile?.id || 'user_current';

      const res = await apiClient.sendTeamInvite({
        senderId: myId,
        senderName: myName,
        senderEmail: myEmail,
        recipientEmail: recipientEmail.trim().toLowerCase(),
        recipientName: recipientName || recipientEmail.split('@')[0],
        teamId: finalTeamId,
        teamName: finalTeamName,
        teamDesc: selectedTeam?.description || 'University collaborative engineering capstone project team.',
        teamLeader: myName,
        projectCategory: selectedTeam?.category || 'Engineering',
        message: message || `${myName} invited you to join the ${finalTeamName} team.`
      });

      if (res.success) {
        setFeedback({ type: 'success', text: `Team invitation sent to ${recipientName || recipientEmail} successfully!` });
        if (onInviteSent) onInviteSent(res.invite);
        setTimeout(() => {
          onClose();
          setFeedback({ type: '', text: '' });
        }, 1200);
      } else {
        setFeedback({ type: 'error', text: res.message || 'Failed to send invitation.' });
      }
    } catch (err) {
      setFeedback({ type: 'error', text: err.message || 'System error sending invite.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-backdrop animate-fade-in" style={{ zIndex: 9999 }}>
      <div className="modal-card animate-fade-in" style={{ maxWidth: '520px', width: '100%', borderRadius: '24px', padding: '32px' }}>
        <div className="modal-header flex justify-between align-center pb-3" style={{ borderBottom: '1px solid var(--border-color, #E2E8F0)', marginBottom: '20px' }}>
          <div className="flex align-center gap-3">
            <div style={{ width: '42px', height: '42px', borderRadius: '12px', background: '#EFF6FF', color: '#2563EB', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <UserPlus size={22} />
            </div>
            <div>
              <h3 style={{ fontSize: '18px', fontWeight: '800', margin: 0 }}>Invite Teammate to Capstone</h3>
              <p style={{ fontSize: '12px', color: '#64748B', margin: '2px 0 0' }}>Send an actionable team invitation request</p>
            </div>
          </div>
          <button className="close-btn" onClick={onClose} style={{ background: 'none', border: 'none', fontSize: '18px', cursor: 'pointer', color: '#94A3B8' }}>✕</button>
        </div>

        {feedback.text && (
          <div className={`p-3 rounded-xl mb-4 flex align-center gap-2 ${feedback.type === 'error' ? 'bg-red-50 text-red-600 border border-red-200' : 'bg-emerald-50 text-emerald-600 border border-emerald-200'}`} style={{ padding: '12px 16px', borderRadius: '12px', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '8px', background: feedback.type === 'error' ? '#FEF2F2' : '#DEF7EC', color: feedback.type === 'error' ? '#DC2626' : '#03543F' }}>
            {feedback.type === 'error' ? <AlertCircle size={16} /> : <CheckCircle2 size={16} />}
            <span>{feedback.text}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="form-group-stack">
          {/* Select Team */}
          <div className="form-group mb-4">
            <label style={{ fontSize: '13px', fontWeight: '700', marginBottom: '6px', display: 'block' }}>Select Project Team *</label>
            <select
              value={selectedTeamId}
              onChange={(e) => setSelectedTeamId(e.target.value)}
              className="custom-sort-btn"
              style={{ width: '100%', padding: '10px 14px', borderRadius: '12px', border: '1px solid #CBD5E1', fontSize: '13.5px', background: 'white' }}
            >
              {teams.map(t => (
                <option key={t.id} value={t.id}>{t.name} ({t.category})</option>
              ))}
            </select>
          </div>

          {/* Recipient Student */}
          <div className="form-group mb-4">
            <label style={{ fontSize: '13px', fontWeight: '700', marginBottom: '6px', display: 'block' }}>Recipient Student *</label>
            {registeredStudents.length > 0 ? (
              <select
                value={recipientEmail}
                onChange={handleStudentSelect}
                className="custom-sort-btn mb-2"
                style={{ width: '100%', padding: '10px 14px', borderRadius: '12px', border: '1px solid #CBD5E1', fontSize: '13.5px', background: 'white', marginBottom: '8px' }}
              >
                <option value="">-- Choose from registered students --</option>
                {registeredStudents.map(s => (
                  <option key={s.email} value={s.email}>{s.name} ({s.major || s.role}) - {s.email}</option>
                ))}
              </select>
            ) : null}

            <input
              type="email"
              placeholder="Or enter student email: classmate@stanford.edu"
              value={recipientEmail}
              onChange={(e) => setRecipientEmail(e.target.value)}
              required
              style={{ width: '100%', padding: '10px 14px', borderRadius: '12px', border: '1px solid #CBD5E1', fontSize: '13.5px' }}
            />
          </div>

          {/* Invitation Message */}
          <div className="form-group mb-5">
            <label style={{ fontSize: '13px', fontWeight: '700', marginBottom: '6px', display: 'block' }}>Personal Note (Optional)</label>
            <textarea
              rows={3}
              placeholder="Hey! Would love to have you on our team for the capstone project..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              style={{ width: '100%', padding: '10px 14px', borderRadius: '12px', border: '1px solid #CBD5E1', fontSize: '13.5px', resize: 'vertical' }}
            />
          </div>

          {/* Submit Actions */}
          <div className="modal-actions flex gap-3 mt-4" style={{ display: 'flex', gap: '12px' }}>
            <button
              type="submit"
              className="btn-primary full-width"
              disabled={loading}
              style={{ flex: 1, height: '44px', fontWeight: '800', borderRadius: '12px' }}
            >
              {loading ? 'Sending Request...' : 'Send Team Invitation'}
            </button>
            <button
              type="button"
              className="btn-secondary"
              onClick={onClose}
              style={{ borderRadius: '12px', padding: '0 20px' }}
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
