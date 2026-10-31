import React from 'react';
import { LucideIcon, TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface MetricCardProps {
  title: string;
  value: string | number;
  change?: number; // e.g. +12.4% or -2.1%
  subtitle?: string;
  icon: LucideIcon;
  variant?: 'default' | 'success' | 'warning' | 'error';
  isLoading?: boolean;
}

export const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  change,
  subtitle,
  icon: Icon,
  variant = 'default',
  isLoading = false,
}) => {
  const getIconStyles = () => {
    switch (variant) {
      case 'success':
        return 'bg-emerald-50 text-emerald-600 border-emerald-100';
      case 'warning':
        return 'bg-amber-50 text-amber-600 border-amber-100';
      case 'error':
        return 'bg-rose-50 text-rose-600 border-rose-100';
      default:
        return 'bg-blue-50 text-blue-600 border-blue-100';
    }
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs hover:border-slate-300 transition-all">
      <div className="flex items-center justify-between gap-3">
        <span className="text-xs font-medium text-slate-500 uppercase tracking-wide truncate">
          {title}
        </span>
        <div
          className={`w-9 h-9 rounded-lg border flex items-center justify-center shrink-0 ${getIconStyles()}`}
        >
          <Icon className="w-4 h-4 stroke-[2]" />
        </div>
      </div>

      <div className="mt-3">
        {isLoading ? (
          <div className="h-8 w-28 bg-slate-100 rounded animate-pulse my-1" />
        ) : (
          <div className="text-2xl font-bold tracking-tight text-slate-900 tabular-nums">
            {value}
          </div>
        )}
      </div>

      <div className="mt-2.5 flex items-center justify-between text-xs text-slate-500 pt-2 border-t border-slate-100">
        {change !== undefined ? (
          <div className="flex items-center gap-1 font-medium">
            {change > 0 ? (
              <span className="inline-flex items-center text-emerald-700 text-xs font-semibold gap-0.5">
                <TrendingUp className="w-3.5 h-3.5" />
                +{change}%
              </span>
            ) : change < 0 ? (
              <span className="inline-flex items-center text-rose-700 text-xs font-semibold gap-0.5">
                <TrendingDown className="w-3.5 h-3.5" />
                {change}%
              </span>
            ) : (
              <span className="inline-flex items-center text-slate-500 text-xs font-semibold gap-0.5">
                <Minus className="w-3 h-3" />
                0%
              </span>
            )}
            <span className="text-slate-400 text-[11px] ml-1">vs previous period</span>
          </div>
        ) : (
          <span className="text-slate-500 text-[11px]">{subtitle || 'Active period'}</span>
        )}

        {subtitle && change !== undefined && (
          <span className="text-[11px] text-slate-400 font-medium truncate">{subtitle}</span>
        )}
      </div>
    </div>
  );
};
