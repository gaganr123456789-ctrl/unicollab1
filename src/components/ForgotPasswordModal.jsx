import React, { useState } from 'react';
import { X, KeyRound, Mail, CheckCircle2, ArrowRight, ShieldCheck, Lock } from 'lucide-react';
import { apiClient } from '../services/apiClient';

export default function ForgotPasswordModal({ isOpen, onClose, theme }) {
  const [step, setStep] = useState(1); // 1: Request Link/Code, 2: Enter Verification Code & New Password, 3: Success
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successInfo, setSuccessInfo] = useState('');

  if (!isOpen) return null;

  const handleRequestReset = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessInfo('');

    if (!email.trim()) {
      setErrorMsg('Please enter your registered academic email address.');
      return;
    }

    setLoading(true);
    const res = await apiClient.forgotPassword(email.trim());
    setLoading(false);

    if (res.success) {
      setSuccessInfo(res.message || 'A 6-digit verification code has been dispatched to your email inbox.');
      setStep(2);
    } else {
      setErrorMsg(res.message || 'Failed to dispatch password reset code.');
    }
  };

  const handleResetPasswordSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    if (!code.trim()) {
      setErrorMsg('Please enter the 6-digit reset code received in your email inbox.');
      return;
    }

    if (!newPassword || newPassword.length < 6) {
      setErrorMsg('New password must be at least 6 characters.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setErrorMsg('New password and confirmation do not match.');
      return;
    }

    setLoading(true);
    // 1. Verify OTP
    const verifyRes = await apiClient.verifyOtp(email.trim(), code.trim());
    if (!verifyRes.success) {
      setLoading(false);
      setErrorMsg(verifyRes.message || 'Invalid or expired verification code.');
      return;
    }

    // 2. Reset Password
    const res = await apiClient.resetPassword(email.trim(), code.trim(), newPassword.trim());
    setLoading(false);

    if (res.success) {
      setStep(3);
    } else {
      setErrorMsg(res.message || 'Password reset execution failed. Please check your code.');
    }
  };

  const handleClose = () => {
    setStep(1);
    setEmail('');
    setCode('');
    setNewPassword('');
    setConfirmPassword('');
    setErrorMsg('');
    setSuccessInfo('');
    onClose();
  };

  return (
    <div className="modal-backdrop animate-fade-in" onClick={handleClose} style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(15, 23, 42, 0.75)',
      backdropFilter: 'blur(8px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 99999,
      padding: '20px'
    }}>
      <div className="modal-content modal-md" onClick={(e) => e.stopPropagation()} style={{
        width: '100%',
        maxWidth: '460px',
        background: theme === 'dark' ? '#111827' : '#FFFFFF',
        border: `1px solid ${theme === 'dark' ? '#374151' : '#E2E8F0'}`,
        borderRadius: '24px',
        boxShadow: '0 25px 60px rgba(0, 0, 0, 0.25)',
        overflow: 'hidden',
        position: 'relative'
      }}>
        
        {/* Modal Header */}
        <div className="modal-header flex justify-between align-center" style={{
          padding: '24px 28px 18px',
          borderBottom: `1px solid ${theme === 'dark' ? '#1F2937' : '#F1F5F9'}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <div className="flex align-center gap-2" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div className="modal-icon-badge blue" style={{
              width: '40px',
              height: '40px',
              borderRadius: '12px',
              background: '#EFF6FF',
              color: '#2563EB',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <KeyRound size={20} />
            </div>
            <div>
              <h3 style={{ fontSize: '18px', fontWeight: 800, margin: 0, color: theme === 'dark' ? '#FFFFFF' : '#0F172A' }}>Reset Your Password</h3>
              <p className="text-sm text-muted" style={{ fontSize: '12px', color: '#64748B', margin: '2px 0 0' }}>UniCollab Real Resend OTP Recovery</p>
            </div>
          </div>
          <button className="btn-close-modal" onClick={handleClose} style={{ background: 'none', border: 'none', color: '#94A3B8', cursor: 'pointer' }}>
            <X size={20} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="modal-body" style={{ padding: '24px 28px' }}>

          {errorMsg && (
            <div className="banner error-banner mb-4" style={{
              background: '#FEE2E2',
              border: '1px solid #FCA5A5',
              color: '#991B1B',
              padding: '10px 14px',
              borderRadius: '12px',
              fontSize: '12.5px',
              fontWeight: 600,
              marginBottom: '18px'
            }}>
              ⚠️ {errorMsg}
            </div>
          )}

          {step === 1 && (
            <form onSubmit={handleRequestReset}>
              <p className="text-muted text-sm mb-4" style={{ fontSize: '13.5px', color: theme === 'dark' ? '#9CA3AF' : '#475569', marginBottom: '18px' }}>
                Enter your registered academic email address. We will send a 6-digit verification code directly to your inbox via Resend.
              </p>

              <div className="form-group" style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: theme === 'dark' ? '#D1D5DB' : '#334155', marginBottom: '6px' }}>Academic Email Address</label>
                <div className="input-icon-wrapper" style={{ position: 'relative' }}>
                  <Mail size={16} className="input-icon" style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }} />
                  <input 
                    type="email" 
                    required 
                    placeholder="e.g. alex.rivera@stanford.edu"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '11px 14px 11px 40px',
                      borderRadius: '12px',
                      border: `1px solid ${theme === 'dark' ? '#374151' : '#CBD5E1'}`,
                      background: theme === 'dark' ? '#1F2937' : '#F8FAFC',
                      color: theme === 'dark' ? '#F9FAFB' : '#0F172A',
                      fontSize: '13.5px',
                      outline: 'none',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>
              </div>

              <div className="modal-actions flex justify-end gap-2" style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                <button type="button" className="btn-secondary" onClick={handleClose} disabled={loading} style={{
                  padding: '10px 18px',
                  borderRadius: '12px',
                  border: `1px solid ${theme === 'dark' ? '#374151' : '#CBD5E1'}`,
                  background: 'transparent',
                  color: theme === 'dark' ? '#D1D5DB' : '#475569',
                  fontSize: '13px',
                  fontWeight: 700,
                  cursor: 'pointer'
                }}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary" disabled={loading} style={{
                  padding: '10px 20px',
                  borderRadius: '12px',
                  border: 'none',
                  background: '#2563EB',
                  color: '#FFFFFF',
                  fontSize: '13px',
                  fontWeight: 800,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}>
                  {loading ? 'Dispatching Email via Resend...' : 'Send Resend OTP Code'}
                  <ArrowRight size={16} />
                </button>
              </div>
            </form>
          )}

          {step === 2 && (
            <form onSubmit={handleResetPasswordSubmit}>
              {successInfo && (
                <div style={{
                  background: '#ECFDF5',
                  border: '1px solid #6EE7B7',
                  color: '#065F46',
                  padding: '10px 14px',
                  borderRadius: '12px',
                  fontSize: '12.5px',
                  fontWeight: 600,
                  marginBottom: '18px'
                }}>
                  📬 {successInfo}
                </div>
              )}

              <div className="form-group mb-3" style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: theme === 'dark' ? '#D1D5DB' : '#334155', marginBottom: '6px' }}>6-Digit Resend Verification Code</label>
                <div className="input-icon-wrapper" style={{ position: 'relative' }}>
                  <ShieldCheck size={16} className="input-icon" style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#2563EB' }} />
                  <input 
                    type="text" 
                    required 
                    maxLength="6"
                    placeholder="Enter 6-digit OTP code"
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '11px 14px 11px 40px',
                      borderRadius: '12px',
                      border: `1px solid ${theme === 'dark' ? '#374151' : '#CBD5E1'}`,
                      background: theme === 'dark' ? '#1F2937' : '#F8FAFC',
                      color: theme === 'dark' ? '#F9FAFB' : '#0F172A',
                      fontSize: '15px',
                      fontWeight: 800,
                      letterSpacing: '3px',
                      outline: 'none',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>
              </div>

              <div className="form-group mb-3" style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: theme === 'dark' ? '#D1D5DB' : '#334155', marginBottom: '6px' }}>New Password</label>
                <div className="input-icon-wrapper" style={{ position: 'relative' }}>
                  <Lock size={16} className="input-icon" style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }} />
                  <input 
                    type="password" 
                    required 
                    placeholder="••••••••"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '11px 14px 11px 40px',
                      borderRadius: '12px',
                      border: `1px solid ${theme === 'dark' ? '#374151' : '#CBD5E1'}`,
                      background: theme === 'dark' ? '#1F2937' : '#F8FAFC',
                      color: theme === 'dark' ? '#F9FAFB' : '#0F172A',
                      fontSize: '13.5px',
                      outline: 'none',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>
              </div>

              <div className="form-group mb-4" style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: theme === 'dark' ? '#D1D5DB' : '#334155', marginBottom: '6px' }}>Confirm New Password</label>
                <div className="input-icon-wrapper" style={{ position: 'relative' }}>
                  <Lock size={16} className="input-icon" style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }} />
                  <input 
                    type="password" 
                    required 
                    placeholder="••••••••"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '11px 14px 11px 40px',
                      borderRadius: '12px',
                      border: `1px solid ${theme === 'dark' ? '#374151' : '#CBD5E1'}`,
                      background: theme === 'dark' ? '#1F2937' : '#F8FAFC',
                      color: theme === 'dark' ? '#F9FAFB' : '#0F172A',
                      fontSize: '13.5px',
                      outline: 'none',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>
              </div>

              <div className="modal-actions flex justify-end gap-2" style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                <button type="button" className="btn-secondary" onClick={() => setStep(1)} disabled={loading} style={{
                  padding: '10px 18px',
                  borderRadius: '12px',
                  border: `1px solid ${theme === 'dark' ? '#374151' : '#CBD5E1'}`,
                  background: 'transparent',
                  color: theme === 'dark' ? '#D1D5DB' : '#475569',
                  fontSize: '13px',
                  fontWeight: 700,
                  cursor: 'pointer'
                }}>
                  Back
                </button>
                <button type="submit" className="btn-primary" disabled={loading} style={{
                  padding: '10px 20px',
                  borderRadius: '12px',
                  border: 'none',
                  background: '#2563EB',
                  color: '#FFFFFF',
                  fontSize: '13px',
                  fontWeight: 800,
                  cursor: 'pointer'
                }}>
                  {loading ? 'Verifying & Updating...' : 'Reset Password'}
                </button>
              </div>
            </form>
          )}

          {step === 3 && (
            <div className="text-center py-4" style={{ textAlign: 'center', padding: '16px 0' }}>
              <div className="modal-icon-badge green center-badge mb-3" style={{
                width: '56px',
                height: '56px',
                borderRadius: '50%',
                background: '#ECFDF5',
                color: '#059669',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '16px'
              }}>
                <CheckCircle2 size={28} />
              </div>
              <h4 style={{ fontSize: '20px', fontWeight: 800, color: theme === 'dark' ? '#FFFFFF' : '#0F172A', margin: '0 0 8px' }}>Password Reset Successful!</h4>
              <p className="text-muted text-sm mb-4" style={{ fontSize: '13.5px', color: theme === 'dark' ? '#9CA3AF' : '#64748B', marginBottom: '24px' }}>
                Your UniCollab password has been updated. You can now log in using your new credentials.
              </p>
              <button className="btn-primary full-width" onClick={handleClose} style={{
                width: '100%',
                padding: '12px',
                borderRadius: '12px',
                border: 'none',
                background: '#2563EB',
                color: '#FFFFFF',
                fontSize: '14px',
                fontWeight: 800,
                cursor: 'pointer'
              }}>
                Return to Login
              </button>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
