import React from 'react';
import { 
  X, 
  Pause, 
  Play, 
  XCircle, 
  Calendar, 
  Package, 
  Layers, 
  FileText, 
  User, 
  ShieldAlert,
  Clock,
  CheckCircle2,
  AlertTriangle
} from 'lucide-react';
import { PopulatedSubscription } from '../../types';
import { subscriptionService } from '../../services/subscriptionService';
import { formatINR } from '../../utils/formatters';

interface SubscriptionDetailPhase3ModalProps {
  subscription: PopulatedSubscription | null;
  onClose: () => void;
  onRefresh: () => void;
  addToast: (title: string, message: string, type?: 'success' | 'warning' | 'info' | 'error') => void;
}

export const SubscriptionDetailPhase3Modal: React.FC<SubscriptionDetailPhase3ModalProps> = ({
  subscription,
  onClose,
  onRefresh,
  addToast,
}) => {
  if (!subscription) return null;

  const sub = subscription;
  const plan = sub.plan;

  // Plan permissions from Phase 2
  const allowPause = plan?.allowPause ?? true;
  const allowEarlyClose = plan?.allowEarlyClose ?? true;
  const allowRenewal = plan?.allowRenewal ?? true;

  const handlePause = async () => {
    if (!allowPause) {
      addToast('Restriction', `Plan ${plan.name} does not permit subscription pausing.`, 'warning');
      return;
    }

    if (!confirm(`Are you sure you want to pause billing for ${sub.customer.company || sub.customer.name}? This will suspend recurring charges.`)) {
      return;
    }

    try {
      await subscriptionService.pauseSubscription(sub._id);
      addToast('Subscription Paused', 'Billing has been successfully paused.', 'info');
      onRefresh();
      onClose();
    } catch (err: any) {
      addToast('Pause Failed', err.message || 'Could not pause subscription.', 'error');
    }
  };

  const handleResume = async () => {
    try {
      await subscriptionService.resumeSubscription(sub._id);
      addToast('Subscription Resumed', 'Subscription is now ACTIVE and billing schedule resumed.', 'success');
      onRefresh();
      onClose();
    } catch (err: any) {
      addToast('Resume Failed', err.message || 'Could not resume subscription.', 'error');
    }
  };

  const handleClose = async () => {
    if (!allowEarlyClose) {
      addToast('Restriction', `Plan ${plan.name} does not permit early closure under contractual terms.`, 'warning');
      return;
    }

    if (!confirm(`WARNING: Closing subscription ${sub._id} may be irreversible and will terminate service entitlements immediately. Proceed with closure?`)) {
      return;
    }

    try {
      await subscriptionService.closeSubscription(sub._id);
      addToast('Subscription Closed', 'Subscription status updated to CLOSED.', 'warning');
      onRefresh();
      onClose();
    } catch (err: any) {
      addToast('Closure Failed', err.message || 'Could not close subscription.', 'error');
    }
  };

  const statusColors = {
    active: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border-emerald-300 dark:border-emerald-700',
    paused: 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300 border-amber-300 dark:border-amber-700',
    closed: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 border-slate-300 dark:border-slate-700',
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-xl w-full p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-150 max-h-[92vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Subscription Statement
            </span>
            <span className={`px-2 py-0.5 rounded text-xs border font-mono capitalize ${statusColors[sub.status]}`}>
              {sub.status}
            </span>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="py-5 space-y-5 text-xs">
          {/* Top Identifier */}
          <div className="flex items-start justify-between">
            <div>
              <span className="text-[10px] text-slate-400 uppercase tracking-widest font-mono">Subscription ID</span>
              <div className="text-base font-bold font-mono text-slate-900 dark:text-white mt-0.5">
                {sub._id}
              </div>
            </div>

            <div className="text-right">
              <span className="text-[10px] text-slate-400 uppercase tracking-widest font-mono">Source Quotation</span>
              <div className="text-xs font-mono font-semibold text-indigo-600 dark:text-indigo-400 mt-0.5">
                {typeof sub.quotation === 'object' ? (sub.quotation.quotationNumber || sub.quotation._id) : sub.quotation}
              </div>
            </div>
          </div>

          {/* Customer & Product Information */}
          <div className="grid grid-cols-2 gap-4 p-4 rounded-xl bg-slate-50 dark:bg-slate-850 border border-slate-100 dark:border-slate-800">
            <div>
              <span className="font-semibold text-slate-500 uppercase tracking-wider text-[10px] block mb-1">
                Customer Account
              </span>
              <div className="font-bold text-slate-900 dark:text-white text-sm">
                {sub.customer.company || sub.customer.name}
              </div>
              <div className="text-slate-600 dark:text-slate-300">
                Contact: {sub.customer.name}
              </div>
              <div className="text-slate-500 font-mono">
                {sub.customer.email}
              </div>
            </div>

            <div>
              <span className="font-semibold text-slate-500 uppercase tracking-wider text-[10px] block mb-1">
                Product & Entitlement
              </span>
              <div className="font-bold text-slate-900 dark:text-white">
                {sub.product.name}
              </div>
              <div className="text-slate-500 font-mono">
                Code: {sub.product.code}
              </div>
              <div className="mt-1 font-mono font-semibold text-slate-800 dark:text-slate-200">
                Quantity: {sub.quantity} unit(s)
              </div>
            </div>
          </div>

          {/* Plan Details & Business Rule Badges */}
          <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-slate-500 uppercase tracking-wider text-[10px]">
                Plan Configuration
              </span>
              <span className="font-bold text-slate-900 dark:text-white font-mono">
                {formatINR(plan.price)}/{plan.billingCycle}
              </span>
            </div>

            <div className="text-sm font-bold text-indigo-600 dark:text-indigo-400">
              {plan.name} [{plan.code}]
            </div>

            {/* Plan Rules Checks */}
            <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-100 dark:border-slate-800 text-[11px]">
              <div className="flex items-center gap-1.5">
                <span className="text-slate-500">Pause:</span>
                <span className={`font-semibold ${allowPause ? 'text-emerald-600' : 'text-rose-500'}`}>
                  {allowPause ? 'Allowed' : 'Not Allowed'}
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-slate-500">Early Close:</span>
                <span className={`font-semibold ${allowEarlyClose ? 'text-emerald-600' : 'text-rose-500'}`}>
                  {allowEarlyClose ? 'Allowed' : 'Not Allowed'}
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-slate-500">Renewal:</span>
                <span className={`font-semibold ${allowRenewal ? 'text-emerald-600' : 'text-rose-500'}`}>
                  {allowRenewal ? 'Enabled' : 'Disabled'}
                </span>
              </div>
            </div>
          </div>

          {/* Dates & Timeline */}
          <div className="grid grid-cols-2 gap-4 p-4 rounded-xl border border-slate-200 dark:border-slate-800">
            <div>
              <span className="font-semibold text-slate-500 uppercase tracking-wider text-[10px] block">
                Start Date
              </span>
              <div className="text-sm font-mono font-bold text-slate-900 dark:text-white mt-1">
                {sub.startDate ? sub.startDate.split('T')[0] : 'N/A'}
              </div>
              <div className="text-[11px] text-slate-500 mt-0.5">Initial activation date</div>
            </div>

            <div>
              <span className="font-semibold text-slate-500 uppercase tracking-wider text-[10px] block">
                Next Billing Date
              </span>
              <div className="text-sm font-mono font-bold text-slate-900 dark:text-white mt-1">
                {sub.nextBillingDate ? sub.nextBillingDate.split('T')[0] : 'N/A'}
              </div>
              <div className="text-[11px] text-slate-500 mt-0.5">Scheduled automated settlement</div>
            </div>
          </div>

          {/* Status Management Actions */}
          <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 font-medium"
            >
              Close Details
            </button>

            <div className="flex items-center gap-2">
              {/* 1. Pause Subscription (check plan allowPause) */}
              {sub.status === 'active' && allowPause && (
                <button
                  onClick={handlePause}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-amber-300 dark:border-amber-700 text-amber-700 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/30 font-medium transition-colors"
                >
                  <Pause className="w-3.5 h-3.5" />
                  <span>Pause Subscription</span>
                </button>
              )}

              {/* 2. Resume Subscription */}
              {sub.status === 'paused' && (
                <button
                  onClick={handleResume}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-medium transition-colors"
                >
                  <Play className="w-3.5 h-3.5" />
                  <span>Resume Subscription</span>
                </button>
              )}

              {/* 3. Close Subscription (check plan allowEarlyClose) */}
              {sub.status !== 'closed' && allowEarlyClose && (
                <button
                  onClick={handleClose}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-rose-300 dark:border-rose-800 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 font-medium transition-colors"
                >
                  <XCircle className="w-3.5 h-3.5" />
                  <span>Close Subscription</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
