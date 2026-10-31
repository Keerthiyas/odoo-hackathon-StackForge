import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { FileSpreadsheet, X, Loader2, Send, Save } from 'lucide-react';
import { CreateQuotationDTO, Plan, Product, Quotation, UpdateQuotationDTO } from '../../../types';
import { productService } from '../../../api/productService';
import { planService } from '../../../api/planService';
import { usersService } from '../../../api/services';
import { useAuth } from '../../../context/AuthContext';
import { FormInput } from '../../../components/common/FormInput';
import { FormSelect } from '../../../components/common/FormSelect';
import { formatCurrency } from '../../../utils/formatters';

const quotationSchema = z.object({
  customer: z.string().min(1, 'Customer is required'),
  product: z.string().min(1, 'Product is required'),
  plan: z.string().min(1, 'Plan is required'),
  quantity: z.number().min(1, 'Quantity must be at least 1'),
  unitPrice: z.number().min(0, 'Unit price must be at least 0'),
  validUntil: z.string().optional(),
});

type QuotationFormData = z.infer<typeof quotationSchema>;

interface QuotationFormModalProps {
  isOpen: boolean;
  quotation?: Quotation | null; // If editing
  isSubmitting?: boolean;
  onSubmit: (data: CreateQuotationDTO | UpdateQuotationDTO) => Promise<void>;
  onClose: () => void;
}

