import React, { useRef } from 'react';
import { 
  X, 
  Printer, 
  Download, 
  Send, 
  CheckCircle2, 
  AlertTriangle, 
  Clock, 
  FileText, 
  CreditCard,
  User, 
  Calendar, 
  DollarSign,
  Building,
  Mail,
  Phone
} from 'lucide-react';
import { PopulatedPhase4Invoice, Phase4InvoiceStatus } from '../../types';
import { invoiceService } from '../../services/invoiceService';
import { formatINR } from '../../utils/formatters';

interface Phase4InvoiceDetailModalProps {
  invoice: PopulatedPhase4Invoice | null;
  onClose: () => void;
  onRefresh: () => void;
  onRecordPayment?: (invoice: PopulatedPhase4Invoice) => void;
  addToast: (title: string, message: string, type?: 'success' | 'warning' | 'info' | 'error') => void;
}

export const Phase4InvoiceDetailModal: React.FC<Phase4InvoiceDetailModalProps> = ({
  invoice,
  onClose,
  onRefresh,
  onRecordPayment,
  addToast,
}) => {
  const printableAreaRef = useRef<HTMLDivElement>(null);

  if (!invoice) return null;

  const getStatusBadge = (status: Phase4InvoiceStatus) => {
    switch (status) {
      case 'paid':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
            <CheckCircle2 className="w-3.5 h-3.5" />
            Paid
          </span>
        );
      case 'sent':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-300 dark:border-blue-800">
            <Send className="w-3.5 h-3.5" />
            Sent
          </span>
        );
      case 'overdue':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300 border border-rose-300 dark:border-rose-800 animate-pulse">
            <AlertTriangle className="w-3.5 h-3.5" />
            Overdue
          </span>
        );
      case 'draft':
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300 border border-slate-300 dark:border-slate-700">
            <Clock className="w-3.5 h-3.5" />
            Draft
          </span>
        );
    }
  };

  const handleSendInvoice = async () => {
    try {
      await invoiceService.sendInvoice(invoice._id);
      addToast('Invoice Sent', `Invoice ${invoice._id.slice(-8)} has been marked as sent to customer.`, 'success');
      onRefresh();
    } catch {
      addToast('Error', 'Failed to send invoice.', 'error');
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDownload = () => {
    invoiceService.downloadInvoicePdf(invoice);
    addToast('Invoice Downloaded', 'The invoice file was generated.', 'success');
  };

  const productName = 'product' in invoice.subscription && typeof invoice.subscription.product === 'object'
    ? invoice.subscription.product.name
    : 'StackForge Subscription';

  const planName = 'plan' in invoice.subscription && typeof invoice.subscription.plan === 'object'
    ? invoice.subscription.plan.name
    : 'Subscription Plan';

  const billingCycle = 'plan' in invoice.subscription && typeof invoice.subscription.plan === 'object'
    ? invoice.subscription.plan.billingCycle
    : 'monthly';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto print:p-0 print:bg-white print:static">
      <div className="relative w-full max-w-3xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden my-8 print:border-none print:shadow-none print:w-full print:max-w-none print:my-0">
        
        {/* Header toolbar (Hidden in print) */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 print:hidden">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Invoice Details
                </h3>
                {getStatusBadge(invoice.status)}
              </div>
              <p className="text-xs text-slate-500 font-mono">
                ID: {invoice._id}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {invoice.status === 'draft' && (
              <button
                onClick={handleSendInvoice}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors shadow-xs"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Send to Customer</span>
              </button>
            )}

            {invoice.status !== 'paid' && onRecordPayment && (
              <button
                onClick={() => {
                  onRecordPayment(invoice);
                  onClose();
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-colors shadow-xs"
              >
                <CreditCard className="w-3.5 h-3.5" />
                <span>Record Payment</span>
              </button>
            )}

            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-lg transition-colors border border-slate-200 dark:border-slate-700"
              title="Print Invoice"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print</span>
            </button>

            <button
              onClick={handleDownload}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-lg transition-colors border border-slate-200 dark:border-slate-700"
              title="Download Document"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download</span>
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

        {/* Printable Invoice Sheet */}
        <div ref={printableAreaRef} className="p-8 space-y-8 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 print:text-black print:bg-white print:p-4">
          
          {/* Top Brand & Invoice Metadata */}
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-6 border-b border-slate-200 dark:border-slate-800 pb-6 print:border-black">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xl font-black tracking-tight text-indigo-600 dark:text-indigo-400 print:text-black">
                  STACKFORGE
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Enterprise Subscription & Recurring Billing
              </p>
            </div>

            <div className="sm:text-right space-y-1">
              <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white print:text-black">
                INVOICE
              </h2>
              <div className="text-xs text-slate-500 dark:text-slate-400 font-mono">
                #{invoice._id}
              </div>
              <div className="pt-1">
                {getStatusBadge(invoice.status)}
              </div>
            </div>
          </div>

          {/* Dates & Timeline Summary */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 print:bg-transparent print:border-black">
            <div>
              <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Generated Date</p>
              <p className="text-sm font-medium mt-0.5">{invoice.generatedAt || 'N/A'}</p>
            </div>
            <div>
              <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Due Date</p>
              <p className="text-sm font-semibold text-slate-900 dark:text-slate-100 mt-0.5">{invoice.dueDate || 'N/A'}</p>
            </div>
            <div>
              <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Invoice Status</p>
              <p className="text-sm font-semibold uppercase mt-0.5 tracking-wide">{invoice.status}</p>
            </div>
            <div>
              <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Total Amount</p>
              <p className="text-base font-bold text-indigo-600 dark:text-indigo-400 print:text-black mt-0.5">
                {formatINR(invoice.amount)}
              </p>
            </div>
          </div>

          {/* Customer & Subscription Information Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Customer Information */}
            <div className="p-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 space-y-3 print:border-black">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                <User className="w-4 h-4 text-indigo-600 dark:text-indigo-400 print:text-black" />
                <span>Customer Information</span>
              </div>
              <div className="space-y-1.5 text-xs">
                <div className="flex items-start gap-2">
                  <Building className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                  <span className="font-semibold text-slate-900 dark:text-white">
                    {invoice.customer.company || invoice.customer.name}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <User className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span className="text-slate-600 dark:text-slate-400">
                    Contact: {invoice.customer.name}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span className="text-slate-600 dark:text-slate-400">
                    {invoice.customer.email}
                  </span>
                </div>
                {invoice.customer.phone && (
                  <div className="flex items-center gap-2">
                    <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="text-slate-600 dark:text-slate-400">
                      {invoice.customer.phone}
                    </span>
                  </div>
                )}
                <div className="pt-2 text-[11px] text-slate-400 font-mono">
                  Ref ID: {invoice.customer._id}
                </div>
              </div>
            </div>

            {/* Subscription Information */}
            <div className="p-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 space-y-3 print:border-black">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                <CreditCard className="w-4 h-4 text-indigo-600 dark:text-indigo-400 print:text-black" />
                <span>Subscription Information</span>
              </div>
              <div className="space-y-1.5 text-xs">
                <div>
                  <span className="text-slate-500">Service: </span>
                  <span className="font-semibold text-slate-900 dark:text-white">
                    {productName}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500">Tier / Plan: </span>
                  <span className="font-medium text-slate-800 dark:text-slate-200">
                    {planName} ({billingCycle})
                  </span>
                </div>
                <div>
                  <span className="text-slate-500">Quantity / Seats: </span>
                  <span className="font-medium text-slate-800 dark:text-slate-200">
                    {invoice.subscription.quantity} Unit(s)
                  </span>
                </div>
                <div>
                  <span className="text-slate-500">Next Billing Date: </span>
                  <span className="font-medium text-slate-800 dark:text-slate-200">
                    {invoice.subscription.nextBillingDate || 'N/A'}
                  </span>
                </div>
                <div className="pt-2 text-[11px] text-slate-400 font-mono truncate">
                  Subscription ID: {invoice.subscription._id}
                </div>
              </div>
            </div>
          </div>

          {/* Clean Financial Breakdown (Strict adherence: only actual backend data) */}
          <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden print:border-black">
            <div className="bg-slate-50 dark:bg-slate-800/60 px-4 py-2.5 border-b border-slate-200 dark:border-slate-800 font-semibold text-xs text-slate-700 dark:text-slate-300 print:bg-transparent print:border-black">
              Subscription Billing Summary
            </div>
            <div className="p-4 space-y-3">
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-600 dark:text-slate-400">
                  {productName} - {planName} (Qty: {invoice.subscription.quantity})
                </span>
                <span className="font-medium text-slate-900 dark:text-white">
                  {formatINR(invoice.amount)}
                </span>
              </div>
              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center print:border-black">
                <span className="text-sm font-bold text-slate-900 dark:text-white">
                  Total Amount Due:
                </span>
                <span className="text-lg font-black text-indigo-600 dark:text-indigo-400 print:text-black">
                  {formatINR(invoice.amount)}
                </span>
              </div>
            </div>
          </div>

          {/* Payment Instructions / Terms */}
          <div className="text-[11px] text-slate-500 dark:text-slate-400 border-t border-slate-100 dark:border-slate-800 pt-4 space-y-1">
            <p className="font-semibold text-slate-700 dark:text-slate-300">Payment Instructions</p>
            <p>Direct electronic bank transfer (NEFT / RTGS / IMPS), UPI, or corporate card. Please reference Invoice ID #{invoice._id.slice(-8)} on all remittance notices.</p>
          </div>
        </div>

        <div className="flex items-center justify-between px-6 py-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 print:hidden">
          <span className="text-xs text-slate-400 font-medium">
            Official Billing Statement
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
