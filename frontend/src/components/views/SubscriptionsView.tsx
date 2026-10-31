import React, { useState, useEffect, useCallback } from 'react';
import { 
  Search, 
  Plus, 
  Eye, 
  Pause, 
  Play, 
  XCircle, 
  ChevronLeft, 
  ChevronRight, 
  CreditCard,
  RefreshCw,
  Calendar,
  AlertCircle
} from 'lucide-react';
import { PopulatedSubscription, Product, PlanModel, PopulatedQuotation } from '../../types';
import { subscriptionService } from '../../services/subscriptionService';
import { quotationService } from '../../services/quotationService';
import { useApp } from '../../context/AppContext';
import { formatINR } from '../../utils/formatters';

interface SubscriptionsViewProps {
  onOpenCreate: (quotation?: PopulatedQuotation) => void;
  onViewDetails: (subscription: PopulatedSubscription) => void;
  addToast: (title: string, message: string, type?: 'success' | 'warning' | 'info' | 'error') => void;
}

export const SubscriptionsView: React.FC<SubscriptionsViewProps> = ({
  onOpenCreate,
  onViewDetails,
  addToast,
}) => {
  const { currentUser, refreshKey, triggerRefresh } = useApp();
  const isCustomer = currentUser?.role === 'customer';

  const [subscriptions, setSubscriptions] = useState<PopulatedSubscription[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [plans, setPlans] = useState<PlanModel[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Filters
  const [search, setSearch] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [productFilter, setProductFilter] = useState<string>('all');
  const [planFilter, setPlanFilter] = useState<string>('all');
  const [nextBillingBefore, setNextBillingBefore] = useState<string>('');

  // Pagination
  const [page, setPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [total, setTotal] = useState<number>(0);
  const limit = 8;

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [subsRes, loadedProducts, loadedPlans] = await Promise.all([
        subscriptionService.listSubscriptions({
          search: search || undefined,
          status: statusFilter,
          productId: productFilter,
          planId: planFilter,
          nextBillingBefore: nextBillingBefore || undefined,
          page,
          limit,
        }),
        quotationService.getProducts(),
        quotationService.getPlans(),
      ]);

      setSubscriptions(subsRes.subscriptions);
      setTotal(subsRes.total);
      setTotalPages(subsRes.totalPages);
      setProducts(loadedProducts);
      setPlans(loadedPlans);
    } catch (err: any) {
      console.error('Failed to load subscriptions:', err);
      addToast('Error', 'Failed to retrieve subscription records.', 'error');
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter, productFilter, planFilter, nextBillingBefore, page, addToast]);

  useEffect(() => {
    loadData();
  }, [loadData, refreshKey]);

  // Status Action: Pause
  const handlePause = async (sub: PopulatedSubscription) => {
    if (!sub.plan.allowPause) {
      addToast('Action Restricted', `Plan "${sub.plan.name}" does not permit subscription pausing.`, 'warning');
      return;
    }

    if (!confirm(`Pause subscription for ${sub.customer.company || sub.customer.name}? This will suspend recurring billing.`)) {
      return;
    }

    try {
      await subscriptionService.pauseSubscription(sub._id);
      addToast('Subscription Paused', `Subscription status updated to PAUSED.`, 'info');
      triggerRefresh();
    } catch (err: any) {
      addToast('Pause Failed', err.message || 'Could not pause subscription.', 'error');
    }
  };

  // Status Action: Resume
  const handleResume = async (sub: PopulatedSubscription) => {
    try {
      await subscriptionService.resumeSubscription(sub._id);
      addToast('Subscription Resumed', `Subscription status updated to ACTIVE.`, 'success');
      triggerRefresh();
    } catch (err: any) {
      addToast('Resume Failed', err.message || 'Could not resume subscription.', 'error');
    }
  };

  // Status Action: Close
  const handleClose = async (sub: PopulatedSubscription) => {
    if (!sub.plan.allowEarlyClose) {
      addToast('Action Restricted', `Plan "${sub.plan.name}" does not permit early closure.`, 'warning');
      return;
    }

    if (!confirm(`WARNING: Closing subscription ${sub._id} may be irreversible and terminates service access. Proceed?`)) {
      return;
    }

    try {
      await subscriptionService.closeSubscription(sub._id);
      addToast('Subscription Closed', `Subscription status updated to CLOSED.`, 'warning');
      triggerRefresh();
    } catch (err: any) {
      addToast('Close Failed', err.message || 'Could not close subscription.', 'error');
    }
  };

  const statusBadges = {
    active: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border-emerald-300 dark:border-emerald-700 font-semibold',
    paused: 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300 border-amber-300 dark:border-amber-700 font-medium',
    closed: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 border-slate-300 dark:border-slate-700',
  };

  const displayedSubs = isCustomer
    ? subscriptions.filter(s => s.customer?._id === currentUser?._id || s.customer?.email === currentUser?.email)
    : subscriptions;

  const activeCount = displayedSubs.filter(s => s.status === 'active').length;
  const pausedCount = displayedSubs.filter(s => s.status === 'paused').length;
  const monthlyRecurring = displayedSubs
    .filter(s => s.status === 'active')
    .reduce((sum, s) => sum + (s.plan.price * s.quantity), 0);

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
            {isCustomer ? 'My Subscriptions' : 'Subscriptions'}
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            {isCustomer ? 'Active recurring memberships and billing cycles.' : 'Customer subscriptions, billing cycles, and lifecycle states.'}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => loadData()}
            className="p-2 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors"
            title="Refresh Subscriptions"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          </button>

          {!isCustomer && (
            <button
              onClick={() => onOpenCreate()}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold transition-colors shadow-xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>New Subscription</span>
            </button>
          )}
        </div>
      </div>

      {/* Visual Metric Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <span>Total Subscriptions</span>
            <CreditCard className="w-4 h-4 text-slate-400" />
          </div>
          <div className="text-2xl font-bold text-slate-900 dark:text-white mt-1.5 font-mono tabular-nums">
            {displayedSubs.length}
          </div>
          <p className="text-[11px] text-slate-500 mt-1">Enrolled accounts</p>
        </div>

        <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs">
          <div className="flex items-center justify-between text-xs text-emerald-600 dark:text-emerald-400">
            <span>Active Running</span>
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          </div>
          <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-1.5 font-mono tabular-nums">
            {activeCount}
          </div>
          <p className="text-[11px] text-slate-500 mt-1">Generating revenue</p>
        </div>

        <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs">
          <div className="flex items-center justify-between text-xs text-amber-600 dark:text-amber-400">
            <span>Paused / Frozen</span>
            <Pause className="w-3.5 h-3.5 text-amber-500" />
          </div>
          <div className="text-2xl font-bold text-amber-600 dark:text-amber-400 mt-1.5 font-mono tabular-nums">
            {pausedCount}
          </div>
          <p className="text-[11px] text-slate-500 mt-1">Billing temporarily paused</p>
        </div>

        <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs">
          <div className="flex items-center justify-between text-xs text-indigo-600 dark:text-indigo-400">
            <span>Active Run Rate</span>
            <span className="text-[11px] font-semibold">INR (₹)</span>
          </div>
          <div className="text-2xl font-bold text-slate-900 dark:text-white mt-1.5 font-mono tabular-nums">
            {formatINR(monthlyRecurring)}
          </div>
          <p className="text-[11px] text-slate-500 mt-1">Total active cycle value</p>
        </div>
      </div>

      {/* Filter and Search Console */}
      <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-3 shadow-xs">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 text-xs">
          {/* Search by subscription ID or Customer */}
          <div className="relative md:col-span-1">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by ID or customer name..."
              value={search}
              onChange={e => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="w-full pl-8 pr-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 focus:ring-1 focus:ring-indigo-500"
            />
          </div>

          {/* Filter by Product */}
          <div>
            <select
              value={productFilter}
              onChange={e => {
                setProductFilter(e.target.value);
                setPage(1);
              }}
              className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 focus:ring-1 focus:ring-indigo-500"
            >
              <option value="all">All Products</option>
              {products.map(p => (
                <option key={p._id} value={p._id}>{p.name}</option>
              ))}
            </select>
          </div>

          {/* Filter by Plan */}
          <div>
            <select
              value={planFilter}
              onChange={e => {
                setPlanFilter(e.target.value);
                setPage(1);
              }}
              className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 focus:ring-1 focus:ring-indigo-500"
            >
              <option value="all">All Plans</option>
              {plans.map(pl => (
                <option key={pl._id} value={pl._id}>{pl.name} ({formatINR(pl.price)})</option>
              ))}
            </select>
          </div>

          {/* Next Billing Date Filter */}
          <div className="flex items-center gap-1.5">
            <span className="text-slate-400 text-[11px] whitespace-nowrap">Billing Before:</span>
            <input
              type="date"
              value={nextBillingBefore}
              onChange={e => {
                setNextBillingBefore(e.target.value);
                setPage(1);
              }}
              className="w-full px-2 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-mono text-[11px]"
            />
          </div>
        </div>

        {/* Status Segmented Tabs (ONLY: active | paused | closed) */}
        <div className="flex items-center gap-1.5 pt-2 border-t border-slate-100 dark:border-slate-800 overflow-x-auto text-xs">
          <span className="text-slate-400 text-[11px] mr-1">Status:</span>
          {['all', 'active', 'paused', 'closed'].map(st => (
            <button
              key={st}
              onClick={() => {
                setStatusFilter(st);
                setPage(1);
              }}
              className={`px-3 py-1 rounded-md transition-colors capitalize text-xs font-medium whitespace-nowrap ${
                statusFilter === st
                  ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* Subscription Table */}
      <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-850 text-slate-600 dark:text-slate-300 border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="py-3 px-3.5 font-semibold">Subscription ID</th>
                <th className="py-3 px-3.5 font-semibold">Customer Name</th>
                <th className="py-3 px-3.5 font-semibold">Product Name</th>
                <th className="py-3 px-3.5 font-semibold">Plan Name</th>
                <th className="py-3 px-3 font-semibold text-center">Quantity</th>
                <th className="py-3 px-3.5 font-semibold">Start Date</th>
                <th className="py-3 px-3.5 font-semibold">Next Billing Date</th>
                <th className="py-3 px-3.5 font-semibold">Status</th>
                <th className="py-3 px-3.5 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
              {loading ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-500">
                    Loading subscription records...
                  </td>
                </tr>
              ) : displayedSubs.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-500">
                    No subscriptions found matching the current filter criteria.
                  </td>
                </tr>
              ) : (
                displayedSubs.map(sub => {
                  const allowPause = sub.plan.allowPause;
                  const allowEarlyClose = sub.plan.allowEarlyClose;

                  return (
                    <tr 
                      key={sub._id}
                      className="hover:bg-slate-50/70 dark:hover:bg-slate-850/50 transition-colors"
                    >
                      {/* Subscription ID */}
                      <td className="py-3 px-3.5 font-mono font-semibold text-indigo-600 dark:text-indigo-400 whitespace-nowrap">
                        <button
                          onClick={() => onViewDetails(sub)}
                          className="hover:underline flex items-center gap-1"
                        >
                          <CreditCard className="w-3.5 h-3.5" />
                          <span>{sub._id.substring(0, 10)}...</span>
                        </button>
                      </td>

                      {/* Customer Name */}
                      <td className="py-3 px-3.5">
                        <div className="font-semibold text-slate-900 dark:text-white">
                          {sub.customer.company || sub.customer.name}
                        </div>
                        <div className="text-[11px] text-slate-500 dark:text-slate-400">
                          {sub.customer.name} · {sub.customer.email}
                        </div>
                      </td>

                      {/* Product Name */}
                      <td className="py-3 px-3.5 font-medium text-slate-800 dark:text-slate-200">
                        {sub.product.name}
                      </td>

                      {/* Plan Name */}
                      <td className="py-3 px-3.5">
                        <div className="text-slate-800 dark:text-slate-200 font-medium">
                          {sub.plan.name}
                        </div>
                        <div className="text-[10px] text-slate-400 capitalize">
                          {sub.plan.billingCycle} billing ({formatINR(sub.plan.price)})
                        </div>
                      </td>

                      {/* Quantity */}
                      <td className="py-3 px-3 text-center font-mono font-medium text-slate-800 dark:text-slate-200">
                        {sub.quantity}
                      </td>

                      {/* Start Date */}
                      <td className="py-3 px-3.5 font-mono text-[11px] text-slate-600 dark:text-slate-300 whitespace-nowrap">
                        {sub.startDate ? sub.startDate.split('T')[0] : 'N/A'}
                      </td>

                      {/* Next Billing Date */}
                      <td className="py-3 px-3.5 font-mono text-[11px] text-slate-600 dark:text-slate-300 whitespace-nowrap">
                        {sub.nextBillingDate ? sub.nextBillingDate.split('T')[0] : 'N/A'}
                      </td>

                      {/* Status: active | paused | closed */}
                      <td className="py-3 px-3.5">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] border capitalize ${statusBadges[sub.status]}`}>
                          {sub.status}
                        </span>
                      </td>

                      {/* Actions: View, Pause, Resume, Close */}
                      <td className="py-3 px-3.5 text-right whitespace-nowrap">
                        <div className="inline-flex items-center gap-1">
                          {/* View Subscription */}
                          <button
                            onClick={() => onViewDetails(sub)}
                            className="p-1.5 text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 rounded hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                            title="View Subscription Details"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>

                          {/* 1. Pause Subscription (check plan allowPause, non-customer) */}
                          {!isCustomer && sub.status === 'active' && allowPause && (
                            <button
                              onClick={() => handlePause(sub)}
                              className="p-1.5 text-amber-600 hover:text-amber-800 rounded hover:bg-amber-50 dark:hover:bg-amber-950/40 transition-colors"
                              title="Pause Subscription"
                            >
                              <Pause className="w-3.5 h-3.5" />
                            </button>
                          )}

                          {/* 2. Resume Subscription (non-customer) */}
                          {!isCustomer && sub.status === 'paused' && (
                            <button
                              onClick={() => handleResume(sub)}
                              className="p-1.5 text-emerald-600 hover:text-emerald-800 rounded hover:bg-emerald-50 dark:hover:bg-emerald-950/40 transition-colors"
                              title="Resume Subscription"
                            >
                              <Play className="w-3.5 h-3.5" />
                            </button>
                          )}

                          {/* 3. Close Subscription (check plan allowEarlyClose, non-customer) */}
                          {!isCustomer && sub.status !== 'closed' && allowEarlyClose && (
                            <button
                              onClick={() => handleClose(sub)}
                              className="p-1.5 text-rose-500 hover:text-rose-700 rounded hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                              title="Close Subscription"
                            >
                              <XCircle className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        <div className="p-3.5 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500">
          <div>
            Showing <span className="font-semibold text-slate-800 dark:text-slate-200">{displayedSubs.length}</span> of{' '}
            <span className="font-semibold text-slate-800 dark:text-slate-200">{total}</span> total subscriptions
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="p-1.5 rounded border border-slate-200 dark:border-slate-700 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50 dark:hover:bg-slate-800"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
            <span className="px-2 font-mono text-[11px]">
              Page {page} of {totalPages}
            </span>
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              className="p-1.5 rounded border border-slate-200 dark:border-slate-700 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50 dark:hover:bg-slate-800"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
