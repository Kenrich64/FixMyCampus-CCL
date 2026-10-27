import React from 'react';
import { Clock, CheckCircle2, PlayCircle, XCircle } from 'lucide-react';

export function StatusBadge({ status }) {
  const normalized = (status || 'pending').toLowerCase();

  const config = {
    pending: { label: 'Pending', icon: Clock, className: 'badge-pending' },
    in_progress: { label: 'In Progress', icon: PlayCircle, className: 'badge-in_progress' },
    resolved: { label: 'Resolved', icon: CheckCircle2, className: 'badge-resolved' },
    rejected: { label: 'Rejected', icon: XCircle, className: 'badge-rejected' }
  };

  const item = config[normalized] || config.pending;
  const Icon = item.icon;

  return (
    <span className={`badge ${item.className}`}>
      <Icon size={12} strokeWidth={2.5} />
      <span>{item.label}</span>
    </span>
  );
}

export default StatusBadge;
