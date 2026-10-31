import React, { useState } from 'react';
import { X, Plus, Trash2, DollarSign } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { BrightloopService } from '../../services/api';
import { invoiceService } from '../../services/invoiceService';
import { quotationService } from '../../services/quotationService';
import { subscriptionService } from '../../services/subscriptionService';
import { formatINR } from '../../utils/formatters';

export const CreateInvoiceModal: React.FC = () => {
  const { 
    isCreateInvoiceOpen, 
    setIsCreateInvoiceOpen, 
    customers, 
    refreshData, 
    addToast 
  } = useApp();

  const [customerId, setCustomerId] = useState(customers[0]?.id || '');
  const [description, setDescription] = useState('Enterprise Custom Deployment & Support');
  const [unitPrice, setUnitPrice] = useState<number>(2500);
  const [quantity, setQuantity] = useState<number>(1);
  const [taxPercent, setTaxPercent] = useState<number>(8.5);
  const [notes, setNotes] = useState('Net 15 terms. Dedicated account manager support included.');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isCreateInvoiceOpen) return null;

  const targetCustomer = customers.find(c => c.id === customerId) || customers[0];
  const subtotal = unitPrice * quantity;
  const tax = Math.round(((subtotal * taxPercent) / 100) * 100) / 100;
  const total = subtotal + tax;

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetCustomer) return;

    setIsSubmitting(true);
    try {
      const today = new Date().toISOString().split('T')[0];
      const dueDate = new Date(Date.now() + 15 * 86400000).toISOString().split('T')[0];

      await BrightloopService.createInvoice({
        customerId: targetCustomer.id,
        customerName: targetCustomer.name,
        customerCompany: targetCustomer.company,
        customerEmail: targetCustomer.email,
        planName: description,
        subtotal,
        discount: 0,
        tax,
        total,
        status: 'open',
        issueDate: today,
        dueDate,
        notes,
        lineItems: [
          {
            id: `li_${Date.now()}`,
            description,
            quantity: Number(quantity),
            unitPrice: Number(unitPrice),
            amount: subtotal,
          },
        ],
      });

      // Synchronize with Phase 4 invoice service so Invoices table updates immediately
      try {
        const [users, subsRes] = await Promise.all([
          quotationService.getUsers(),
          subscriptionService.listSubscriptions({ limit: 50 })
        ]);
        const matchedUser = users.find(u => u.email === targetCustomer.email || u.name === targetCustomer.name) || users[0];
        const matchedSub = subsRes.subscriptions.find(s => s.customer._id === matchedUser?._id) || subsRes.subscriptions[0];

        await invoiceService.createInvoice({
          customer: matchedUser?._id || '65f1a1000000000000000001',
          subscription: matchedSub?._id || '65f1e1000000000000000001',
          amount: total,
          dueDate,
          status: 'sent',
          generatedAt: today,
        });
      } catch (e) {
        console.warn('Phase 4 invoice save fallback:', e);
      }

      addToast(
        'Invoice Issued',
        `New invoice generated for ${targetCustomer.company} for ${formatINR(total)}.`,
        'success'
      );
      setIsCreateInvoiceOpen(false);
      await refreshData();
    } catch {
      addToast('Error', 'Failed to generate invoice.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Issue Manual B2B Invoice
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Create an ad-hoc billable statement or one-off consulting fee.
            </p>
          </div>
          <button
            onClick={() => setIsCreateInvoiceOpen(false)}
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleCreate} className="mt-5 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
              Recipient Customer Organization
            </label>
            <select
              value={customerId}
              onChange={e => setCustomerId(e.target.value)}
              className="mt-1 w-full px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-1 focus:ring-indigo-500"
            >
              {customers.map(c => (
                <option key={c.id} value={c.id}>
                  {c.company} ({c.name})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
              Line Item Description
            </label>
            <input
              type="text"
              value={description}
              onChange={e => setDescription(e.target.value)}
              className="mt-1 w-full px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-1 focus:ring-indigo-500"
              required
            />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                Quantity
              </label>
              <input
                type="number"
                min="1"
                value={quantity}
                onChange={e => setQuantity(Number(e.target.value))}
                className="mt-1 w-full px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-mono"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                Unit Price (₹)
              </label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={unitPrice}
                onChange={e => setUnitPrice(Number(e.target.value))}
                className="mt-1 w-full px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-mono"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                Tax Rate (%)
              </label>
              <input
                type="number"
                min="0"
                step="0.1"
                value={taxPercent}
                onChange={e => setTaxPercent(Number(e.target.value))}
                className="mt-1 w-full px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-mono"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
              Payment Terms & Remit Notes
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={e => setNotes(e.target.value)}
              className="mt-1 w-full px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
            />
          </div>

          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-700 flex items-center justify-between text-xs font-bold">
            <span className="text-slate-700 dark:text-slate-300">Total Invoice Amount:</span>
            <span className="text-base font-mono text-indigo-600 dark:text-indigo-400">
              {formatINR(total)}
            </span>
          </div>

          <div className="pt-3 flex items-center justify-end gap-2 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={() => setIsCreateInvoiceOpen(false)}
              className="px-3 py-1.5 text-xs text-slate-600 dark:text-slate-400 hover:text-slate-900 rounded-lg"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-1.5 text-xs font-semibold rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white transition-colors"
            >
              {isSubmitting ? 'Generating...' : 'Issue Invoice'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
