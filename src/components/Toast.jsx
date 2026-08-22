import React from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

export default function Toast({ toasts = [], removeToast }) {
  if (!toasts || toasts.length === 0) return null;

  return (
    <div style={{
      position: 'fixed',
      top: '20px',
      right: '20px',
      zIndex: 99999,
      display: 'flex',
      flexDirection: 'column',
      gap: '10px',
      maxWidth: '380px',
      width: 'calc(100% - 40px)',
      pointerEvents: 'none'
    }}>
      {toasts.map(toast => {
        const isSuccess = toast.type === 'success';
        const isError = toast.type === 'error';
        const isWarning = toast.type === 'warning';

        const bg = isSuccess ? '#ECFDF5' : isError ? '#FEF2F2' : isWarning ? '#FFFBEB' : '#EFF6FF';
        const border = isSuccess ? '#10B981' : isError ? '#EF4444' : isWarning ? '#F59E0B' : '#3B82F6';
        const color = isSuccess ? '#065F46' : isError ? '#991B1B' : isWarning ? '#92400E' : '#1E40AF';

        return (
          <div
            key={toast.id}
            className="animate-fade-in"
            style={{
              pointerEvents: 'auto',
              background: bg,
              borderLeft: `4px solid ${border}`,
              color: color,
              padding: '12px 16px',
              borderRadius: '12px',
              boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '12px',
              fontSize: '13.5px',
              fontWeight: 600
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              {isSuccess && <CheckCircle2 size={18} style={{ color: border, flexShrink: 0 }} />}
              {isError && <AlertCircle size={18} style={{ color: border, flexShrink: 0 }} />}
              {isWarning && <AlertCircle size={18} style={{ color: border, flexShrink: 0 }} />}
              {!isSuccess && !isError && !isWarning && <Info size={18} style={{ color: border, flexShrink: 0 }} />}
              <span>{toast.message}</span>
            </div>
            {removeToast && (
              <button
                onClick={() => removeToast(toast.id)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: color, padding: '2px', display: 'flex' }}
              >
                <X size={14} />
              </button>
            )}
          </div>
        );
      })}
    </div>
  );
}
