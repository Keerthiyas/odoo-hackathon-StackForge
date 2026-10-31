import React, { useState, useEffect, useCallback } from 'react';
import { 
  Search, 
  Plus, 
  Eye, 
  Edit3, 
  Send, 
  Trash2, 
  ArrowRight, 
  ChevronLeft, 
  ChevronRight, 
  FileText,
  Filter,
  CheckCircle2,
  Clock,
  RefreshCw
} from 'lucide-react';
import { PopulatedQuotation, Quotation, Product, PlanModel } from '../../types';
import { quotationService } from '../../services/quotationService';
import { useApp } from '../../context/AppContext';
import { formatINR } from '../../utils/formatters';

interface QuotationsViewProps {
  onOpenCreate: () => void;
  onOpenEdit: (quotation: PopulatedQuotation | Quotation) => void;
  onViewDetails: (quotation: PopulatedQuotation) => void;
  onConvertToSubscription: (quotation: PopulatedQuotation) => void;
  addToast: (title: string, message: string, type?: 'success' | 'warning' | 'info' | 'error') => void;
}

export const QuotationsView: React.FC<QuotationsViewProps> = ({
  onOpenCreate,
  onOpenEdit,
  onViewDetails,
  onConvertToSubscription,
  addToast,
}) => {
  const { currentUser, refreshKey, triggerRefresh } = useApp();
  const isCustomer = currentUser?.role === 'customer';

  const [quotations, setQuotations] = useState<PopulatedQuotation[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [plans, setPlans] = useState<PlanModel[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Filters
  const [search, setSearch] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [productFilter, setProductFilter] = useState<string>('all');
  const [planFilter, setPlanFilter] = useState<string>('all');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');

  // Pagination
  const [page, setPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [total, setTotal] = useState<number>(0);
  const limit = 8;

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [quotationRes, loadedProducts, loadedPlans] = await Promise.all([
        quotationService.listQuotations({
          search: search || undefined,
          status: statusFilter,
          productId: productFilter,
          planId: planFilter,
          startDate: startDate || undefined,
          endDate: endDate || undefined,
          page,
          limit,
        }),
        quotationService.getProducts(),
        quotationService.getPlans(),
      ]);

      setQuotations(quotationRes.quotations);
      setTotalPages(quotationRes.totalPages);
      setTotal(quotationRes.total);
      setProducts(loadedProducts);
      setPlans(loadedPlans);
    } catch (err: any) {
      console.error('Failed to load quotations:', err);
      addToast('Error', 'Failed to retrieve quotation records.', 'error');
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter, productFilter, planFilter, startDate, endDate, page, addToast]);

  useEffect(() => {
    loadData();
  }, [loadData, refreshKey]);

  // Handle quick actions
  const handleSend = async (q: PopulatedQuotation) => {
    try {
      await quotationService.sendQuotation(q._id);
      addToast('Quotation Sent', `Proposal ${q.quotationNumber || q._id} sent to ${q.customer.email}.`, 'success');
      triggerRefresh();
    } catch (err: any) {
      addToast('Send Failed', err.message || 'Could not send quotation.', 'error');
    }
  };

  const handleDelete = async (q: PopulatedQuotation) => {
    if (!confirm(`Are you sure you want to delete draft quotation ${q.quotationNumber || q._id}?`)) {
      return;
    }
    try {
      await quotationService.deleteDraftQuotation(q._id);
      addToast('Draft Deleted', 'Draft quotation removed from database.', 'info');
      triggerRefresh();
    } catch (err: any) {
      addToast('Delete Failed', err.message || 'Could not delete quotation.', 'error');
    }
  };

  const statusBadges = {
    draft: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border-slate-300 dark:border-slate-700',
    sent: 'bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300 border-blue-200 dark:border-blue-800',
    accepted: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800 font-semibold',
    rejected: 'bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300 border-rose-200 dark:border-rose-800',
  };

  const displayedQuotations = isCustomer
    ? quotations.filter(q => q.customer?._id === currentUser?._id || q.customer?.email === currentUser?.email)
    : quotations;

  const totalValue = displayedQuotations.reduce((sum, q) => sum + (q.totalAmount || 0), 0);
  const pendingCount = displayedQuotations.filter(q => q.status === 'draft' || q.status === 'sent').length;
  const acceptedCount = displayedQuotations.filter(q => q.status === 'accepted').length;
  const acceptedValue = displayedQuotations.filter(q => q.status === 'accepted').reduce((sum, q) => sum + (q.totalAmount || 0), 0);

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
            {isCustomer ? 'My Quotations' : 'Quotations'}
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            {isCustomer ? 'Review and manage your commercial proposals and quotes.' : 'Commercial proposals, pricing quotes, and approval pipeline.'}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => loadData()}
            className="p-2 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors"
            title="Refresh Quotations"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          </button>

          {!isCustomer && (
            <button
              onClick={onOpenCreate}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold transition-colors shadow-xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Create Quotation</span>
            </button>
          )}
        </div>
      </div>

      {/* Visual Metric Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <span>Total Proposals</span>
            <FileText className="w-4 h-4 text-slate-400" />
          </div>
          <div className="text-2xl font-bold text-slate-900 dark:text-white mt-1.5 font-mono tabular-nums">
            {displayedQuotations.length}
          </div>
          <p className="text-[11px] text-slate-500 mt-1">Active quotes in pipeline</p>
        </div>

        <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs">
          <div className="flex items-center justify-between text-xs text-blue-600 dark:text-blue-400">
            <span>Awaiting Review</span>
            <Clock className="w-4 h-4 text-blue-500" />
          </div>
          <div className="text-2xl font-bold text-blue-600 dark:text-blue-400 mt-1.5 font-mono tabular-nums">
            {pendingCount}
          </div>
          <p className="text-[11px] text-slate-500 mt-1">Draft or sent proposals</p>
        </div>

        <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs">
          <div className="flex items-center justify-between text-xs text-emerald-600 dark:text-emerald-400">
            <span>Accepted</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-1.5 font-mono tabular-nums">
            {acceptedCount}
          </div>
          <p className="text-[11px] text-slate-500 mt-1">{formatINR(acceptedValue)} closed</p>
        </div>

        <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs">
          <div className="flex items-center justify-between text-xs text-indigo-600 dark:text-indigo-400">
            <span>Pipeline Value</span>
            <span className="text-[11px] font-semibold">INR (₹)</span>
          </div>
          <div className="text-2xl font-bold text-slate-900 dark:text-white mt-1.5 font-mono tabular-nums">
            {formatINR(totalValue)}
          </div>
          <p className="text-[11px] text-slate-500 mt-1">Total commercial quote value</p>
        </div>
      </div>

      {/* Filter and Search Console */}
      <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-3 shadow-xs">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 text-xs">
          {/* Search by quotation number or customer */}
          <div className="relative md:col-span-1">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search quotation # or customer..."
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

          {/* Date range filter */}
          <div className="flex items-center gap-1.5">
            <input
              type="date"
              value={startDate}
              onChange={e => {
                setStartDate(e.target.value);
                setPage(1);
              }}
              className="w-1/2 px-2 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-mono text-[11px]"
              title="Start Date"
            />
            <span className="text-slate-400">-</span>
            <input
              type="date"
              value={endDate}
              onChange={e => {
                setEndDate(e.target.value);
                setPage(1);
              }}
              className="w-1/2 px-2 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-mono text-[11px]"
              title="End Date"
            />
          </div>
        </div>

        {/* Status Filter Segmented Controls */}
        <div className="flex items-center gap-1.5 pt-2 border-t border-slate-100 dark:border-slate-800 overflow-x-auto text-xs">
          <span className="text-slate-400 text-[11px] mr-1">Status:</span>
          {['all', 'draft', 'sent', 'accepted', 'rejected'].map(st => (
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

      {/* Quotation Listing Table */}
      <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-850 text-slate-600 dark:text-slate-300 border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="py-3 px-3.5 font-semibold">Quotation ID</th>
                <th className="py-3 px-3.5 font-semibold">Customer Name</th>
                <th className="py-3 px-3.5 font-semibold">Product Name</th>
                <th className="py-3 px-3.5 font-semibold">Plan Name</th>
                <th className="py-3 px-3 font-semibold text-center">Qty</th>
                <th className="py-3 px-3 font-semibold text-right">Unit Price</th>
                <th className="py-3 px-3.5 font-semibold text-right">Total Amount</th>
                <th className="py-3 px-3.5 font-semibold">Status</th>
                <th className="py-3 px-3.5 font-semibold">Valid Until</th>
                <th className="py-3 px-3.5 font-semibold">Created By</th>
                <th className="py-3 px-3.5 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
              {loading ? (
                <tr>
                  <td colSpan={11} className="py-12 text-center text-slate-500">
                    Loading quotation records...
                  </td>
                </tr>
              ) : displayedQuotations.length === 0 ? (
                <tr>
                  <td colSpan={11} className="py-12 text-center text-slate-500">
                    No quotations match the active criteria.
                  </td>
                </tr>
              ) : (
                displayedQuotations.map(q => {
                  return (
                    <tr 
                      key={q._id} 
                      className="hover:bg-slate-50/70 dark:hover:bg-slate-850/50 transition-colors"
                    >
                      {/* Quotation ID */}
                      <td className="py-3 px-3.5 font-mono font-semibold text-indigo-600 dark:text-indigo-400 whitespace-nowrap">
                        <button
                          onClick={() => onViewDetails(q)}
                          className="hover:underline flex items-center gap-1"
                        >
                          <FileText className="w-3.5 h-3.5" />
                          <span>{q.quotationNumber || q._id.substring(0, 10)}</span>
                        </button>
                      </td>

                      {/* Customer Name */}
                      <td className="py-3 px-3.5">
                        <div className="font-semibold text-slate-900 dark:text-white">
                          {q.customer.company || q.customer.name}
                        </div>
                        <div className="text-[11px] text-slate-500 dark:text-slate-400">
                          {q.customer.name}
                        </div>
                      </td>

                      {/* Product Name */}
                      <td className="py-3 px-3.5 font-medium text-slate-800 dark:text-slate-200">
                        {q.product.name}
                      </td>

                      {/* Plan Name */}
                      <td className="py-3 px-3.5 text-slate-700 dark:text-slate-300">
                        {q.plan.name}
                      </td>

                      {/* Quantity */}
                      <td className="py-3 px-3 text-center font-mono font-medium text-slate-800 dark:text-slate-200">
                        {q.quantity}
                      </td>

                      {/* Unit Price */}
                      <td className="py-3 px-3 text-right font-mono text-slate-600 dark:text-slate-400 tabular-nums">
                        {formatINR(q.unitPrice)}
                      </td>

                      {/* Total Amount (Stored snapshot) */}
                      <td className="py-3 px-3.5 text-right font-mono font-bold text-slate-900 dark:text-white tabular-nums">
                        {formatINR(q.totalAmount)}
                      </td>

                      {/* Status */}
                      <td className="py-3 px-3.5">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] border capitalize ${statusBadges[q.status]}`}>
                          {q.status}
                        </span>
                      </td>

                      {/* Valid Until */}
                      <td className="py-3 px-3.5 font-mono text-[11px] text-slate-500 whitespace-nowrap">
                        {q.validUntil ? q.validUntil.split('T')[0] : 'Open'}
                      </td>

                      {/* Created By */}
                      <td className="py-3 px-3.5 text-slate-600 dark:text-slate-400 text-[11px] whitespace-nowrap">
                        {q.createdBy.name}
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-3.5 text-right whitespace-nowrap">
                        <div className="inline-flex items-center gap-1">
                          {/* View Quotation */}
                          <button
                            onClick={() => onViewDetails(q)}
                            className="p-1.5 text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 rounded hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                            title="View Quotation"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>

                          {/* Edit Quotation (draft only, non-customer) */}
                          {!isCustomer && q.status === 'draft' && (
                            <button
                              onClick={() => onOpenEdit(q)}
                              className="p-1.5 text-slate-500 hover:text-slate-900 dark:hover:text-white rounded hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                              title="Edit Quotation"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                          )}

                          {/* Send Quotation (draft only, non-customer) */}
                          {!isCustomer && q.status === 'draft' && (
                            <button
                              onClick={() => handleSend(q)}
                              className="p-1.5 text-blue-600 hover:text-blue-800 rounded hover:bg-blue-50 dark:hover:bg-blue-950/40 transition-colors"
                              title="Send Quotation"
                            >
                              <Send className="w-3.5 h-3.5" />
                            </button>
                          )}

                          {/* Convert to Subscription (accepted status only, non-customer) */}
                          {!isCustomer && q.status === 'accepted' && (
                            <button
                              onClick={() => onConvertToSubscription(q)}
                              className="px-2 py-1 text-[11px] font-semibold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100 rounded flex items-center gap-1 transition-colors"
                              title="Create Subscription from Accepted Quotation"
                            >
                              <span>Convert</span>
                              <ArrowRight className="w-3 h-3" />
                            </button>
                          )}

                          {/* Delete Draft (draft only, non-customer) */}
                          {!isCustomer && q.status === 'draft' && (
                            <button
                              onClick={() => handleDelete(q)}
                              className="p-1.5 text-rose-500 hover:text-rose-700 rounded hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                              title="Delete Draft"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
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
            Showing <span className="font-semibold text-slate-800 dark:text-slate-200">{quotations.length}</span> of{' '}
            <span className="font-semibold text-slate-800 dark:text-slate-200">{total}</span> total quotations
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
