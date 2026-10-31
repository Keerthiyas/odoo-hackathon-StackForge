import React, { useState, useEffect, useMemo } from 'react';
import { X, Send, Save, AlertCircle, Building2, Layers, Package, User } from 'lucide-react';
import { quotationService } from '../../services/quotationService';
import { Product, PlanModel, UserModel, Quotation, PopulatedQuotation } from '../../types';
import { formatINR } from '../../utils/formatters';

interface CreateQuotationModalProps {
  isOpen: boolean;
  onClose: () => void;
  quotationToEdit?: PopulatedQuotation | Quotation | null;
  onSaved: () => void;
  addToast: (title: string, message: string, type?: 'success' | 'warning' | 'info' | 'error') => void;
}

export const CreateQuotationModal: React.FC<CreateQuotationModalProps> = ({
  isOpen,
  onClose,
  quotationToEdit,
  onSaved,
  addToast,
}) => {
  const [users, setUsers] = useState<UserModel[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [plans, setPlans] = useState<PlanModel[]>([]);
  const [currentUser, setCurrentUser] = useState<UserModel | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  // Form Fields strictly following MongoDB schema:
  // customer: ObjectId
  // product: ObjectId
  // plan: ObjectId
  // quantity: Number (>= 1)
  // unitPrice: Number
  // validUntil: Date (optional)
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('');
  const [selectedProductId, setSelectedProductId] = useState<string>('');
  const [selectedPlanId, setSelectedPlanId] = useState<string>('');
  const [quantity, setQuantity] = useState<number>(1);
  const [validUntil, setValidUntil] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Load master data
  useEffect(() => {
    if (!isOpen) return;

    const loadData = async () => {
      setLoading(true);
      try {
        const [loadedUsers, loadedProducts, loadedPlans, staffUser] = await Promise.all([
          quotationService.getUsers(),
          quotationService.getProducts(),
          quotationService.getPlans(),
          quotationService.getCurrentUser(),
        ]);

        const customerUsers = loadedUsers.filter(u => u.role === 'customer');
        setUsers(customerUsers);
        setProducts(loadedProducts.filter(p => p.status === 'active'));
        setPlans(loadedPlans.filter(p => p.status === 'active'));
        setCurrentUser(staffUser);

        if (quotationToEdit) {
          const custId = typeof quotationToEdit.customer === 'object' && quotationToEdit.customer ? (quotationToEdit.customer as any)._id : quotationToEdit.customer;
          const prodId = typeof quotationToEdit.product === 'object' && quotationToEdit.product ? (quotationToEdit.product as any)._id : quotationToEdit.product;
          const planId = typeof quotationToEdit.plan === 'object' && quotationToEdit.plan ? (quotationToEdit.plan as any)._id : quotationToEdit.plan;

          setSelectedCustomerId(custId);
          setSelectedProductId(prodId);
          setSelectedPlanId(planId);
          setQuantity(quotationToEdit.quantity || 1);
          setValidUntil(quotationToEdit.validUntil ? quotationToEdit.validUntil.split('T')[0] : '');
        } else {
          // Defaults for new quotation
          if (customerUsers.length > 0) setSelectedCustomerId(customerUsers[0]._id);
          if (loadedProducts.length > 0) {
            const firstProd = loadedProducts[0];
            setSelectedProductId(firstProd._id);
            const matchingPlans = loadedPlans.filter(p => p.product === firstProd._id);
            if (matchingPlans.length > 0) setSelectedPlanId(matchingPlans[0]._id);
          }
          // Default validUntil: 30 days from now
          const defaultExpiry = new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0];
          setValidUntil(defaultExpiry);
        }
      } catch (err) {
        console.error('Failed to load quotation form dependencies:', err);
        addToast('Load Error', 'Could not load products or customer list.', 'error');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [isOpen, quotationToEdit, addToast]);

  // When product changes, filter associated plans and update selected plan
  const associatedPlans = useMemo(() => {
    if (!selectedProductId) return [];
    return plans.filter(p => p.product === selectedProductId);
  }, [plans, selectedProductId]);

  const handleProductChange = (newProductId: string) => {
    setSelectedProductId(newProductId);
    const available = plans.filter(p => p.product === newProductId);
    if (available.length > 0) {
      setSelectedPlanId(available[0]._id);
    } else {
      setSelectedPlanId('');
    }
  };

  // Derive unit price from the selected plan (authoritative plan pricing)
  const selectedPlan = useMemo(() => {
    return plans.find(p => p._id === selectedPlanId);
  }, [plans, selectedPlanId]);

  const unitPrice = selectedPlan ? selectedPlan.price : 0;
  // Quotation preview amount (final authoritative amount calculated and stored server-side)
  const totalAmountPreview = (quantity || 0) * unitPrice;

  const handleSubmit = async (targetStatus: 'draft' | 'sent') => {
    if (!selectedCustomerId) {
      addToast('Validation', 'Please select a customer.', 'warning');
      return;
    }
    if (!selectedProductId) {
      addToast('Validation', 'Please select a product.', 'warning');
      return;
    }
    if (!selectedPlanId) {
      addToast('Validation', 'Please select an associated plan.', 'warning');
      return;
    }
    if (quantity < 1) {
      addToast('Validation', 'Quantity must be at least 1.', 'warning');
      return;
    }

    setIsSubmitting(true);
    try {
      if (quotationToEdit) {
        await quotationService.updateQuotation(quotationToEdit._id, {
          customer: selectedCustomerId,
          product: selectedProductId,
          plan: selectedPlanId,
          quantity: Number(quantity),
          unitPrice,
          validUntil: validUntil || undefined,
          status: targetStatus,
        });
        addToast('Quotation Updated', `Quotation ${quotationToEdit.quotationNumber || quotationToEdit._id} updated as ${targetStatus.toUpperCase()}.`, 'success');
      } else {
        await quotationService.createQuotation({
          customer: selectedCustomerId,
          product: selectedProductId,
          plan: selectedPlanId,
          quantity: Number(quantity),
          unitPrice,
          validUntil: validUntil || undefined,
          status: targetStatus,
        });
        addToast(
          targetStatus === 'sent' ? 'Quotation Sent' : 'Draft Saved',
          `Quotation has been successfully ${targetStatus === 'sent' ? 'sent to customer' : 'saved as draft'}.`,
          'success'
        );
      }
      onSaved();
      onClose();
    } catch (err: any) {
      addToast('Submission Failed', err.message || 'Could not save quotation.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-xl w-full p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-150 max-h-[92vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              {quotationToEdit ? 'Edit Quotation' : 'Create New Quotation'}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Create commercial proposals with tailored pricing and terms.
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
            Loading customer accounts and active products...
          </div>
        ) : (
          <form onSubmit={e => e.preventDefault()} className="mt-5 space-y-4 text-xs">
            {/* 1. Customer Selection */}
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300">
                Customer Account <span className="text-rose-500">*</span>
              </label>
              <select
                value={selectedCustomerId}
                onChange={e => setSelectedCustomerId(e.target.value)}
                className="mt-1 w-full px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-1 focus:ring-indigo-500"
                required
              >
                <option value="" disabled>Select customer account...</option>
                {users.map(u => (
                  <option key={u._id} value={u._id}>
                    {u.company ? `${u.company} — ${u.name}` : u.name} ({u.email})
                  </option>
                ))}
              </select>
            </div>

            {/* 2. Product Selection */}
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300">
                Product <span className="text-rose-500">*</span>
              </label>
              <select
                value={selectedProductId}
                onChange={e => handleProductChange(e.target.value)}
                className="mt-1 w-full px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-1 focus:ring-indigo-500"
                required
              >
                <option value="" disabled>Select active product...</option>
                {products.map(p => (
                  <option key={p._id} value={p._id}>
                    {p.name} [{p.code}]
                  </option>
                ))}
              </select>
            </div>

            {/* 3. Plan Selection (Associated with selected product) */}
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300">
                Plan Tier <span className="text-rose-500">*</span>
              </label>
              <select
                value={selectedPlanId}
                onChange={e => setSelectedPlanId(e.target.value)}
                className="mt-1 w-full px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-1 focus:ring-indigo-500"
                required
              >
                {associatedPlans.length === 0 ? (
                  <option value="" disabled>No plans available for this product</option>
                ) : (
                  associatedPlans.map(pl => (
                    <option key={pl._id} value={pl._id}>
                      {pl.name} — {formatINR(pl.price)} / {pl.billingCycle}
                    </option>
                  ))
                )}
              </select>
              {selectedPlan && (
                <div className="mt-1 text-[11px] text-slate-500 flex items-center gap-2">
                  <span>Cycle: <strong className="capitalize">{selectedPlan.billingCycle}</strong></span>
                  <span>·</span>
                  <span>Early Close: <strong>{selectedPlan.allowEarlyClose ? 'Allowed' : 'Not Allowed'}</strong></span>
                </div>
              )}
            </div>

            {/* 4. Quantity and 5. Unit Price */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300">
                  Quantity <span className="text-rose-500">*</span>
                </label>
                <input
                  type="number"
                  min="1"
                  step="1"
                  value={quantity}
                  onChange={e => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                  className="mt-1 w-full px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-mono focus:ring-1 focus:ring-indigo-500"
                  required
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300">
                  Unit Price (₹)
                </label>
                <input
                  type="text"
                  readOnly
                  value={formatINR(unitPrice)}
                  className="mt-1 w-full px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-mono cursor-not-allowed"
                />
                <span className="text-[10px] text-slate-400">Plan rate</span>
              </div>
            </div>

            {/* 6. Total Amount Preview */}
            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-700 flex items-center justify-between">
              <div>
                <span className="font-semibold text-slate-700 dark:text-slate-300">
                  Total Amount
                </span>
                <p className="text-[10px] text-slate-400">
                  {quantity} × {formatINR(unitPrice)}
                </p>
              </div>
              <span className="text-lg font-bold font-mono text-indigo-600 dark:text-indigo-400 tabular-nums">
                {formatINR(totalAmountPreview)}
              </span>
            </div>

            {/* 7. Valid Until Date Picker */}
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300">
                Valid Until
              </label>
              <input
                type="date"
                value={validUntil}
                onChange={e => setValidUntil(e.target.value)}
                className="mt-1 w-full px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-mono focus:ring-1 focus:ring-indigo-500"
              />
            </div>

            {/* 8. Created By */}
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300">
                Prepared By
              </label>
              <div className="mt-1 px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-mono flex items-center justify-between">
                <span>{currentUser ? `${currentUser.name} (${currentUser.email})` : 'StackForge Staff'}</span>
                <span className="text-[10px] uppercase font-sans font-semibold bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300 px-1.5 py-0.5 rounded">
                  {currentUser?.role || 'Staff'}
                </span>
              </div>
            </div>

            {/* Action Buttons: Save Draft, Send Quotation, Cancel */}
            <div className="pt-4 flex items-center justify-end gap-2 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-slate-600 dark:text-slate-400 hover:text-slate-900 rounded-lg transition-colors"
              >
                Cancel
              </button>

              <button
                type="button"
                disabled={isSubmitting}
                onClick={() => handleSubmit('draft')}
                className="flex items-center gap-1.5 px-4 py-2 font-medium rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-750 transition-colors"
              >
                <Save className="w-3.5 h-3.5" />
                <span>Save Draft</span>
              </button>

              <button
                type="button"
                disabled={isSubmitting}
                onClick={() => handleSubmit('sent')}
                className="flex items-center gap-1.5 px-4 py-2 font-semibold rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs transition-colors"
              >
                <Send className="w-3.5 h-3.5" />
                <span>{isSubmitting ? 'Processing...' : 'Send Quotation'}</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
