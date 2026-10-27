import React from 'react';
import { AlertCircle, AlertTriangle } from 'lucide-react';

export function ConfirmModal({
  isOpen,
  title = 'Confirm Action',
  message = 'Are you sure you want to proceed?',
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  isDanger = false,
  isLoading = false,
  onConfirm,
  onCancel
}) {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div style={{ padding: '1.625rem 1.5rem' }}>

          {/* Icon + Title */}
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.875rem', marginBottom: '0.875rem' }}>
            <div style={{
              width: '38px', height: '38px', borderRadius: '50%', flexShrink: 0,
              background: isDanger ? '#fee2e2' : 'var(--primary-light)',
              color: isDanger ? '#dc2626' : 'var(--primary)',
              display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}>
              {isDanger ? <AlertTriangle size={20} /> : <AlertCircle size={20} />}
            </div>
            <div>
              <h3 style={{ fontSize: '1rem', marginBottom: '0.25rem' }}>{title}</h3>
              <p style={{ fontSize: '0.875rem', lineHeight: 1.55 }}>{message}</p>
            </div>
          </div>

          {/* Actions */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', paddingTop: '0.75rem', borderTop: '1px solid var(--border-light)' }}>
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={onCancel}
              disabled={isLoading}
            >
              {cancelLabel}
            </button>
            <button
              type="button"
              className={`btn btn-sm ${isDanger ? 'btn-danger' : 'btn-primary'}`}
              onClick={onConfirm}
              disabled={isLoading}
            >
              {isLoading ? (
                <><span className="spinner spinner-sm" style={{ borderTopColor: '#fff' }} /> Processing…</>
              ) : confirmLabel}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ConfirmModal;
