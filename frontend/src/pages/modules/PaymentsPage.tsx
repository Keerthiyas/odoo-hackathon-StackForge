import React, { useState } from 'react';
import { Search, CreditCard, Download, Filter } from 'lucide-react';
import { MOCK_PAYMENTS } from '../../data/mockData';
import { Payment } from '../../types';
import { RecentPaymentsTable } from '../../components/dashboard/RecentPaymentsTable';
import { EmptyState } from '../../components/common/EmptyState';
import { formatCurrency } from '../../utils/formatters';

export const PaymentsPage: React.FC = () => {
  const [payments] = useState<Payment[]>(MOCK_PAYMENTS);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [toast, setToast] = useState<string | null>(null);

  const filtered = payments.filter((p) => {
    const matchesSearch =
      (p.customerName || '').toLowerCase().includes(search.toLowerCase()) ||
      (p.transactionId || '').toLowerCase().includes(search.toLowerCase()) ||
      (p.invoiceNumber || '').toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'ALL' || p.status.toUpperCase() === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const totalSettled = filtered
    .filter((p) => p.status === 'SUCCESS')
    .reduce((sum, curr) => sum + curr.amount, 0);

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900">Payments</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Credit card transactions, ACH wire transfers, Stripe webhooks, and receipts
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              setToast('Exporting transaction settlement ledger...');
              setTimeout(() => setToast(null), 3000);
            }}
            className="px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg shadow-xs flex items-center gap-1.5 transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export Ledger</span>
          </button>
        </div>
      </div>

      {toast && (
        <div className="p-3 bg-blue-50 border border-blue-200 text-blue-800 rounded-xl text-xs flex items-center justify-between animate-in fade-in">
          <span>{toast}</span>
          <span className="text-[10px] text-blue-500 font-mono">Info</span>
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
            placeholder="Search by transaction ID, invoice or customer..."
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-blue-600 focus:bg-white transition-colors"
          />
        </div>

        <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0">
          {['ALL', 'SUCCESS', 'PENDING', 'FAILED'].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-2.5 py-1 text-xs font-medium rounded-lg transition-colors whitespace-nowrap ${
                statusFilter === st
                  ? 'bg-blue-600 text-white font-semibold'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              {st === 'ALL' ? 'All Statuses' : st}
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          title="No payments found"
          description="Try broadening your search term or switching the status filter."
          icon={CreditCard}
          actionLabel="Clear Filters"
          onAction={() => {
            setSearch('');
            setStatusFilter('ALL');
          }}
        />
      ) : (
        <RecentPaymentsTable payments={filtered} />
      )}
    </div>
  );
};
