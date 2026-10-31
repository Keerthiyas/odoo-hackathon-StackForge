import React, { useState, useEffect, useCallback } from 'react';
import { 
  CreditCard, 
  Search, 
  Plus, 
  CheckCircle2, 
  Clock, 
  Calendar, 
  DollarSign, 
  Filter, 
  RotateCcw, 
  ExternalLink, 
  Eye, 
  ChevronLeft, 
  ChevronRight,
  Landmark,
  Banknote,
  MoreHorizontal
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { 
  PopulatedPaymentModel, 
  PaymentMethod, 
  PaymentStatus,
  PopulatedPhase4Invoice,
  Phase4Invoice 
} from '../../types';
import { paymentService } from '../../services/paymentService';
import { invoiceService } from '../../services/invoiceService';
import { formatINR } from '../../utils/formatters';

interface PaymentsViewProps {
  onOpenRecordPayment: () => void;
  onViewPayment: (payment: PopulatedPaymentModel) => void;
  onViewInvoice: (invoice: PopulatedPhase4Invoice) => void;
  addToast: (title: string, message: string, type?: 'success' | 'warning' | 'info' | 'error') => void;
}

export const PaymentsView: React.FC<PaymentsViewProps> = ({
  onOpenRecordPayment,
  onViewPayment,
  onViewInvoice,
  addToast,
}) => {
  const { currentUser, refreshKey, triggerRefresh } = useApp();
  const isCustomer = currentUser?.role === 'customer';

  const [payments, setPayments] = useState<PopulatedPaymentModel[]>([]);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [loading, setLoading] = useState<boolean>(true);

  // Filters
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [methodFilter, setMethodFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [startDateFilter, setStartDateFilter] = useState<string>('');
  const [endDateFilter, setEndDateFilter] = useState<string>('');

  const fetchPayments = useCallback(async () => {
    try {
      setLoading(true);
      const res = await paymentService.listPayments({
        search: searchQuery,
        method: methodFilter,
        status: statusFilter,
        startDate: startDateFilter || undefined,
        endDate: endDateFilter || undefined,
        page: currentPage,
        limit: 8,
      });
      setPayments(res.payments);
      setTotalCount(res.total);
      setTotalPages(res.totalPages);
    } catch {
      addToast('Error', 'Failed to retrieve payment records.', 'error');
    } finally {
      setLoading(false);
    }
  }, [searchQuery, methodFilter, statusFilter, startDateFilter, endDateFilter, currentPage, addToast]);

  useEffect(() => {
    fetchPayments();
  }, [fetchPayments, refreshKey]);

  const handleJumpToInvoice = async (invRef: PopulatedPhase4Invoice | Phase4Invoice | string) => {
    try {
      const invId = typeof invRef === 'object' ? invRef._id : String(invRef);
      const fullInvoice = await invoiceService.getInvoiceById(invId);
      onViewInvoice(fullInvoice);
    } catch {
      addToast('Error', 'Could not open associated invoice.', 'error');
    }
  };

  const getMethodIcon = (method: PaymentMethod) => {
    switch (method) {
      case 'bank_transfer':
        return <Landmark className="w-3.5 h-3.5 text-blue-500" />;
      case 'card':
        return <CreditCard className="w-3.5 h-3.5 text-indigo-500" />;
      case 'cash':
        return <Banknote className="w-3.5 h-3.5 text-emerald-500" />;
      case 'other':
      default:
        return <MoreHorizontal className="w-3.5 h-3.5 text-slate-400" />;
    }
  };

  const getMethodLabel = (method: PaymentMethod) => {
    switch (method) {
      case 'bank_transfer': return 'Bank Transfer';
      case 'card': return 'Credit Card';
      case 'cash': return 'Cash';
      case 'other': return 'Other';
      default: return method;
    }
  };

  const displayedPayments = isCustomer
    ? payments.filter(p => p.customer?._id === currentUser?._id || p.customer?.email === currentUser?.email)
    : payments;

  // Metrics
  const totalSettledAmount = displayedPayments.filter(p => p.status === 'completed').reduce((sum, p) => sum + p.amount, 0);
  const totalPendingAmount = displayedPayments.filter(p => p.status === 'pending').reduce((sum, p) => sum + p.amount, 0);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
            {isCustomer ? 'My Payments' : 'Payments'}
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            {isCustomer ? 'Review and track your transaction history and payment receipts.' : 'Transaction history, settled volume, and payment methods.'}
          </p>
        </div>

        {!isCustomer && (
          <button
            onClick={onOpenRecordPayment}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white text-xs font-semibold transition-colors shadow-xs self-start sm:self-auto"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Record Payment</span>
          </button>
        )}
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Total Settled Volume</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
              {formatINR(totalSettledAmount)}
            </span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1">Reconciled funds</p>
        </div>

        <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Pending Reconciliation</span>
            <Clock className="w-4 h-4 text-amber-500" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-amber-600 dark:text-amber-400">
              {formatINR(totalPendingAmount)}
            </span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1">Awaiting bank clearing</p>
        </div>

        <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Total Transactions</span>
            <CreditCard className="w-4 h-4 text-indigo-500" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-slate-900 dark:text-white">
              {displayedPayments.length}
            </span>
            <span className="text-xs text-slate-400 font-mono">Records</span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1">Audit log entries</p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {/* Search by payment ID, invoice ID, or customer name */}
          <div className="relative lg:col-span-2">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search payment ID, invoice ID, or customer..."
              value={searchQuery}
              onChange={e => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 outline-none"
            />
          </div>

          {/* Payment Method filter */}
          <div>
            <select
              value={methodFilter}
              onChange={e => {
                setMethodFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 outline-none"
            >
              <option value="all">All Methods</option>
              <option value="bank_transfer">Bank Transfer (ACH/Wire)</option>
              <option value="card">Credit Card</option>
              <option value="cash">Cash</option>
              <option value="other">Other</option>
            </select>
          </div>

          {/* Payment Status filter */}
          <div>
            <select
              value={statusFilter}
              onChange={e => {
                setStatusFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 outline-none"
            >
              <option value="all">All Statuses</option>
              <option value="completed">Completed only</option>
              <option value="pending">Pending only</option>
            </select>
          </div>

          {/* Reset button */}
          <div className="flex items-center">
            {(searchQuery || methodFilter !== 'all' || statusFilter !== 'all' || startDateFilter || endDateFilter) && (
              <button
                onClick={() => {
                  setSearchQuery('');
                  setMethodFilter('all');
                  setStatusFilter('all');
                  setStartDateFilter('');
                  setEndDateFilter('');
                  setCurrentPage(1);
                }}
                className="flex items-center gap-1 px-3 py-2 text-xs text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset</span>
              </button>
            )}
          </div>
        </div>

        {/* Date Range Row */}
        <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-slate-100 dark:border-slate-800 text-xs">
          <span className="text-slate-500 font-medium">Date Range:</span>
          <div className="flex items-center gap-2">
            <input
              type="date"
              value={startDateFilter}
              onChange={e => {
                setStartDateFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="px-2.5 py-1 text-xs rounded-md border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
            />
            <span className="text-slate-400">to</span>
            <input
              type="date"
              value={endDateFilter}
              onChange={e => {
                setEndDateFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="px-2.5 py-1 text-xs rounded-md border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
            />
          </div>
        </div>
      </div>

      {/* Payment Listing Table */}
      <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-slate-500 uppercase tracking-wider font-semibold">
              <tr>
                <th className="py-3 px-4">Payment ID</th>
                <th className="py-3 px-4">Invoice ID</th>
                <th className="py-3 px-4">Customer Name</th>
                <th className="py-3 px-4 text-right">Amount</th>
                <th className="py-3 px-4">Method</th>
                <th className="py-3 px-4">Payment Date</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {loading ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-500">
                    Loading payments...
                  </td>
                </tr>
              ) : displayedPayments.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-500">
                    No payment records found matching the filter criteria.
                  </td>
                </tr>
              ) : (
                displayedPayments.map(payment => (
                  <tr key={payment._id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors">
                    {/* Payment ID */}
                    <td className="py-3.5 px-4 font-mono font-medium text-emerald-600 dark:text-emerald-400">
                      <button
                        onClick={() => onViewPayment(payment)}
                        className="hover:underline text-left"
                      >
                        #{payment._id.slice(-8)}
                      </button>
                    </td>

                    {/* Invoice ID */}
                    <td className="py-3.5 px-4 font-mono text-slate-600 dark:text-slate-300">
                      <button
                        onClick={() => handleJumpToInvoice(payment.invoice)}
                        className="flex items-center gap-1 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
                        title="View associated invoice"
                      >
                        <span>#{typeof payment.invoice === 'object' ? payment.invoice._id.slice(-8) : String(payment.invoice).slice(-8)}</span>
                        <ExternalLink className="w-3 h-3 text-slate-400" />
                      </button>
                    </td>

                    {/* Customer Name */}
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-slate-900 dark:text-white">
                        {payment.customer.name}
                      </div>
                      <div className="text-[11px] text-slate-500">
                        {payment.customer.company || payment.customer.email}
                      </div>
                    </td>

                    {/* Amount */}
                    <td className="py-3.5 px-4 text-right font-bold text-slate-900 dark:text-white">
                      {formatINR(payment.amount)}
                    </td>

                    {/* Payment Method */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-1.5 font-medium text-slate-700 dark:text-slate-300">
                        {getMethodIcon(payment.paymentMethod)}
                        <span>{getMethodLabel(payment.paymentMethod)}</span>
                      </div>
                    </td>

                    {/* Payment Date */}
                    <td className="py-3.5 px-4 text-slate-600 dark:text-slate-300">
                      {payment.paymentDate}
                    </td>

                    {/* Status */}
                    <td className="py-3.5 px-4 text-center">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                        payment.status === 'completed'
                          ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                          : 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-200 dark:border-amber-800'
                      }`}>
                        {payment.status === 'completed' ? (
                          <CheckCircle2 className="w-3 h-3" />
                        ) : (
                          <Clock className="w-3 h-3" />
                        )}
                        {payment.status.toUpperCase()}
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => onViewPayment(payment)}
                          className="p-1.5 text-slate-600 hover:text-emerald-600 dark:text-slate-400 dark:hover:text-emerald-400 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                          title="View Payment Details"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>

                        <button
                          onClick={() => handleJumpToInvoice(payment.invoice)}
                          className="p-1.5 text-slate-600 hover:text-indigo-600 dark:text-slate-400 dark:hover:text-indigo-400 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                          title="Go to Linked Invoice"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        <div className="flex items-center justify-between px-4 py-3 border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 text-xs">
          <span className="text-slate-500">
            Showing <span className="font-semibold text-slate-800 dark:text-slate-200">{displayedPayments.length}</span> of <span className="font-semibold text-slate-800 dark:text-slate-200">{totalCount}</span> payments
          </span>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage <= 1}
              className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-40 transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="font-mono text-slate-600 dark:text-slate-300">
              {currentPage} / {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage >= totalPages}
              className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-40 transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
