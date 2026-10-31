import React from 'react';
import { 
  TrendingUp, 
  Download, 
  BarChart3, 
  PieChart as PieChartIcon, 
  ShieldAlert, 
  CheckCircle2,
  FileSpreadsheet,
  ArrowUpRight
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  Legend 
} from 'recharts';
import { useApp } from '../../context/AppContext';

export const RevenueAnalyticsView: React.FC = () => {
  const { metrics, subscriptions, invoices, addToast } = useApp();

  const churnReasons = metrics?.churnReasons || [];
  const monthlyTrends = metrics?.monthlyTrends || [];

  const handleExportCSV = (type: 'subscriptions' | 'invoices') => {
    let csvContent = '';
    let filename = '';

    if (type === 'subscriptions') {
      filename = `brightloop_subscriptions_${new Date().toISOString().split('T')[0]}.csv`;
      const headers = ['ID', 'Company', 'Contact', 'Plan', 'BillingCycle', 'Amount', 'Status', 'PeriodStart', 'PeriodEnd'];
      const rows = subscriptions.map(s => [
        s.id,
        `"${s.customerCompany}"`,
        `"${s.customerName}"`,
        `"${s.planName}"`,
        s.billingCycle,
        s.amount,
        s.status,
        s.currentPeriodStart,
        s.currentPeriodEnd,
      ]);
      csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    } else {
      filename = `brightloop_invoices_${new Date().toISOString().split('T')[0]}.csv`;
      const headers = ['InvoiceNumber', 'Company', 'CustomerEmail', 'Plan', 'Total', 'Status', 'IssueDate', 'DueDate', 'PaidAt'];
      const rows = invoices.map(i => [
        i.invoiceNumber,
        `"${i.customerCompany}"`,
        i.customerEmail,
        `"${i.planName}"`,
        i.total,
        i.status,
        i.issueDate,
        i.dueDate,
        i.paidAt || '',
      ]);
      csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    }

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    addToast('Export Successful', `Exported ${filename} to your device.`, 'success');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
            Analytics
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Revenue retention cohorts and churn analysis.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => handleExportCSV('subscriptions')}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-750 transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export Subscriptions</span>
          </button>
          <button
            onClick={() => handleExportCSV('invoices')}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white transition-colors shadow-xs"
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span>Export Invoices</span>
          </button>
        </div>
      </div>

      {/* Cohort Summary Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
          <span className="text-xs text-slate-500 dark:text-slate-400">Expansion MRR (Last 30 Days)</span>
          <div className="text-2xl font-bold text-slate-900 dark:text-white mt-2 font-mono tabular-nums">
            +$12,800
          </div>
          <p className="text-[11px] text-emerald-600 dark:text-emerald-400 mt-1">
            Driven by seat pack upgrades & Enterprise migrations
          </p>
        </div>

        <div className="p-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
          <span className="text-xs text-slate-500 dark:text-slate-400">Net Logo Churn Rate</span>
          <div className="text-2xl font-bold text-slate-900 dark:text-white mt-2 font-mono tabular-nums">
            1.2%
          </div>
          <p className="text-[11px] text-slate-500 mt-1">
            10 cancellations out of 1,248 total accounts
          </p>
        </div>

        <div className="p-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
          <span className="text-xs text-slate-500 dark:text-slate-400">Customer Lifetime Value (LTV)</span>
          <div className="text-2xl font-bold text-slate-900 dark:text-white mt-2 font-mono tabular-nums">
            $9,890
          </div>
          <p className="text-[11px] text-slate-500 mt-1">
            LTV to CAC ratio currently trending at 4.2x
          </p>
        </div>
      </div>

      {/* Churn Reasons Breakdown */}
      <div className="p-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
        <div className="mb-4">
          <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
            Primary Churn & Downsize Causes
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Verified exit surveys logged during subscription cancellation
          </p>
        </div>

        <div className="space-y-4">
          {churnReasons.map((item, idx) => (
            <div key={idx} className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="font-medium text-slate-800 dark:text-slate-200">
                  {item.reason}
                </span>
                <span className="font-mono text-slate-500 dark:text-slate-400">
                  {item.percentage}% ({item.count} accounts)
                </span>
              </div>
              <div className="h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                <div 
                  className={`h-full rounded-full ${
                    idx === 0 
                      ? 'bg-rose-500' 
                      : idx === 1 
                      ? 'bg-amber-500' 
                      : idx === 2 
                      ? 'bg-indigo-500' 
                      : 'bg-slate-400'
                  }`}
                  style={{ width: `${item.percentage}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Expansion MRR Velocity Chart */}
      <div className="p-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
              Expansion Velocity (Monthly Additional MRR)
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Existing accounts expanding tier usage over time
            </p>
          </div>
          <span className="text-xs font-mono text-emerald-600 dark:text-emerald-400 font-medium">
            +88.2% Growth in Expansion
          </span>
        </div>

        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={monthlyTrends} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" opacity={0.5} />
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
              <YAxis 
                tick={{ fontSize: 11, fill: '#64748b' }} 
                axisLine={false} 
                tickLine={false}
                tickFormatter={val => `$${val / 1000}k`}
              />
              <Tooltip 
                formatter={(val: any) => [`$${Number(val).toLocaleString()}`, 'Expansion MRR']}
                contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', color: '#f8fafc', fontSize: '12px' }}
              />
              <Bar dataKey="expansionMrr" name="Expansion MRR" fill="#6366f1" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};
