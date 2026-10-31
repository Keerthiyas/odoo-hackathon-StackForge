import React, { useState, useEffect } from 'react';
import { X, Layers, Save, Check } from 'lucide-react';
import { PlanModel, Product } from '../../types';
import { planService } from '../../services/planService';
import { productService } from '../../services/productService';

interface CreatePlanModalProps {
  isOpen: boolean;
  onClose: () => void;
  planToEdit?: PlanModel | null;
  onSaved: () => void;
  addToast: (title: string, message: string, type?: 'success' | 'warning' | 'info' | 'error') => void;
}

export const CreatePlanModal: React.FC<CreatePlanModalProps> = ({
  isOpen,
  onClose,
  planToEdit,
  onSaved,
  addToast,
}) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loadingProducts, setLoadingProducts] = useState<boolean>(true);

  // Form states
  const [productId, setProductId] = useState('');
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [price, setPrice] = useState<number>(0);
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'quarterly' | 'annual'>('monthly');
  const [allowPause, setAllowPause] = useState(true);
  const [allowEarlyClose, setAllowEarlyClose] = useState(true);
  const [allowRenewal, setAllowRenewal] = useState(true);
  const [featuresStr, setFeaturesStr] = useState('');
  const [status, setStatus] = useState<'active' | 'inactive'>('active');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadProducts();
    }
  }, [isOpen]);

  const loadProducts = async () => {
    setLoadingProducts(true);
    try {
      const prods = await productService.getProducts({ status: 'active' });
      setProducts(prods);
      if (!planToEdit && prods.length > 0 && !productId) {
        setProductId(prods[0]._id);
      }
    } catch {
      // fallback
    } finally {
      setLoadingProducts(false);
    }
  };

  useEffect(() => {
    if (planToEdit) {
      setProductId(planToEdit.product);
      setName(planToEdit.name);
      setCode(planToEdit.code);
      setPrice(planToEdit.price);
      setBillingCycle(planToEdit.billingCycle);
      setAllowPause(planToEdit.allowPause ?? true);
      setAllowEarlyClose(planToEdit.allowEarlyClose ?? true);
      setAllowRenewal(planToEdit.allowRenewal ?? true);
      setFeaturesStr(planToEdit.features?.join(', ') || '');
      setStatus(planToEdit.status);
    } else {
      setName('');
      setCode('');
      setPrice(99);
      setBillingCycle('monthly');
      setAllowPause(true);
      setAllowEarlyClose(true);
      setAllowRenewal(true);
      setFeaturesStr('Standard API Access, 5 Team Seats, 99.9% SLA');
      setStatus('active');
    }
  }, [planToEdit, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !code.trim() || !productId) {
      addToast('Validation Error', 'Product, plan name, and code are required.', 'warning');
      return;
    }

    setIsSubmitting(true);
    const featuresList = featuresStr
      .split(',')
      .map(s => s.trim())
      .filter(Boolean);

    try {
      if (planToEdit) {
        await planService.updatePlan(planToEdit._id, {
          name,
          code,
          product: productId,
          price: Number(price),
          billingCycle,
          allowPause,
          allowEarlyClose,
          allowRenewal,
          features: featuresList,
          status,
        });
        addToast('Plan Updated', `Plan ${name} configurations saved.`, 'success');
      } else {
        await planService.createPlan({
          name,
          code,
          product: productId,
          price: Number(price),
          billingCycle,
          allowPause,
          allowEarlyClose,
          allowRenewal,
          features: featuresList,
          status,
        });
        addToast('Plan Created', `New plan ${name} added to catalog.`, 'success');
      }
      onSaved();
      onClose();
    } catch (err: any) {
      addToast('Error', err.message || 'Could not save plan.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-150 my-8">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <Layers className="w-5 h-5 text-indigo-600" />
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              {planToEdit ? 'Edit Pricing Plan' : 'Create New Pricing Plan'}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4 text-xs">
          {/* Associated Product */}
          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300">
              Associated Product *
            </label>
            <select
              value={productId}
              onChange={e => setProductId(e.target.value)}
              className="mt-1 w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-1 focus:ring-indigo-500"
              required
            >
              {products.map(p => (
                <option key={p._id} value={p._id}>
                  {p.name} ({p.code})
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300">
                Plan Name *
              </label>
              <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="e.g. Enterprise Tier"
                className="mt-1 w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-1 focus:ring-indigo-500"
                required
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300">
                Plan Code / Slug *
              </label>
              <input
                type="text"
                value={code}
                onChange={e => setCode(e.target.value.toUpperCase())}
                placeholder="e.g. SF-ENT-M"
                className="mt-1 w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-1 focus:ring-indigo-500 font-mono uppercase"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300">
                Price (₹ INR) *
              </label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={price}
                onChange={e => setPrice(Number(e.target.value))}
                className="mt-1 w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-1 focus:ring-indigo-500 font-mono"
                required
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300">
                Billing Cycle *
              </label>
              <select
                value={billingCycle}
                onChange={e => setBillingCycle(e.target.value as any)}
                className="mt-1 w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-1 focus:ring-indigo-500"
              >
                <option value="monthly">Monthly</option>
                <option value="quarterly">Quarterly</option>
                <option value="annual">Annual</option>
              </select>
            </div>
          </div>

          {/* Phase 3 Lifecycle Entitlement Rules */}
          <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 space-y-2">
            <span className="font-semibold text-slate-800 dark:text-slate-200 block text-[11px] uppercase tracking-wider">
              Lifecycle Policies
            </span>

            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={allowPause}
                onChange={e => setAllowPause(e.target.checked)}
                className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300 dark:border-slate-700"
              />
              <span className="text-slate-700 dark:text-slate-300">
                Allow Pause (permits customers to temporarily pause billing)
              </span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={allowEarlyClose}
                onChange={e => setAllowEarlyClose(e.target.checked)}
                className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300 dark:border-slate-700"
              />
              <span className="text-slate-700 dark:text-slate-300">
                Allow Early Close (permits terminating before next billing date)
              </span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={allowRenewal}
                onChange={e => setAllowRenewal(e.target.checked)}
                className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300 dark:border-slate-700"
              />
              <span className="text-slate-700 dark:text-slate-300">
                Allow Auto-Renewal
              </span>
            </label>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300">
              Features (Comma separated)
            </label>
            <input
              type="text"
              value={featuresStr}
              onChange={e => setFeaturesStr(e.target.value)}
              placeholder="Unlimited Seats, Priority Support, Custom SLAs"
              className="mt-1 w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-1 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300">
              Status
            </label>
            <div className="mt-1 flex items-center gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="status"
                  value="active"
                  checked={status === 'active'}
                  onChange={() => setStatus('active')}
                  className="text-indigo-600 focus:ring-indigo-500"
                />
                <span className="text-slate-700 dark:text-slate-300">Active</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="status"
                  value="inactive"
                  checked={status === 'inactive'}
                  onChange={() => setStatus('inactive')}
                  className="text-indigo-600 focus:ring-indigo-500"
                />
                <span className="text-slate-700 dark:text-slate-300">Inactive</span>
              </label>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-semibold shadow-xs disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>{planToEdit ? 'Save Changes' : 'Create Plan'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
