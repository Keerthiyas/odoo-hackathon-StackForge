import React, { useState } from 'react';
import { X, AlertTriangle, ShieldCheck } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { BrightloopService } from '../../services/api';

export const CancelSubscriptionModal: React.FC = () => {
  const { 
    subscriptionToCancel, 
    setSubscriptionToCancel, 
    refreshData, 
    addToast 
  } = useApp();

  const [churnReason, setChurnReason] = useState('Budget Reallocation / Downsizing');
  const [customFeedback, setCustomFeedback] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!subscriptionToCancel) return null;

  const sub = subscriptionToCancel;

  const handleConfirmCancel = async () => {
    setIsSubmitting(true);
    try {
      const fullReason = customFeedback 
        ? `${churnReason}: ${customFeedback}` 
        : churnReason;

      await BrightloopService.updateSubscriptionStatus(sub.id, 'canceled', fullReason);
      addToast(
        'Subscription Canceled',
        `${sub.customerCompany}'s contract has been marked canceled. Churn survey recorded.`,
        'warning'
      );
      setSubscriptionToCancel(null);
      await refreshData();
    } catch {
      addToast('Error', 'Could not process cancellation.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePauseInstead = async () => {
    try {
      await BrightloopService.updateSubscriptionStatus(sub.id, 'paused');
      addToast(
        'Subscription Paused',
        `Paused billing for 60 days as churn mitigation for ${sub.customerCompany}.`,
        'success'
      );
      setSubscriptionToCancel(null);
      await refreshData();
    } catch {
      addToast('Error', 'Failed to pause subscription.', 'error');
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-rose-50 text-rose-600 dark:bg-rose-950/40 dark:text-rose-400">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Cancel Subscription
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {sub.customerCompany} · {sub.planName}
              </p>
            </div>
          </div>

          <button
            onClick={() => setSubscriptionToCancel(null)}
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Churn Survey Form */}
        <div className="mt-5 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
              Primary Cancellation Reason
            </label>
            <select
              value={churnReason}
              onChange={e => setChurnReason(e.target.value)}
              className="mt-1 w-full px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-1 focus:ring-indigo-500"
            >
              <option value="Budget Reallocation / Downsizing">Budget Reallocation / Downsizing</option>
              <option value="Lack of Internal Team Adoption">Lack of Internal Team Adoption</option>
              <option value="Missing Custom ERP Integration">Missing Custom ERP Integration</option>
              <option value="Price Sensitivity at Renewal">Price Sensitivity at Renewal</option>
              <option value="Switched to Competitor">Switched to Competitor</option>
              <option value="Project Sunset / Liquidation">Project Sunset / Liquidation</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
              Exit Notes & Feedback
            </label>
            <textarea
              rows={2}
              value={customFeedback}
              onChange={e => setCustomFeedback(e.target.value)}
              placeholder="Optional customer context for CSM review..."
              className="mt-1 w-full px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-1 focus:ring-indigo-500"
            />
          </div>

          {/* Retention Mitigation Offer */}
          <div className="p-3.5 rounded-xl bg-indigo-50/70 dark:bg-indigo-950/30 border border-indigo-200/60 dark:border-indigo-800/60">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-indigo-900 dark:text-indigo-200">
              <ShieldCheck className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              <span>Retention Mitigation Recommended</span>
            </div>
            <p className="text-[11px] text-indigo-800/80 dark:text-indigo-300/80 mt-1">
              Offer a 60-day billing pause to retain customer data while budget cycles settle.
            </p>
            <button
              type="button"
              onClick={handlePauseInstead}
              className="mt-2.5 w-full py-1.5 text-xs font-medium rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white transition-colors"
            >
              Pause Subscription Instead
            </button>
          </div>

          {/* Action Buttons */}
          <div className="pt-3 flex items-center justify-end gap-2 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={() => setSubscriptionToCancel(null)}
              className="px-3 py-1.5 text-xs text-slate-600 dark:text-slate-400 hover:text-slate-900 rounded-lg"
            >
              Keep Active
            </button>
            <button
              type="button"
              disabled={isSubmitting}
              onClick={handleConfirmCancel}
              className="px-4 py-1.5 text-xs font-semibold rounded-lg bg-rose-600 hover:bg-rose-700 text-white transition-colors"
            >
              {isSubmitting ? 'Canceling...' : 'Confirm Cancellation'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
