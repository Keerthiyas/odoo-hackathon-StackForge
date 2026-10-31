import React, { useState } from 'react';
import { Percent, Plus, Tag, Calendar, Copy, Check } from 'lucide-react';
import { StatusBadge } from '../../components/common/StatusBadge';

interface CouponItem {
  id: string;
  code: string;
  type: 'percentage' | 'fixed';
  value: number;
  appliesTo: string;
  redemptions: number;
  maxRedemptions: number;
  status: 'ACTIVE' | 'ARCHIVED';
  expiresAt: string;
}

const INITIAL_COUPONS: CouponItem[] = [
  {
    id: 'disc_01',
    code: 'STARTUP20',
    type: 'percentage',
    value: 20,
    appliesTo: 'Growth Plan (First 3 Months)',
    redemptions: 142,
    maxRedemptions: 500,
    status: 'ACTIVE',
    expiresAt: '2026-12-31',
  },
  {
    id: 'disc_02',
    code: 'ANNUAL100',
    type: 'fixed',
    value: 100,
    appliesTo: 'All Annual Contracts',
    redemptions: 89,
    maxRedemptions: 200,
    status: 'ACTIVE',
    expiresAt: '2026-11-30',
  },
  {
    id: 'disc_03',
    code: 'PARTNER50',
    type: 'percentage',
    value: 50,
    appliesTo: 'Enterprise Pilot Program',
    redemptions: 12,
    maxRedemptions: 20,
    status: 'ACTIVE',
    expiresAt: '2026-11-15',
  },
];

export const DiscountsPage: React.FC = () => {
  const [coupons] = useState<CouponItem[]>(INITIAL_COUPONS);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const copyToClipboard = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900">Discounts & Coupons</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Promotional codes, volume discounts, partnership coupons, and retention incentives
          </p>
        </div>
        <button
          onClick={() => {
            setToast('Discount code creation wizard ready for backend.');
            setTimeout(() => setToast(null), 3000);
          }}
          className="px-3.5 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-xs flex items-center gap-1.5 transition-colors self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>New Discount Code</span>
        </button>
      </div>

      {toast && (
        <div className="p-3 bg-blue-50 border border-blue-200 text-blue-800 rounded-xl text-xs flex items-center justify-between animate-in fade-in">
          <span>{toast}</span>
          <span className="text-[10px] text-blue-500 font-mono">Info</span>
        </div>
      )}

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {coupons.map((coupon) => (
          <div
            key={coupon.id}
            className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                    <Percent className="w-3.5 h-3.5" />
                  </div>
                  <span className="font-bold text-slate-900 text-sm">
                    {coupon.type === 'percentage' ? `${coupon.value}% OFF` : `$${coupon.value} OFF`}
                  </span>
                </div>
                <StatusBadge status={coupon.status} size="sm" />
              </div>

              <div className="mt-4 p-2.5 bg-slate-50 border border-dashed border-slate-200 rounded-lg flex items-center justify-between">
                <span className="font-mono font-bold text-slate-900 text-xs tracking-wider">
                  {coupon.code}
                </span>
                <button
                  onClick={() => copyToClipboard(coupon.code)}
                  className="p-1 text-slate-400 hover:text-blue-600 rounded transition-colors"
                  title="Copy coupon code"
                >
                  {copiedCode === coupon.code ? (
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                  ) : (
                    <Copy className="w-3.5 h-3.5" />
                  )}
                </button>
              </div>

              <p className="text-xs text-slate-600 mt-3 font-medium">{coupon.appliesTo}</p>
            </div>

            <div className="pt-4 mt-4 border-t border-slate-100 text-xs text-slate-500 space-y-1.5">
              <div className="flex justify-between text-[11px]">
                <span>Usage Limit:</span>
                <span className="font-semibold text-slate-800 tabular-nums">
                  {coupon.redemptions} / {coupon.maxRedemptions} redeemed
                </span>
              </div>
              <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                <div
                  className="bg-blue-600 h-full rounded-full"
                  style={{ width: `${(coupon.redemptions / coupon.maxRedemptions) * 100}%` }}
                />
              </div>
              <div className="flex justify-between text-[10px] text-slate-400 pt-1">
                <span>Expires: {coupon.expiresAt}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
