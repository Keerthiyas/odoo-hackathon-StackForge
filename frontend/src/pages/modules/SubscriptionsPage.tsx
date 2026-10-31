import React, { useEffect, useState, useCallback } from 'react';
import {
  Repeat,
  Plus,
  Eye,
  PauseCircle,
  PlayCircle,
  XCircle,
  Search,
  RefreshCw,
  Download,
} from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import { CreateSubscriptionDTO, Plan, Product, Subscription, SubscriptionStatus } from '../../types';
import { subscriptionService } from '../../api/subscriptionService';
import { productService } from '../../api/productService';
import { planService } from '../../api/planService';
import { DataTable } from '../../components/common/DataTable';
import { StatusBadge } from '../../components/common/StatusBadge';
import { Pagination } from '../../components/common/Pagination';
import { ConfirmationDialog } from '../../components/common/ConfirmationDialog';
import { ToastNotification } from '../../components/common/ToastNotification';
import { EmptyState } from '../../components/common/EmptyState';
import { SubscriptionFormModal } from './subscriptions/SubscriptionFormModal';
import { SubscriptionDetailsModal } from './subscriptions/SubscriptionDetailsModal';
import { formatCurrency, formatDate } from '../../utils/formatters';

export const SubscriptionsPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const convertQuotationId = searchParams.get('convertQuotationId');

  // Subscriptions List state
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [total, setTotal] = useState<number>(0);
  const [page, setPage] = useState<number>(1);
  const [limit] = useState<number>(10);

  // Filters & Search
  const [search, setSearch] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [productFilter, setProductFilter] = useState<string>('all');
  const [planFilter, setPlanFilter] = useState<string>('all');
  const [timelineFilter, setTimelineFilter] = useState<string>('all');

  // Filter options
  const [products, setProducts] = useState<Product[]>([]);
  const [plans, setPlans] = useState<Plan[]>([]);

  // Modals
  const [isFormOpen, setIsFormOpen] = useState<boolean>(false);
  const [preselectedQuoteId, setPreselectedQuoteId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const [detailsSub, setDetailsSub] = useState<Subscription | null>(null);

  // Lifecycle Action Dialogs
  const [pauseTarget, setPauseTarget] = useState<Subscription | null>(null);
  const [resumeTarget, setResumeTarget] = useState<Subscription | null>(null);
  const [closeTarget, setCloseTarget] = useState<Subscription | null>(null);
  const [isActionLoading, setIsActionLoading] = useState<boolean>(false);

  // Toast
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

  // Fetch product and plan filters
  useEffect(() => {
    productService.getProducts({ limit: 100 }).then((res) => setProducts(res.data));
    planService.getPlans({ limit: 100 }).then((res) => setPlans(res.data));
  }, []);

  // Handle incoming convertQuotationId query param
  useEffect(() => {
    if (convertQuotationId) {
      setPreselectedQuoteId(convertQuotationId);
      setIsFormOpen(true);
      // Clean query parameter after reading
      setSearchParams({}, { replace: true });
    }
  }, [convertQuotationId, setSearchParams]);

  // Fetch subscriptions
  const fetchSubscriptions = useCallback(async () => {
    setLoading(true);
    try {
      const res = await subscriptionService.getSubscriptions({
        search: search.trim() || undefined,
        status: statusFilter === 'all' ? undefined : (statusFilter as SubscriptionStatus),
        productId: productFilter === 'all' ? undefined : productFilter,
        planId: planFilter === 'all' ? undefined : planFilter,
        billingTimeline: timelineFilter === 'all' ? undefined : (timelineFilter as any),
        page,
        limit,
      });
      setSubscriptions(res.data);
      setTotal(res.total);
    } catch (err: any) {
      setToast({
        message: err.message || 'Failed to fetch subscriptions from backend.',
        type: 'error',
      });
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter, productFilter, planFilter, timelineFilter, page, limit]);

  useEffect(() => {
    fetchSubscriptions();
  }, [fetchSubscriptions]);

  // Create Subscription Submit
  const handleCreateSubscription = async (dto: CreateSubscriptionDTO) => {
    setIsSubmitting(true);
    try {
      await subscriptionService.createSubscription(dto);
      setToast({ message: 'Subscription successfully activated and scheduled.', type: 'success' });
      setIsFormOpen(false);
      setPreselectedQuoteId(null);
      await fetchSubscriptions();
    } catch (err: any) {
      setToast({ message: err.message || 'Failed to activate subscription.', type: 'error' });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Pause Action Execution
  const handleConfirmPause = async () => {
    if (!pauseTarget) return;
    const targetId = pauseTarget._id || pauseTarget.id || '';
    setIsActionLoading(true);
    try {
      await subscriptionService.pauseSubscription(targetId);
      setToast({ message: `Subscription ${pauseTarget.subscriptionNumber || targetId} has been paused.`, type: 'info' });
      setPauseTarget(null);
      if (detailsSub && (detailsSub._id === targetId || detailsSub.id === targetId)) {
        setDetailsSub((prev) => (prev ? { ...prev, status: 'paused' } : null));
      }
      await fetchSubscriptions();
    } catch (err: any) {
      setToast({ message: err.message || 'Unable to pause subscription per plan terms.', type: 'error' });
    } finally {
      setIsActionLoading(false);
    }
  };

  // Resume Action Execution
  const handleConfirmResume = async () => {
    if (!resumeTarget) return;
    const targetId = resumeTarget._id || resumeTarget.id || '';
    setIsActionLoading(true);
    try {
      await subscriptionService.resumeSubscription(targetId);
      setToast({ message: `Subscription ${resumeTarget.subscriptionNumber || targetId} resumed successfully.`, type: 'success' });
      setResumeTarget(null);
      if (detailsSub && (detailsSub._id === targetId || detailsSub.id === targetId)) {
        setDetailsSub((prev) => (prev ? { ...prev, status: 'active' } : null));
      }
      await fetchSubscriptions();
    } catch (err: any) {
      setToast({ message: err.message || 'Unable to resume subscription.', type: 'error' });
    } finally {
      setIsActionLoading(false);
    }
  };

  // Close Action Execution
  const handleConfirmClose = async () => {
    if (!closeTarget) return;
    const targetId = closeTarget._id || closeTarget.id || '';
    setIsActionLoading(true);
    try {
      await subscriptionService.closeSubscription(targetId);
      setToast({ message: `Subscription ${closeTarget.subscriptionNumber || targetId} closed permanently.`, type: 'info' });
      setCloseTarget(null);
      if (detailsSub && (detailsSub._id === targetId || detailsSub.id === targetId)) {
        setDetailsSub((prev) => (prev ? { ...prev, status: 'closed' } : null));
      }
      await fetchSubscriptions();
    } catch (err: any) {
      setToast({ message: err.message || 'Failed to close subscription.', type: 'error' });
    } finally {
      setIsActionLoading(false);
    }
  };

  // Export CSV mock utility
  const handleExportCSV = () => {
    setToast({ message: 'Exporting active subscriptions ledger to CSV...', type: 'info' });
    setTimeout(() => {
      setToast({ message: 'Subscriptions report exported successfully.', type: 'success' });
    }, 1200);
  };

  // Columns definition
  const columns = [
    {
      header: 'Subscription ID',
      accessor: (s: Subscription) => (
        <span className="font-mono font-medium text-slate-900 whitespace-nowrap">
          {s.subscriptionNumber || `SUB-${(s._id || s.id || '').slice(-6).toUpperCase()}`}
        </span>
      ),
    },
    {
      header: 'Customer Name',
      accessor: (s: Subscription) => {
        const custName =
          typeof s.customer === 'object' && s.customer !== null && 'name' in s.customer
            ? (s.customer as any).name
            : s.customerName || 'Customer';
        const company =
          typeof s.customer === 'object' && s.customer !== null
            ? (s.customer as any).companyName || (s.customer as any).company
            : null;
        return (
          <div>
            <div className="font-semibold text-slate-900">{custName}</div>
            {company && <div className="text-[11px] text-slate-400">{company}</div>}
          </div>
        );
      },
    },
    {
      header: 'Product Name',
      accessor: (s: Subscription) => {
        const prodName =
          typeof s.product === 'object' && s.product !== null && 'name' in s.product
            ? (s.product as any).name
            : s.productName || 'Software Product';
        return <span className="font-medium text-slate-800">{prodName}</span>;
      },
    },
    {
      header: 'Plan Name',
      accessor: (s: Subscription) => {
        const plName =
          typeof s.plan === 'object' && s.plan !== null && 'name' in s.plan
            ? (s.plan as any).name
            : s.planName || 'Plan';
        return <span className="text-slate-700">{plName}</span>;
      },
    },
    {
      header: 'Quantity',
      accessor: (s: Subscription) => (
        <span className="font-mono tabular-nums text-slate-900">{s.quantity || 1}</span>
      ),
      className: 'text-center',
    },
    {
      header: 'Start Date',
      accessor: (s: Subscription) => (
        <span className="text-slate-600 font-mono tabular-nums whitespace-nowrap">
          {formatDate(s.startDate)}
        </span>
      ),
    },
    {
      header: 'Next Billing Date',
      accessor: (s: Subscription) => (
        <span className="font-mono font-medium text-blue-900 tabular-nums whitespace-nowrap">
          {formatDate(s.nextBillingDate)}
        </span>
      ),
    },
    {
      header: 'Status',
      accessor: (s: Subscription) => <StatusBadge status={s.status} size="sm" />,
    },
    {
      header: 'Actions',
      accessor: (s: Subscription) => {
        const status = s.status ? s.status.toLowerCase() : 'active';
        const isActive = status === 'active';
        const isPaused = status === 'paused';
        const isClosed = status === 'closed';

        const allowPause =
          typeof s.plan === 'object' && s.plan !== null && 'allowPause' in s.plan
            ? Boolean((s.plan as any).allowPause)
            : false;

        return (
          <div className="flex items-center justify-end gap-1">
            {/* View Details */}
            <button
              onClick={() => setDetailsSub(s)}
              className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-slate-100 rounded transition-colors"
              title="View Subscription Details"
            >
              <Eye className="w-3.5 h-3.5" />
            </button>

            {/* Pause Action */}
            {isActive && (
              <button
                onClick={() => setPauseTarget(s)}
                disabled={!allowPause}
                className={`p-1.5 rounded transition-colors ${
                  allowPause
                    ? 'text-slate-500 hover:text-amber-600 hover:bg-amber-50'
                    : 'text-slate-300 cursor-not-allowed'
                }`}
                title={allowPause ? 'Pause Subscription' : 'Plan terms disallow pause'}
              >
                <PauseCircle className="w-3.5 h-3.5" />
              </button>
            )}

            {/* Resume Action */}
            {isPaused && (
              <button
                onClick={() => setResumeTarget(s)}
                className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded transition-colors"
                title="Resume Subscription"
              >
                <PlayCircle className="w-3.5 h-3.5" />
              </button>
            )}

            {/* Close Action */}
            {!isClosed && (
              <button
                onClick={() => setCloseTarget(s)}
                className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors"
                title="Close Subscription Permanently"
              >
                <XCircle className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        );
      },
      className: 'text-right',
    },
  ];

  return (
    <div className="space-y-5">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900">Subscription Management</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage recurring subscriber contracts, automated billing intervals, pauses, and renewals
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleExportCSV}
            className="px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg shadow-xs flex items-center gap-1.5 transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>
          <button
            onClick={() => {
              setPreselectedQuoteId(null);
              setIsFormOpen(true);
            }}
            className="px-3.5 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-xs flex items-center gap-1.5 transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Activate Subscription</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs space-y-3">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          {/* Search */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              placeholder="Search by subscription ID, customer or product..."
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-blue-600 focus:bg-white transition-colors"
            />
          </div>

          {/* Status Tabs */}
          <div className="flex items-center gap-1 overflow-x-auto pb-1 md:pb-0">
            {['all', 'active', 'paused', 'closed'].map((st) => (
              <button
                key={st}
                onClick={() => {
                  setStatusFilter(st);
                  setPage(1);
                }}
                className={`px-3 py-1 text-xs font-medium rounded-lg transition-colors whitespace-nowrap capitalize ${
                  statusFilter === st
                    ? 'bg-blue-600 text-white font-semibold'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                {st === 'all' ? 'All Subscriptions' : st}
              </button>
            ))}
          </div>
        </div>

        {/* Secondary Filter Dropdowns */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-2 border-t border-slate-100 text-xs">
          {/* Product Filter */}
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-medium text-slate-500 whitespace-nowrap">Product:</span>
            <select
              value={productFilter}
              onChange={(e) => {
                setProductFilter(e.target.value);
                setPage(1);
              }}
              className="w-full py-1 px-2.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-blue-600 focus:bg-white transition-colors"
            >
              <option value="all">All Products</option>
              {products.map((p) => (
                <option key={p._id} value={p._id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>

          {/* Plan Filter */}
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-medium text-slate-500 whitespace-nowrap">Plan:</span>
            <select
              value={planFilter}
              onChange={(e) => {
                setPlanFilter(e.target.value);
                setPage(1);
              }}
              className="w-full py-1 px-2.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-blue-600 focus:bg-white transition-colors"
            >
              <option value="all">All Plans</option>
              {plans.map((pl) => (
                <option key={pl._id} value={pl._id}>
                  {pl.name}
                </option>
              ))}
            </select>
          </div>

          {/* Next Billing Timeline Filter */}
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-medium text-slate-500 whitespace-nowrap">Next Billing:</span>
            <select
              value={timelineFilter}
              onChange={(e) => {
                setTimelineFilter(e.target.value);
                setPage(1);
              }}
              className="w-full py-1 px-2.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-blue-600 focus:bg-white transition-colors"
            >
              <option value="all">All Timelines</option>
              <option value="7days">Upcoming in 7 Days</option>
              <option value="30days">Upcoming in 30 Days</option>
            </select>
          </div>
        </div>
      </div>

      {/* Table & Pagination */}
      {loading ? (
        <div className="bg-white p-8 rounded-xl border border-slate-200 flex items-center justify-center">
          <div className="flex items-center gap-2 text-slate-500 text-xs">
            <RefreshCw className="w-4 h-4 animate-spin text-blue-600" />
            <span>Loading active recurring subscriptions from backend...</span>
          </div>
        </div>
      ) : subscriptions.length === 0 ? (
        <EmptyState
          title="No subscriptions found"
          description="Try adjusting your filter parameters or activate a new subscription from an approved quotation."
          icon={Repeat}
          actionLabel="Activate Subscription"
          onAction={() => {
            setPreselectedQuoteId(null);
            setIsFormOpen(true);
          }}
        />
      ) : (
        <div className="space-y-3">
          <DataTable<Subscription>
            columns={columns}
            data={subscriptions}
            rowKey={(s) => s._id || s.id || ''}
          />

          <Pagination
            currentPage={page}
            totalPages={Math.ceil(total / limit) || 1}
            totalItems={total}
            itemsPerPage={limit}
            onPageChange={setPage}
          />
        </div>
      )}

      {/* Subscription Creation / Conversion Modal */}
      <SubscriptionFormModal
        isOpen={isFormOpen}
        preselectedQuotationId={preselectedQuoteId}
        isSubmitting={isSubmitting}
        onSubmit={handleCreateSubscription}
        onClose={() => {
          setIsFormOpen(false);
          setPreselectedQuoteId(null);
        }}
      />

      {/* Subscription Details Modal */}
      <SubscriptionDetailsModal
        isOpen={!!detailsSub}
        subscription={detailsSub}
        onClose={() => setDetailsSub(null)}
        onRequestPause={(s) => setPauseTarget(s)}
        onRequestResume={(s) => setResumeTarget(s)}
        onRequestClose={(s) => setCloseTarget(s)}
      />

      {/* Pause Confirmation Dialog */}
      <ConfirmationDialog
        isOpen={!!pauseTarget}
        title="Pause Subscription"
        message={`Are you sure you want to pause billing for ${
          pauseTarget?.subscriptionNumber || pauseTarget?._id || pauseTarget?.id
        }? Recurring charges will be halted until resumed.`}
        confirmLabel="Pause Billing"
        cancelLabel="Cancel"
        variant="warning"
        isLoading={isActionLoading}
        onConfirm={handleConfirmPause}
        onCancel={() => setPauseTarget(null)}
      />

      {/* Resume Confirmation Dialog */}
      <ConfirmationDialog
        isOpen={!!resumeTarget}
        title="Resume Subscription"
        message={`Resume active billing for ${
          resumeTarget?.subscriptionNumber || resumeTarget?._id || resumeTarget?.id
        }? Recurring invoicing will be re-enabled on schedule.`}
        confirmLabel="Resume Billing"
        cancelLabel="Cancel"
        variant="primary"
        isLoading={isActionLoading}
        onConfirm={handleConfirmResume}
        onCancel={() => setResumeTarget(null)}
      />

      {/* Close Confirmation Dialog (Irreversible Warning) */}
      <ConfirmationDialog
        isOpen={!!closeTarget}
        title="Close Subscription (Irreversible)"
        message={`Warning: Closing subscription ${
          closeTarget?.subscriptionNumber || closeTarget?._id || closeTarget?.id
        } will immediately terminate recurring access. This operation cannot be undone per Master Service Agreement.`}
        confirmLabel="Close Contract"
        cancelLabel="Keep Active"
        variant="danger"
        isLoading={isActionLoading}
        onConfirm={handleConfirmClose}
        onCancel={() => setCloseTarget(null)}
      />

      {/* Toast Notification */}
      {toast && (
        <ToastNotification
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
};
