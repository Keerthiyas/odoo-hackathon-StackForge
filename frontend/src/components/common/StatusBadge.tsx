import React from 'react';

type StatusType =
  | 'ACTIVE'
  | 'TRIALING'
  | 'PAST_DUE'
  | 'CANCELED'
  | 'UNPAID'
  | 'PAID'
  | 'PENDING'
  | 'OVERDUE'
  | 'DRAFT'
  | 'VOID'
  | 'SUCCESS'
  | 'FAILED'
  | 'REFUNDED'
  | 'ARCHIVED';

interface StatusBadgeProps {
  status: StatusType | boolean | string;
  size?: 'sm' | 'md';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, size = 'md' }) => {
  let normalized = '';
  if (typeof status === 'boolean') {
    normalized = status ? 'ACTIVE' : 'INACTIVE';
  } else {
    normalized = (status || '').toString().toUpperCase();
  }

  // Consistent semantic color pairing (Green for success/active, Orange/Amber for warning/pending, Red for overdue/failed)
  let dotColor = 'bg-slate-400';
  let textColor = 'text-slate-700';
  let bgColor = 'bg-slate-100';

  if (['ACTIVE', 'PAID', 'SUCCESS', 'TRUE', 'COMPLETED', 'ACCEPTED'].includes(normalized)) {
    dotColor = 'bg-emerald-500';
    textColor = 'text-emerald-700';
    bgColor = 'bg-emerald-50';
  } else if (['PENDING', 'TRIALING', 'DRAFT', 'PAUSED'].includes(normalized)) {
    dotColor = 'bg-amber-500';
    textColor = 'text-amber-700';
    bgColor = 'bg-amber-50';
  } else if (['SENT'].includes(normalized)) {
    dotColor = 'bg-blue-500';
    textColor = 'text-blue-700';
    bgColor = 'bg-blue-50';
  } else if (['INACTIVE', 'ARCHIVED', 'FALSE', 'CLOSED'].includes(normalized)) {
    dotColor = 'bg-slate-400';
    textColor = 'text-slate-600';
    bgColor = 'bg-slate-100';
  } else if (['OVERDUE', 'PAST_DUE', 'FAILED', 'CANCELED', 'UNPAID', 'VOID', 'REJECTED'].includes(normalized)) {
    dotColor = 'bg-rose-500';
    textColor = 'text-rose-700';
    bgColor = 'bg-rose-50';
  }

  // Format label: 'PAST_DUE' -> 'Past Due'
  const formattedLabel = normalized
    .split('_')
    .map((word) => word.charAt(0) + word.slice(1).toLowerCase())
    .join(' ');

  const sizeClasses = size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-xs';

  return (
    <span
      className={`inline-flex items-center gap-1.5 font-medium rounded-md ${bgColor} ${textColor} ${sizeClasses} whitespace-nowrap shrink-0`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${dotColor}`} aria-hidden="true" />
      {formattedLabel}
    </span>
  );
};
