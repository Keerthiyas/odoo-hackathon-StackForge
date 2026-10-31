import React, { useState, useEffect } from 'react';
import { 
  TrendingUp, 
  Users, 
  CreditCard, 
  AlertTriangle, 
  ArrowUpRight, 
  CheckCircle2, 
  ChevronRight,
  FileSpreadsheet,
  FileText,
  Plus,
  Receipt,
  Package,
  Layers,
  ArrowRight,
  Send,
  Calendar,
  Clock,
  Download,
  Eye,
  ShieldCheck
} from 'lucide-react';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  Legend 
} from 'recharts';
import { useApp } from '../../context/AppContext';
import { formatINR, formatINRShort } from '../../utils/formatters';
import { quotationService } from '../../services/quotationService';
import { invoiceService } from '../../services/invoiceService';
import { paymentService } from '../../services/paymentService';
import { subscriptionService } from '../../services/subscriptionService';
import { 
  PopulatedQuotation, 
  PopulatedPhase4Invoice, 
  PopulatedPaymentModel, 
  PopulatedSubscription 
} from '../../types';

// ==========================================
// 1. ADMIN DASHBOARD
// ==========================================
const AdminDashboard: React.FC = () => {
  const { 
    metrics, 
    subscriptions, 
    invoices, 
    plans,
    setCurrentView, 
    setIsCreateQuotationOpen,
    setIsCreateSubPhase3Open,
    setIsCreateProductOpen,
    setIsCreateInvoiceOpen,
    setSelectedSubscriptionPhase3
  } = useApp();

  const chartData = metrics?.monthlyTrends || [];
  const totalInvoiced = invoices.reduce((acc, i) => acc + (i.total || (i as any).amount || 0), 0);
  const totalCollected = invoices.filter(i => i.status === 'paid').reduce((acc, i) => acc + (i.total || (i as any).amount || 0), 0);
  const totalPending = invoices.filter(i => i.status === 'open' || i.status === 'draft' || i.status === 'overdue' || (i.status as any) === 'sent').reduce((acc, i) => acc + (i.total || (i as any).amount || 0), 0);

  return (
    <div className="space-y-6">
      {/* Header & Quick Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
            Dashboard
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Executive overview of revenue operations, contract volume, and platform growth.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setIsCreateQuotationOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-750 transition-colors shadow-xs"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Create Quotation</span>
          </button>
          <button
            onClick={() => setIsCreateSubPhase3Open(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-750 transition-colors shadow-xs"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Subscription</span>
          </button>
          <button
            onClick={() => setIsCreateProductOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white transition-colors shadow-xs"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Product</span>
          </button>
        </div>
      </div>

      {/* 4 Focused KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Monthly Recurring Revenue */}
        <div className="p-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs hover:border-slate-300 dark:hover:border-slate-700 transition-all">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <span className="font-medium">Active MRR</span>
            <div className="flex items-center text-emerald-600 dark:text-emerald-400 font-semibold text-[11px]">
              <ArrowUpRight className="w-3.5 h-3.5 mr-0.5" />
              <span>+14.8%</span>
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-900 dark:text-white mt-2 font-mono tabular-nums">
            {formatINR(metrics?.mrr || 148250)}
          </div>
          <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-2">
            ARR Pace: <span className="font-mono font-medium text-slate-700 dark:text-slate-300">{formatINR(metrics?.arr || 1780000)}</span>
          </div>
        </div>

        {/* Active Subscriptions */}
        <div className="p-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs hover:border-slate-300 dark:hover:border-slate-700 transition-all">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <span className="font-medium">Active Subscriptions</span>
            <div className="flex items-center text-emerald-600 dark:text-emerald-400 font-semibold text-[11px]">
              <ArrowUpRight className="w-3.5 h-3.5 mr-0.5" />
              <span>+8.2%</span>
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-900 dark:text-white mt-2 font-mono tabular-nums">
            {(metrics?.activeSubscriptions || subscriptions.length || 1248).toLocaleString('en-IN')}
          </div>
          <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-2">
            ARPU: <span className="font-mono font-medium text-slate-700 dark:text-slate-300">{formatINR(metrics?.arpu || 11878)}</span> /mo
          </div>
        </div>

        {/* Invoiced & Settlement */}
        <div className="p-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs hover:border-slate-300 dark:hover:border-slate-700 transition-all">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <span className="font-medium">Total Invoiced</span>
            <span className="text-[11px] font-mono text-indigo-600 dark:text-indigo-400 font-semibold">
              Reconciled
            </span>
          </div>
          <div className="text-2xl font-bold text-slate-900 dark:text-white mt-2 font-mono tabular-nums">
            {formatINR(totalInvoiced || 285400)}
          </div>
          <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-2 flex items-center justify-between">
            <span>Settled: <strong className="text-emerald-600 dark:text-emerald-400 font-mono">{formatINR(totalCollected || 215000)}</strong></span>
            <span>Due: <strong className="text-amber-600 dark:text-amber-400 font-mono">{formatINR(totalPending || 70400)}</strong></span>
          </div>
        </div>

        {/* Net Revenue Retention */}
        <div className="p-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs hover:border-slate-300 dark:hover:border-slate-700 transition-all">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <span className="font-medium">Net Revenue Retention</span>
            <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
              Top Decile
            </span>
          </div>
          <div className="text-2xl font-bold text-slate-900 dark:text-white mt-2 font-mono tabular-nums">
            {metrics?.netRevenueRetention || 118.4}%
          </div>
          <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-2">
            Expansion rate outpaces churn 4.8x
          </div>
        </div>
      </div>

      {/* Visual Analytics Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* MRR Growth Trend */}
        <div className="p-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
                Monthly Recurring Revenue
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                MRR trajectory and compound expansion in Indian Rupees
              </p>
            </div>
            <span className="text-xs font-mono text-indigo-600 dark:text-indigo-400 font-medium">
              6-Month Pace
            </span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorMrr" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#4f46e5" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" opacity={0.5} />
                <XAxis 
                  dataKey="month" 
                  tick={{ fontSize: 11, fill: '#64748b' }} 
                  axisLine={false} 
                  tickLine={false} 
                />
                <YAxis 
                  tick={{ fontSize: 11, fill: '#64748b' }} 
                  axisLine={false} 
                  tickLine={false}
                  tickFormatter={val => formatINRShort(val)}
                />
                <Tooltip 
                  formatter={(val: any) => [formatINR(Number(val)), 'MRR']}
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', color: '#f8fafc', fontSize: '12px' }}
                />
                <Area 
                  type="monotone" 
                  dataKey="mrr" 
                  stroke="#4f46e5" 
                  strokeWidth={2.5} 
                  fillOpacity={1} 
                  fill="url(#colorMrr)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Acquisition vs Churn */}
        <div className="p-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
                Acquisition vs Cancellations
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                New accounts onboarded vs churned contracts
              </p>
            </div>
            <span className="text-xs font-mono text-emerald-600 dark:text-emerald-400 font-medium">
              Net Gain: +114 /mo
            </span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" opacity={0.5} />
                <XAxis 
                  dataKey="month" 
                  tick={{ fontSize: 11, fill: '#64748b' }} 
                  axisLine={false} 
                  tickLine={false} 
                />
                <YAxis 
                  tick={{ fontSize: 11, fill: '#64748b' }} 
                  axisLine={false} 
                  tickLine={false} 
                />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', color: '#f8fafc', fontSize: '12px' }}
                />
                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                <Bar dataKey="newSubscribers" name="New Subscriptions" fill="#10b981" radius={[4, 4, 0, 0]} />
                <Bar dataKey="churnedSubscribers" name="Cancellations" fill="#f43f5e" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Products & Plans Summary Strip */}
      <div className="p-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 flex items-center justify-center text-indigo-600 dark:text-indigo-400 shrink-0">
            <Package className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
              Catalog & Tier Configuration
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              {plans.length} active plans configured across all enterprise software tiers.
            </p>
          </div>
        </div>

        <button
          onClick={() => setCurrentView('products')}
          className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300 transition-colors self-start sm:self-auto"
        >
          <span>View Products & Plans</span>
          <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Recent Subscriptions Activity Table */}
      <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-xs">
        <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
              Recent Enterprise Subscriptions
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Active recurring contracts and billing periods
            </p>
          </div>
          <button
            onClick={() => setCurrentView('subscriptions')}
            className="flex items-center gap-1 text-xs font-medium text-indigo-600 dark:text-indigo-400 hover:text-indigo-700"
          >
            <span>View All ({subscriptions.length})</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-850 text-slate-600 dark:text-slate-300 border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="py-3 px-4 font-semibold">Customer / Company</th>
                <th className="py-3 px-4 font-semibold">Plan Tier</th>
                <th className="py-3 px-4 font-semibold">Billing Frequency</th>
                <th className="py-3 px-4 font-semibold">Current Value</th>
                <th className="py-3 px-4 font-semibold">Status</th>
                <th className="py-3 px-4 font-semibold">Renews / Period End</th>
                <th className="py-3 px-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
              {subscriptions.slice(0, 5).map(sub => {
                return (
                  <tr key={sub.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-850/50 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-slate-900 dark:text-white">
                        {sub.customerCompany}
                      </div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400">
                        {sub.customerName}
                      </div>
                    </td>

                    <td className="py-3.5 px-4 font-medium text-slate-800 dark:text-slate-200">
                      {sub.planName}
                      <span className="text-slate-500 dark:text-slate-400 text-[11px] ml-1.5">({sub.seats} seats)</span>
                    </td>

                    <td className="py-3.5 px-4 text-slate-600 dark:text-slate-400 capitalize">
                      {sub.billingCycle}
                    </td>

                    <td className="py-3.5 px-4 font-mono font-semibold text-slate-900 dark:text-white tabular-nums">
                      {formatINR(sub.amount)}
                    </td>

                    <td className="py-3.5 px-4">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium capitalize ${
                        sub.status === 'active' 
                          ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300' 
                          : sub.status === 'past_due'
                          ? 'bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300'
                          : sub.status === 'trialing'
                          ? 'bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300'
                          : sub.status === 'paused'
                          ? 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300'
                          : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                      }`}>
                        {sub.status.replace('_', ' ')}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-slate-600 dark:text-slate-400 font-mono text-[11px]">
                      {sub.currentPeriodEnd}
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => setCurrentView('subscriptions')}
                        className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 font-medium text-xs"
                      >
                        Details
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

// ==========================================
// 2. STAFF DASHBOARD
// ==========================================
const StaffDashboard: React.FC = () => {
  const { 
    setCurrentView, 
    setIsCreateQuotationOpen,
    setIsCreateSubPhase3Open,
    setSelectedQuotation,
    setInitialQuotationForSub,
    addToast,
    refreshKey
  } = useApp();

  const [quotations, setQuotations] = useState<PopulatedQuotation[]>([]);
  const [subscriptions, setSubscriptions] = useState<PopulatedSubscription[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadStaffData = async () => {
      setLoading(true);
      try {
        const [qRes, sRes] = await Promise.all([
          quotationService.listQuotations({ limit: 10 }),
          subscriptionService.listSubscriptions({ limit: 10 })
        ]);
        setQuotations(qRes.quotations);
        setSubscriptions(sRes.subscriptions);
      } catch (err) {
        console.error('Error loading staff dashboard:', err);
      } finally {
        setLoading(false);
      }
    };
    loadStaffData();
  }, [refreshKey]);

  const pendingQuotations = quotations.filter(q => q.status === 'sent' || q.status === 'draft');
  const acceptedQuotations = quotations.filter(q => q.status === 'accepted');
  const totalPipelineValue = quotations.reduce((acc, q) => acc + q.totalAmount, 0);

  const handleSendQuotation = async (q: PopulatedQuotation) => {
    try {
      await quotationService.sendQuotation(q._id);
      addToast('Quotation Sent', `Proposal ${q.quotationNumber || q._id} dispatched to ${q.customer.email}.`, 'success');
      const refreshed = await quotationService.listQuotations({ limit: 10 });
      setQuotations(refreshed.quotations);
    } catch {
      addToast('Error', 'Could not send quotation.', 'error');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header & Quick Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
            Dashboard
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Commercial pipeline, client proposals, and subscription activations.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setIsCreateQuotationOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white transition-colors shadow-xs"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Create Quotation</span>
          </button>
          <button
            onClick={() => setIsCreateSubPhase3Open(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-750 transition-colors shadow-xs"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Subscription</span>
          </button>
        </div>
      </div>

      {/* 4 Focused KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Pipeline */}
        <div className="p-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <span className="font-medium">Total Proposals</span>
            <FileSpreadsheet className="w-4 h-4 text-indigo-500" />
          </div>
          <div className="text-2xl font-bold text-slate-900 dark:text-white mt-2 font-mono tabular-nums">
            {quotations.length}
          </div>
          <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-2">
            Pipeline Value: <strong className="font-mono text-slate-800 dark:text-slate-200">{formatINR(totalPipelineValue)}</strong>
          </div>
        </div>

        {/* Pending Client Review */}
        <div className="p-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <span className="font-medium">Pending Approval</span>
            <Clock className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-bold text-amber-600 dark:text-amber-400 mt-2 font-mono tabular-nums">
            {pendingQuotations.length}
          </div>
          <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-2">
            Proposals awaiting client confirmation
          </div>
        </div>

        {/* Accepted / Ready for Conversion */}
        <div className="p-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <span className="font-medium">Accepted Proposals</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-2 font-mono tabular-nums">
            {acceptedQuotations.length}
          </div>
          <div className="text-[11px] text-emerald-600 dark:text-emerald-400 mt-2 font-medium">
            Eligible for 1-click subscription conversion
          </div>
        </div>

        {/* Managed Subscriptions */}
        <div className="p-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <span className="font-medium">Active Accounts</span>
            <Users className="w-4 h-4 text-blue-500" />
          </div>
          <div className="text-2xl font-bold text-slate-900 dark:text-white mt-2 font-mono tabular-nums">
            {subscriptions.length}
          </div>
          <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-2">
            Provisioned customer contracts
          </div>
        </div>
      </div>

      {/* Actionable Pending Quotations */}
      <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-xs">
        <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
              Action Required: Commercial Proposals
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Drafts needing dispatch and accepted quotations ready for subscription provisioning.
            </p>
          </div>
          <button
            onClick={() => setCurrentView('quotations')}
            className="flex items-center gap-1 text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700"
          >
            <span>View All Quotations</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-850 text-slate-600 dark:text-slate-300 border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="py-3 px-4 font-semibold">Proposal ID</th>
                <th className="py-3 px-4 font-semibold">Customer Account</th>
                <th className="py-3 px-4 font-semibold">Product & Plan</th>
                <th className="py-3 px-4 font-semibold text-right">Value</th>
                <th className="py-3 px-4 font-semibold text-center">Status</th>
                <th className="py-3 px-4 font-semibold">Valid Until</th>
                <th className="py-3 px-4 font-semibold text-right">Immediate Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-500">
                    Loading commercial pipeline...
                  </td>
                </tr>
              ) : quotations.slice(0, 6).map(q => {
                return (
                  <tr key={q._id} className="hover:bg-slate-50/80 dark:hover:bg-slate-850/50 transition-colors">
                    <td className="py-3 px-4 font-mono font-semibold text-indigo-600 dark:text-indigo-400">
                      {q.quotationNumber || q._id.substring(0, 8)}
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-semibold text-slate-900 dark:text-white">
                        {q.customer.company || q.customer.name}
                      </div>
                      <div className="text-[11px] text-slate-500">
                        {q.customer.email}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span className="font-medium text-slate-800 dark:text-slate-200">{q.product.name}</span>
                      <span className="text-slate-500 text-[11px] ml-1">({q.plan.name})</span>
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-slate-900 dark:text-white tabular-nums">
                      {formatINR(q.totalAmount)}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold capitalize ${
                        q.status === 'accepted' ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300' :
                        q.status === 'sent' ? 'bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300' :
                        'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                      }`}>
                        {q.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-mono text-[11px] text-slate-500">
                      {q.validUntil ? q.validUntil.split('T')[0] : 'Open'}
                    </td>
                    <td className="py-3 px-4 text-right">
                      {q.status === 'accepted' ? (
                        <button
                          onClick={() => {
                            setInitialQuotationForSub(q);
                            setIsCreateSubPhase3Open(true);
                          }}
                          className="px-2.5 py-1 rounded bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-[11px] transition-colors shadow-xs inline-flex items-center gap-1"
                        >
                          <span>Convert</span>
                          <ArrowRight className="w-3 h-3" />
                        </button>
                      ) : q.status === 'draft' ? (
                        <button
                          onClick={() => handleSendQuotation(q)}
                          className="px-2.5 py-1 rounded bg-blue-600 hover:bg-blue-700 text-white font-semibold text-[11px] transition-colors shadow-xs inline-flex items-center gap-1"
                        >
                          <Send className="w-3 h-3" />
                          <span>Send</span>
                        </button>
                      ) : (
                        <button
                          onClick={() => setSelectedQuotation(q)}
                          className="px-2.5 py-1 rounded border border-slate-200 dark:border-slate-700 hover:bg-slate-100 text-slate-700 dark:text-slate-300 font-medium text-[11px] transition-colors"
                        >
                          Review
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

// ==========================================
// 3. CUSTOMER DASHBOARD ("MY DASHBOARD")
// ==========================================
const CustomerDashboard: React.FC = () => {
  const { 
    currentUser, 
    setCurrentView, 
    setSelectedPhase4Invoice,
    addToast,
    refreshKey 
  } = useApp();

  const [subscriptions, setSubscriptions] = useState<PopulatedSubscription[]>([]);
  const [invoices, setInvoices] = useState<PopulatedPhase4Invoice[]>([]);
  const [payments, setPayments] = useState<PopulatedPaymentModel[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadCustomerData = async () => {
      setLoading(true);
      try {
        const [subsRes, invsRes, paysRes] = await Promise.all([
          subscriptionService.listSubscriptions({ limit: 10 }),
          invoiceService.listInvoices({ limit: 10 }),
          paymentService.listPayments({ limit: 10 })
        ]);

        const mySubs = subsRes.subscriptions.filter(s => 
          s.customer._id === currentUser?._id || 
          s.customer.email.toLowerCase() === currentUser?.email.toLowerCase()
        );
        const myInvs = invsRes.invoices.filter(i => 
          i.customer._id === currentUser?._id || 
          i.customer.email.toLowerCase() === currentUser?.email.toLowerCase()
        );
        const myPays = paysRes.payments.filter(p => 
          p.customer._id === currentUser?._id || 
          p.customer.email.toLowerCase() === currentUser?.email.toLowerCase()
        );

        setSubscriptions(mySubs.length > 0 ? mySubs : subsRes.subscriptions.slice(0, 2));
        setInvoices(myInvs.length > 0 ? myInvs : invsRes.invoices.slice(0, 3));
        setPayments(myPays.length > 0 ? myPays : paysRes.payments.slice(0, 3));
      } catch (err) {
        console.error('Failed to load customer dashboard:', err);
      } finally {
        setLoading(false);
      }
    };
    loadCustomerData();
  }, [currentUser, refreshKey]);

  const primarySub = subscriptions[0];
  const outstandingInvoices = invoices.filter(i => i.status !== 'paid');
  const totalSettled = payments.filter(p => p.status === 'completed').reduce((sum, p) => sum + p.amount, 0);

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
            My Dashboard
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Welcome back, {currentUser?.name}. Overview of your subscription entitlement, billing schedule, and statements.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setCurrentView('invoices')}
            className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-750 transition-colors shadow-xs"
          >
            <FileText className="w-3.5 h-3.5" />
            <span>My Invoices</span>
          </button>
          <button
            onClick={() => setCurrentView('payments')}
            className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white transition-colors shadow-xs"
          >
            <Receipt className="w-3.5 h-3.5" />
            <span>Payment History</span>
          </button>
        </div>
      </div>

      {/* 3 Visual Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Card 1: Active Subscription Overview */}
        <div className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Active Plan
            </span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
              {primarySub ? primarySub.status.toUpperCase() : 'ACTIVE'}
            </span>
          </div>

          <div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">
              {primarySub ? primarySub.plan.name : 'Enterprise Ultra'}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Service: {primarySub ? primarySub.product.name : 'StackForge Core Suite'}
            </p>
          </div>

          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-baseline justify-between">
            <div>
              <span className="text-2xl font-black font-mono text-slate-900 dark:text-white">
                {formatINR(primarySub ? primarySub.plan.price * primarySub.quantity : 1299)}
              </span>
              <span className="text-xs text-slate-400 ml-1">
                /{primarySub ? primarySub.plan.billingCycle : 'mo'}
              </span>
            </div>
            <span className="text-xs text-slate-500 font-mono">
              Qty: {primarySub ? primarySub.quantity : 1}
            </span>
          </div>

          <div className="text-[11px] text-slate-500 flex items-center justify-between">
            <span>Next Billing Date:</span>
            <span className="font-mono font-semibold text-slate-800 dark:text-slate-200">
              {primarySub?.nextBillingDate ? primarySub.nextBillingDate.split('T')[0] : '2026-11-30'}
            </span>
          </div>
        </div>

        {/* Card 2: Billing & Account Health */}
        <div className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Billing Health
            </span>
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
              outstandingInvoices.length === 0
                ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300'
                : 'bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300'
            }`}>
              {outstandingInvoices.length === 0 ? 'NOMINAL' : 'PAYMENT DUE'}
            </span>
          </div>

          <div>
            <div className="flex items-center gap-2">
              {outstandingInvoices.length === 0 ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-500" />
              ) : (
                <AlertTriangle className="w-5 h-5 text-amber-500" />
              )}
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                {outstandingInvoices.length === 0 ? 'All Invoices Settled' : `${outstandingInvoices.length} Pending Invoice(s)`}
              </h3>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              {outstandingInvoices.length === 0 
                ? 'Your account is in good standing with zero overdue balance.'
                : 'Please review and remit payment before due dates.'}
            </p>
          </div>

          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-1.5 text-xs">
            <div className="flex justify-between text-slate-500">
              <span>Settled Volume:</span>
              <span className="font-mono font-bold text-slate-900 dark:text-white">
                {formatINR(totalSettled)}
              </span>
            </div>
            <div className="flex justify-between text-slate-500">
              <span>Payment Channel:</span>
              <span className="font-medium text-slate-700 dark:text-slate-300">
                Direct NetBanking / Card
              </span>
            </div>
          </div>
        </div>

        {/* Card 3: Security & Support Entitlement */}
        <div className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Entitlements & SLA
            </span>
            <ShieldCheck className="w-4 h-4 text-indigo-500" />
          </div>

          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Enterprise Support Tier
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Contractual 99.99% uptime guarantee with priority 15-minute response SLA.
            </p>
          </div>

          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-1.5 text-[11px]">
            <div className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
              <span>Dedicated Technical Account Manager</span>
            </div>
            <div className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
              <span>Automated Daily Data Exports</span>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Statements Table */}
      <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-xs">
        <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
              Recent Billing Invoices
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Electronic tax invoices and payment verification
            </p>
          </div>
          <button
            onClick={() => setCurrentView('invoices')}
            className="flex items-center gap-1 text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700"
          >
            <span>View All ({invoices.length})</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-850 text-slate-600 dark:text-slate-300 border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="py-3 px-4 font-semibold">Invoice #</th>
                <th className="py-3 px-4 font-semibold">Generated Date</th>
                <th className="py-3 px-4 font-semibold">Due Date</th>
                <th className="py-3 px-4 font-semibold text-right">Amount</th>
                <th className="py-3 px-4 font-semibold text-center">Status</th>
                <th className="py-3 px-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-500">
                    Loading statements...
                  </td>
                </tr>
              ) : invoices.map(inv => (
                <tr key={inv._id} className="hover:bg-slate-50/80 dark:hover:bg-slate-850/50 transition-colors">
                  <td className="py-3.5 px-4 font-mono font-semibold text-indigo-600 dark:text-indigo-400">
                    #{inv._id.slice(-8)}
                  </td>
                  <td className="py-3.5 px-4 text-slate-600 dark:text-slate-400">
                    {inv.generatedAt}
                  </td>
                  <td className="py-3.5 px-4 text-slate-800 dark:text-slate-200 font-medium">
                    {inv.dueDate}
                  </td>
                  <td className="py-3.5 px-4 text-right font-mono font-bold text-slate-900 dark:text-white tabular-nums">
                    {formatINR(inv.amount, true)}
                  </td>
                  <td className="py-3.5 px-4 text-center">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold capitalize ${
                      inv.status === 'paid' ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300' :
                      inv.status === 'overdue' ? 'bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300' :
                      'bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300'
                    }`}>
                      {inv.status}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    <button
                      onClick={() => setSelectedPhase4Invoice(inv)}
                      className="px-2.5 py-1 text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline"
                    >
                      View Statement
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

// ==========================================
// MAIN COMPONENT EXPORT
// ==========================================
export const OverviewView: React.FC = () => {
  const { currentUser } = useApp();
  const role = currentUser?.role || 'admin';

  if (role === 'customer') {
    return <CustomerDashboard />;
  }

  if (role === 'staff') {
    return <StaffDashboard />;
  }

  return <AdminDashboard />;
};
