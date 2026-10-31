import React from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';
import { SubscriptionGrowthData } from '../../types';

interface GrowthChartProps {
  data: SubscriptionGrowthData[];
  isLoading?: boolean;
}

export const GrowthChart: React.FC<GrowthChartProps> = ({ data, isLoading }) => {
  const currentNetActive = data.length > 0 ? data[data.length - 1].netActive : 0;
  const totalNewInPeriod = data.reduce((acc, curr) => acc + curr.newSubs, 0);
  const totalChurnInPeriod = data.reduce((acc, curr) => acc + curr.churned, 0);

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-slate-900 text-white p-3 rounded-lg shadow-xl text-xs space-y-1.5 border border-slate-800">
          <div className="font-semibold text-slate-300 pb-1 border-b border-slate-800">
            {label} Subscriptions
          </div>
          {payload.map((entry: any, index: number) => (
            <div key={`item-${index}`} className="flex items-center justify-between gap-4">
              <span className="flex items-center gap-1.5 text-slate-400">
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
                {entry.name}:
              </span>
              <span className="font-semibold tabular-nums text-white">
                {entry.value.toLocaleString()}
              </span>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-slate-100">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-semibold text-slate-900">Subscription Growth</h3>
            <span className="text-[11px] text-slate-400">Net Active & Velocity</span>
          </div>
          <div className="flex items-center gap-3 mt-1 text-xs text-slate-500">
            <span>
              Net Active: <strong className="text-slate-900 tabular-nums">{currentNetActive.toLocaleString()}</strong>
            </span>
            <span aria-hidden="true">·</span>
            <span>
              New: <strong className="text-emerald-600 tabular-nums">+{totalNewInPeriod}</strong>
            </span>
            <span aria-hidden="true">·</span>
            <span>
              Churn: <strong className="text-rose-600 tabular-nums">-{totalChurnInPeriod}</strong>
            </span>
          </div>
        </div>
      </div>

      {/* Chart */}
      <div className="h-72 w-full pt-4">
        {isLoading ? (
          <div className="h-full w-full flex items-center justify-center bg-slate-50 rounded-lg animate-pulse text-xs text-slate-400">
            Loading subscription metrics...
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
              <defs>
                <linearGradient id="netActiveGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#2563eb" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#2563eb" stopOpacity={0.0} />
                </linearGradient>
                <linearGradient id="newSubsGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#16a34a" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#16a34a" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis
                dataKey="period"
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
                tickFormatter={(val) => `${val}`}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend
                verticalAlign="top"
                align="right"
                iconType="circle"
                wrapperStyle={{ paddingBottom: '12px', fontSize: '11px' }}
              />
              <Area
                type="monotone"
                dataKey="netActive"
                name="Total Active Subscribers"
                stroke="#2563eb"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#netActiveGradient)"
              />
              <Area
                type="monotone"
                dataKey="newSubs"
                name="New Signups"
                stroke="#16a34a"
                strokeWidth={1.5}
                fillOpacity={1}
                fill="url(#newSubsGradient)"
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
};
