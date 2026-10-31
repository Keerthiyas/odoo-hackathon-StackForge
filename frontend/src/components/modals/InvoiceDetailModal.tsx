import React from 'react';
import { X, Printer, CheckCircle, Download, FileText, Zap } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { BrightloopService } from '../../services/api';
import { formatINR } from '../../utils/formatters';

export const InvoiceDetailModal: React.FC = () => {
  const { 
    selectedInvoice, 
    setSelectedInvoice, 
    canPerformAction, 
    refreshData, 
    addToast 
  } = useApp();

  if (!selectedInvoice) return null;

  const inv = selectedInvoice;

  const handlePrint = () => {
    window.print();
  };

  const handleMarkPaid = async () => {
    try {
      await BrightloopService.markInvoicePaid(inv.id);
      addToast('Invoice Reconciled', `${inv.invoiceNumber} is marked as PAID.`, 'success');
      setSelectedInvoice({ ...inv, status: 'paid', paidAt: new Date().toISOString().split('T')[0] });
      await refreshData();
    } catch {
      addToast('Error', 'Could not update invoice.', 'error');
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 print:p-0 print:bg-white">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-2xl w-full p-8 shadow-2xl animate-in fade-in zoom-in-95 duration-150 max-h-[92vh] overflow-y-auto print:border-none print:shadow-none print:max-w-none print:p-0">
        {/* Modal Controls (Hidden in Print) */}
        <div className="flex items-center justify-between pb-6 border-b border-slate-100 dark:border-slate-800 print:hidden">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Invoice Statement
            </span>
            <span className={`px-2 py-0.5 rounded text-xs font-medium uppercase font-mono ${
              inv.status === 'paid' 
                ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300' 
                : inv.status === 'overdue'
                ? 'bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300'
                : 'bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300'
            }`}>
              {inv.status}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 transition-colors"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print / PDF</span>
            </button>

            {canPerformAction('issue_invoice') && (inv.status === 'open' || inv.status === 'overdue') && (
              <button
                onClick={handleMarkPaid}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white transition-colors"
              >
                <CheckCircle className="w-3.5 h-3.5" />
                <span>Mark as Paid</span>
              </button>
            )}

            <button
              onClick={() => setSelectedInvoice(null)}
              className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Printable Invoice Document Body */}
        <div className="py-6 space-y-6">
          {/* Header & Logo */}
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center text-white font-bold">
                <Zap className="w-5 h-5 fill-current" />
              </div>
              <div>
                <h2 className="text-base font-bold text-slate-900 dark:text-white leading-none">
                  StackForge Platforms, Inc.
                </h2>
                <p className="text-xs text-slate-500 mt-1">
                  Subscription Infrastructure & Billing Engine
                </p>
                <p className="text-[11px] text-slate-400 font-mono mt-0.5">
                  GSTIN: 27AABCS1429B1Z
                </p>
              </div>
            </div>

            <div className="text-right">
              <span className="text-xs text-slate-400 uppercase tracking-widest font-mono">Invoice Reference</span>
              <div className="text-lg font-bold font-mono text-slate-900 dark:text-white mt-0.5">
                {inv.invoiceNumber}
              </div>
              <div className="text-xs text-slate-500 mt-1">
                Issued: <span className="font-mono text-slate-800 dark:text-slate-200">{inv.issueDate}</span>
              </div>
              <div className="text-xs text-slate-500">
                Due: <span className="font-mono text-slate-800 dark:text-slate-200">{inv.dueDate}</span>
              </div>
            </div>
          </div>

          {/* Bill To Info */}
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-850 border border-slate-100 dark:border-slate-800 grid grid-cols-2 gap-4 text-xs">
            <div>
              <span className="font-semibold text-slate-500 uppercase tracking-wider text-[10px]">
                Billed To
              </span>
              <div className="font-bold text-slate-900 dark:text-white mt-1 text-sm">
                {inv.customerCompany}
              </div>
              <div className="text-slate-600 dark:text-slate-400 mt-0.5">
                Attn: {inv.customerName}
              </div>
              <div className="text-slate-500 font-mono mt-0.5">
                {inv.customerEmail}
              </div>
            </div>

            <div className="text-right">
              <span className="font-semibold text-slate-500 uppercase tracking-wider text-[10px]">
                Payment Status
              </span>
              <div className="font-bold text-slate-900 dark:text-white mt-1 text-sm capitalize">
                {inv.status}
              </div>
              {inv.paidAt && (
                <div className="text-emerald-600 dark:text-emerald-400 font-mono text-[11px] mt-0.5">
                  Settled on {inv.paidAt}
                </div>
              )}
              {inv.notes && (
                <div className="text-slate-500 text-[11px] mt-1 italic max-w-xs ml-auto">
                  {inv.notes}
                </div>
              )}
            </div>
          </div>

          {/* Line Items Table */}
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-100/70 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-y border-slate-200 dark:border-slate-700">
              <tr>
                <th className="py-2.5 px-3 font-semibold">Description</th>
                <th className="py-2.5 px-3 font-semibold text-center w-16">Qty</th>
                <th className="py-2.5 px-3 font-semibold text-right w-24">Unit Price</th>
                <th className="py-2.5 px-3 font-semibold text-right w-24">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {inv.lineItems.map(item => (
                <tr key={item.id}>
                  <td className="py-3 px-3 font-medium text-slate-900 dark:text-white">
                    {item.description}
                  </td>
                  <td className="py-3 px-3 text-center font-mono text-slate-600 dark:text-slate-300">
                    {item.quantity}
                  </td>
                  <td className="py-3 px-3 text-right font-mono text-slate-600 dark:text-slate-300">
                    {formatINR(item.unitPrice)}
                  </td>
                  <td className="py-3 px-3 text-right font-mono font-semibold text-slate-900 dark:text-white">
                    {formatINR(item.amount)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Financial Calculation Summary */}
          <div className="flex justify-end pt-2">
            <div className="w-64 space-y-2 text-xs">
              <div className="flex items-center justify-between text-slate-600 dark:text-slate-400">
                <span>Subtotal:</span>
                <span className="font-mono text-slate-900 dark:text-white font-medium">
                  {formatINR(inv.subtotal)}
                </span>
              </div>

              {inv.discount > 0 && (
                <div className="flex items-center justify-between text-emerald-600 dark:text-emerald-400">
                  <span>Discounts Applied:</span>
                  <span className="font-mono">
                    -{formatINR(inv.discount)}
                  </span>
                </div>
              )}

              <div className="flex items-center justify-between text-slate-600 dark:text-slate-400">
                <span>Estimated Tax (GST):</span>
                <span className="font-mono text-slate-900 dark:text-white font-medium">
                  {formatINR(inv.tax)}
                </span>
              </div>

              <div className="pt-2 border-t border-slate-200 dark:border-slate-700 flex items-center justify-between font-bold text-sm text-slate-900 dark:text-white">
                <span>Balance Due:</span>
                <span className="font-mono text-indigo-600 dark:text-indigo-400 text-base">
                  {formatINR(inv.total)}
                </span>
              </div>
            </div>
          </div>

          {/* Remittance Info Footer */}
          <div className="pt-6 border-t border-slate-100 dark:border-slate-800 text-[11px] text-slate-400 space-y-1">
            <p>
              Please remit payment within 15 days of invoice date. UPI / Net Banking / RTGS supported.
            </p>
            <p>
              Questions? Contact billing@stackforge.io.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
