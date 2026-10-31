import React, { useState, useEffect } from 'react';
import { 
  X, 
  CreditCard, 
  DollarSign, 
  Calendar, 
  FileText, 
  User, 
  CheckCircle2, 
  Clock, 
  Building 
} from 'lucide-react';
import { 
  PopulatedPhase4Invoice, 
  PaymentMethod, 
  PaymentStatus,
  UserModel 
} from '../../types';
import { invoiceService } from '../../services/invoiceService';
import { paymentService } from '../../services/paymentService';
import { formatINR } from '../../utils/formatters';

interface RecordPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  presetInvoice?: PopulatedPhase4Invoice | null;
  onPaymentRecorded: () => void;
  addToast: (title: string, message: string, type?: 'success' | 'warning' | 'info' | 'error') => void;
}

export const RecordPaymentModal: React.FC<RecordPaymentModalProps> = ({
  isOpen,
  onClose,
  presetInvoice,
  onPaymentRecorded,
  addToast,
}) => {
  const [invoices, setInvoices] = useState<PopulatedPhase4Invoice[]>([]);
  const [selectedInvoiceId, setSelectedInvoiceId] = useState<string>('');
  const [amount, setAmount] = useState<number>(0);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('bank_transfer');
  const [paymentDate, setPaymentDate] = useState<string>(() => new Date().toISOString().split('T')[0]);
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>('completed');
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [loadingInvoices, setLoadingInvoices] = useState<boolean>(false);

  // Fetch available invoices on open
  useEffect(() => {
    if (isOpen) {
      setLoadingInvoices(true);
      invoiceService.listInvoices({ limit: 50 })
        .then(res => {
          setInvoices(res.invoices);
          if (presetInvoice) {
            setSelectedInvoiceId(presetInvoice._id);
            setAmount(presetInvoice.amount);
          } else if (res.invoices.length > 0) {
            // Prefer unpaid/overdue/sent invoices
            const unpaid = res.invoices.find(i => i.status !== 'paid') || res.invoices[0];
            setSelectedInvoiceId(unpaid._id);
            setAmount(unpaid.amount);
          }
        })
        .finally(() => setLoadingInvoices(false));
    }
  }, [isOpen, presetInvoice]);

  // When selected invoice changes, update customer binding and default amount
  const selectedInvoice = invoices.find(i => i._id === selectedInvoiceId) || presetInvoice || null;

  const handleInvoiceChange = (invId: string) => {
    setSelectedInvoiceId(invId);
    const target = invoices.find(i => i._id === invId);
    if (target) {
      setAmount(target.amount);
    }
  };

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedInvoice) {
      addToast('Validation Error', 'Please select an invoice to record payment.', 'error');
      return;
    }

    if (amount <= 0) {
      addToast('Validation Error', 'Payment amount must be greater than 0.', 'error');
      return;
    }

    try {
      setSubmitting(true);
      await paymentService.createPayment({
        invoice: selectedInvoice._id,
        customer: selectedInvoice.customer._id,
        amount: Number(amount),
        paymentMethod,
        paymentDate,
        status: paymentStatus,
      });

      addToast(
        'Payment Recorded',
        `Successfully logged ${paymentMethod.replace('_', ' ')} of ${formatINR(amount)} for ${selectedInvoice.customer.name}.`,
        'success'
      );
      onPaymentRecorded();
      onClose();
    } catch {
      addToast('Error', 'Failed to record payment.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden my-8">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400">
              <CreditCard className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Record Payment
              </h3>
              <p className="text-xs text-slate-500">
                Log customer remittance against an issued subscription invoice
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          
          {/* 1. Invoice Selector */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
              Target Invoice <span className="text-rose-500">*</span>
            </label>
            <select
              value={selectedInvoiceId}
              onChange={e => handleInvoiceChange(e.target.value)}
              disabled={loadingInvoices}
              className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
              required
            >
              {loadingInvoices ? (
                <option value="">Loading invoices...</option>
              ) : invoices.length === 0 ? (
                <option value="">No invoices found</option>
              ) : (
                invoices.map(inv => (
                  <option key={inv._id} value={inv._id}>
                    #{inv._id.slice(-8)} — {inv.customer.name} ({inv.customer.company || 'Direct'}) — {formatINR(inv.amount)} [{inv.status.toUpperCase()}]
                  </option>
                ))
              )}
            </select>
            {selectedInvoice && (
              <div className="mt-2 p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/60 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-indigo-500" />
                  <div>
                    <span className="font-semibold text-slate-900 dark:text-white">
                      Invoice #{selectedInvoice._id.slice(-8)}
                    </span>
                    <span className="text-slate-500 ml-2">Due: {selectedInvoice.dueDate}</span>
                  </div>
                </div>
                <div className="text-right">
                  <span className="font-bold text-slate-900 dark:text-white">
                    {formatINR(selectedInvoice.amount)}
                  </span>
                  <span className={`ml-2 text-[10px] font-bold uppercase px-1.5 py-0.5 rounded ${
                    selectedInvoice.status === 'paid' ? 'bg-emerald-100 text-emerald-800' :
                    selectedInvoice.status === 'overdue' ? 'bg-rose-100 text-rose-800' : 'bg-blue-100 text-blue-800'
                  }`}>
                    {selectedInvoice.status}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* 2. Customer Information (Read-only / Auto-bound from Invoice) */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
              Customer (Auto-Bound from Invoice)
            </label>
            <div className="flex items-center gap-3 px-3 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-100/70 dark:bg-slate-800/60 text-xs text-slate-700 dark:text-slate-300">
              <User className="w-4 h-4 text-slate-400 shrink-0" />
              <div className="flex-1 truncate">
                <span className="font-semibold text-slate-900 dark:text-white">
                  {selectedInvoice?.customer.name || 'No customer bound'}
                </span>
                {selectedInvoice?.customer.company && (
                  <span className="text-slate-500 ml-1.5">
                    ({selectedInvoice.customer.company})
                  </span>
                )}
                <span className="text-slate-400 ml-2">
                  • {selectedInvoice?.customer.email}
                </span>
              </div>
              <span className="text-[10px] font-mono text-slate-400">
                {selectedInvoice?.customer._id.slice(-6)}
              </span>
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              Customer details matched from the selected invoice.
            </p>
          </div>

          {/* 3. Amount & Payment Method */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                Payment Amount (₹ INR) <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2 text-xs font-bold text-slate-400">₹</span>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  value={amount}
                  onChange={e => setAmount(parseFloat(e.target.value) || 0)}
                  className="w-full pl-8 pr-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                Payment Method <span className="text-rose-500">*</span>
              </label>
              <select
                value={paymentMethod}
                onChange={e => setPaymentMethod(e.target.value as PaymentMethod)}
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                required
              >
                <option value="bank_transfer">Direct Bank Transfer (NEFT / RTGS / IMPS)</option>
                <option value="card">Credit / Debit Card</option>
                <option value="cash">Cash / Remittance Slip</option>
                <option value="other">Other Payment Channel</option>
              </select>
            </div>
          </div>

          {/* 4. Payment Date & Status */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                Payment Date <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <Calendar className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="date"
                  value={paymentDate}
                  onChange={e => setPaymentDate(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                Payment Status <span className="text-rose-500">*</span>
              </label>
              <select
                value={paymentStatus}
                onChange={e => setPaymentStatus(e.target.value as PaymentStatus)}
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                required
              >
                <option value="completed">Completed (Funds Reconciled)</option>
                <option value="pending">Pending (Awaiting Settlement)</option>
              </select>
            </div>
          </div>

          {/* Actions */}
          <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="px-4 py-2 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting || !selectedInvoice}
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 rounded-lg transition-colors shadow-sm disabled:opacity-50"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>{submitting ? 'Recording Payment...' : 'Record Payment'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
