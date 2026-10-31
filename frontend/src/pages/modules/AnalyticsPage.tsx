import React, { useState } from 'react';
import { BarChart3, TrendingUp, Users, DollarSign, Activity, Download } from 'lucide-react';
import { MetricCard } from '../../components/dashboard/MetricCard';
import { RevenueChart } from '../../components/dashboard/RevenueChart';
import { GrowthChart } from '../../components/dashboard/GrowthChart';
import { MOCK_MONTHLY_REVENUE, MOCK_SUBSCRIPTION_GROWTH } from '../../data/mockData';

export const AnalyticsPage: React.FC = () => {
  const [toast, setToast] = useState<string | null>(null);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900">Subscription Analytics</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Key SaaS performance indicators, net revenue retention, cohort churn and unit economics
          </p>
        </div>
        <button
          onClick={() => {
            setToast('Generating executive analytics PDF deck...');
            setTimeout(() => setToast(null), 3000);
          }}
          className="px-3.5 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg shadow-xs flex items-center gap-1.5 transition-colors self-start sm:self-auto"
        >
          <Download className="w-3.5 h-3.5" />
          <span>Export Analytics Report</span>
        </button>
      </div>

      {toast && (
        <div className="p-3 bg-blue-50 border border-blue-200 text-blue-800 rounded-xl text-xs flex items-center justify-between animate-in fade-in">
          <span>{toast}</span>
          <span className="text-[10px] text-blue-500 font-mono">Info</span>
        </div>
      )}

      {/* Advanced SaaS Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Net Revenue Retention (NRR)"
          value="118.4%"
          change={3.2}
          subtitle="Top quartile B2B benchmark"
          icon={TrendingUp}
          variant="success"
        />
        <MetricCard
          title="Average Revenue / User (ARPU)"
          value="$199.20"
          change={5.8}
          subtitle="Per active subscriber/mo"
          icon={DollarSign}
          variant="default"
        />
        <MetricCard
          title="Monthly Logo Churn"
          value="1.24%"
          change={-0.3}
          subtitle="Consistently sub-2%"
          icon={Activity}
          variant="success"
        />
        <MetricCard
          title="Customer Acquisition (CAC)"
          value="$340"
          change={-8.1}
          subtitle="Payback period: 1.8 months"
          icon={Users}
          variant="default"
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <RevenueChart data={MOCK_MONTHLY_REVENUE} />
        <GrowthChart data={MOCK_SUBSCRIPTION_GROWTH} />
      </div>
    </div>
  );
};
