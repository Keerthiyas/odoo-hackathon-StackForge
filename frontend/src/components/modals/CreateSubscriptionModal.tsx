import React, { useState, useMemo } from 'react';
import { X, Check, DollarSign, Calculator, Users, CreditCard } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { BillingCycle } from '../../types';
import { BrightloopService } from '../../services/api';
import { formatINR } from '../../utils/formatters';

export const CreateSubscriptionModal: React.FC = () => {
  const { 
    isCreateSubOpen, 
    setIsCreateSubOpen, 
    customers, 
    plans, 
    refreshData, 
    addToast 
  } = useApp();

  const [selectedCustomerId, setSelectedCustomerId] = useState<string>(customers[0]?.id || '');
  const [selectedPlanId, setSelectedPlanId] = useState<string>(plans[1]?.id || plans[0]?.id || '');
  const [billingCycle, setBillingCycle] = useState<BillingCycle>('monthly');
  const [seats, setSeats] = useState<number>(10);
  const [discountPercent, setDiscountPercent] = useState<number>(0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const selectedCustomer = customers.find(c => c.id === selectedCustomerId) || customers[0];
  const selectedPlan = plans.find(p => p.id === selectedPlanId) || plans[0];

  // Price calculations
  const basePrice = useMemo(() => {
    if (!selectedPlan) return 0;
    if (billingCycle === 'annual') return selectedPlan.annualPrice;
    if (billingCycle === 'quarterly') return selectedPlan.monthlyPrice * 3;
    return selectedPlan.monthlyPrice;
  }, [selectedPlan, billingCycle]);

  // Additional seat cost if exceeding base seats
  const extraSeats = Math.max(0, seats - (selectedPlan?.maxSeats || 5));
  const extraSeatCost = extraSeats * (billingCycle === 'annual' ? 120 : 15);

  const subtotal = basePrice + extraSeatCost;
  const discountAmount = (subtotal * discountPercent) / 100;
  const finalAmount = Math.max(0, subtotal - discountAmount);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCustomer || !selectedPlan) return;

    setIsSubmitting(true);
    try {
      const today = new Date().toISOString().split('T')[0];
      const endDate = new Date(
        Date.now() + 
        (billingCycle === 'annual' ? 365 : billingCycle === 'quarterly' ? 90 : 30) * 86400000
      ).toISOString().split('T')[0];

      await BrightloopService.createSubscription({
        customerId: selectedCustomer.id,
        customerName: selectedCustomer.name,
        customerCompany: selectedCustomer.company,
        customerEmail: selectedCustomer.email,
        planId: selectedPlan.id,
        planName: selectedPlan.name,
        status: 'active',
        billingCycle,
        amount: Math.round(finalAmount),
        seats: Number(seats),
        currentPeriodStart: today,
        currentPeriodEnd: endDate,
        cancelAtPeriodEnd: false,
        discountPercent: Number(discountPercent),
        paymentMethodSummary: `${selectedCustomer.paymentMethod.brand} ending in ${selectedCustomer.paymentMethod.last4}`,
        autoRenew: true,
      });

      addToast(
        'Subscription Activated',
        `Successfully provisioned ${selectedPlan.name} for ${selectedCustomer.company}.`,
        'success'
      );
      setIsCreateSubOpen(false);
      await refreshData();
    } catch {
      addToast('Error', 'Failed to create subscription.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isCreateSubOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-xl w-full p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-150 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Provision New Subscription
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Select customer, plan tier, billing frequency, and seat quota.
            </p>
          </div>
          <button
            onClick={() => setIsCreateSubOpen(false)}
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          {/* Customer Selection */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
              Customer Account
            </label>
            <select
              value={selectedCustomerId}
              onChange={e => setSelectedCustomerId(e.target.value)}
              className="mt-1 w-full px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-1 focus:ring-indigo-500"
            >
              {customers.map(c => (
                <option key={c.id} value={c.id}>
                  {c.company} ({c.name} - {c.email})
                </option>
              ))}
            </select>
          </div>

          {/* Plan Tier Selection */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
              Product Tier
            </label>
            <div className="grid grid-cols-2 gap-2 mt-1">
              {plans.map(p => (
                <button
                  type="button"
                  key={p.id}
                  onClick={() => setSelectedPlanId(p.id)}
                  className={`p-3 rounded-xl border text-left transition-all ${
                    selectedPlanId === p.id
                      ? 'border-indigo-600 bg-indigo-50/50 dark:bg-indigo-950/30 text-indigo-950 dark:text-indigo-200 ring-1 ring-indigo-500'
                      : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between text-xs font-bold">
                    <span>{p.name}</span>
                    <span className="font-mono text-indigo-600 dark:text-indigo-400">{formatINR(p.monthlyPrice)}/mo</span>
                  </div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                    Up to {p.maxSeats} seats · {(p.maxApiCalls / 1000).toLocaleString()}k calls
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Billing Frequency */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                Billing Cadence
              </label>
              <select
                value={billingCycle}
                onChange={e => setBillingCycle(e.target.value as BillingCycle)}
                className="mt-1 w-full px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-1 focus:ring-indigo-500"
              >
                <option value="monthly">Monthly</option>
                <option value="quarterly">Quarterly</option>
                <option value="annual">Annual (Save 20%)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                Allocated Seats
              </label>
              <input
                type="number"
                min="1"
                max="500"
                value={seats}
                onChange={e => setSeats(Number(e.target.value))}
                className="mt-1 w-full px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-1 focus:ring-indigo-500 font-mono"
              />
            </div>
          </div>

          {/* Discount Field */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
              Promotional Discount (%)
            </label>
            <input
              type="number"
              min="0"
              max="100"
              value={discountPercent}
              onChange={e => setDiscountPercent(Number(e.target.value))}
              placeholder="0"
              className="mt-1 w-full px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-1 focus:ring-indigo-500 font-mono"
            />
          </div>

          {/* Real-time Order Summary */}
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-700 space-y-2 text-xs">
            <div className="flex items-center justify-between text-slate-600 dark:text-slate-400">
              <span>Base Plan ({selectedPlan?.name}):</span>
              <span className="font-mono text-slate-900 dark:text-white">{formatINR(basePrice)}</span>
            </div>
            {extraSeats > 0 && (
              <div className="flex items-center justify-between text-slate-600 dark:text-slate-400">
                <span>Extra Seats ({extraSeats} seats):</span>
                <span className="font-mono text-slate-900 dark:text-white">+{formatINR(extraSeatCost)}</span>
              </div>
            )}
            {discountPercent > 0 && (
              <div className="flex items-center justify-between text-emerald-600 dark:text-emerald-400 font-medium">
                <span>Discount ({discountPercent}%):</span>
                <span className="font-mono">-{formatINR(discountAmount)}</span>
              </div>
            )}
            <div className="pt-2 border-t border-slate-200 dark:border-slate-700 flex items-center justify-between font-bold text-sm text-slate-900 dark:text-white">
              <span>Total Charge Today:</span>
              <span className="font-mono text-indigo-600 dark:text-indigo-400">{formatINR(finalAmount)}</span>
            </div>
          </div>

          {/* Submit / Cancel Actions */}
          <div className="pt-4 flex items-center justify-end gap-2 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={() => setIsCreateSubOpen(false)}
              className="px-4 py-2 text-xs text-slate-600 dark:text-slate-400 hover:text-slate-900 rounded-lg"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 text-xs font-medium rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs transition-colors"
            >
              {isSubmitting ? 'Provisioning...' : 'Activate Subscription'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
