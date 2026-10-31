import React, { useState, useEffect } from 'react';
import { X, Check, ArrowRight, Calendar, User, Package, Layers, FileText } from 'lucide-react';
import { subscriptionService } from '../../services/subscriptionService';
import { quotationService } from '../../services/quotationService';
import { Quotation, PopulatedQuotation, UserModel, Product, PlanModel } from '../../types';
import { formatINR } from '../../utils/formatters';

interface CreateSubscriptionPhase3ModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialQuotation?: PopulatedQuotation | Quotation | null;
  onCreated: () => void;
  addToast: (title: string, message: string, type?: 'success' | 'warning' | 'info' | 'error') => void;
}

export const CreateSubscriptionPhase3Modal: React.FC<CreateSubscriptionPhase3ModalProps> = ({
  isOpen,
  onClose,
  initialQuotation,
  onCreated,
  addToast,
}) => {
  const [eligibleQuotations, setEligibleQuotations] = useState<PopulatedQuotation[]>([]);
  const [selectedQuotationId, setSelectedQuotationId] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Form Fields strictly following MongoDB Subscription Schema:
  // - customer: ObjectId
  // - product: ObjectId
  // - plan: ObjectId
  // - quotation: ObjectId
  // - quantity: Number
  // - startDate: Date
  // - nextBillingDate: Date
  // - status: 'active'
  const [startDate, setStartDate] = useState<string>('');
  const [nextBillingDate, setNextBillingDate] = useState<string>('');

  // Load eligible accepted quotations
  useEffect(() => {
    if (!isOpen) return;

    const loadData = async () => {
      setLoading(true);
      try {
        const listRes = await quotationService.listQuotations({ status: 'accepted' });
        setEligibleQuotations(listRes.quotations);

        const today = new Date().toISOString().split('T')[0];
        setStartDate(today);

        // Pre-select if initial quotation was passed
        if (initialQuotation) {
          setSelectedQuotationId(initialQuotation._id);
        } else if (listRes.quotations.length > 0) {
          setSelectedQuotationId(listRes.quotations[0]._id);
        }
      } catch (err: any) {
        console.error('Failed to load eligible quotations:', err);
        addToast('Load Error', 'Could not fetch accepted quotations.', 'error');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [isOpen, initialQuotation, addToast]);

  // Selected quotation object
  const activeQuotation = eligibleQuotations.find(q => q._id === selectedQuotationId) || eligibleQuotations[0];

  // Update nextBillingDate based on plan's billingCycle when quotation or startDate changes
  useEffect(() => {
    if (!startDate) return;
    const dateObj = new Date(startDate);
    const cycle = activeQuotation?.plan?.billingCycle || 'monthly';

    if (cycle === 'annual') {
      dateObj.setFullYear(dateObj.getFullYear() + 1);
    } else if (cycle === 'quarterly') {
      dateObj.setMonth(dateObj.getMonth() + 3);
    } else {
      dateObj.setMonth(dateObj.getMonth() + 1);
    }

    setNextBillingDate(dateObj.toISOString().split('T')[0]);
  }, [startDate, activeQuotation]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeQuotation) {
      addToast('Validation', 'Please select an eligible accepted quotation.', 'warning');
      return;
    }
    if (!startDate || !nextBillingDate) {
      addToast('Validation', 'Start date and Next Billing date are required.', 'warning');
      return;
    }

    setIsSubmitting(true);
    try {
      // Submit exact ObjectIds:
      // customer: ObjectId
      // product: ObjectId
      // plan: ObjectId
      // quotation: ObjectId
      // quantity: Number
      // startDate: Date
      // nextBillingDate: Date
      await subscriptionService.createSubscription({
        customer: activeQuotation.customer._id,
        product: activeQuotation.product._id,
        plan: activeQuotation.plan._id,
        quotation: activeQuotation._id,
        quantity: activeQuotation.quantity,
        startDate,
        nextBillingDate,
        status: 'active',
      });

      addToast(
        'Subscription Activated',
        `Provisioned subscription for ${activeQuotation.customer.company || activeQuotation.customer.name} from Quotation ${activeQuotation.quotationNumber || activeQuotation._id}.`,
        'success'
      );
      onCreated();
      onClose();
    } catch (err: any) {
      addToast('Creation Failed', err.message || 'Could not provision subscription.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-150 max-h-[92vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              New Subscription
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Convert an accepted proposal into an active recurring subscription.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {loading ? (
          <div className="py-12 text-center text-xs text-slate-500">
            Checking backend for eligible accepted quotations...
          </div>
        ) : eligibleQuotations.length === 0 ? (
          <div className="py-8 text-center space-y-3">
            <div className="p-3 bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-300 rounded-xl text-xs max-w-md mx-auto">
              No accepted quotations found. Only customer-accepted quotations can be converted into active subscriptions.
            </div>
            <p className="text-xs text-slate-500">
              Go to Quotation Management, review or accept a draft/sent quotation first.
            </p>
            <button
              onClick={onClose}
              className="px-4 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-xs font-semibold hover:bg-slate-200 transition-colors"
            >
              Close
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="mt-5 space-y-4 text-xs">
            {/* 1. Quotation Selector */}
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300">
                1. Select Accepted Source Quotation <span className="text-rose-500">*</span>
              </label>
              <select
                value={selectedQuotationId}
                onChange={e => setSelectedQuotationId(e.target.value)}
                className="mt-1 w-full px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-1 focus:ring-indigo-500"
                required
              >
                {eligibleQuotations.map(q => (
                  <option key={q._id} value={q._id}>
                    {q.quotationNumber || q._id} — {q.customer.company || q.customer.name} ({q.product.name} / {q.plan.name}) [{formatINR(q.totalAmount)}]
                  </option>
                ))}
              </select>
            </div>

            {/* Display Auto-Populated Parameters */}
            {activeQuotation && (
              <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-850 space-y-2.5">
                <span className="font-semibold text-slate-500 uppercase tracking-wider text-[10px] block">
                  Quotation Summary
                </span>

                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Customer:</span>
                  <span className="font-bold text-slate-900 dark:text-white">
                    {activeQuotation.customer.company || activeQuotation.customer.name}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Product:</span>
                  <span className="font-medium text-slate-900 dark:text-white">
                    {activeQuotation.product.name}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Plan & Cadence:</span>
                  <span className="font-medium text-slate-900 dark:text-white">
                    {activeQuotation.plan.name} ({formatINR(activeQuotation.plan.price)}/{activeQuotation.plan.billingCycle})
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Quantity:</span>
                  <span className="font-mono font-bold text-slate-900 dark:text-white">
                    {activeQuotation.quantity} unit(s)
                  </span>
                </div>

                <div className="flex items-center justify-between pt-1 border-t border-slate-200 dark:border-slate-700">
                  <span className="text-slate-500">Contract Value:</span>
                  <span className="font-mono font-bold text-indigo-600 dark:text-indigo-400">
                    {formatINR(activeQuotation.totalAmount)}
                  </span>
                </div>
              </div>
            )}

            {/* Start Date & Next Billing Date */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300">
                  Start Date <span className="text-rose-500">*</span>
                </label>
                <input
                  type="date"
                  value={startDate}
                  onChange={e => setStartDate(e.target.value)}
                  className="mt-1 w-full px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-mono focus:ring-1 focus:ring-indigo-500"
                  required
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300">
                  Next Billing Date <span className="text-rose-500">*</span>
                </label>
                <input
                  type="date"
                  value={nextBillingDate}
                  onChange={e => setNextBillingDate(e.target.value)}
                  className="mt-1 w-full px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-mono focus:ring-1 focus:ring-indigo-500"
                  required
                />
              </div>
            </div>

            {/* Status notice: only 'active', 'paused', 'closed' */}
            <div className="p-3 rounded-lg bg-indigo-50/60 dark:bg-indigo-950/20 text-slate-600 dark:text-slate-400 text-[11px]">
              Initial status will be set to <strong className="text-indigo-600 font-mono">active</strong> upon backend confirmation.
            </div>

            {/* Actions */}
            <div className="pt-4 flex items-center justify-end gap-2 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-slate-600 dark:text-slate-400 hover:text-slate-900 rounded-lg transition-colors"
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={isSubmitting}
                className="px-4 py-2 font-semibold rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs transition-colors flex items-center gap-1.5"
              >
                <span>{isSubmitting ? 'Provisioning...' : 'Confirm & Create Subscription'}</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
