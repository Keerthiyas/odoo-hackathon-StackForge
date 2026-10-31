import React, { useState, useRef, useEffect } from 'react';
import { Calendar, RefreshCw, ChevronDown, Check } from 'lucide-react';
import { DateFilterType } from '../../types';

interface DateFilterBarProps {
  currentFilter: DateFilterType;
  onFilterChange: (filter: DateFilterType, customDates?: { start: string; end: string }) => void;
  onRefresh: () => void;
  isRefreshing?: boolean;
}

export const DateFilterBar: React.FC<DateFilterBarProps> = ({
  currentFilter,
  onFilterChange,
  onRefresh,
  isRefreshing = false,
}) => {
  const [customOpen, setCustomOpen] = useState(false);
  const [startDate, setStartDate] = useState('2026-10-01');
  const [endDate, setEndDate] = useState('2026-10-31');
  const customRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (customRef.current && !customRef.current.contains(event.target as Node)) {
        setCustomOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filterOptions: { id: DateFilterType; label: string }[] = [
    { id: 'today', label: 'Today' },
    { id: 'week', label: 'This Week' },
    { id: 'month', label: 'This Month' },
    { id: 'year', label: 'This Year' },
  ];

  const handleApplyCustom = (e: React.FormEvent) => {
    e.preventDefault();
    onFilterChange('custom', { start: startDate, end: endDate });
    setCustomOpen(false);
  };

  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2">
      <div>
        <h1 className="text-xl font-bold tracking-tight text-slate-900">Subscription Overview</h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Real-time metrics, automated billing health, and contract revenue analysis
        </p>
      </div>

      <div className="flex items-center gap-2 self-start sm:self-auto flex-wrap">
        {/* Date Filter Segmented Buttons */}
        <div className="flex items-center p-1 bg-white border border-slate-200 rounded-lg shadow-xs">
          {filterOptions.map((opt) => (
            <button
              key={opt.id}
              onClick={() => onFilterChange(opt.id)}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all whitespace-nowrap ${
                currentFilter === opt.id
                  ? 'bg-blue-600 text-white font-semibold shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              {opt.label}
            </button>
          ))}

          {/* Custom Date Range Picker */}
          <div className="relative" ref={customRef}>
            <button
              onClick={() => setCustomOpen(!customOpen)}
              className={`px-2.5 py-1.5 text-xs font-medium rounded-md transition-all flex items-center gap-1.5 whitespace-nowrap ${
                currentFilter === 'custom'
                  ? 'bg-blue-600 text-white font-semibold shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <Calendar className="w-3.5 h-3.5" />
              <span>Custom</span>
              <ChevronDown className="w-3 h-3 opacity-70" />
            </button>

            {customOpen && (
              <div className="absolute right-0 mt-2 w-72 bg-white rounded-xl shadow-xl border border-slate-200 p-4 z-50 animate-in fade-in zoom-in-95 duration-100">
                <div className="font-semibold text-xs text-slate-900 mb-3 flex items-center gap-1.5">
                  <Calendar className="w-4 h-4 text-blue-600" />
                  Select Date Range
                </div>
                <form onSubmit={handleApplyCustom} className="space-y-3">
                  <div>
                    <label className="block text-[11px] font-medium text-slate-600 mb-1">
                      Start Date
                    </label>
                    <input
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="w-full px-2.5 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-none focus:border-blue-600"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-medium text-slate-600 mb-1">
                      End Date
                    </label>
                    <input
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      className="w-full px-2.5 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-none focus:border-blue-600"
                    />
                  </div>
                  <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={() => setCustomOpen(false)}
                      className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-lg"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-3 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg"
                    >
                      Apply Range
                    </button>
                  </div>
                </form>
              </div>
            )}
          </div>
        </div>

        {/* Refresh simulation button */}
        <button
          onClick={onRefresh}
          disabled={isRefreshing}
          className="p-2 text-slate-600 hover:text-blue-600 bg-white border border-slate-200 hover:border-slate-300 rounded-lg shadow-xs transition-colors disabled:opacity-50"
          title="Refresh dashboard metrics"
          aria-label="Refresh data"
        >
          <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-blue-600' : ''}`} />
        </button>
      </div>
    </div>
  );
};