export const QuotationFormModal: React.FC<QuotationFormModalProps> = ({
  isOpen,
  quotation,
  isSubmitting = false,
  onSubmit,
  onClose,
}) => {
  const { user } = useAuth();
  const isEditMode = !!quotation;

  const [customers, setCustomers] = useState<any[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loadingData, setLoadingData] = useState(false);
  const [submitIntent, setSubmitIntent] = useState<'draft' | 'sent'>('draft');

  // Default validUntil: 30 days from now in YYYY-MM-DD
  const defaultValidUntil = () => {
    const d = new Date();
    d.setDate(d.getDate() + 30);
    return d.toISOString().split('T')[0];
  };

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors },
  } = useForm<QuotationFormData>({
    resolver: zodResolver(quotationSchema),
    defaultValues: {
      customer: '',
      product: '',
      plan: '',
      quantity: 1,
      unitPrice: 0,
      validUntil: defaultValidUntil(),
    },
  });

  const selectedProductId = watch('product');
  const selectedPlanId = watch('plan');
  const quantity = watch('quantity') || 1;
  const unitPrice = watch('unitPrice') || 0;
  const totalAmount = quantity * unitPrice;

  // Load Customers, Products, and Plans when modal opens
  useEffect(() => {
    if (isOpen) {
      setLoadingData(true);
      Promise.all([
        usersService.getCustomers(),
        productService.getProducts({ limit: 100 }),
        planService.getPlans({ limit: 100 }),
      ])
        .then(([custRes, prodRes, planRes]) => {
          setCustomers(custRes);
          setProducts(prodRes.data);
          setPlans(planRes.data);
        })
        .finally(() => {
          setLoadingData(false);
        });
    }
  }, [isOpen]);

  // Sync form values on open / quote prop change
  useEffect(() => {
    if (quotation) {
      const custId =
        typeof quotation.customer === 'object' && quotation.customer !== null
          ? (quotation.customer as any)._id || (quotation.customer as any).id
          : quotation.customer;
      const prodId =
        typeof quotation.product === 'object' && quotation.product !== null
          ? (quotation.product as any)._id
          : quotation.product;
      const plId =
        typeof quotation.plan === 'object' && quotation.plan !== null
          ? (quotation.plan as any)._id
          : quotation.plan;

      const dateStr = quotation.validUntil
        ? quotation.validUntil.split('T')[0]
        : defaultValidUntil();

      reset({
        customer: custId || '',
        product: prodId || '',
        plan: plId || '',
        quantity: quotation.quantity || 1,
        unitPrice: quotation.unitPrice || 0,
        validUntil: dateStr,
      });
    } else {
      reset({
        customer: '',
        product: '',
        plan: '',
        quantity: 1,
        unitPrice: 0,
        validUntil: defaultValidUntil(),
      });
    }
  }, [quotation, reset, isOpen]);

  // When selected product changes, filter available plans
  const availablePlans = plans.filter((pl) => {
    if (!selectedProductId) return true;
    const plProdId = typeof pl.product === 'string' ? pl.product : pl.product._id;
    return plProdId === selectedProductId;
  });

  // When selectedPlanId changes, update unitPrice automatically from plan price
  useEffect(() => {
    if (selectedPlanId) {
      const matchedPlan = plans.find((p) => p._id === selectedPlanId);
      if (matchedPlan) {
        setValue('unitPrice', matchedPlan.price, { shouldValidate: true });
      }
    }
  }, [selectedPlanId, plans, setValue]);

  // If selected product changes and current plan doesn't belong to it, reset plan
  useEffect(() => {
    if (selectedProductId && selectedPlanId) {
      const matched = availablePlans.some((p) => p._id === selectedPlanId);
      if (!matched) {
        setValue('plan', '');
        setValue('unitPrice', 0);
      }
    }
  }, [selectedProductId, selectedPlanId, availablePlans, setValue]);

  if (!isOpen) return null;

  const onFormSubmit = async (data: QuotationFormData) => {
    const creatorId = user?._id || user?.id || 'usr_admin_01';
    const payload: CreateQuotationDTO | UpdateQuotationDTO = {
      customer: data.customer,
      product: data.product,
      plan: data.plan,
      quantity: Number(data.quantity),
      unitPrice: Number(data.unitPrice),
      totalAmount: Number(data.quantity) * Number(data.unitPrice),
      status: submitIntent,
      validUntil: data.validUntil ? new Date(data.validUntil).toISOString() : undefined,
      ...(isEditMode ? {} : { createdBy: creatorId }),
    };

    await onSubmit(payload);
  };

  const customerOptions = customers.map((c) => ({
    value: c.id || c._id || '',
    label: `${c.name} (${c.company || c.companyName || c.email})`,
  }));

  const productOptions = products.map((p) => ({
    value: p._id,
    label: `${p.name} ($${p.basePrice} base)`,
  }));

  const planOptions = availablePlans.map((pl) => ({
    value: pl._id,
    label: `${pl.name} - $${pl.price} (${pl.billingCycle})`,
  }));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl shadow-xl border border-slate-200 max-w-xl w-full p-6 animate-in zoom-in-95 duration-150 max-h-[94vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <FileSpreadsheet className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                {isEditMode ? 'Edit Quotation' : 'Create New Quotation'}
              </h3>
              <p className="text-[11px] text-slate-500">
                Follows exact MongoDB Quotation schema: customer, product, plan, quantity, unit price & snapshot total
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

        {/* Form */}
        <form onSubmit={handleSubmit(onFormSubmit)} className="mt-4 space-y-4" noValidate>
          {/* Customer Selection */}
          <FormSelect
            label="Customer"
            required
            placeholder={loadingData ? 'Loading customer accounts...' : 'Select a customer...'}
            options={customerOptions}
            error={errors.customer?.message}
            helperText="Populated from Users API. Submits the customer ObjectId."
            {...register('customer')}
          />

          {/* Product Selection */}
          <FormSelect
            label="Product"
            required
            placeholder={loadingData ? 'Loading products...' : 'Select a software product...'}
            options={productOptions}
            error={errors.product?.message}
            helperText="Populated from Products API. Displays active catalog products."
            {...register('product')}
          />

          {/* Plan Selection (Dynamic) */}
          <FormSelect
            label="Plan"
            required
            placeholder={
              !selectedProductId
                ? 'Select a product first to view available plans'
                : availablePlans.length === 0
                ? 'No plans configured for this product'
                : 'Select a plan...'
            }
            options={planOptions}
            error={errors.plan?.message}
            disabled={!selectedProductId || availablePlans.length === 0}
            helperText="Populated based on selected product. Automatically updates unit price."
            {...register('plan')}
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Quantity */}
            <FormInput
              label="Quantity"
              type="number"
              min="1"
              required
              placeholder="1"
              error={errors.quantity?.message}
              helperText="Minimum 1 seat or license."
              {...register('quantity', { valueAsNumber: true })}
            />

            {/* Unit Price */}
            <FormInput
              label="Unit Price"
              type="number"
              step="0.01"
              min="0"
              required
              prefixText="$"
              placeholder="0.00"
              error={errors.unitPrice?.message}
              helperText="Populated from plan price. Editable if custom rate agreed."
              {...register('unitPrice', { valueAsNumber: true })}
            />
          </div>

          {/* Total Amount Snapshot Display */}
          <div className="p-3.5 bg-blue-50/70 border border-blue-200/80 rounded-xl flex items-center justify-between">
            <div>
              <span className="text-[11px] font-semibold text-blue-900 block">
                Total Amount (Stored Snapshot)
              </span>
              <span className="text-[11px] text-blue-700">
                Formula: {quantity} seat{quantity > 1 ? 's' : ''} × {formatCurrency(unitPrice)}
              </span>
            </div>
            <div className="text-right">
              <span className="text-lg font-bold text-blue-950 font-mono tabular-nums">
                {formatCurrency(totalAmount)}
              </span>
              <span className="text-[10px] text-blue-600 font-mono block">USD / cadence</span>
            </div>
          </div>

          {/* Valid Until Date Picker */}
          <FormInput
            label="Valid Until (Optional)"
            type="date"
            placeholder="YYYY-MM-DD"
            error={errors.validUntil?.message}
            helperText="Quotation expiry date. Defaults to 30 days from creation."
            {...register('validUntil')}
          />

          {/* Action Buttons */}
          <div className="pt-4 flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-2.5 border-t border-slate-100">
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
              onClick={() => setSubmitIntent('draft')}
              disabled={isSubmitting}
              className="px-4 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors flex items-center justify-center gap-1.5 disabled:opacity-50"
            >
              {isSubmitting && submitIntent === 'draft' ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Save className="w-3.5 h-3.5" />
              )}
              <span>{isEditMode ? 'Update Draft' : 'Save as Draft'}</span>
            </button>

            <button
              type="submit"
              onClick={() => setSubmitIntent('sent')}
              disabled={isSubmitting}
              className="px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-xs transition-colors flex items-center justify-center gap-1.5 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:ring-offset-1 disabled:opacity-50"
            >
              {isSubmitting && submitIntent === 'sent' ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Send className="w-3.5 h-3.5" />
              )}
              <span>{isEditMode ? 'Save & Send' : 'Send Quotation'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
