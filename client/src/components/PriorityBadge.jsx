import React from 'react';
import { AlertTriangle, AlertCircle, Info, Check } from 'lucide-react';

export function PriorityBadge({ priority }) {
  const normalized = (priority || 'medium').toLowerCase();

  const config = {
    urgent: { label: 'Urgent', icon: AlertTriangle, className: 'badge-priority-urgent' },
    high: { label: 'High', icon: AlertCircle, className: 'badge-priority-high' },
    medium: { label: 'Medium', icon: Info, className: 'badge-priority-medium' },
    low: { label: 'Low', icon: Check, className: 'badge-priority-low' }
  };

  const item = config[normalized] || config.medium;
  const Icon = item.icon;

  return (
    <span className={`badge ${item.className}`}>
      <Icon size={12} strokeWidth={2.5} />
      <span>{item.label}</span>
    </span>
  );
}

export default PriorityBadge;
