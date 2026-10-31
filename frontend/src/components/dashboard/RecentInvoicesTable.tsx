import React, { useState } from 'react';
import { Download, Eye, ExternalLink, FileText, CheckCircle2 } from 'lucide-react';
import { Invoice } from '../../types';
import { StatusBadge } from '../common/StatusBadge';
import { formatCurrency, formatDate } from '../../utils/formatters';

interface RecentInvoicesTableProps {
  invoices: Invoice[];
  onViewAll?: () => void;
}

export const RecentInvoicesTable: React.FC<RecentInvoicesTableProps> = ({ invoices, onViewAll }) => {
  const [activeInvoice, setActiveInvoice] = useState<Invoice | null>(null);
  const [downloadSuccess, setDownloadSuccess] = useState<string | null>(null);

  const handleDownload = (inv: Invoice, e: React.MouseEvent) => {
    e.stopPropagation();
    // Simulate frontend PDF download
    setDownloadSuccess(`Generated ${inv.invoiceNumber}.pdf`);
    setTimeout(() => setDownloadSuccess(null), 3000);
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs flex flex-col">
      {/* Table Header */}
      <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-slate-900">Recent Invoices</h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Billed statements, due dates, outstanding balances and payment receipts
          </p>
        </div>
        {onViewAll && (
          <button
            onClick={onViewAll}
            className="text-xs font-medium text-blue-600 hover:text-blue-700 flex items-center gap-1 transition-colors"
          >
            <span>View All</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {downloadSuccess && (
        <div className="mx-5 my-2 p-2.5 bg-emerald-50 border border-emerald-200 rounded-lg text-xs text-emerald-800 flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{downloadSuccess} downloaded successfully</span>
        </div>
      )}

      {/* Table Content */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="bg-slate-50/75 border-b border-slate-200/80 text-slate-500 uppercase tracking-wider text-[11px] font-semibold">
              <th className="py-3 px-4">Invoice #</th>
              <th className="py-3 px-4">Customer</th>
              <th className="py-3 px-4">Issue Date</th>
              <th className="py-3 px-4">Due Date</th>
              <th className="py-3 px-4">Status</th>
              <th className="py-3 px-4 text-right">Total Amount</th>
              <th className="py-3 px-4 text-center">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {invoices.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-8 text-center text-slate-400">
                  No invoices found for the current period.
                </td>
              </tr>
            ) : (
              invoices.map((inv) => (
                <tr
                  key={inv.id}
                  className="hover:bg-slate-50/80 transition-colors group cursor-pointer"
                  onClick={() => setActiveInvoice(inv)}
                >
                  <td className="py-3 px-4 font-mono font-medium text-slate-900 whitespace-nowrap flex items-center gap-2">
                    <FileText className="w-3.5 h-3.5 text-slate-400" />
                    {inv.invoiceNumber}
                  </td>
                  <td className="py-3 px-4">
                    <div className="font-semibold text-slate-900">{inv.customerName}</div>
                    <div className="text-[11px] text-slate-400">{inv.customerEmail}</div>
                  </td>
                  <td className="py-3 px-4 text-slate-500 tabular-nums">{formatDate(inv.issueDate)}</td>
                  <td className="py-3 px-4 text-slate-500 tabular-nums">
                    <span className={inv.status === 'OVERDUE' ? 'text-rose-600 font-semibold' : ''}>
                      {formatDate(inv.dueDate)}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <StatusBadge status={inv.status} size="sm" />
                  </td>
                  <td className="py-3 px-4 text-right font-semibold text-slate-900 tabular-nums font-mono">
                    {formatCurrency(inv.total ?? inv.amount)}
                  </td>
                  <td className="py-3 px-4 text-center" onClick={(e) => e.stopPropagation()}>
                    <div className="inline-flex items-center gap-1">
                      <button
                        onClick={() => setActiveInvoice(inv)}
                        className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-slate-100 rounded transition-colors"
                        title="View Invoice"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        onClick={(e) => handleDownload(inv, e)}
                        className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-slate-100 rounded transition-colors"
                        title="Download PDF"
                      >
                        <Download className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Invoice Modal */}
      {activeInvoice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 max-w-lg w-full p-6 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                  <FileText className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">{activeInvoice.invoiceNumber}</h3>
                  <p className="text-[11px] text-slate-500">Issued on {formatDate(activeInvoice.issueDate)}</p>
                </div>
              </div>
              <StatusBadge status={activeInvoice.status} />
            </div>

            <div className="py-4 space-y-3 text-xs">
              <div className="flex justify-between py-1.5 border-b border-slate-100">
                <span className="text-slate-500">Bill To</span>
                <span className="font-semibold text-slate-900">{activeInvoice.customerName || 'Customer'}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-100">
                <span className="text-slate-500">Due Date</span>
                <span className="font-semibold text-slate-800 tabular-nums font-mono">
                  {formatDate(activeInvoice.dueDate)}
                </span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-100">
                <span className="text-slate-500">Subtotal</span>
                <span className="tabular-nums font-mono text-slate-700">
                  {formatCurrency(activeInvoice.amount)}
                </span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-100">
                <span className="text-slate-500">Sales Tax (10%)</span>
                <span className="tabular-nums font-mono text-slate-700">
                  {formatCurrency(activeInvoice.tax ?? 0)}
                </span>
              </div>
              {Boolean(activeInvoice.discount && activeInvoice.discount > 0) && (
                <div className="flex justify-between py-1.5 border-b border-slate-100 text-emerald-600">
                  <span>Applied Discount</span>
                  <span className="tabular-nums font-mono">-{formatCurrency(activeInvoice.discount)}</span>
                </div>
              )}
              <div className="flex justify-between py-2 border-t border-slate-200 text-sm font-bold">
                <span className="text-slate-900">Total Due</span>
                <span className="text-blue-600 tabular-nums font-mono">
                  {formatCurrency(activeInvoice.total ?? activeInvoice.amount)}
                </span>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
              <button
                onClick={(e) => handleDownload(activeInvoice, e)}
                className="px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-100 rounded-lg flex items-center gap-1.5 transition-colors border border-slate-200"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download PDF</span>
              </button>

              <button
                onClick={() => setActiveInvoice(null)}
                className="px-4 py-1.5 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
