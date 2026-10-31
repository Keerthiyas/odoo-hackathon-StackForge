import React from 'react';
import { Layers, X, Edit, Check, X as XIcon, Package, Calendar } from 'lucide-react';
import { Plan } from '../../../types';
import { StatusBadge } from '../../../components/common/StatusBadge';
import { formatCurrency, formatDate } from '../../../utils/formatters';

interface PlanDetailsModalProps {
  plan: Plan | null;
  productName?: string;
  isOpen: boolean;
  onClose: () => void;
  onEdit: (plan: Plan) => void;
}

export const PlanDetailsModal: React.FC<PlanDetailsModalProps> = ({
  plan,
  productName,
  isOpen,
  onClose,
  onEdit,
}) => {
  if (!isOpen || !plan) return null;

  const resolvedProductName =
    productName ||
    (typeof plan.product === 'object' && plan.product !== null
      ? plan.product.name
      : 'Associated Product');

  const productId =
    typeof plan.product === 'object' && plan.product !== null
      ? plan.product._id
      : plan.product;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl shadow-xl border border-slate-200 max-w-lg w-full p-6 animate-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <Layers className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block">
                ID: {plan._id}
              </span>
              <h3 className="text-sm font-bold text-slate-900">{plan.name}</h3>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-600 rounded-lg transition-colors"
            aria-label="Close modal"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="py-4 space-y-4 text-xs">
          {/* Price & Billing Cadence Banner */}
          <div className="grid grid-cols-2 gap-3 p-3 bg-slate-50 rounded-xl border border-slate-100">
            <div>
              <span className="text-[11px] text-slate-400 block mb-1">Billing Cadence</span>
              <span className="font-semibold text-slate-900 capitalize text-sm">
                {plan.billingCycle}
              </span>
            </div>
            <div>
              <span className="text-[11px] text-slate-400 block mb-1">Subscription Price</span>
              <span className="text-base font-bold text-slate-900 tabular-nums font-mono">
                {formatCurrency(plan.price)}
              </span>
            </div>
          </div>

          {/* Associated Product Link */}
          <div className="p-3 bg-white rounded-xl border border-slate-200">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
              Associated Product
            </span>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-slate-900 font-semibold">
                <Package className="w-4 h-4 text-blue-600" />
                <span>{resolvedProductName}</span>
              </div>
              <span className="text-[10px] font-mono text-slate-400">Ref: {productId}</span>
            </div>
          </div>

          {/* Policy Badges */}
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
            <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block mb-2">
              Lifecycle Policies & Capabilities
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {/* Allow Pause */}
              <div className="p-2 bg-white rounded-lg border border-slate-200 flex items-center justify-between">
                <span className="text-[11px] text-slate-600">Allow Pause</span>
                {plan.allowPause ? (
                  <span className="inline-flex items-center gap-0.5 text-emerald-600 font-bold text-[10px]">
                    <Check className="w-3 h-3" /> Yes
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-0.5 text-slate-400 font-medium text-[10px]">
                    <XIcon className="w-3 h-3" /> No
                  </span>
                )}
              </div>

              {/* Allow Renewal */}
              <div className="p-2 bg-white rounded-lg border border-slate-200 flex items-center justify-between">
                <span className="text-[11px] text-slate-600">Auto Renewal</span>
                {plan.allowRenewal ? (
                  <span className="inline-flex items-center gap-0.5 text-emerald-600 font-bold text-[10px]">
                    <Check className="w-3 h-3" /> Yes
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-0.5 text-slate-400 font-medium text-[10px]">
                    <XIcon className="w-3 h-3" /> No
                  </span>
                )}
              </div>

              {/* Allow Early Close */}
              <div className="p-2 bg-white rounded-lg border border-slate-200 flex items-center justify-between">
                <span className="text-[11px] text-slate-600">Early Close</span>
                {plan.allowEarlyClose ? (
                  <span className="inline-flex items-center gap-0.5 text-emerald-600 font-bold text-[10px]">
                    <Check className="w-3 h-3" /> Yes
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-0.5 text-slate-400 font-medium text-[10px]">
                    <XIcon className="w-3 h-3" /> No
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Active Status */}
          <div className="flex items-center justify-between pt-2 border-t border-slate-100">
            <span className="text-slate-500">Plan Status</span>
            <StatusBadge status={plan.isActive} />
          </div>

          {/* Timestamps */}
          <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
            <div className="flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5" />
              <span>Created: {formatDate(plan.createdAt)}</span>
            </div>
            <div>
              <span>Updated: {formatDate(plan.updatedAt || plan.createdAt)}</span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="pt-4 flex items-center justify-end gap-2.5 border-t border-slate-100">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
          >
            Back
          </button>
          <button
            type="button"
            onClick={() => {
              onClose();
              onEdit(plan);
            }}
            className="px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-xs transition-colors flex items-center gap-1.5"
          >
            <Edit className="w-3.5 h-3.5" />
            <span>Edit Plan</span>
          </button>
        </div>
      </div>
    </div>
  );
};
