import React, { useState } from 'react';
import { ExternalLink, Check, MoreVertical } from 'lucide-react';
import { Subscription } from '../../types';
import { StatusBadge } from '../common/StatusBadge';
import { formatCurrency, formatDate } from '../../utils/formatters';

interface RecentSubscriptionsTableProps {
  subscriptions: Subscription[];
  onViewAll?: () => void;
}

export const RecentSubscriptionsTable: React.FC<RecentSubscriptionsTableProps> = ({
  subscriptions,
  onViewAll,
}) => {
  const [selectedSub, setSelectedSub] = useState<Subscription | null>(null);
  const [actionNotice, setActionNotice] = useState<string | null>(null);

  const handleAction = (sub: Subscription, action: string) => {
    setActionNotice(`${action} triggered for ${sub.subscriptionNumber}`);
    setTimeout(() => setActionNotice(null), 3000);
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs flex flex-col">
      {/* Table Header */}
      <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-slate-900">Recent Subscriptions</h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Latest subscription lifecycles, upgrades and recurring contracts
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

      {actionNotice && (
        <div className="mx-5 my-2 p-2.5 bg-blue-50 border border-blue-200 rounded-lg text-xs text-blue-800 flex items-center justify-between animate-in fade-in">
          <span>{actionNotice}</span>
          <span className="text-[10px] text-blue-500">Notice</span>
        </div>
      )}

      {/* Table Content */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="bg-slate-50/75 border-b border-slate-200/80 text-slate-500 uppercase tracking-wider text-[11px] font-semibold">
              <th className="py-3 px-4">Subscription ID</th>
              <th className="py-3 px-4">Customer</th>
              <th className="py-3 px-4">Plan & Product</th>
              <th className="py-3 px-4">Cycle</th>
              <th className="py-3 px-4">Status</th>
              <th className="py-3 px-4 text-right">Amount</th>
              <th className="py-3 px-4">Started Date</th>
              <th className="py-3 px-4 text-center">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {subscriptions.length === 0 ? (
              <tr>
                <td colSpan={8} className="py-8 text-center text-slate-400">
                  No subscriptions match the selected criteria.
                </td>
              </tr>
            ) : (
              subscriptions.map((sub) => (
                <tr
                  key={sub._id || sub.id}
                  className="hover:bg-slate-50/80 transition-colors group cursor-pointer"
                  onClick={() => setSelectedSub(sub)}
                >
                  <td className="py-3 px-4 font-mono font-medium text-slate-900 whitespace-nowrap">
                    {sub.subscriptionNumber}
                  </td>
                  <td className="py-3 px-4">
                    <div className="font-semibold text-slate-900">{sub.customerName}</div>
                    <div className="text-[11px] text-slate-400 truncate max-w-[150px]">
                      {sub.customerEmail}
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <div className="text-slate-800 font-medium">{sub.planName}</div>
                    <div className="text-[11px] text-slate-400 truncate">{sub.productName}</div>
                  </td>
                  <td className="py-3 px-4 capitalize text-slate-600 font-medium">
                    {sub.billingCycle}
                  </td>
                  <td className="py-3 px-4">
                    <StatusBadge status={sub.status} size="sm" />
                  </td>
                  <td className="py-3 px-4 text-right font-semibold text-slate-900 tabular-nums font-mono">
                    {formatCurrency(sub.amount, sub.currency)}
                  </td>
                  <td className="py-3 px-4 text-slate-500 tabular-nums">
                    {formatDate(sub.createdAt || sub.startDate)}
                  </td>
                  <td className="py-3 px-4 text-center" onClick={(e) => e.stopPropagation()}>
                    <button
                      onClick={() => handleAction(sub, 'Details')}
                      className="p-1 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                      title="Manage Subscription"
                    >
                      <MoreVertical className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Subscription Quick View Modal */}
      {selectedSub && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 max-w-lg w-full p-6 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div>
                <span className="text-xs font-semibold text-blue-600 uppercase tracking-wider">
                  Subscription Details
                </span>
                <h3 className="text-base font-bold text-slate-900 mt-0.5">
                  {selectedSub.subscriptionNumber}
                </h3>
              </div>
              <StatusBadge status={selectedSub.status} />
            </div>

            <div className="py-4 space-y-3 text-xs">
              <div className="flex justify-between py-1.5 border-b border-slate-100">
                <span className="text-slate-500">Customer</span>
                <span className="font-semibold text-slate-900">{selectedSub.customerName}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-100">
                <span className="text-slate-500">Email</span>
                <span className="font-mono text-slate-700">{selectedSub.customerEmail}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-100">
                <span className="text-slate-500">Product & Plan</span>
                <span className="font-semibold text-slate-900">
                  {selectedSub.productName} · {selectedSub.planName}
                </span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-100">
                <span className="text-slate-500">Billing Cadence</span>
                <span className="font-medium capitalize text-slate-700">
                  {selectedSub.billingCycle} recurring
                </span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-100">
                <span className="text-slate-500">Recurring Price</span>
                <span className="font-bold text-slate-900 tabular-nums font-mono text-sm">
                  {formatCurrency(selectedSub.amount, selectedSub.currency)}
                </span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-100">
                <span className="text-slate-500">Period Window</span>
                <span className="text-slate-700 tabular-nums">
                  {formatDate(selectedSub.currentPeriodStart || selectedSub.startDate)} -{' '}
                  {formatDate(selectedSub.currentPeriodEnd || selectedSub.endDate)}
                </span>
              </div>
              <div className="flex justify-between py-1.5">
                <span className="text-slate-500">Auto Renewal</span>
                <span className="inline-flex items-center gap-1 text-emerald-600 font-semibold">
                  <Check className="w-3.5 h-3.5" /> Enabled
                </span>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-2">
              <button
                onClick={() => setSelectedSub(null)}
                className="px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
              >
                Close
              </button>
              <button
                onClick={() => {
                  handleAction(selectedSub, 'Renewal');
                  setSelectedSub(null);
                }}
                className="px-4 py-2 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
              >
                Manage Renewal
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
