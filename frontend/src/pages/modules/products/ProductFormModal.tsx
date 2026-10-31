import React, { useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Package, X, Loader2 } from 'lucide-react';
import { CreateProductDTO, Product, UpdateProductDTO } from '../../../types';
import { FormInput } from '../../../components/common/FormInput';
import { FormTextarea } from '../../../components/common/FormTextarea';
import { ToggleSwitch } from '../../../components/common/ToggleSwitch';

const productSchema = z.object({
  name: z
    .string()
    .min(1, 'Product Name is required')
    .refine((val) => val.trim().length > 0, 'Product Name cannot be empty'),
  description: z.string().optional(),
  basePrice: z
    .number()
    .min(0, 'Base Price must be greater than or equal to 0'),
  isActive: z.boolean(),
});

type ProductFormData = z.infer<typeof productSchema>;

interface ProductFormModalProps {
  isOpen: boolean;
  product?: Product | null; // If provided, edit mode
  isSubmitting?: boolean;
  onSubmit: (data: CreateProductDTO | UpdateProductDTO) => Promise<void>;
  onClose: () => void;
}

export const ProductFormModal: React.FC<ProductFormModalProps> = ({
  isOpen,
  product,
  isSubmitting = false,
  onSubmit,
  onClose,
}) => {
  const isEditMode = !!product;

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors },
  } = useForm<ProductFormData>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      name: '',
      description: '',
      basePrice: 0,
      isActive: true,
    },
  });

  useEffect(() => {
    if (product) {
      reset({
        name: product.name,
        description: product.description || '',
        basePrice: product.basePrice,
        isActive: product.isActive,
      });
    } else {
      reset({
        name: '',
        description: '',
        basePrice: 0,
        isActive: true,
      });
    }
  }, [product, reset, isOpen]);

  if (!isOpen) return null;

  const onFormSubmit = async (data: ProductFormData) => {
    await onSubmit({
      name: data.name.trim(),
      description: data.description?.trim() || undefined,
      basePrice: Number(data.basePrice),
      isActive: data.isActive,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl shadow-xl border border-slate-200 max-w-lg w-full p-6 animate-in zoom-in-95 duration-150 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <Package className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                {isEditMode ? 'Edit Product' : 'Add New Product'}
              </h3>
              <p className="text-[11px] text-slate-500">
                {isEditMode
                  ? 'Update database fields for this software product'
                  : 'Register a new catalog product matching Mongoose schema'}
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
          {/* Product Name */}
          <FormInput
            label="Product Name"
            required
            placeholder="e.g. Cloud Intelligence Suite"
            error={errors.name?.message}
            {...register('name')}
          />

          {/* Description */}
          <FormTextarea
            label="Description"
            rows={3}
            placeholder="Detailed description of software capability, features, or target systems..."
            error={errors.description?.message}
            helperText="Optional descriptive summary of the product catalog entry."
            {...register('description')}
          />

          {/* Base Price */}
          <FormInput
            label="Base Price"
            type="number"
            step="0.01"
            min="0"
            required
            prefixText="$"
            placeholder="0.00"
            error={errors.basePrice?.message}
            helperText="Minimum price standard (0 or higher, negative values rejected)."
            {...register('basePrice', { valueAsNumber: true })}
          />

          {/* Active Status Switch */}
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
            <Controller
              name="isActive"
              control={control}
              render={({ field }) => (
                <ToggleSwitch
                  label="Active Status"
                  description="When enabled, plans under this product can be subscribed to."
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
              <span>{isEditMode ? 'Save Changes' : 'Save Product'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
