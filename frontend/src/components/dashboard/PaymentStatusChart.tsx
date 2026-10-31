import React from 'react';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
} from 'recharts';
import { PaymentStatusDistribution } from '../../types';
import { formatCurrency } from '../../utils/formatters';

interface PaymentStatusChartProps {
  data: PaymentStatusDistribution[];
  isLoading?: boolean;
}

export const PaymentStatusChart: React.FC<PaymentStatusChartProps> = ({ data, isLoading }) => {
  const totalVolume = data.reduce((acc, curr) => acc + curr.value, 0);

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const item = payload[0].payload as PaymentStatusDistribution;
      return (
        <div className="bg-slate-900 text-white p-3 rounded-lg shadow-xl text-xs space-y-1 border border-slate-800">
          <div className="font-semibold text-slate-300">{item.name}</div>
          <div className="text-white font-bold tabular-nums">{formatCurrency(item.value)}</div>
          <div className="text-slate-400 text-[11px]">{item.percentage}% of total billing</div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between">
      {/* Header */}
      <div className="pb-4 border-b border-slate-100 flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-slate-900">Payment Status Distribution</h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Total volume: <strong className="text-slate-900 tabular-nums">{formatCurrency(totalVolume)}</strong>
          </p>
        </div>
      </div>

      {/* Chart & Legends */}
      <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-6">
        {/* Donut Chart */}
        <div className="h-56 w-56 shrink-0 relative flex items-center justify-center">
          {isLoading ? (
            <div className="w-40 h-40 rounded-full border-4 border-slate-200 border-t-blue-600 animate-spin" />
          ) : (
            <>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Tooltip content={<CustomTooltip />} />
                  <Pie
                    data={data}
                    cx="50%"
                    cy="50%"
                    innerRadius={62}
                    outerRadius={88}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {data.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} stroke="transparent" />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-[11px] text-slate-400 font-medium">Settled</span>
                <span className="text-lg font-bold text-slate-900 tabular-nums">
                  {data[0]?.percentage || 0}%
                </span>
              </div>
            </>
          )}
        </div>

        {/* Legend Breakdown */}
        <div className="flex-1 w-full space-y-3">
          {data.map((item) => (
            <div
              key={item.name}
              className="flex items-center justify-between p-2.5 rounded-lg bg-slate-50 border border-slate-100 text-xs"
            >
              <div className="flex items-center gap-2 min-w-0">
                <span
                  className="w-2.5 h-2.5 rounded-full shrink-0"
                  style={{ backgroundColor: item.color }}
                />
                <span className="font-medium text-slate-700 truncate">{item.name}</span>
              </div>
              <div className="text-right shrink-0">
                <div className="font-semibold text-slate-900 tabular-nums">
                  {formatCurrency(item.value)}
                </div>
                <div className="text-[11px] text-slate-400 tabular-nums">{item.percentage}%</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
