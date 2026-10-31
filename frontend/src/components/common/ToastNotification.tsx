import React, { useEffect } from 'react';
import { CheckCircle2, AlertTriangle, AlertCircle, Info, X } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface ToastProps {
  id?: string;
  type: ToastType;
  message: string;
  title?: string;
  duration?: number;
  onClose: () => void;
}

export const ToastNotification: React.FC<ToastProps> = ({
  type,
  message,
  title,
  duration = 4000,
  onClose,
}) => {
  useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(() => {
        onClose();
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [duration, onClose]);

  const config = {
    success: {
      icon: CheckCircle2,
      bg: 'bg-emerald-50 border-emerald-200 text-emerald-900',
      iconColor: 'text-emerald-600',
    },
    error: {
      icon: AlertCircle,
      bg: 'bg-rose-50 border-rose-200 text-rose-900',
      iconColor: 'text-rose-600',
    },
    warning: {
      icon: AlertTriangle,
      bg: 'bg-amber-50 border-amber-200 text-amber-900',
      iconColor: 'text-amber-600',
    },
    info: {
      icon: Info,
      bg: 'bg-blue-50 border-blue-200 text-blue-900',
      iconColor: 'text-blue-600',
    },
  }[type];

  const Icon = config.icon;

  return (
    <div
      className={`fixed top-4 right-4 z-50 max-w-md w-full shadow-lg border rounded-xl p-3.5 flex items-start gap-3 animate-in fade-in slide-in-from-top-3 duration-200 ${config.bg}`}
    >
      <Icon className={`w-5 h-5 shrink-0 mt-0.5 ${config.iconColor}`} />
      <div className="flex-1 min-w-0">
        {title && <h4 className="text-xs font-bold leading-tight mb-0.5">{title}</h4>}
        <p className="text-xs leading-relaxed">{message}</p>
      </div>
      <button
        onClick={onClose}
        className="p-1 text-slate-400 hover:text-slate-700 rounded-md transition-colors shrink-0"
        aria-label="Dismiss toast"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
};
