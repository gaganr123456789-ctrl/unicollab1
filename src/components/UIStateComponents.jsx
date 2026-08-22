import React from 'react';
import { AlertCircle, RefreshCw, Inbox, CheckCircle2, X } from 'lucide-react';

// 1. Loading Skeleton Component
export const SkeletonCard = ({ count = 3, type = 'card' }) => {
  return (
    <div className="skeleton-grid-wrapper" style={{ display: 'grid', gap: '20px', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', width: '100%' }}>
      {Array.from({ length: count }).map((_, idx) => (
        <div 
          key={idx} 
          className="skeleton-card"
          style={{
            padding: '24px',
            borderRadius: '16px',
            background: 'var(--bg-glass, rgba(255, 255, 255, 0.7))',
            border: '1px solid rgba(226, 232, 240, 0.8)',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
            animation: 'pulse 1.5s infinite ease-in-out'
          }}
        >
          <div style={{ width: '40%', height: '18px', background: '#E2E8F0', borderRadius: '6px' }} />
          <div style={{ width: '80%', height: '24px', background: '#CBD5E1', borderRadius: '6px' }} />
          <div style={{ width: '100%', height: '14px', background: '#F1F5F9', borderRadius: '4px' }} />
          <div style={{ width: '60%', height: '14px', background: '#F1F5F9', borderRadius: '4px' }} />
          <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
            <div style={{ width: '60px', height: '22px', background: '#DBEAFE', borderRadius: '12px' }} />
            <div style={{ width: '80px', height: '22px', background: '#EDE9FE', borderRadius: '12px' }} />
          </div>
        </div>
      ))}
    </div>
  );
};

// 2. Error State Component with Retry Action
export const ErrorMessage = ({ title = 'Failed to load content', message = 'Something went wrong while communicating with the server.', onRetry }) => {
  return (
    <div 
      className="error-state-card"
      style={{
        padding: '32px 24px',
        borderRadius: '16px',
        background: '#FEF2F2',
        border: '1px solid #FECACA',
        textAlign: 'center',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '14px',
        margin: '20px 0'
      }}
    >
      <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: '#FEE2E2', color: '#EF4444', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <AlertCircle size={26} />
      </div>
      <div>
        <h4 style={{ margin: '0 0 6px 0', fontSize: '16px', fontWeight: 800, color: '#991B1B' }}>{title}</h4>
        <p style={{ margin: 0, fontSize: '13.5px', color: '#B91C1C' }}>{message}</p>
      </div>
      {onRetry && (
        <button
          onClick={onRetry}
          style={{
            padding: '10px 20px',
            borderRadius: '9999px',
            background: '#EF4444',
            color: 'white',
            border: 'none',
            fontSize: '13px',
            fontWeight: 700,
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px'
          }}
        >
          <RefreshCw size={15} /> Try Again
        </button>
      )}
    </div>
  );
};

// 3. Designed Empty State Placeholder
export const EmptyState = ({ 
  icon: Icon = Inbox, 
  title = 'No items found', 
  description = 'There is no data matching your current filters or selection.', 
  actionLabel, 
  onAction 
}) => {
  return (
    <div 
      className="empty-state-card"
      style={{
        padding: '48px 24px',
        borderRadius: '20px',
        background: 'var(--bg-glass, rgba(255, 255, 255, 0.6))',
        border: '1px dashed #CBD5E1',
        textAlign: 'center',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '16px',
        margin: '24px 0'
      }}
    >
      <div style={{ width: '56px', height: '56px', borderRadius: '16px', background: '#EFF6FF', color: '#2563EB', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Icon size={28} />
      </div>
      <div style={{ maxWidth: '400px' }}>
        <h3 style={{ margin: '0 0 6px 0', fontSize: '18px', fontWeight: 800, color: 'var(--text-main, #0F172A)' }}>{title}</h3>
        <p style={{ margin: 0, fontSize: '14px', color: 'var(--text-muted, #64748B)' }}>{description}</p>
      </div>
      {actionLabel && onAction && (
        <button
          onClick={onAction}
          style={{
            padding: '10px 22px',
            borderRadius: '9999px',
            background: 'linear-gradient(135deg, #2563EB 0%, #7C3AED 100%)',
            color: 'white',
            border: 'none',
            fontSize: '13.5px',
            fontWeight: 700,
            cursor: 'pointer',
            boxShadow: '0 4px 14px rgba(37, 99, 235, 0.25)'
          }}
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
};

// 4. Toast Notification Popup
export const ToastNotification = ({ toast, onClose }) => {
  if (!toast) return null;

  const isSuccess = toast.type !== 'error';

  return (
    <div
      style={{
        position: 'fixed',
        bottom: '24px',
        right: '24px',
        zIndex: 9999,
        background: isSuccess ? '#065F46' : '#991B1B',
        color: 'white',
        padding: '14px 20px',
        borderRadius: '12px',
        boxShadow: '0 10px 25px rgba(0, 0, 0, 0.2)',
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        fontSize: '14px',
        fontWeight: 600,
        animation: 'slideUp 0.3s ease-out'
      }}
    >
      {isSuccess ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
      <span>{toast.message}</span>
      <button 
        onClick={onClose}
        style={{ background: 'transparent', border: 'none', color: 'white', cursor: 'pointer', opacity: 0.8, padding: 0, marginLeft: '8px' }}
      >
        <X size={16} />
      </button>
    </div>
  );
};
