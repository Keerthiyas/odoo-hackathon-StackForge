import React, { useState } from 'react';
import { Search, Plus, Download, FileText, CheckCircle2 } from 'lucide-react';
import { MOCK_INVOICES } from '../../data/mockData';
import { Invoice } from '../../types';
import { StatusBadge } from '../../components/common/StatusBadge';
import { formatCurrency, formatDate } from '../../utils/formatters';
import { EmptyState } from '../../components/common/EmptyState';

export const InvoicesPage: React.FC = () => {
  const [invoices] = useState<Invoice[]>(MOCK_INVOICES);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [toast, setToast] = useState<string | null>(null);

  const filtered = invoices.filter((inv) => {
    const matchesSearch =
      (inv.customerName || '').toLowerCase().includes(search.toLowerCase()) ||
      (inv.invoiceNumber || '').toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'ALL' || inv.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleDownload = (invoiceNumber: string) => {
    setToast(`Downloaded invoice statement ${invoiceNumber}.pdf`);
    setTimeout(() => setToast(null), 3000);
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900">Invoices</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Billing history, account receivables, payment receipts, and taxation lines
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              setToast('Creating manual one-off invoice draft...');
              setTimeout(() => setToast(null), 3000);
            }}
            className="px-3.5 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-xs flex items-center gap-1.5 transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Generate Invoice</span>
          </button>
        </div>
      </div>

      {toast && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>{toast}</span>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by invoice number or client name..."
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-blue-600 focus:bg-white transition-colors"
          />
        </div>

        <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0">
          {['ALL', 'PAID', 'PENDING', 'OVERDUE'].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-2.5 py-1 text-xs font-medium rounded-lg transition-colors whitespace-nowrap ${
                statusFilter === st
                  ? 'bg-blue-600 text-white font-semibold'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              {st === 'ALL' ? 'All Invoices' : st}
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          title="No invoices found"
          description="Try clearing your search query or choosing another invoice status filter."
          icon={FileText}
          actionLabel="Reset Search"
          onAction={() => {
            setSearch('');
            setStatusFilter('ALL');
          }}
        />
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50/75 border-b border-slate-200/80 text-slate-500 uppercase tracking-wider text-[11px] font-semibold">
                  <th className="py-3 px-4">Invoice #</th>
                  <th className="py-3 px-4">Customer</th>
                  <th className="py-3 px-4">Issue Date</th>
                  <th className="py-3 px-4">Due Date</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Amount</th>
                  <th className="py-3 px-4 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((inv) => (
                  <tr key={inv.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4 font-mono font-medium text-slate-900 whitespace-nowrap flex items-center gap-2">
                      <FileText className="w-3.5 h-3.5 text-slate-400" />
                      {inv.invoiceNumber}
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-semibold text-slate-900">{inv.customerName}</div>
                      <div className="text-[11px] text-slate-400">{inv.customerEmail}</div>
                    </td>
                    <td className="py-3 px-4 text-slate-500 tabular-nums">{formatDate(inv.issueDate || inv.createdAt)}</td>
                    <td className="py-3 px-4 text-slate-500 tabular-nums">
                      <span className={inv.status === 'OVERDUE' ? 'text-rose-600 font-semibold' : ''}>
                        {formatDate(inv.dueDate)}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <StatusBadge status={inv.status} size="sm" />
                    </td>
                    <td className="py-3 px-4 text-right font-semibold text-slate-900 tabular-nums font-mono">
                      {formatCurrency(inv.total ?? inv.amount)}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <button
                        onClick={() => handleDownload(inv.invoiceNumber)}
                        className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-slate-100 rounded transition-colors"
                        title="Download PDF"
                      >
                        <Download className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
