import React, { useState } from 'react';
import { Search, Plus, Users, Mail, Phone, Building } from 'lucide-react';
import { MOCK_CUSTOMERS } from '../../data/mockData';
import { Customer } from '../../types';
import { StatusBadge } from '../../components/common/StatusBadge';
import { formatCurrency, formatDate } from '../../utils/formatters';
import { EmptyState } from '../../components/common/EmptyState';

export const CustomersPage: React.FC = () => {
  const [customers] = useState<Customer[]>(MOCK_CUSTOMERS);
  const [search, setSearch] = useState('');
  const [toast, setToast] = useState<string | null>(null);

  const filtered = customers.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      (c.companyName || c.company || '').toLowerCase().includes(search.toLowerCase()) ||
      c.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900">Customers</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Accounts, client contacts, subscription portfolios and total lifetime value
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              setToast('Customer Onboarding Form ready for backend schema.');
              setTimeout(() => setToast(null), 3000);
            }}
            className="px-3.5 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-xs flex items-center gap-1.5 transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Add Customer</span>
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
      <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by customer name, company or email..."
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-blue-600 focus:bg-white transition-colors"
          />
        </div>
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          title="No customers found"
          description="Try searching with a different contact name or domain."
          icon={Users}
          actionLabel="Clear Search"
          onAction={() => setSearch('')}
        />
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50/75 border-b border-slate-200/80 text-slate-500 uppercase tracking-wider text-[11px] font-semibold">
                  <th className="py-3 px-4">Customer & Organization</th>
                  <th className="py-3 px-4">Contact Info</th>
                  <th className="py-3 px-4 text-center">Active Subs</th>
                  <th className="py-3 px-4 text-right">Lifetime Spent</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Joined Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4">
                      <div className="font-semibold text-slate-900">{c.name}</div>
                      <div className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
                        <Building className="w-3 h-3 text-slate-400" />
                        <span>{c.companyName || c.company || 'Enterprise Customer'}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="text-slate-700 flex items-center gap-1.5 font-mono text-[11px]">
                        <Mail className="w-3 h-3 text-slate-400" />
                        {c.email}
                      </div>
                      {c.phone && (
                        <div className="text-slate-400 flex items-center gap-1.5 mt-0.5 text-[11px]">
                          <Phone className="w-3 h-3 text-slate-400" />
                          {c.phone}
                        </div>
                      )}
                    </td>
                    <td className="py-3 px-4 text-center font-semibold text-slate-900 tabular-nums">
                      {c.subscriptionsCount ?? 1}
                    </td>
                    <td className="py-3 px-4 text-right font-semibold text-slate-900 tabular-nums font-mono">
                      {formatCurrency(c.totalSpent)}
                    </td>
                    <td className="py-3 px-4">
                      <StatusBadge status={c.status} size="sm" />
                    </td>
                    <td className="py-3 px-4 text-slate-500 tabular-nums">
                      {formatDate(c.joinedDate || c.createdAt)}
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
