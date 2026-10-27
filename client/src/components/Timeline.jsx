import React from 'react';
import {
  PlusCircle, RefreshCw, AlertTriangle,
  UserCheck, MessageSquare, Camera, CheckCircle2
} from 'lucide-react';

const EVENT_META = {
  submitted:        { Icon: PlusCircle,    color: 'var(--primary)',                  bg: 'var(--primary-light)',            label: 'Complaint Registered' },
  status_changed:   { Icon: RefreshCw,     color: 'var(--status-resolved-text)',     bg: 'var(--status-resolved-bg)',       label: 'Status Updated' },
  priority_changed: { Icon: AlertTriangle, color: 'var(--status-pending-text)',      bg: 'var(--status-pending-bg)',        label: 'Priority Adjusted' },
  assigned:         { Icon: UserCheck,     color: '#7c3aed',                         bg: '#f5f3ff',                         label: 'Technician Assigned' },
  note_added:       { Icon: MessageSquare, color: '#0284c7',                         bg: '#f0f9ff',                         label: 'Note Added' },
  evidence_uploaded:{ Icon: Camera,        color: '#4f46e5',                         bg: '#eef2ff',                         label: 'Evidence Attached' },
  _default:         { Icon: CheckCircle2,  color: 'var(--text-muted)',               bg: 'var(--bg-subtle)',                label: 'Update Recorded' },
};

function formatDate(str) {
  if (!str) return '';
  return new Date(str).toLocaleString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
    hour: '2-digit', minute: '2-digit'
  });
}

export function Timeline({ history = [] }) {
  if (!history || history.length === 0) {
    return (
      <div className="empty-state" style={{ padding: '1.5rem' }}>
        <p style={{ fontSize: '0.8125rem' }}>No timeline events recorded yet.</p>
      </div>
    );
  }

  return (
    <div className="timeline">
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        {history.map((event, idx) => {
          const meta = EVENT_META[event.event_type] || EVENT_META._default;
          const { Icon } = meta;

          return (
            <div key={event.id || idx} className="timeline-item">
              {/* Dot */}
              <div className="timeline-dot" style={{ background: meta.bg, color: meta.color }}>
                <Icon size={16} strokeWidth={2.2} />
              </div>

              {/* Body */}
              <div className="timeline-body">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.375rem', marginBottom: '0.25rem' }}>
                  <span style={{ fontWeight: 600, fontSize: '0.875rem', color: 'var(--text-main)' }}>
                    {meta.label}
                  </span>
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-light)', whiteSpace: 'nowrap' }}>
                    {formatDate(event.created_at)}
                  </span>
                </div>

                <div style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
                  By: <strong style={{ color: 'var(--text-secondary)' }}>{event.changed_by_name || 'System'}</strong>
                </div>

                {/* Value diff */}
                {(event.old_value || event.new_value) && event.event_type !== 'evidence_uploaded' && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', marginTop: '0.4rem' }}>
                    {event.old_value && <span className="diff-old">{event.old_value}</span>}
                    {event.old_value && <span style={{ color: 'var(--text-light)', fontSize: '0.75rem' }}>→</span>}
                    <span className="diff-new">{event.new_value}</span>
                  </div>
                )}

                {/* Note */}
                {event.note && (
                  <div style={{
                    marginTop: '0.5rem',
                    fontSize: '0.8125rem',
                    color: 'var(--text-secondary)',
                    lineHeight: 1.5,
                    background: 'var(--bg-subtle)',
                    padding: '0.5rem 0.75rem',
                    borderRadius: 'var(--radius-sm)',
                    borderLeft: `2.5px solid ${meta.color}`
                  }}>
                    {event.note}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default Timeline;
