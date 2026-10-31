import React from 'react';
import {
  Repeat,
  X,
  PauseCircle,
  PlayCircle,
  XCircle,
  Building2,
  Mail,
  ShieldCheck,
  FileText,
} from 'lucide-react';
import { Subscription } from '../../../types';
import { StatusBadge } from '../../../components/common/StatusBadge';
import { formatCurrency, formatDate } from '../../../utils/formatters';

interface SubscriptionDetailsModalProps {
  isOpen: boolean;
  subscription: Subscription | null;
  onClose: () => void;
  onRequestPause: (subscription: Subscription) => void;
  onRequestResume: (subscription: Subscription) => void;
  onRequestClose: (subscription: Subscription) => void;
}

export const SubscriptionDetailsModal: React.FC<SubscriptionDetailsModalProps> = ({
  isOpen,
  subscription,
  onClose,
  onRequestPause,
  onRequestResume,
  onRequestClose,
}) => {
  if (!isOpen || !subscription) return null;

  const subId = subscription._id || subscription.id || '';
  const quantity = subscription.quantity || 1;

  const customerName =
    typeof subscription.customer === 'object' && subscription.customer !== null && 'name' in subscription.customer
      ? (subscription.customer as any).name
      : subscription.customerName || 'Customer';

  const customerEmail =
    typeof subscription.customer === 'object' && subscription.customer !== null && 'email' in subscription.customer
      ? (subscription.customer as any).email
      : subscription.customerEmail || '';

  const customerCompany =
    typeof subscription.customer === 'object' && subscription.customer !== null
      ? (subscription.customer as any).companyName || (subscription.customer as any).company
      : '';

  const productName =
    typeof subscription.product === 'object' && subscription.product !== null && 'name' in subscription.product
      ? (subscription.product as any).name
      : subscription.productName || 'Software Product';

  const planName =
    typeof subscription.plan === 'object' && subscription.plan !== null && 'name' in subscription.plan
      ? (subscription.plan as any).name
      : subscription.planName || 'Plan';

  const planPrice =
    typeof subscription.plan === 'object' && subscription.plan !== null && 'price' in subscription.plan
      ? (subscription.plan as any).price
      : 0;

  const billingCycle =
    typeof subscription.plan === 'object' && subscription.plan !== null && 'billingCycle' in subscription.plan
      ? (subscription.plan as any).billingCycle
      : subscription.billingCycle || 'monthly';

  // Plan Lifecycle Policies
  const allowPause =
    typeof subscription.plan === 'object' && subscription.plan !== null && 'allowPause' in subscription.plan
      ? Boolean((subscription.plan as any).allowPause)
      : false;

  const allowRenewal =
    typeof subscription.plan === 'object' && subscription.plan !== null && 'allowRenewal' in subscription.plan
      ? Boolean((subscription.plan as any).allowRenewal)
      : true;

  const allowEarlyClose =
    typeof subscription.plan === 'object' && subscription.plan !== null && 'allowEarlyClose' in subscription.plan
      ? Boolean((subscription.plan as any).allowEarlyClose)
      : false;

  const quoteId =
    typeof subscription.quotation === 'object' && subscription.quotation !== null
      ? (subscription.quotation as any).quotationNumber || (subscription.quotation as any)._id
      : subscription.quotation;

  const status = subscription.status ? subscription.status.toLowerCase() : 'active';
  const isActive = status === 'active';
  const isPaused = status === 'paused';
  const isClosed = status === 'closed';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl shadow-xl border border-slate-200 max-w-xl w-full p-6 animate-in zoom-in-95 duration-150 max-h-[94vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <Repeat className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-slate-900">
                  {subscription.subscriptionNumber || `SUB-${subId.slice(-6).toUpperCase()}`}
                </h3>
                <StatusBadge status={subscription.status} size="sm" />
              </div>
              <p className="text-[11px] text-slate-500">
                Created {formatDate(subscription.createdAt || subscription.startDate)}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-600 rounded-lg transition-colors"
            aria-label="Close modal"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="mt-4 space-y-4">
          {/* Customer & Product Section */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-4 bg-slate-50 rounded-xl border border-slate-100">
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider mb-1">
                Subscriber Account
              </span>
              <div className="text-xs font-bold text-slate-900">{customerName}</div>
              {customerCompany && (
                <div className="text-[11px] text-slate-600 flex items-center gap-1 mt-0.5">
                  <Building2 className="w-3 h-3 text-slate-400" />
                  <span>{customerCompany}</span>
                </div>
              )}
              {customerEmail && (
                <div className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
                  <Mail className="w-3 h-3 text-slate-400" />
                  <span>{customerEmail}</span>
                </div>
              )}
            </div>

            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider mb-1">
                Service Package
              </span>
              <div className="text-xs font-bold text-slate-900">{productName}</div>
              <div className="text-[11px] text-slate-600 mt-0.5">Plan: {planName}</div>
              <div className="text-[11px] font-mono text-slate-700 mt-0.5 capitalize">
                Cadence: {billingCycle} · {quantity} license{quantity > 1 ? 's' : ''}
              </div>
            </div>
          </div>

          {/* Billing & Timeline Grid */}
          <div className="grid grid-cols-3 gap-3 p-3.5 bg-white border border-slate-200 rounded-xl text-center">
            <div>
              <span className="text-[10px] uppercase font-semibold text-slate-400 block">Start Date</span>
              <span className="text-xs font-semibold text-slate-900 font-mono tabular-nums">
                {formatDate(subscription.startDate)}
              </span>
            </div>
            <div>
              <span className="text-[10px] uppercase font-semibold text-slate-400 block">Next Billing</span>
              <span className="text-xs font-semibold text-blue-900 font-mono tabular-nums">
                {formatDate(subscription.nextBillingDate)}
              </span>
            </div>
            <div>
              <span className="text-[10px] uppercase font-semibold text-slate-400 block">Recurring Total</span>
              <span className="text-xs font-bold text-slate-900 font-mono tabular-nums">
                {formatCurrency(planPrice * quantity)}
              </span>
            </div>
          </div>

          {/* Plan Lifecycle Rules Box */}
          <div className="p-3.5 bg-slate-50/80 rounded-xl border border-slate-200 space-y-2">
            <div className="flex items-center justify-between border-b border-slate-200/60 pb-1.5">
              <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                Plan Contract Rules & Policies
              </span>
              <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
            </div>

            <div className="grid grid-cols-3 gap-2 text-xs">
              <div className="flex items-center gap-1.5">
                <span className={`w-2 h-2 rounded-full ${allowPause ? 'bg-emerald-500' : 'bg-rose-400'}`} />
                <span className="text-slate-700 text-[11px]">
                  Pause: <strong>{allowPause ? 'Allowed' : 'Disabled'}</strong>
                </span>
              </div>

              <div className="flex items-center gap-1.5">
                <span className={`w-2 h-2 rounded-full ${allowRenewal ? 'bg-emerald-500' : 'bg-rose-400'}`} />
                <span className="text-slate-700 text-[11px]">
                  Auto-Renew: <strong>{allowRenewal ? 'Yes' : 'No'}</strong>
                </span>
              </div>

              <div className="flex items-center gap-1.5">
                <span className={`w-2 h-2 rounded-full ${allowEarlyClose ? 'bg-emerald-500' : 'bg-rose-400'}`} />
                <span className="text-slate-700 text-[11px]">
                  Early Close: <strong>{allowEarlyClose ? 'Allowed' : 'Penalty'}</strong>
                </span>
              </div>
            </div>

            {!allowPause && (
              <p className="text-[10px] text-amber-700 bg-amber-50/80 p-2 rounded-lg border border-amber-200/60">
                Notice: The policy configured on <strong>{planName}</strong> prohibits freezing or pausing billing.
              </p>
            )}
          </div>

          {/* Source Quotation Traceability */}
          {quoteId && (
            <div className="p-3 bg-blue-50/40 rounded-xl border border-blue-100 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-blue-600" />
                <div>
                  <span className="font-semibold text-slate-900 block">Origin Quotation Reference</span>
                  <span className="text-[11px] font-mono text-blue-700">{quoteId}</span>
                </div>
              </div>
              <span className="text-[10px] bg-blue-100/80 text-blue-800 font-mono px-2 py-0.5 rounded">
                Traceable Snapshot
              </span>
            </div>
          )}

          {/* Lifecycle Action Buttons */}
          <div className="pt-4 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2.5">
            <div className="flex items-center gap-2">
              {/* Pause Action */}
              {isActive && (
                <button
                  onClick={() => onRequestPause(subscription)}
                  disabled={!allowPause}
                  className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors flex items-center gap-1.5 ${
                    allowPause
                      ? 'text-amber-800 bg-amber-50 hover:bg-amber-100 border border-amber-200'
                      : 'text-slate-400 bg-slate-100 cursor-not-allowed border border-slate-200'
                  }`}
                  title={allowPause ? 'Pause subscription' : 'Plan terms disallow pause'}
                >
                  <PauseCircle className="w-3.5 h-3.5" />
                  <span>Pause Subscription</span>
                </button>
              )}

              {/* Resume Action */}
              {isPaused && (
                <button
                  onClick={() => onRequestResume(subscription)}
                  className="px-3 py-1.5 text-xs font-semibold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg transition-colors flex items-center gap-1.5"
                >
                  <PlayCircle className="w-3.5 h-3.5" />
                  <span>Resume Subscription</span>
                </button>
              )}

              {/* Close Action */}
              {!isClosed && (
                <button
                  onClick={() => onRequestClose(subscription)}
                  className="px-3 py-1.5 text-xs font-medium text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-lg transition-colors flex items-center gap-1.5"
                >
                  <XCircle className="w-3.5 h-3.5" />
                  <span>Close Subscription</span>
                </button>
              )}
            </div>

            <button
              onClick={onClose}
              className="px-3.5 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
