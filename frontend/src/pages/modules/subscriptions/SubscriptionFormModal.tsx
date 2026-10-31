import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Repeat, X, Loader2, AlertCircle } from 'lucide-react';
import { CreateSubscriptionDTO, Quotation } from '../../../types';
import { quotationService } from '../../../api/quotationService';
import { formatCurrency } from '../../../utils/formatters';
import { FormInput } from '../../../components/common/FormInput';
import { FormSelect } from '../../../components/common/FormSelect';

const subscriptionSchema = z.object({
  quotation: z.string().min(1, 'Source accepted quotation is required'),
  startDate: z.string().min(1, 'Start date is required'),
  nextBillingDate: z.string().min(1, 'Next billing date is required'),
});

type SubscriptionFormData = z.infer<typeof subscriptionSchema>;

interface SubscriptionFormModalProps {
  isOpen: boolean;
  preselectedQuotationId?: string | null;
  isSubmitting?: boolean;
  onSubmit: (dto: CreateSubscriptionDTO) => Promise<void>;
  onClose: () => void;
}

export const SubscriptionFormModal: React.FC<SubscriptionFormModalProps> = ({
  isOpen,
  preselectedQuotationId,
  isSubmitting = false,
  onSubmit,
  onClose,
}) => {
  const [acceptedQuotations, setAcceptedQuotations] = useState<Quotation[]>([]);
  const [loadingQuotations, setLoadingQuotations] = useState(false);
  const [activeQuotation, setActiveQuotation] = useState<Quotation | null>(null);

  const getTodayISO = () => new Date().toISOString().split('T')[0];

  const calculateNextBilling = (start: string, cycle: 'monthly' | 'yearly' = 'monthly') => {
    const d = new Date(start || new Date());
    if (cycle === 'yearly') {
      d.setFullYear(d.getFullYear() + 1);
    } else {
      d.setMonth(d.getMonth() + 1);
    }
    return d.toISOString().split('T')[0];
  };

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<SubscriptionFormData>({
    resolver: zodResolver(subscriptionSchema),
    defaultValues: {
      quotation: '',
      startDate: getTodayISO(),
      nextBillingDate: calculateNextBilling(getTodayISO(), 'monthly'),
    },
  });

  const selectedQuoteId = watch('quotation');
  const startDate = watch('startDate');

  // Load accepted quotations when modal opens
  useEffect(() => {
    if (isOpen) {
      setLoadingQuotations(true);
      quotationService
        .getQuotations({ status: 'accepted', limit: 50 })
        .then((res) => {
          setAcceptedQuotations(res.data);
          const firstId = res.data[0] ? res.data[0]._id || res.data[0].id : '';
          const targetId = preselectedQuotationId || firstId || '';
          if (targetId) {
            setValue('quotation', targetId);
          }
        })
        .finally(() => {
          setLoadingQuotations(false);
        });
    }
  }, [isOpen, preselectedQuotationId, setValue]);

  // Synchronize active quotation details when selectedQuoteId changes
  useEffect(() => {
    if (selectedQuoteId) {
      const match = acceptedQuotations.find((q) => q._id === selectedQuoteId || q.id === selectedQuoteId);
      if (match) {
        setActiveQuotation(match);
        const cycle =
          typeof match.plan === 'object' && match.plan !== null && 'billingCycle' in match.plan
            ? (match.plan as any).billingCycle
            : 'monthly';
        setValue('nextBillingDate', calculateNextBilling(startDate, cycle));
      }
    }
  }, [selectedQuoteId, acceptedQuotations, startDate, setValue]);

  // Recalculate nextBillingDate when startDate changes
  useEffect(() => {
    if (activeQuotation) {
      const cycle =
        typeof activeQuotation.plan === 'object' && activeQuotation.plan !== null && 'billingCycle' in activeQuotation.plan
          ? (activeQuotation.plan as any).billingCycle
          : 'monthly';
      setValue('nextBillingDate', calculateNextBilling(startDate, cycle));
    }
  }, [startDate, activeQuotation, setValue]);

  if (!isOpen) return null;

  const onFormSubmit = async (data: SubscriptionFormData) => {
    if (!activeQuotation) return;

    const customerId =
      typeof activeQuotation.customer === 'object' && activeQuotation.customer !== null
        ? (activeQuotation.customer as any)._id || (activeQuotation.customer as any).id
        : activeQuotation.customer || '';

    const productId =
      typeof activeQuotation.product === 'object' && activeQuotation.product !== null
        ? (activeQuotation.product as any)._id
        : activeQuotation.product || '';

    const planId =
      typeof activeQuotation.plan === 'object' && activeQuotation.plan !== null
        ? (activeQuotation.plan as any)._id
        : activeQuotation.plan || '';

    const payload: CreateSubscriptionDTO = {
      customer: customerId,
      product: productId,
      plan: planId,
      quotation: data.quotation,
      quantity: activeQuotation.quantity || 1,
      startDate: new Date(data.startDate).toISOString(),
      nextBillingDate: new Date(data.nextBillingDate).toISOString(),
      status: 'active',
    };

    await onSubmit(payload);
  };

  const quotationOptions = acceptedQuotations.map((q) => {
    const custName =
      typeof q.customer === 'object' && q.customer !== null && 'name' in q.customer
        ? (q.customer as any).name
        : 'Customer';
    const prodName =
      typeof q.product === 'object' && q.product !== null && 'name' in q.product
        ? (q.product as any).name
        : 'Product';
    const idVal = q._id || q.id || '';
    return {
      value: idVal,
      label: `${q.quotationNumber || idVal} - ${custName} (${prodName}, ${formatCurrency(q.totalAmount)})`,
    };
  });

  const customerName =
    activeQuotation && typeof activeQuotation.customer === 'object' && activeQuotation.customer !== null
      ? (activeQuotation.customer as any).name
      : 'Select a quotation';

  const productName =
    activeQuotation && typeof activeQuotation.product === 'object' && activeQuotation.product !== null
      ? (activeQuotation.product as any).name
      : '';

  const planName =
    activeQuotation && typeof activeQuotation.plan === 'object' && activeQuotation.plan !== null
      ? (activeQuotation.plan as any).name
      : '';

  const planCycle =
    activeQuotation && typeof activeQuotation.plan === 'object' && activeQuotation.plan !== null
      ? (activeQuotation.plan as any).billingCycle
      : 'monthly';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl shadow-xl border border-slate-200 max-w-lg w-full p-6 animate-in zoom-in-95 duration-150 max-h-[94vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Repeat className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">Activate New Subscription</h3>
              <p className="text-[11px] text-slate-500">
                Converts an approved quotation into an active recurring subscription
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="p-1 text-slate-400 hover:text-slate-600 rounded-lg transition-colors"
            aria-label="Close modal"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {acceptedQuotations.length === 0 && !loadingQuotations ? (
          <div className="py-8 text-center space-y-3">
            <AlertCircle className="w-10 h-10 text-amber-500 mx-auto" />
            <h4 className="text-sm font-semibold text-slate-900">No Accepted Quotations Available</h4>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Subscriptions must reference an accepted quotation per database schema.
              Please go to the Quotations tab, create or send a quote, and mark it as accepted.
            </p>
            <div className="pt-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit(onFormSubmit)} className="mt-4 space-y-4" noValidate>
            {/* Source Quotation Selection */}
            <FormSelect
              label="Source Accepted Quotation"
              required
              placeholder={loadingQuotations ? 'Loading approved quotes...' : 'Choose an accepted quotation...'}
              options={quotationOptions}
              error={errors.quotation?.message}
              helperText="Only quotations with status 'accepted' are eligible for subscription activation."
              {...register('quotation')}
            />

            {/* Populated Quotation Summary Card */}
            {activeQuotation && (
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200/80 space-y-2.5">
                <div className="flex items-center justify-between border-b border-slate-200/60 pb-2">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                    Pre-Populated Quotation Snapshot
                  </span>
                  <span className="text-[11px] font-mono font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                    Status: Accepted
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-slate-400 block text-[10px]">Subscriber / Customer</span>
                    <span className="font-semibold text-slate-900">{customerName}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">Product & Plan</span>
                    <span className="font-semibold text-slate-900">{productName}</span>
                    <span className="text-slate-500 text-[11px] block">{planName}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">Billing Cadence</span>
                    <span className="font-medium text-slate-700 capitalize">{planCycle}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">Quantity & Snapshot Value</span>
                    <span className="font-mono font-bold text-slate-900 tabular-nums">
                      {activeQuotation.quantity} seat{activeQuotation.quantity > 1 ? 's' : ''} ({formatCurrency(activeQuotation.totalAmount)})
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Dates Configuration */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <FormInput
                label="Subscription Start Date"
                type="date"
                required
                error={errors.startDate?.message}
                helperText="Effective start date of contract."
                {...register('startDate')}
              />

              <FormInput
                label="Next Billing Date"
                type="date"
                required
                error={errors.nextBillingDate?.message}
                helperText={`Auto-computed based on ${planCycle} plan cadence.`}
                {...register('nextBillingDate')}
              />
            </div>

            {/* Actions */}
            <div className="pt-4 flex items-center justify-end gap-2.5 border-t border-slate-100">
              <button
                type="button"
                onClick={onClose}
                disabled={isSubmitting}
                className="px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-100 rounded-lg transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting || !activeQuotation}
                className="px-5 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-xs transition-colors flex items-center gap-1.5 focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:ring-offset-1 disabled:opacity-50"
              >
                {isSubmitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                <span>Activate Subscription</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
