import React from 'react';
import { 
  X, 
  Printer, 
  CheckCircle, 
  XCircle, 
  Send, 
  Layers, 
  Package, 
  User, 
  Calendar, 
  DollarSign, 
  ArrowRight,
  ShieldCheck
} from 'lucide-react';
import { PopulatedQuotation } from '../../types';
import { quotationService } from '../../services/quotationService';
import { formatINR } from '../../utils/formatters';

interface QuotationDetailModalProps {
  quotation: PopulatedQuotation | null;
  onClose: () => void;
  onRefresh: () => void;
  onConvertToSubscription: (quotation: PopulatedQuotation) => void;
  addToast: (title: string, message: string, type?: 'success' | 'warning' | 'info' | 'error') => void;
}

export const QuotationDetailModal: React.FC<QuotationDetailModalProps> = ({
  quotation,
  onClose,
  onRefresh,
  onConvertToSubscription,
  addToast,
}) => {
  if (!quotation) return null;

  const handlePrint = () => {
    window.print();
  };

  const handleSend = async () => {
    try {
      await quotationService.sendQuotation(quotation._id);
      addToast('Quotation Sent', `Quotation ${quotation.quotationNumber || quotation._id} dispatched to ${quotation.customer.email}.`, 'success');
      onRefresh();
      onClose();
    } catch (err: any) {
      addToast('Send Error', err.message || 'Could not send quotation.', 'error');
    }
  };

  const handleAccept = async () => {
    try {
      await quotationService.acceptQuotation(quotation._id);
      addToast('Quotation Accepted', `Quotation has been accepted. It is now eligible for subscription conversion!`, 'success');
      onRefresh();
      onClose();
    } catch (err: any) {
      addToast('Accept Error', err.message || 'Could not accept quotation.', 'error');
    }
  };

  const handleReject = async () => {
    try {
      await quotationService.rejectQuotation(quotation._id);
      addToast('Quotation Rejected', `Quotation marked as rejected.`, 'info');
      onRefresh();
      onClose();
    } catch (err: any) {
      addToast('Reject Error', err.message || 'Could not reject quotation.', 'error');
    }
  };

  const statusColors = {
    draft: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border-slate-300 dark:border-slate-700',
    sent: 'bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300 border-blue-200 dark:border-blue-800',
    accepted: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800 font-bold',
    rejected: 'bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300 border-rose-200 dark:border-rose-800',
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 print:p-0 print:bg-white">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl animate-in fade-in zoom-in-95 duration-150 max-h-[92vh] overflow-y-auto print:border-none print:shadow-none print:max-w-none print:p-0">
        {/* Top Controls (Hidden during print) */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800 print:hidden">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Quotation Review
            </span>
            <span className={`px-2 py-0.5 rounded-full text-xs border font-mono capitalize ${statusColors[quotation.status]}`}>
              {quotation.status}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 transition-colors"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print</span>
            </button>

            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Quotation Document Body */}
        <div className="py-6 space-y-6 text-xs">
          {/* Header */}
          <div className="flex items-start justify-between">
            <div>
              <span className="text-sm font-bold text-slate-900 dark:text-white">
                StackForge
              </span>
              <p className="text-[11px] text-slate-500">Commercial Proposal & Quotation</p>
            </div>

            <div className="text-right">
              <span className="text-xs text-slate-400 uppercase tracking-widest font-mono">Quotation #</span>
              <div className="text-base font-bold font-mono text-slate-900 dark:text-white">
                {quotation.quotationNumber || quotation._id.slice(-8)}
              </div>
              <div className="text-[11px] text-slate-500 mt-1">
                Valid Until: <strong className="font-mono text-slate-800 dark:text-slate-200">{quotation.validUntil ? quotation.validUntil.split('T')[0] : 'Open Proposal'}</strong>
              </div>
            </div>
          </div>

          {/* Customer & Staff Info Grid */}
          <div className="grid grid-cols-2 gap-4 p-4 rounded-xl bg-slate-50 dark:bg-slate-850 border border-slate-100 dark:border-slate-800">
            <div>
              <span className="font-semibold text-slate-500 uppercase tracking-wider text-[10px] block mb-1">
                Customer Details
              </span>
              <div className="font-bold text-slate-900 dark:text-white text-sm">
                {quotation.customer.company || quotation.customer.name}
              </div>
              <div className="text-slate-600 dark:text-slate-300">
                Contact: {quotation.customer.name}
              </div>
              <div className="text-slate-500 font-mono">
                {quotation.customer.email}
              </div>
            </div>

            <div>
              <span className="font-semibold text-slate-500 uppercase tracking-wider text-[10px] block mb-1">
                Prepared By
              </span>
              <div className="font-medium text-slate-900 dark:text-white">
                {quotation.createdBy.name}
              </div>
              <div className="text-slate-500 font-mono">
                {quotation.createdBy.email}
              </div>
              <div className="text-[10px] text-slate-400 uppercase mt-0.5">
                Role: {quotation.createdBy.role}
              </div>
            </div>
          </div>

          {/* Product & Plan Details Card */}
          <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 space-y-3">
            <span className="font-semibold text-slate-500 uppercase tracking-wider text-[10px] block">
              Solution Specifications
            </span>

            <div className="flex items-start justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div>
                <div className="font-bold text-slate-900 dark:text-white text-sm">
                  {quotation.product.name}
                </div>
                <div className="text-[11px] text-slate-500 font-mono">
                  Code: {quotation.product.code}
                </div>
                {quotation.product.description && (
                  <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-1 max-w-md">
                    {quotation.product.description}
                  </p>
                )}
              </div>
            </div>

            <div className="pt-1">
              <div className="font-bold text-indigo-600 dark:text-indigo-400">
                Plan: {quotation.plan.name} [{quotation.plan.code}]
              </div>
              <div className="text-slate-500 text-[11px] mt-0.5">
                Billing Cadence: <strong className="capitalize">{quotation.plan.billingCycle}</strong> · 
                Pause Allowed: <strong>{quotation.plan.allowPause ? 'Yes' : 'No'}</strong> · 
                Early Close: <strong>{quotation.plan.allowEarlyClose ? 'Yes' : 'No'}</strong>
              </div>
              {quotation.plan.features && quotation.plan.features.length > 0 && (
                <ul className="mt-2 space-y-1 text-slate-600 dark:text-slate-400 text-[11px]">
                  {quotation.plan.features.map((f, idx) => (
                    <li key={idx}>• {f}</li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          {/* Line Item Pricing Table */}
          <table className="w-full text-left text-xs border border-slate-200 dark:border-slate-800 rounded-lg overflow-hidden">
            <thead className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
              <tr>
                <th className="py-2.5 px-3 font-semibold">Item & Plan Description</th>
                <th className="py-2.5 px-3 font-semibold text-center w-20">Quantity</th>
                <th className="py-2.5 px-3 font-semibold text-right w-28">Unit Price</th>
                <th className="py-2.5 px-3 font-semibold text-right w-32">Total Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              <tr>
                <td className="py-3 px-3 font-medium text-slate-900 dark:text-white">
                  {quotation.product.name} — {quotation.plan.name}
                </td>
                <td className="py-3 px-3 text-center font-mono text-slate-700 dark:text-slate-300">
                  {quotation.quantity}
                </td>
                <td className="py-3 px-3 text-right font-mono text-slate-700 dark:text-slate-300">
                  {formatINR(quotation.unitPrice)}
                </td>
                <td className="py-3 px-3 text-right font-mono font-bold text-slate-900 dark:text-white">
                  {formatINR(quotation.totalAmount)}
                </td>
              </tr>
            </tbody>
          </table>

          {/* Stored Total Amount */}
          <div className="flex justify-end">
            <div className="w-64 p-3 rounded-xl bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-700 flex items-center justify-between">
              <span className="font-semibold text-slate-700 dark:text-slate-300">Total Quotation Value:</span>
              <span className="text-base font-bold font-mono text-indigo-600 dark:text-indigo-400 tabular-nums">
                {formatINR(quotation.totalAmount)}
              </span>
            </div>
          </div>

          {/* Workflow Actions (Hidden during print) */}
          <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3 print:hidden">
            <button
              onClick={onClose}
              className="px-3.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 font-medium"
            >
              Back to List
            </button>

            <div className="flex items-center gap-2">
              {quotation.status === 'draft' && (
                <button
                  onClick={handleSend}
                  className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Send Quotation</span>
                </button>
              )}

              {quotation.status === 'sent' && (
                <>
                  <button
                    onClick={handleReject}
                    className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg border border-rose-300 dark:border-rose-800 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 font-medium"
                  >
                    <XCircle className="w-3.5 h-3.5" />
                    <span>Customer Rejected</span>
                  </button>
                  <button
                    onClick={handleAccept}
                    className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-medium"
                  >
                    <CheckCircle className="w-3.5 h-3.5" />
                    <span>Customer Accepted</span>
                  </button>
                </>
              )}

              {/* Conversion action: Only accepted quotations are eligible */}
              {quotation.status === 'accepted' && (
                <button
                  onClick={() => {
                    onClose();
                    onConvertToSubscription(quotation);
                  }}
                  className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-semibold shadow-xs"
                >
                  <span>Convert to Subscription</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
