import React from 'react';
import { 
  X, 
  CreditCard, 
  FileText, 
  User, 
  Calendar, 
  DollarSign, 
  Building, 
  Mail, 
  CheckCircle2, 
  Clock, 
  Printer, 
  ExternalLink 
} from 'lucide-react';
import { PopulatedPaymentModel, PopulatedPhase4Invoice } from '../../types';
import { formatINR } from '../../utils/formatters';

interface PaymentDetailModalProps {
  payment: PopulatedPaymentModel | null;
  onClose: () => void;
  onViewInvoice?: (invoice: PopulatedPhase4Invoice) => void;
}

export const PaymentDetailModal: React.FC<PaymentDetailModalProps> = ({
  payment,
  onClose,
  onViewInvoice,
}) => {
  if (!payment) return null;

  const getMethodLabel = (method: string) => {
    switch (method) {
      case 'bank_transfer': return 'Bank Transfer (NEFT/RTGS/IMPS)';
      case 'card': return 'Credit/Debit Card';
      case 'cash': return 'Cash';
      case 'other': return 'Other Payment Channel';
      default: return method;
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto print:p-0 print:bg-white print:static">
      <div className="relative w-full max-w-xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden my-8 print:border-none print:shadow-none print:w-full print:max-w-none print:my-0">
        
        {/* Header toolbar (Hidden in print) */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 print:hidden">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400">
              <CreditCard className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Payment Receipt
                </h3>
                <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                  payment.status === 'completed'
                    ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800'
                    : 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-300 dark:border-amber-800'
                }`}>
                  {payment.status === 'completed' ? <CheckCircle2 className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
                  {payment.status.toUpperCase()}
                </span>
              </div>
              <p className="text-xs text-slate-500 font-mono">
                ID: {payment._id}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-lg transition-colors border border-slate-200 dark:border-slate-700"
              title="Print Receipt"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Receipt Content */}
        <div className="p-6 space-y-6 text-slate-900 dark:text-slate-100 print:text-black print:p-4">
          
          {/* Top Receipt Summary */}
          <div className="text-center py-4 border-b border-slate-100 dark:border-slate-800 space-y-1">
            <p className="text-xs uppercase tracking-wider text-slate-500">Amount Paid</p>
            <h2 className="text-3xl font-black text-slate-900 dark:text-white print:text-black">
              {formatINR(payment.amount)}
            </h2>
            <p className="text-xs text-slate-500">
              Paid via {getMethodLabel(payment.paymentMethod)} on {payment.paymentDate}
            </p>
          </div>

          {/* Details Table */}
          <div className="space-y-3 text-xs">
            <div className="flex justify-between py-2 border-b border-slate-100 dark:border-slate-800">
              <span className="text-slate-500">Payment ID:</span>
              <span className="font-mono font-medium">{payment._id}</span>
            </div>

            <div className="flex justify-between py-2 border-b border-slate-100 dark:border-slate-800">
              <span className="text-slate-500">Payment Date:</span>
              <span className="font-medium">{payment.paymentDate}</span>
            </div>

            <div className="flex justify-between py-2 border-b border-slate-100 dark:border-slate-800">
              <span className="text-slate-500">Payment Method:</span>
              <span className="font-semibold text-slate-900 dark:text-white">
                {getMethodLabel(payment.paymentMethod)}
              </span>
            </div>

            <div className="flex justify-between py-2 border-b border-slate-100 dark:border-slate-800">
              <span className="text-slate-500">Payment Status:</span>
              <span className="font-semibold uppercase tracking-wider">{payment.status}</span>
            </div>

            {/* Customer Details */}
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/60 space-y-1.5">
              <div className="flex items-center gap-2 font-semibold text-slate-900 dark:text-white">
                <User className="w-3.5 h-3.5 text-indigo-500" />
                <span>Customer Information</span>
              </div>
              <div className="text-slate-700 dark:text-slate-300">
                {payment.customer.name} {payment.customer.company && `(${payment.customer.company})`}
              </div>
              <div className="text-slate-500">
                {payment.customer.email}
              </div>
              <div className="text-[10px] font-mono text-slate-400">
                Customer ID: {payment.customer._id}
              </div>
            </div>

            {/* Associated Invoice Card */}
            <div className="p-4 rounded-xl bg-indigo-50/60 dark:bg-indigo-950/30 border border-indigo-200/80 dark:border-indigo-800/40 flex items-center justify-between">
              <div>
                <div className="flex items-center gap-1.5 font-semibold text-indigo-900 dark:text-indigo-200 text-xs">
                  <FileText className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                  <span>Associated Invoice</span>
                </div>
                <p className="text-xs text-indigo-700 dark:text-indigo-300 mt-0.5 font-mono">
                  #{typeof payment.invoice === 'object' ? payment.invoice._id : payment.invoice}
                </p>
                {typeof payment.invoice === 'object' && (
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Invoice Amount: {formatINR(payment.invoice.amount)} • Due: {payment.invoice.dueDate}
                  </p>
                )}
              </div>

              {typeof payment.invoice === 'object' && onViewInvoice && (
                <button
                  onClick={() => {
                    onViewInvoice(payment.invoice as PopulatedPhase4Invoice);
                    onClose();
                  }}
                  className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 rounded-lg transition-colors border border-indigo-300 dark:border-indigo-700 print:hidden"
                >
                  <span>View Invoice</span>
                  <ExternalLink className="w-3 h-3" />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 print:hidden">
          <span className="text-xs text-slate-500 font-mono">
            Transaction Reconciled
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-lg transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
