import React, { useEffect, useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Layers, X, Loader2 } from 'lucide-react';
import { CreatePlanDTO, Plan, PlanBillingCycle, Product, UpdatePlanDTO } from '../../../types';
import { productService } from '../../../api/productService';
import { FormInput } from '../../../components/common/FormInput';
import { FormSelect } from '../../../components/common/FormSelect';
import { ToggleSwitch } from '../../../components/common/ToggleSwitch';

const planSchema = z.object({
  product: z.string().min(1, 'Associated Product is required'),
  name: z
    .string()
    .min(1, 'Plan Name is required')
    .refine((val) => val.trim().length > 0, 'Plan Name cannot be empty'),
  billingCycle: z.enum(['monthly', 'yearly'] as const),
  price: z
    .number()
    .min(0, 'Price must be greater than or equal to 0'),
  allowPause: z.boolean(),
  allowRenewal: z.boolean(),
  allowEarlyClose: z.boolean(),
  isActive: z.boolean(),
});

type PlanFormData = z.infer<typeof planSchema>;

interface PlanFormModalProps {
  isOpen: boolean;
  plan?: Plan | null; // If provided, edit mode
  isSubmitting?: boolean;
  onSubmit: (data: CreatePlanDTO | UpdatePlanDTO) => Promise<void>;
  onClose: () => void;
}

export const PlanFormModal: React.FC<PlanFormModalProps> = ({
  isOpen,
  plan,
  isSubmitting = false,
  onSubmit,
  onClose,
}) => {
  const isEditMode = !!plan;
  const [products, setProducts] = useState<Product[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(false);

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors },
  } = useForm<PlanFormData>({
    resolver: zodResolver(planSchema),
    defaultValues: {
      product: '',
      name: '',
      billingCycle: 'monthly',
      price: 0,
      allowPause: false,
      allowRenewal: true,
      allowEarlyClose: false,
      isActive: true,
    },
  });

  // Load available products for the dropdown from backend
  useEffect(() => {
    if (isOpen) {
      setLoadingProducts(true);
      productService
        .getProducts({ limit: 100 })
        .then((res) => {
          setProducts(res.data);
        })
        .finally(() => {
          setLoadingProducts(false);
        });
    }
  }, [isOpen]);

  // Sync form values when plan changes or modal opens
  useEffect(() => {
    if (plan) {
      const productId = typeof plan.product === 'string' ? plan.product : plan.product._id;
      reset({
        product: productId,
        name: plan.name,
        billingCycle: plan.billingCycle,
        price: plan.price,
        allowPause: plan.allowPause,
        allowRenewal: plan.allowRenewal,
        allowEarlyClose: plan.allowEarlyClose,
        isActive: plan.isActive,
      });
    } else {
      reset({
        product: '',
        name: '',
        billingCycle: 'monthly',
        price: 0,
        allowPause: false,
        allowRenewal: true,
        allowEarlyClose: false,
        isActive: true,
      });
    }
  }, [plan, reset, isOpen]);

  if (!isOpen) return null;

  const onFormSubmit = async (data: PlanFormData) => {
    await onSubmit({
      product: data.product,
      name: data.name.trim(),
      billingCycle: data.billingCycle as PlanBillingCycle,
      price: Number(data.price),
      allowPause: data.allowPause,
      allowRenewal: data.allowRenewal,
      allowEarlyClose: data.allowEarlyClose,
      isActive: data.isActive,
    });
  };

  const productOptions = products.map((prod) => ({
    value: prod._id,
    label: `${prod.name} ($${prod.basePrice} base)`,
  }));

  const billingCycleOptions = [
    { value: 'monthly', label: 'Monthly' },
    { value: 'yearly', label: 'Yearly' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl shadow-xl border border-slate-200 max-w-lg w-full p-6 animate-in zoom-in-95 duration-150 max-h-[92vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <Layers className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                {isEditMode ? 'Edit Plan' : 'Create New Plan'}
              </h3>
              <p className="text-[11px] text-slate-500">
                {isEditMode
                  ? 'Update plan parameters and lifecycle policies'
                  : 'Configure billing cadence, pricing and policies for a product'}
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
          {/* Associated Product Dropdown */}
          <FormSelect
            label="Associated Product"
            required
            placeholder={loadingProducts ? 'Loading catalog products...' : 'Select a software product...'}
            options={productOptions}
            error={errors.product?.message}
            helperText="Submit the selected product ObjectId referencing the Products collection."
            {...register('product')}
          />

          {/* Plan Name */}
          <FormInput
            label="Plan Name"
            required
            placeholder="e.g. Starter Cloud Tier"
            error={errors.name?.message}
            {...register('name')}
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Billing Cycle */}
            <FormSelect
              label="Billing Cycle"
              required
              options={billingCycleOptions}
              error={errors.billingCycle?.message}
              helperText="Restricted to monthly or yearly per Mongoose schema."
              {...register('billingCycle')}
            />

            {/* Price */}
            <FormInput
              label="Price"
              type="number"
              step="0.01"
              min="0"
              required
              prefixText="$"
              placeholder="0.00"
              error={errors.price?.message}
              helperText="Minimum 0. No negative values."
              {...register('price', { valueAsNumber: true })}
            />
          </div>

          {/* Policy Toggles Box */}
          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-100 space-y-3">
            <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block border-b border-slate-200/60 pb-1.5">
              Lifecycle Policies
            </span>

            {/* Allow Pause */}
            <Controller
              name="allowPause"
              control={control}
              render={({ field }) => (
                <ToggleSwitch
                  label="Allow Pause"
                  description="Subscribers can temporarily freeze recurring billing."
                  checked={field.value}
                  onChange={field.onChange}
                />
              )}
            />

            {/* Allow Renewal */}
            <Controller
              name="allowRenewal"
              control={control}
              render={({ field }) => (
                <ToggleSwitch
                  label="Allow Renewal"
                  description="Subscription automatically renews at period end."
                  checked={field.value}
                  onChange={field.onChange}
                />
              )}
            />

            {/* Allow Early Close */}
            <Controller
              name="allowEarlyClose"
              control={control}
              render={({ field }) => (
                <ToggleSwitch
                  label="Allow Early Close"
                  description="Subscribers can terminate contract before scheduled term expiration."
                  checked={field.value}
                  onChange={field.onChange}
                />
              )}
            />

            {/* Active Status */}
            <Controller
              name="isActive"
              control={control}
              render={({ field }) => (
                <ToggleSwitch
                  label="Plan Active Status"
                  description="Enable or disable this plan for new subscriber purchases."
                  checked={field.value}
                  onChange={field.onChange}
                />
              )}
            />
          </div>

          {/* Action Buttons */}
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
              disabled={isSubmitting}
              className="px-5 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-xs transition-colors flex items-center gap-1.5 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:ring-offset-1 disabled:opacity-50"
            >
              {isSubmitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              <span>{isEditMode ? 'Save Changes' : 'Save Plan'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
