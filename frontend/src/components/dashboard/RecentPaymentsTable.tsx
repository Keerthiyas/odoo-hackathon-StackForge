import React from 'react';
import { ExternalLink, CreditCard, Building2, CheckCircle2 } from 'lucide-react';
import { Payment } from '../../types';
import { StatusBadge } from '../common/StatusBadge';
import { formatCurrency, formatDate } from '../../utils/formatters';

interface RecentPaymentsTableProps {
  payments: Payment[];
  onViewAll?: () => void;
}

export const RecentPaymentsTable: React.FC<RecentPaymentsTableProps> = ({ payments, onViewAll }) => {
  const getMethodBadge = (payment: Payment) => {
    switch (payment.paymentMethod) {
      case 'credit_card':
        return (
          <div className="flex items-center gap-1.5 text-slate-700">
            <CreditCard className="w-3.5 h-3.5 text-slate-500" />
            <span className="capitalize">{payment.cardBrand || 'Card'}</span>
            {payment.last4 && <span className="text-[11px] text-slate-400 font-mono">•••• {payment.last4}</span>}
          </div>
        );
      case 'bank_transfer':
        return (
          <div className="flex items-center gap-1.5 text-slate-700">
            <Building2 className="w-3.5 h-3.5 text-slate-500" />
            <span>Bank Wire (ACH)</span>
          </div>
        );
      case 'stripe':
        return (
          <div className="flex items-center gap-1.5 text-slate-700">
            <CreditCard className="w-3.5 h-3.5 text-blue-500" />
            <span>Stripe</span>
            {payment.last4 && <span className="text-[11px] text-slate-400 font-mono">•••• {payment.last4}</span>}
          </div>
        );
      default:
        return <span className="capitalize text-slate-600">{payment.paymentMethod}</span>;
    }
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs flex flex-col">
      {/* Table Header */}
      <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-slate-900">Recent Payments</h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Settled transactions, merchant gateways and collection records
          </p>
        </div>
        {onViewAll && (
          <button
            onClick={onViewAll}
            className="text-xs font-medium text-blue-600 hover:text-blue-700 flex items-center gap-1 transition-colors"
          >
            <span>View All</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Table Content */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="bg-slate-50/75 border-b border-slate-200/80 text-slate-500 uppercase tracking-wider text-[11px] font-semibold">
              <th className="py-3 px-4">Transaction ID</th>
              <th className="py-3 px-4">Invoice Ref</th>
              <th className="py-3 px-4">Customer</th>
              <th className="py-3 px-4">Payment Method</th>
              <th className="py-3 px-4 text-right">Amount</th>
              <th className="py-3 px-4">Processed Date</th>
              <th className="py-3 px-4 text-center">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {payments.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-8 text-center text-slate-400">
                  No payments found for this timeframe.
                </td>
              </tr>
            ) : (
              payments.map((p) => (
                <tr key={p.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-3 px-4 font-mono font-medium text-slate-900 whitespace-nowrap">
                    {p.transactionId}
                  </td>
                  <td className="py-3 px-4 font-mono text-slate-500 whitespace-nowrap">
                    {p.invoiceNumber}
                  </td>
                  <td className="py-3 px-4">
                    <span className="font-semibold text-slate-900">{p.customerName}</span>
                  </td>
                  <td className="py-3 px-4">{getMethodBadge(p)}</td>
                  <td className="py-3 px-4 text-right font-semibold text-slate-900 tabular-nums font-mono">
                    {formatCurrency(p.amount, p.currency)}
                  </td>
                  <td className="py-3 px-4 text-slate-500 tabular-nums">
                    {formatDate(p.date || p.createdAt)}
                  </td>
                  <td className="py-3 px-4 text-center">
                    <StatusBadge status={p.status} size="sm" />
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
