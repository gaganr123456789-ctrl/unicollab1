import React, { useState } from 'react';
import { X, Lock, Mail, ArrowRight, ShieldCheck } from 'lucide-react';
import { apiClient } from '../services/apiClient';

export default function SSOAuthModal({ isOpen, onClose, provider = 'google', onSSOSuccess, theme }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen) return null;

  const isGoogle = provider === 'google';
  const brandTitle = isGoogle ? 'Sign in with Google' : 'Sign in to GitHub';
  const emailPlaceholder = isGoogle ? 'yourname@gmail.com' : 'username or email';
  const brandColor = isGoogle ? '#4285F4' : '#181717';

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email.trim()) {
      setErrorMsg(`Please enter your ${isGoogle ? 'Gmail' : 'GitHub'} email or username.`);
      return;
    }
    if (!password.trim()) {
      setErrorMsg('Please enter your account password.');
      return;
    }

    setLoading(true);
    setErrorMsg('');

    const ssoEmail = email.trim().toLowerCase().includes('@') 
      ? email.trim().toLowerCase() 
      : `${email.trim().toLowerCase()}@${isGoogle ? 'gmail.com' : 'github.com'}`;

    const rawName = email.split('@')[0].replace(/[._-]/g, ' ');
    const formattedName = rawName.charAt(0).toUpperCase() + rawName.slice(1);
    const ssoName = `${formattedName} (${isGoogle ? 'Google' : 'GitHub'})`;

    try {
      const res = await apiClient.ssoLogin(provider, {
        email: ssoEmail,
        name: ssoName
      });

      setLoading(false);
      if (res.success && res.user) {
        if (onSSOSuccess) {
          onSSOSuccess(res.user);
        }
        onClose();
      } else {
        setErrorMsg(res.message || 'Authentication failed. Please check your inputs.');
      }
    } catch (err) {
      setLoading(false);
      setErrorMsg('Network error during SSO authentication.');
    }
  };

  return (
    <div className="modal-overlay-backdrop animate-fade-in" style={{
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
      <div className="sso-auth-modal-card animate-scale-up" style={{
        width: '100%',
        maxWidth: '420px',
        background: theme === 'dark' ? '#111827' : '#FFFFFF',
        border: `1px solid ${theme === 'dark' ? '#374151' : '#E2E8F0'}`,
        borderRadius: '24px',
        boxShadow: '0 25px 60px rgba(0, 0, 0, 0.25)',
        overflow: 'hidden',
        position: 'relative'
      }}>
        {/* Header Bar */}
        <div style={{
          padding: '24px 28px 20px',
          borderBottom: `1px solid ${theme === 'dark' ? '#1F2937' : '#F1F5F9'}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '40px',
              height: '40px',
              borderRadius: '12px',
              background: theme === 'dark' ? '#1F2937' : '#F8FAFC',
              border: `1px solid ${theme === 'dark' ? '#374151' : '#E2E8F0'}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              {isGoogle ? (
                <svg width="22" height="22" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
                </svg>
              ) : (
                <svg width="22" height="22" viewBox="0 0 24 24" fill={theme === 'dark' ? '#FFFFFF' : '#0F172A'}>
                  <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"/>
                </svg>
              )}
            </div>
            <div>
              <h3 style={{ fontSize: '17px', fontWeight: 800, margin: 0, color: theme === 'dark' ? '#FFFFFF' : '#0F172A' }}>{brandTitle}</h3>
              <p style={{ fontSize: '11px', color: '#64748B', margin: '2px 0 0', fontWeight: 600 }}>SSO Authentication Service</p>
            </div>
          </div>

          <button 
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              color: '#94A3B8',
              cursor: 'pointer',
              padding: '6px',
              borderRadius: '50%'
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Modal Form */}
        <form onSubmit={handleSubmit} style={{ padding: '24px 28px' }}>
          {errorMsg && (
            <div style={{
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

          <div style={{ marginBottom: '18px' }}>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: theme === 'dark' ? '#D1D5DB' : '#334155', marginBottom: '6px' }}>
              {isGoogle ? 'Gmail Address' : 'GitHub Username / Email'}
            </label>
            <div style={{ position: 'relative' }}>
              <Mail size={16} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }} />
              <input 
                type={isGoogle ? 'email' : 'text'}
                required
                placeholder={emailPlaceholder}
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

          <div style={{ marginBottom: '24px' }}>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: theme === 'dark' ? '#D1D5DB' : '#334155', marginBottom: '6px' }}>
              Account Password
            </label>
            <div style={{ position: 'relative' }}>
              <Lock size={16} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }} />
              <input 
                type="password"
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
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

          <button 
            type="submit"
            disabled={loading}
            style={{
              width: '100%',
              padding: '12px 18px',
              borderRadius: '12px',
              border: 'none',
              background: isGoogle ? '#4285F4' : '#181717',
              color: '#FFFFFF',
              fontSize: '14px',
              fontWeight: 800,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              boxShadow: `0 4px 16px ${isGoogle ? 'rgba(66, 133, 244, 0.35)' : 'rgba(0, 0, 0, 0.35)'}`,
              transition: 'all 0.2s ease'
            }}
          >
            {loading ? 'Authenticating SSO...' : `Authenticate ${isGoogle ? 'Google' : 'GitHub'} SSO`}
            <ArrowRight size={16} />
          </button>
        </form>
      </div>
    </div>
  );
}
