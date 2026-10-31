import React, { useState } from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';
import { MonthlyRevenueData } from '../../types';
import { formatCurrency, formatCompactNumber } from '../../utils/formatters';

interface RevenueChartProps {
  data: MonthlyRevenueData[];
  isLoading?: boolean;
}

export const RevenueChart: React.FC<RevenueChartProps> = ({ data, isLoading }) => {
  const [viewType, setViewType] = useState<'stacked' | 'total'>('stacked');

  const totalRevenue = data.reduce((acc, curr) => acc + curr.total, 0);
  const avgMonthly = data.length > 0 ? Math.round(totalRevenue / data.length) : 0;

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-slate-900 text-white p-3 rounded-lg shadow-xl text-xs space-y-1.5 border border-slate-800">
          <div className="font-semibold text-slate-300 pb-1 border-b border-slate-800">
            {label} Revenue Summary
          </div>
          {payload.map((entry: any, index: number) => (
            <div key={`item-${index}`} className="flex items-center justify-between gap-4">
              <span className="flex items-center gap-1.5 text-slate-400">
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
                {entry.name}:
              </span>
              <span className="font-semibold tabular-nums text-white">
                {formatCurrency(entry.value)}
              </span>
            </div>
          ))}
          {entryTotal(payload) && (
            <div className="pt-1 border-t border-slate-800 flex items-center justify-between text-[11px] font-bold text-blue-400">
              <span>Total Revenue:</span>
              <span className="tabular-nums">{formatCurrency(entryTotal(payload))}</span>
            </div>
          )}
        </div>
      );
    }
    return null;
  };

  const entryTotal = (payload: any[]) => {
    if (payload.length <= 1) return null;
    return payload.reduce((sum, item) => sum + (item.value || 0), 0);
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-semibold text-slate-900">Monthly Revenue</h3>
            <span className="text-[11px] text-slate-400">MRR + Add-ons</span>
          </div>
          <div className="flex items-center gap-3 mt-1 text-xs text-slate-500">
            <span>
              Total: <strong className="text-slate-900 tabular-nums">{formatCurrency(totalRevenue)}</strong>
            </span>
            <span aria-hidden="true">·</span>
            <span>
              Avg: <strong className="text-slate-900 tabular-nums">{formatCurrency(avgMonthly)}/mo</strong>
            </span>
          </div>
        </div>

        {/* View Segmented Control */}
        <div className="flex items-center p-0.5 bg-slate-100 rounded-lg shrink-0">
          <button
            onClick={() => setViewType('stacked')}
            className={`px-2.5 py-1 text-xs font-medium rounded-md transition-all ${
              viewType === 'stacked'
                ? 'bg-white text-blue-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            MRR Breakdown
          </button>
          <button
            onClick={() => setViewType('total')}
            className={`px-2.5 py-1 text-xs font-medium rounded-md transition-all ${
              viewType === 'total'
                ? 'bg-white text-blue-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Total Combined
          </button>
        </div>
      </div>

      {/* Chart */}
      <div className="h-72 w-full pt-4">
        {isLoading ? (
          <div className="h-full w-full flex items-center justify-center bg-slate-50 rounded-lg animate-pulse text-xs text-slate-400">
            Loading revenue trends...
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis
                dataKey="month"
                stroke="#94a3b8"
                fontSize={11}
                tickLine={false}
                axisLine={{ stroke: '#e2e8f0' }}
              />
              <YAxis
                stroke="#94a3b8"
                fontSize={11}
                tickLine={false}
                axisLine={false}
                tickFormatter={(val) => `$${formatCompactNumber(val)}`}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend
                verticalAlign="top"
                align="right"
                iconType="circle"
                wrapperStyle={{ paddingBottom: '12px', fontSize: '11px' }}
              />
              {viewType === 'stacked' ? (
                <>
                  <Bar
                    dataKey="mrr"
                    name="MRR (Recurring)"
                    fill="#2563eb"
                    stackId="a"
                    radius={[0, 0, 0, 0]}
                  />
                  <Bar
                    dataKey="oneTime"
                    name="One-Time / Overages"
                    fill="#93c5fd"
                    stackId="a"
                    radius={[4, 4, 0, 0]}
                  />
                </>
              ) : (
                <Bar
                  dataKey="total"
                  name="Total Gross Revenue"
                  fill="#2563eb"
                  radius={[4, 4, 0, 0]}
                />
              )}
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
};
