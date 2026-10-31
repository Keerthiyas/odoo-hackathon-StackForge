import React, { useState } from 'react';
import { Receipt, Plus, Globe, ShieldCheck } from 'lucide-react';
import { StatusBadge } from '../../components/common/StatusBadge';

interface TaxRule {
  id: string;
  name: string;
  jurisdiction: string;
  rate: number;
  type: 'Sales Tax' | 'VAT' | 'GST';
  isDefault: boolean;
  status: 'ACTIVE' | 'ARCHIVED';
}

const INITIAL_TAXES: TaxRule[] = [
  {
    id: 'tax_01',
    name: 'US Standard State Tax',
    jurisdiction: 'United States (Default)',
    rate: 8.5,
    type: 'Sales Tax',
    isDefault: true,
    status: 'ACTIVE',
  },
  {
    id: 'tax_02',
    name: 'EU Digital Services VAT',
    jurisdiction: 'European Union',
    rate: 20.0,
    type: 'VAT',
    isDefault: false,
    status: 'ACTIVE',
  },
  {
    id: 'tax_03',
    name: 'UK Standard VAT',
    jurisdiction: 'United Kingdom',
    rate: 20.0,
    type: 'VAT',
    isDefault: false,
    status: 'ACTIVE',
  },
  {
    id: 'tax_04',
    name: 'Australia GST',
    jurisdiction: 'Australia',
    rate: 10.0,
    type: 'GST',
    isDefault: false,
    status: 'ACTIVE',
  },
];

export const TaxesPage: React.FC = () => {
  const [taxes] = useState<TaxRule[]>(INITIAL_TAXES);
  const [toast, setToast] = useState<string | null>(null);

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900">Tax Configurations</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Jurisdiction tax rates, international VAT compliance, digital services levies, and exemption rules
          </p>
        </div>
        <button
          onClick={() => {
            setToast('Tax rule creation modal ready.');
            setTimeout(() => setToast(null), 3000);
          }}
          className="px-3.5 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-xs flex items-center gap-1.5 transition-colors self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Add Tax Rate</span>
        </button>
      </div>

      {toast && (
        <div className="p-3 bg-blue-50 border border-blue-200 text-blue-800 rounded-xl text-xs flex items-center justify-between animate-in fade-in">
          <span>{toast}</span>
          <span className="text-[10px] text-blue-500 font-mono">Notice</span>
        </div>
      )}

      {/* Table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50/75 border-b border-slate-200/80 text-slate-500 uppercase tracking-wider text-[11px] font-semibold">
                <th className="py-3 px-4">Tax Name</th>
                <th className="py-3 px-4">Jurisdiction</th>
                <th className="py-3 px-4">Tax Type</th>
                <th className="py-3 px-4 text-right">Tax Rate (%)</th>
                <th className="py-3 px-4">Default Rule</th>
                <th className="py-3 px-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {taxes.map((tax) => (
                <tr key={tax.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-3 px-4 font-semibold text-slate-900 flex items-center gap-2">
                    <Receipt className="w-4 h-4 text-slate-400" />
                    {tax.name}
                  </td>
                  <td className="py-3 px-4 text-slate-600">{tax.jurisdiction}</td>
                  <td className="py-3 px-4 text-slate-700 font-mono">{tax.type}</td>
                  <td className="py-3 px-4 text-right font-bold text-slate-900 tabular-nums font-mono">
                    {tax.rate.toFixed(1)}%
                  </td>
                  <td className="py-3 px-4">
                    {tax.isDefault ? (
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-blue-600 bg-blue-50 px-2 py-0.5 rounded">
                        <ShieldCheck className="w-3 h-3" /> Default
                      </span>
                    ) : (
                      <span className="text-[11px] text-slate-400">Jurisdiction-only</span>
                    )}
                  </td>
                  <td className="py-3 px-4">
                    <StatusBadge status={tax.status} size="sm" />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
