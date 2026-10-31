import React, { useState, useEffect, useCallback } from 'react';
import { 
  FileText, 
  Search, 
  Plus, 
  CheckCircle2, 
  Clock, 
  AlertTriangle, 
  DollarSign, 
  Printer, 
  Download,
  Send,
  CreditCard,
  Eye,
  Filter,
  Calendar,
  RotateCcw,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  AlertCircle
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { PopulatedPhase4Invoice, Phase4InvoiceStatus } from '../../types';
import { invoiceService } from '../../services/invoiceService';
import { formatINR } from '../../utils/formatters';

interface InvoicesViewProps {
  onViewInvoice: (invoice: PopulatedPhase4Invoice) => void;
  onRecordPayment: (invoice: PopulatedPhase4Invoice) => void;
  addToast: (title: string, message: string, type?: 'success' | 'warning' | 'info' | 'error') => void;
}

export const InvoicesView: React.FC<InvoicesViewProps> = ({
  onViewInvoice,
  onRecordPayment,
  addToast,
}) => {
  const { canPerformAction, setIsCreateInvoiceOpen, currentUser, refreshKey, triggerRefresh } = useApp();
  const isCustomer = currentUser?.role === 'customer';

  const [invoices, setInvoices] = useState<PopulatedPhase4Invoice[]>([]);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [loading, setLoading] = useState<boolean>(true);

  // Filters
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [dueDateFilter, setDueDateFilter] = useState<string>('');

  const fetchInvoices = useCallback(async () => {
    try {
      setLoading(true);
      const res = await invoiceService.listInvoices({
        search: searchQuery,
        status: statusFilter,
        dueDate: dueDateFilter || undefined,
        page: currentPage,
        limit: 8,
      });
      setInvoices(res.invoices);
      setTotalCount(res.total);
      setTotalPages(res.totalPages);
    } catch {
      addToast('Error', 'Failed to load invoices from repository.', 'error');
    } finally {
      setLoading(false);
    }
  }, [searchQuery, statusFilter, dueDateFilter, currentPage, addToast]);

  useEffect(() => {
    fetchInvoices();
  }, [fetchInvoices, refreshKey]);

  const handleSendInvoice = async (inv: PopulatedPhase4Invoice) => {
    try {
      await invoiceService.sendInvoice(inv._id);
      addToast('Invoice Sent', `Invoice #${inv._id.slice(-8)} was sent to ${inv.customer.email}.`, 'success');
      triggerRefresh();
    } catch {
      addToast('Error', 'Could not send invoice.', 'error');
    }
  };

  const handlePrint = (inv: PopulatedPhase4Invoice) => {
    onViewInvoice(inv);
    setTimeout(() => {
      window.print();
    }, 300);
  };

  const handleDownload = (inv: PopulatedPhase4Invoice) => {
    invoiceService.downloadInvoicePdf(inv);
    addToast('Invoice Downloaded', `Invoice #${inv._id.slice(-8)} document generated.`, 'success');
  };

  // Status badge styling
  const renderStatusBadge = (status: Phase4InvoiceStatus) => {
    switch (status) {
      case 'paid':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
            <CheckCircle2 className="w-3 h-3" />
            Paid
          </span>
        );
      case 'sent':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
            <Send className="w-3 h-3" />
            Sent
          </span>
        );
      case 'overdue':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300 border border-rose-200 dark:border-rose-800 animate-pulse">
            <AlertTriangle className="w-3 h-3" />
            Overdue
          </span>
        );
      case 'draft':
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
            <Clock className="w-3 h-3" />
            Draft
          </span>
        );
    }
  };

  const displayedInvoices = isCustomer
    ? invoices.filter(inv => inv.customer?._id === currentUser?._id || inv.customer?.email === currentUser?.email)
    : invoices;

  // Financial summary metrics
  const totalInvoiced = displayedInvoices.reduce((acc, i) => acc + i.amount, 0);
  const totalCollected = displayedInvoices.filter(i => i.status === 'paid').reduce((acc, i) => acc + i.amount, 0);
  const totalOverdue = displayedInvoices.filter(i => i.status === 'overdue').reduce((acc, i) => acc + i.amount, 0);
  const totalPending = displayedInvoices.filter(i => i.status === 'sent' || i.status === 'draft').reduce((acc, i) => acc + i.amount, 0);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
            {isCustomer ? 'My Invoices' : 'Invoices'}
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            {isCustomer ? 'Review, download, and track your billing statements.' : 'Billing statements, payment status, and receivables.'}
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          {!isCustomer && canPerformAction('issue_invoice') && (
            <button
              onClick={() => setIsCreateInvoiceOpen(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold transition-colors shadow-xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Create Invoice</span>
            </button>
          )}
        </div>
      </div>

      {/* Financial Metrics Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Total Invoiced</span>
            <span className="text-[11px] font-semibold text-slate-400 font-mono">INR</span>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-slate-900 dark:text-white">
              {formatINR(totalInvoiced)}
            </span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1">Cumulative billed volume</p>
        </div>

        <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400">Paid & Reconciled</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
              {formatINR(totalCollected)}
            </span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1">Settled payments</p>
        </div>

        <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-blue-600 dark:text-blue-400">Awaiting Settlement</span>
            <Clock className="w-4 h-4 text-blue-500" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-slate-900 dark:text-white">
              {formatINR(totalPending)}
            </span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1">Sent & Draft invoices</p>
        </div>

        <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-rose-600 dark:text-rose-400">Overdue Arrears</span>
            <AlertTriangle className="w-4 h-4 text-rose-500" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-rose-600 dark:text-rose-400">
              {formatINR(totalOverdue)}
            </span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1">Past due maturity</p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Search by invoice ID or customer name */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search invoice ID or customer..."
              value={searchQuery}
              onChange={e => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none"
            />
          </div>

          {/* Status filter */}
          <div>
            <select
              value={statusFilter}
              onChange={e => {
                setStatusFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none"
            >
              <option value="all">All Statuses (draft, sent, paid, overdue)</option>
              <option value="draft">Draft only</option>
              <option value="sent">Sent only</option>
              <option value="paid">Paid only</option>
              <option value="overdue">Overdue only</option>
            </select>
          </div>

          {/* Due date filter */}
          <div className="relative">
            <Calendar className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="date"
              placeholder="Filter by Due Date"
              value={dueDateFilter}
              onChange={e => {
                setDueDateFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none"
            />
          </div>

          {/* Clear Filters */}
          <div className="flex items-center gap-2">
            {(searchQuery || statusFilter !== 'all' || dueDateFilter) && (
              <button
                onClick={() => {
                  setSearchQuery('');
                  setStatusFilter('all');
                  setDueDateFilter('');
                  setCurrentPage(1);
                }}
                className="flex items-center gap-1 px-3 py-2 text-xs text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset Filters</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Invoice Listing Table */}
      <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-slate-500 uppercase tracking-wider font-semibold">
              <tr>
                <th className="py-3 px-4">Invoice ID</th>
                <th className="py-3 px-4">Customer Name</th>
                <th className="py-3 px-4">Subscription ID</th>
                <th className="py-3 px-4 text-right">Amount</th>
                <th className="py-3 px-4">Due Date</th>
                <th className="py-3 px-4">Generated Date</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {loading ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-500">
                    Loading invoices...
                  </td>
                </tr>
              ) : displayedInvoices.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-500">
                    No invoices matching the current criteria.
                  </td>
                </tr>
              ) : (
                displayedInvoices.map(inv => (
                  <tr key={inv._id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors">
                    {/* Invoice ID */}
                    <td className="py-3.5 px-4 font-mono font-medium text-indigo-600 dark:text-indigo-400">
                      <button
                        onClick={() => onViewInvoice(inv)}
                        className="hover:underline text-left"
                      >
                        #{inv._id.slice(-8)}
                      </button>
                    </td>

                    {/* Customer Name */}
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-slate-900 dark:text-white">
                        {inv.customer.name}
                      </div>
                      <div className="text-[11px] text-slate-500">
                        {inv.customer.company || inv.customer.email}
                      </div>
                    </td>

                    {/* Subscription ID */}
                    <td className="py-3.5 px-4 font-mono text-slate-500 truncate max-w-[140px]" title={inv.subscription._id}>
                      #{inv.subscription._id.slice(-8)}
                    </td>

                    {/* Amount */}
                    <td className="py-3.5 px-4 text-right font-bold text-slate-900 dark:text-white">
                      {formatINR(inv.amount)}
                    </td>

                    {/* Due Date */}
                    <td className="py-3.5 px-4 text-slate-600 dark:text-slate-300">
                      {inv.dueDate}
                    </td>

                    {/* Generated Date */}
                    <td className="py-3.5 px-4 text-slate-500">
                      {inv.generatedAt}
                    </td>

                    {/* Status */}
                    <td className="py-3.5 px-4 text-center">
                      {renderStatusBadge(inv.status)}
                    </td>

                    {/* Actions */}
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => onViewInvoice(inv)}
                          className="p-1.5 text-slate-600 hover:text-indigo-600 dark:text-slate-400 dark:hover:text-indigo-400 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                          title="View Invoice Details"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>

                        <button
                          onClick={() => handlePrint(inv)}
                          className="p-1.5 text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                          title="Print Invoice"
                        >
                          <Printer className="w-3.5 h-3.5" />
                        </button>

                        <button
                          onClick={() => handleDownload(inv)}
                          className="p-1.5 text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                          title="Download PDF"
                        >
                          <Download className="w-3.5 h-3.5" />
                        </button>

                        {!isCustomer && inv.status === 'draft' && (
                          <button
                            onClick={() => handleSendInvoice(inv)}
                            className="p-1.5 text-blue-600 hover:text-blue-700 dark:text-blue-400 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-950/50 transition-colors"
                            title="Send to Customer"
                          >
                            <Send className="w-3.5 h-3.5" />
                          </button>
                        )}

                        {!isCustomer && inv.status !== 'paid' && (
                          <button
                            onClick={() => onRecordPayment(inv)}
                            className="p-1.5 text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 rounded-lg hover:bg-emerald-50 dark:hover:bg-emerald-950/50 transition-colors"
                            title="Record Payment"
                          >
                            <CreditCard className="w-3.5 h-3.5" />
                          </button>
                        )}
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
            Showing <span className="font-semibold text-slate-800 dark:text-slate-200">{displayedInvoices.length}</span> of <span className="font-semibold text-slate-800 dark:text-slate-200">{totalCount}</span> invoices
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
