import React, { useState } from 'react';
import { 
  X, 
  Building2, 
  Mail, 
  Phone, 
  MapPin, 
  CreditCard, 
  Calendar, 
  Plus, 
  MessageSquare, 
  TrendingUp, 
  CheckCircle2, 
  AlertCircle 
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { HealthScore } from '../../types';
import { BrightloopService } from '../../services/api';
import { formatINR } from '../../utils/formatters';

export const CustomerDrawer: React.FC = () => {
  const { 
    selectedCustomer, 
    setSelectedCustomer, 
    subscriptions, 
    refreshData, 
    addToast 
  } = useApp();

  const [noteTitle, setNoteTitle] = useState('');
  const [noteBody, setNoteBody] = useState('');
  const [isAddingNote, setIsAddingNote] = useState(false);
  const [healthReason, setHealthReason] = useState('');

  if (!selectedCustomer) return null;

  const cust = selectedCustomer;
  const custSubs = subscriptions.filter(s => s.customerId === cust.id);

  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!noteTitle.trim()) return;

    try {
      const updated = await BrightloopService.addCustomerNote(cust.id, noteTitle, noteBody);
      addToast('Note Added', `Logged new activity for ${cust.company}.`, 'success');
      setSelectedCustomer(updated);
      setNoteTitle('');
      setNoteBody('');
      setIsAddingNote(false);
      await refreshData();
    } catch {
      addToast('Error', 'Could not save customer note.', 'error');
    }
  };

  const handleHealthChange = async (newScore: HealthScore) => {
    const reason = prompt('Specify justification for health score change:', cust.healthReason || '');
    if (reason === null) return;

    try {
      const updated = await BrightloopService.updateCustomerHealth(cust.id, newScore, reason);
      addToast('Health Score Updated', `${cust.company} is now marked ${newScore.toUpperCase()}.`, 'info');
      setSelectedCustomer(updated);
      await refreshData();
    } catch {
      addToast('Error', 'Could not update health score.', 'error');
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex justify-end">
      <div className="bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 w-full max-w-xl h-full shadow-2xl flex flex-col animate-in slide-in-from-right duration-200">
        {/* Drawer Header */}
        <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950/50 border border-indigo-200 dark:border-indigo-800 flex items-center justify-center font-bold text-indigo-700 dark:text-indigo-300 text-lg">
              {cust.company.substring(0, 2).toUpperCase()}
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                {cust.company}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Primary Contact: {cust.name} · Assigned CSM: {cust.csmName}
              </p>
            </div>
          </div>

          <button
            onClick={() => setSelectedCustomer(null)}
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Drawer Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Key Metrics Cards */}
          <div className="grid grid-cols-3 gap-3 text-center">
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-850 border border-slate-100 dark:border-slate-800">
              <span className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">Current MRR</span>
              <div className="text-base font-bold font-mono text-slate-900 dark:text-white mt-0.5 tabular-nums">
                {formatINR(cust.currentMrr)}
              </div>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-850 border border-slate-100 dark:border-slate-800">
              <span className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">Lifetime Value</span>
              <div className="text-base font-bold font-mono text-slate-900 dark:text-white mt-0.5 tabular-nums">
                {formatINR(cust.lifetimeValue)}
              </div>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-850 border border-slate-100 dark:border-slate-800">
              <span className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">Tier</span>
              <div className="text-xs font-bold text-indigo-600 dark:text-indigo-400 mt-1 truncate">
                {cust.tier}
              </div>
            </div>
          </div>

          {/* Health Score Controls */}
          <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-850/50 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-slate-800 dark:text-slate-200">Account Health & Risk Rating:</span>
              <div className="flex items-center gap-1">
                {(['healthy', 'neutral', 'at_risk'] as HealthScore[]).map(sc => (
                  <button
                    key={sc}
                    onClick={() => handleHealthChange(sc)}
                    className={`px-2 py-0.5 rounded text-[11px] font-medium capitalize transition-colors ${
                      cust.healthScore === sc
                        ? sc === 'healthy'
                          ? 'bg-emerald-600 text-white'
                          : sc === 'neutral'
                          ? 'bg-amber-600 text-white'
                          : 'bg-rose-600 text-white'
                        : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700'
                    }`}
                  >
                    {sc.replace('_', ' ')}
                  </button>
                ))}
              </div>
            </div>
            {cust.healthReason && (
              <p className="text-xs text-slate-600 dark:text-slate-400 italic">
                "{cust.healthReason}"
              </p>
            )}
          </div>

          {/* Contact & Billing Meta */}
          <div className="space-y-2 text-xs">
            <h4 className="font-semibold text-slate-900 dark:text-white uppercase tracking-wider text-[11px]">
              Profile & Payment Details
            </h4>
            <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 space-y-2 bg-white dark:bg-slate-900">
              <div className="flex items-center justify-between">
                <span className="text-slate-500 flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5" />
                  <span>Email:</span>
                </span>
                <span className="font-mono text-slate-900 dark:text-white">{cust.email}</span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-slate-500 flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5" />
                  <span>Phone:</span>
                </span>
                <span className="text-slate-900 dark:text-white">{cust.phone}</span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-slate-500 flex items-center gap-1.5">
                  <CreditCard className="w-3.5 h-3.5" />
                  <span>Method on File:</span>
                </span>
                <span className="font-mono text-slate-900 dark:text-white">
                  {cust.paymentMethod.brand} ···· {cust.paymentMethod.last4} (exp {cust.paymentMethod.expiry})
                </span>
              </div>

              <div className="flex items-start justify-between pt-1">
                <span className="text-slate-500 flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5" />
                  <span>Billing Address:</span>
                </span>
                <span className="text-slate-700 dark:text-slate-300 text-right max-w-[240px]">
                  {cust.billingAddress.street}, {cust.billingAddress.city}, {cust.billingAddress.state} {cust.billingAddress.postalCode}, {cust.billingAddress.country}
                </span>
              </div>
            </div>
          </div>

          {/* Subscribed Services */}
          <div className="space-y-2 text-xs">
            <h4 className="font-semibold text-slate-900 dark:text-white uppercase tracking-wider text-[11px]">
              Active Subscriptions ({custSubs.length})
            </h4>
            {custSubs.map(sub => (
              <div key={sub.id} className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center justify-between">
                <div>
                  <div className="font-bold text-slate-900 dark:text-white">{sub.planName}</div>
                  <div className="text-[11px] text-slate-500">
                    {sub.seats} seats · Renews {sub.currentPeriodEnd}
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-mono font-bold text-slate-900 dark:text-white tabular-nums">
                    {formatINR(sub.amount)}/{sub.billingCycle}
                  </div>
                  <span className={`inline-block px-1.5 py-0.2 rounded text-[10px] font-medium capitalize mt-0.5 ${
                    sub.status === 'active' ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'
                  }`}>
                    {sub.status}
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* CSM Notes & Lifecycle Events Timeline */}
          <div className="space-y-3 text-xs">
            <div className="flex items-center justify-between">
              <h4 className="font-semibold text-slate-900 dark:text-white uppercase tracking-wider text-[11px]">
                Lifecycle Timeline & CSM Logs
              </h4>
              <button
                onClick={() => setIsAddingNote(!isAddingNote)}
                className="text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1 font-medium text-xs"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Note</span>
              </button>
            </div>

            {/* Note form */}
            {isAddingNote && (
              <form onSubmit={handleAddNote} className="p-3 rounded-xl border border-indigo-200 dark:border-indigo-800 bg-indigo-50/40 dark:bg-indigo-950/20 space-y-2">
                <input
                  type="text"
                  placeholder="Activity Title (e.g. QBR Meeting, Payment Followup)..."
                  value={noteTitle}
                  onChange={e => setNoteTitle(e.target.value)}
                  className="w-full px-2.5 py-1.5 text-xs rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                  required
                />
                <textarea
                  rows={2}
                  placeholder="Details and next steps..."
                  value={noteBody}
                  onChange={e => setNoteBody(e.target.value)}
                  className="w-full px-2.5 py-1.5 text-xs rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                />
                <div className="flex justify-end gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setIsAddingNote(false)}
                    className="px-2.5 py-1 text-slate-500 hover:text-slate-800"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-3 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded font-medium"
                  >
                    Save Note
                  </button>
                </div>
              </form>
            )}

            {/* Event list */}
            <div className="relative pl-4 space-y-4 before:absolute before:left-1.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200 dark:before:bg-slate-800">
              {cust.lifecycleEvents.map(ev => (
                <div key={ev.id} className="relative">
                  <div className="absolute -left-4 top-1 w-2.5 h-2.5 rounded-full bg-indigo-600 border-2 border-white dark:border-slate-900" />
                  <div className="text-slate-400 text-[10px] font-mono">{ev.date}</div>
                  <div className="font-semibold text-slate-900 dark:text-white">{ev.title}</div>
                  <div className="text-slate-600 dark:text-slate-400 text-xs mt-0.5">{ev.description}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
