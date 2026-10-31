import React, { useState } from 'react';
import { 
  Radio, 
  Zap, 
  CheckCircle, 
  AlertCircle, 
  RefreshCcw, 
  Terminal, 
  Send, 
  ShieldCheck, 
  Server,
  CreditCard
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { BrightloopService } from '../../services/api';

export const GatewayWebhooksView: React.FC = () => {
  const { subscriptions, refreshData, addToast, backendStatus, checkBackend } = useApp();

  const [selectedEventType, setSelectedEventType] = useState<'payment_succeeded' | 'payment_failed' | 'subscription_canceled' | 'trial_ended'>('payment_succeeded');
  const [selectedSubId, setSelectedSubId] = useState<string>(subscriptions[0]?.id || '');
  const [isSimulating, setIsSimulating] = useState(false);
  const [lastWebhookPayload, setLastWebhookPayload] = useState<any | null>(null);

  const handleSimulateWebhook = async () => {
    setIsSimulating(true);
    try {
      const targetSub = subscriptions.find(s => s.id === selectedSubId) || subscriptions[0];
      const result = await BrightloopService.simulateWebhook(selectedEventType, targetSub?.id);

      const generatedPayload = {
        id: `evt_${Date.now().toString(36)}`,
        object: 'event',
        api_version: '2026-10-30',
        created: Math.floor(Date.now() / 1000),
        type: result.event,
        data: {
          object: {
            id: targetSub?.id || 'sub_demo',
            customer: targetSub?.customerId,
            customer_email: targetSub?.customerEmail,
            amount: targetSub ? targetSub.amount * 100 : 49900,
            currency: 'usd',
            status: selectedEventType === 'payment_failed' ? 'past_due' : 'active',
          },
        },
      };

      setLastWebhookPayload(generatedPayload);

      if (result.success) {
        addToast(`Webhook: ${result.event}`, result.message, 'success');
        await refreshData();
      } else {
        addToast('Webhook Dispatch', result.message, 'warning');
      }
    } catch {
      addToast('Error', 'Failed to dispatch webhook event.', 'error');
    } finally {
      setIsSimulating(false);
    }
  };

  const handleResetData = () => {
    if (confirm('Reset demo state back to factory default mock records?')) {
      BrightloopService.resetToDefault();
      refreshData();
      addToast('Factory Data Restored', 'Reset all customers, subscriptions, and invoices to initial state.', 'info');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
            Gateways
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Payment processor connections and webhook endpoints.
          </p>
        </div>

        <button
          onClick={handleResetData}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-750 transition-colors self-start sm:self-auto"
        >
          <RefreshCcw className="w-3.5 h-3.5" />
          <span>Reset Data</span>
        </button>
      </div>

      {/* Gateway Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-900 dark:text-white flex items-center gap-1.5">
              <CreditCard className="w-4 h-4 text-indigo-600" />
              <span>Stripe Connect</span>
            </span>
            <span className="text-[11px] font-medium text-emerald-600 dark:text-emerald-400">
              Active / Healthy
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
            Primary card payment gateway with 3D-Secure 2.0 and automated smart retries.
          </p>
          <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-500">
            <span>Webhook Status:</span>
            <span className="font-mono text-emerald-600 font-medium">Listening (100% 200 OK)</span>
          </div>
        </div>

        <div className="p-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-900 dark:text-white flex items-center gap-1.5">
              <Radio className="w-4 h-4 text-emerald-600" />
              <span>Adyen Global B2B</span>
            </span>
            <span className="text-[11px] font-medium text-emerald-600 dark:text-emerald-400">
              Active
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
            Handles European SEPA direct debit and cross-border bank wire transfers.
          </p>
          <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-500">
            <span>Reconciliation:</span>
            <span className="font-mono text-slate-700 dark:text-slate-300">Daily T+1</span>
          </div>
        </div>

        <div className="p-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-900 dark:text-white flex items-center gap-1.5">
              <Server className="w-4 h-4 text-amber-500" />
              <span>Backend API Server</span>
            </span>
            <span className={`text-[11px] font-medium ${backendStatus.online ? 'text-emerald-600' : 'text-amber-500'}`}>
              {backendStatus.online ? 'Online' : 'Local Fallback'}
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
            Configured target: <code className="font-mono text-[11px] bg-slate-100 dark:bg-slate-800 px-1 py-0.5 rounded">{backendStatus.url}</code>
          </p>
          <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-500">
            <span>Test Ping:</span>
            <button
              onClick={() => {
                checkBackend();
                addToast('Ping Tested', `Tested connection to ${backendStatus.url}.`, 'info');
              }}
              className="text-indigo-600 dark:text-indigo-400 hover:underline font-medium"
            >
              Re-check Ping
            </button>
          </div>
        </div>
      </div>

      {/* Webhook Testing Simulator */}
      <div className="p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-6">
        <div>
          <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Terminal className="w-4 h-4 text-indigo-600" />
            <span>Webhook Events</span>
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Test incoming gateway events to verify automated status transitions and invoicing.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
              Webhook Event Type
            </label>
            <select
              value={selectedEventType}
              onChange={e => setSelectedEventType(e.target.value as any)}
              className="mt-1 w-full px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-1 focus:ring-indigo-500"
            >
              <option value="payment_succeeded">invoice.payment_succeeded (Auto-settle & Renew)</option>
              <option value="payment_failed">invoice.payment_failed (Trigger Past Due & Dunning)</option>
              <option value="subscription_canceled">customer.subscription.deleted (Cancel & Churn)</option>
              <option value="trial_ended">customer.subscription.trial_will_end (Convert Trial)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
              Target Subscription Account
            </label>
            <select
              value={selectedSubId}
              onChange={e => setSelectedSubId(e.target.value)}
              className="mt-1 w-full px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-1 focus:ring-indigo-500"
            >
              {subscriptions.map(s => (
                <option key={s.id} value={s.id}>
                  {s.customerCompany} — {s.planName} (${s.amount}/{s.billingCycle}) [{s.status}]
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex items-center justify-between pt-2">
          <span className="text-xs text-slate-500 dark:text-slate-400">
            Clicking will emit the event and mutate client-side state in real-time.
          </span>
          <button
            onClick={handleSimulateWebhook}
            disabled={isSimulating}
            className="flex items-center gap-2 px-4 py-2 text-xs font-medium rounded-lg bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white transition-colors shadow-xs"
          >
            <Send className="w-3.5 h-3.5" />
            <span>{isSimulating ? 'Dispatching...' : 'Dispatch Simulated Webhook'}</span>
          </button>
        </div>

        {/* Live Payload Preview */}
        {lastWebhookPayload && (
          <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                Last Received Webhook Payload (HTTP 200)
              </span>
              <span className="text-[11px] font-mono text-emerald-600 dark:text-emerald-400 font-medium">
                SUCCESS
              </span>
            </div>
            <pre className="p-4 rounded-xl bg-slate-950 text-slate-200 font-mono text-xs overflow-x-auto max-h-56 leading-relaxed">
              {JSON.stringify(lastWebhookPayload, null, 2)}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
};
