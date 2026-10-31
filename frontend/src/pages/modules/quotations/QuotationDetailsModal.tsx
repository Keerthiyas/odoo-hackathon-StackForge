import React from 'react';
import {
  FileSpreadsheet,
  X,
  Printer,
  Send,
  CheckCircle2,
  XCircle,
  ArrowRight,
  Edit2,
  User as UserIcon,
  Building2,
  Mail,
  ShieldCheck,
} from 'lucide-react';
import { Quotation } from '../../../types';
import { StatusBadge } from '../../../components/common/StatusBadge';
import { formatCurrency, formatDate } from '../../../utils/formatters';

interface QuotationDetailsModalProps {
  isOpen: boolean;
  quotation: Quotation | null;
  onClose: () => void;
  onEdit?: (quotation: Quotation) => void;
  onSend?: (id: string) => Promise<void>;
  onAccept?: (id: string) => Promise<void>;
  onReject?: (id: string) => Promise<void>;
  onConvertToSubscription?: (quotation: Quotation) => void;
}

export const QuotationDetailsModal: React.FC<QuotationDetailsModalProps> = ({
  isOpen,
  quotation,
  onClose,
  onEdit,
  onSend,
  onAccept,
  onReject,
  onConvertToSubscription,
}) => {
  if (!isOpen || !quotation) return null;

  const quoteId = quotation._id || quotation.id || '';

  const customerName =
    typeof quotation.customer === 'object' && quotation.customer !== null && 'name' in quotation.customer
      ? (quotation.customer as any).name
      : quotation.customerName || 'Customer';

  const customerEmail =
    typeof quotation.customer === 'object' && quotation.customer !== null && 'email' in quotation.customer
      ? (quotation.customer as any).email
      : '';

  const customerCompany =
    typeof quotation.customer === 'object' && quotation.customer !== null
      ? (quotation.customer as any).companyName || (quotation.customer as any).company
      : '';

  const productName =
    typeof quotation.product === 'object' && quotation.product !== null && 'name' in quotation.product
      ? (quotation.product as any).name
      : 'Software Product';

  const planName =
    typeof quotation.plan === 'object' && quotation.plan !== null && 'name' in quotation.plan
      ? (quotation.plan as any).name
      : 'Plan';

  const planCycle =
    typeof quotation.plan === 'object' && quotation.plan !== null && 'billingCycle' in quotation.plan
      ? (quotation.plan as any).billingCycle
      : 'monthly';

  const createdByName =
    typeof quotation.createdBy === 'object' && quotation.createdBy !== null && 'name' in quotation.createdBy
      ? (quotation.createdBy as any).name
      : 'Authorized Sales Representative';

  const quoteStatus = quotation.status ? quotation.status.toLowerCase() : 'draft';

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-150 print:p-0 print:bg-white">
      <div className="bg-white rounded-2xl shadow-xl border border-slate-200 max-w-2xl w-full p-6 animate-in zoom-in-95 duration-150 max-h-[94vh] overflow-y-auto print:border-none print:shadow-none print:max-w-none print:h-auto print:max-h-none print:rounded-none">
        {/* Modal Top Actions (Hidden in print) */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 print:hidden">
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono font-medium text-slate-500">
              {quotation.quotationNumber || `QTE-${quoteId.slice(-6).toUpperCase()}`}
            </span>
            <StatusBadge status={quotation.status} size="sm" />
          </div>
          <div className="flex items-center gap-1.5">
            <button
              onClick={handlePrint}
              className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors flex items-center gap-1 text-xs font-medium"
              title="Print / Save PDF"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print</span>
            </button>
            <button
              onClick={onClose}
              className="p-1 text-slate-400 hover:text-slate-600 rounded-lg transition-colors"
              aria-label="Close modal"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Printable Quotation Sheet */}
        <div className="mt-4 space-y-6">
          {/* Company Branding & Header */}
          <div className="flex flex-col sm:flex-row justify-between items-start gap-4 pb-6 border-b border-slate-200">
            <div>
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-blue-600 flex items-center justify-center text-white font-bold text-xs">
                  B
                </div>
                <span className="text-base font-bold text-slate-900 tracking-tight">
                  Brightloop Software
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Enterprise Cloud Infrastructure & Software Subscriptions
              </p>
              <p className="text-[11px] text-slate-400">
                100 Innovation Way, Suite 400 · San Francisco, CA · support@brightloop.io
              </p>
            </div>

            <div className="text-left sm:text-right">
              <span className="text-xs uppercase tracking-wider font-bold text-slate-400 block">
                Commercial Quotation
              </span>
              <span className="text-base font-bold font-mono text-slate-900">
                {quotation.quotationNumber || `QTE-${quoteId.slice(-6).toUpperCase()}`}
              </span>
              <div className="text-xs text-slate-500 mt-1 space-y-0.5">
                <div>Date: {formatDate(quotation.createdAt || new Date().toISOString())}</div>
                {quotation.validUntil && (
                  <div className="text-amber-700 font-medium">
                    Valid Until: {formatDate(quotation.validUntil)}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Client Details & Created By Strip */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 bg-slate-50 rounded-xl border border-slate-100">
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                Quotation Prepared For
              </span>
              <div className="font-semibold text-slate-900 text-sm">{customerName}</div>
              {customerCompany && (
                <div className="text-xs text-slate-600 flex items-center gap-1.5 mt-0.5">
                  <Building2 className="w-3 h-3 text-slate-400" />
                  <span>{customerCompany}</span>
                </div>
              )}
              {customerEmail && (
                <div className="text-xs text-slate-500 flex items-center gap-1.5 mt-0.5">
                  <Mail className="w-3 h-3 text-slate-400" />
                  <span>{customerEmail}</span>
                </div>
              )}
            </div>

            <div className="sm:text-right">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                Sales Representative
              </span>
              <div className="font-medium text-slate-900 text-xs flex sm:justify-end items-center gap-1">
                <UserIcon className="w-3 h-3 text-slate-400" />
                <span>{createdByName}</span>
              </div>
              <div className="text-[11px] text-slate-500 mt-0.5">
                Status: <span className="capitalize font-semibold text-slate-700">{quoteStatus}</span>
              </div>
            </div>
          </div>

          {/* Line Item Table */}
          <div className="border border-slate-200 rounded-xl overflow-hidden">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider text-[11px] font-semibold">
                  <th className="py-2.5 px-4">Item & Description</th>
                  <th className="py-2.5 px-3 text-center">Billing Cadence</th>
                  <th className="py-2.5 px-3 text-right">Quantity</th>
                  <th className="py-2.5 px-3 text-right">Unit Price</th>
                  <th className="py-2.5 px-4 text-right">Total Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                <tr>
                  <td className="py-3 px-4">
                    <div className="font-bold text-slate-900">{productName}</div>
                    <div className="text-[11px] text-slate-500 mt-0.5">Plan: {planName}</div>
                  </td>
                  <td className="py-3 px-3 text-center capitalize text-slate-600 font-medium">
                    {planCycle}
                  </td>
                  <td className="py-3 px-3 text-right font-mono tabular-nums text-slate-900">
                    {quotation.quantity}
                  </td>
                  <td className="py-3 px-3 text-right font-mono tabular-nums text-slate-900">
                    {formatCurrency(quotation.unitPrice)}
                  </td>
                  <td className="py-3 px-4 text-right font-mono font-bold tabular-nums text-slate-900">
                    {formatCurrency(quotation.totalAmount)}
                  </td>
                </tr>
              </tbody>
              <tfoot>
                <tr className="bg-slate-50/80 border-t border-slate-200">
                  <td colSpan={3} className="py-3 px-4 text-[11px] text-slate-500">
                    Taxes and potential discounts are calculated upon subscription activation.
                  </td>
                  <td className="py-3 px-3 text-right font-bold text-slate-700">Total Snapshot:</td>
                  <td className="py-3 px-4 text-right font-mono font-bold text-base text-blue-900 tabular-nums">
                    {formatCurrency(quotation.totalAmount)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>

          {/* Terms & Verification Notice */}
          <div className="p-3 bg-slate-50/80 rounded-xl border border-slate-200/60 text-[11px] text-slate-500 flex items-start gap-2">
            <ShieldCheck className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
            <span>
              This quotation constitutes an official price quote under Brightloop Software Master Service Agreement.
              Upon acceptance, it serves as the authoritative basis for creating recurring subscriptions and automated billing.
            </span>
          </div>

          {/* Interactive Management Actions (Hidden in Print) */}
          <div className="pt-4 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3 print:hidden">
            <div className="flex items-center gap-2">
              {quoteStatus === 'draft' && onEdit && (
                <button
                  onClick={() => onEdit(quotation)}
                  className="px-3 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors flex items-center gap-1.5"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                  <span>Edit Proposal</span>
                </button>
              )}

              {quoteStatus === 'draft' && onSend && quoteId && (
                <button
                  onClick={() => onSend(quoteId)}
                  className="px-3.5 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-xs transition-colors flex items-center gap-1.5"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Send to Customer</span>
                </button>
              )}

              {quoteStatus === 'sent' && onAccept && quoteId && (
                <button
                  onClick={() => onAccept(quoteId)}
                  className="px-3 py-1.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-xs transition-colors flex items-center gap-1.5"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Accept Quotation</span>
                </button>
              )}

              {quoteStatus === 'sent' && onReject && quoteId && (
                <button
                  onClick={() => onReject(quoteId)}
                  className="px-3 py-1.5 text-xs font-medium text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-lg transition-colors flex items-center gap-1.5"
                >
                  <XCircle className="w-3.5 h-3.5" />
                  <span>Reject Quotation</span>
                </button>
              )}
            </div>

            <div className="flex items-center gap-2">
              {quoteStatus === 'accepted' && onConvertToSubscription && (
                <button
                  onClick={() => onConvertToSubscription(quotation)}
                  className="px-3.5 py-1.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-xs transition-colors flex items-center gap-1.5"
                >
                  <span>Convert to Subscription</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              )}

              <button
                onClick={onClose}
                className="px-3.5 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
