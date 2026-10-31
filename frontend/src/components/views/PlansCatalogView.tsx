import React, { useState, useEffect } from 'react';
import { 
  Check, 
  Layers, 
  Sparkles, 
  Settings, 
  Edit3, 
  ShieldCheck, 
  Zap,
  Users,
  Cpu,
  Plus,
  Search,
  Trash2,
  Power,
  RefreshCw,
  Table,
  Grid
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Plan, PlanModel, Product } from '../../types';
import { BrightloopService } from '../../services/api';
import { planService } from '../../services/planService';
import { productService } from '../../services/productService';
import { CreatePlanModal } from '../modals/CreatePlanModal';
import { formatINR } from '../../utils/formatters';

export const PlansCatalogView: React.FC = () => {
  const { plans: contextPlans, canPerformAction, refreshData, addToast, setIsCreateSubOpen, setCurrentView, refreshKey, triggerRefresh } = useApp();
  const [activeTab, setActiveTab] = useState<'matrix' | 'table'>('table');
  const [billingInterval, setBillingInterval] = useState<'monthly' | 'annual'>('monthly');

  // Phase 2 Mongoose Plans data
  const [mongoosePlans, setMongoosePlans] = useState<PlanModel[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loadingMongoose, setLoadingMongoose] = useState<boolean>(true);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [productFilter, setProductFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');

  // Modals state
  const [isCreatePlanOpen, setIsCreatePlanOpen] = useState(false);
  const [planToEdit, setPlanToEdit] = useState<PlanModel | null>(null);

  // Edit tier plan state (from legacy contextPlans)
  const [editingPlan, setEditingPlan] = useState<Plan | null>(null);
  const [editPrice, setEditPrice] = useState<number>(0);
  const [editSeats, setEditSeats] = useState<number>(0);
  const [editCalls, setEditCalls] = useState<number>(0);

  const loadMongooseData = async () => {
    setLoadingMongoose(true);
    try {
      const [fetchedPlans, fetchedProducts] = await Promise.all([
        planService.getPlans(),
        productService.getProducts()
      ]);
      setMongoosePlans(fetchedPlans);
      setProducts(fetchedProducts);
    } catch (err: any) {
      addToast('Error', err.message || 'Could not load plans catalog.', 'error');
    } finally {
      setLoadingMongoose(false);
    }
  };

  useEffect(() => {
    loadMongooseData();
  }, [refreshKey]);

  const handleTogglePlanStatus = async (plan: PlanModel) => {
    const nextStatus = plan.status === 'active' ? 'inactive' : 'active';
    try {
      await planService.updatePlan(plan._id, { status: nextStatus });
      addToast('Plan Updated', `${plan.name} status changed to ${nextStatus}.`, 'success');
      triggerRefresh();
    } catch (err: any) {
      addToast('Error', err.message || 'Could not update plan status.', 'error');
    }
  };

  const handleDeletePlan = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete plan "${name}"?`)) return;
    try {
      await planService.deletePlan(id);
      addToast('Plan Deleted', `Plan "${name}" removed.`, 'success');
      triggerRefresh();
    } catch (err: any) {
      addToast('Error', err.message || 'Could not delete plan.', 'error');
    }
  };

  const startEditLegacyPlan = (plan: Plan) => {
    setEditingPlan(plan);
    setEditPrice(billingInterval === 'annual' ? plan.annualPrice : plan.monthlyPrice);
    setEditSeats(plan.maxSeats);
    setEditCalls(plan.maxApiCalls);
  };

  const handleSaveLegacyPlan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPlan) return;

    try {
      const updates: Partial<Plan> = {
        maxSeats: Number(editSeats),
        maxApiCalls: Number(editCalls),
      };
      if (billingInterval === 'annual') {
        updates.annualPrice = Number(editPrice);
      } else {
        updates.monthlyPrice = Number(editPrice);
      }

      await BrightloopService.updatePlan(editingPlan.id, updates);
      addToast('Plan Updated', `${editingPlan.name} tier configurations updated.`, 'success');
      setEditingPlan(null);
      await refreshData();
    } catch {
      addToast('Error', 'Could not update plan configurations.', 'error');
    }
  };

  // Filtered Mongoose plans
  const filteredPlans = mongoosePlans.filter(p => {
    const matchesSearch = 
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.code.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesProduct = productFilter === 'all' || p.product === productFilter;
    const matchesStatus = statusFilter === 'all' || p.status === statusFilter;
    return matchesSearch && matchesProduct && matchesStatus;
  });

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
            Products & Plans
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Subscription pricing, billing intervals, and feature tiers.
          </p>
        </div>

        {/* View Switcher and Actions */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Sub-Tab Navigation */}
          <div className="flex items-center p-1 bg-slate-100 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 text-xs">
            <button
              onClick={() => setCurrentView('products')}
              className="px-3 py-1.5 rounded-md font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
            >
              Products ({products.length})
            </button>
            <button
              onClick={() => setCurrentView('plans')}
              className="px-3 py-1.5 rounded-md font-semibold bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs"
            >
              Plans ({mongoosePlans.length})
            </button>
          </div>

          <div className="flex items-center p-1 bg-slate-100 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 text-xs">
            <button
              onClick={() => setActiveTab('table')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md font-medium transition-colors ${
                activeTab === 'table'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              <Table className="w-3.5 h-3.5" />
              <span>Table</span>
            </button>
            <button
              onClick={() => setActiveTab('matrix')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md font-medium transition-colors ${
                activeTab === 'matrix'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              <Grid className="w-3.5 h-3.5" />
              <span>Tier Matrix</span>
            </button>
          </div>

          <button
            onClick={() => {
              setPlanToEdit(null);
              setIsCreatePlanOpen(true);
            }}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-xs transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Create Plan</span>
          </button>
        </div>
      </div>

      {activeTab === 'table' ? (
        /* ==================== MONGOOSE PLAN MANAGEMENT TABLE ==================== */
        <div className="space-y-4">
          {/* Filters Bar */}
          <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
            <div className="relative flex-1 max-w-sm">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search plans by name or code..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 focus:ring-1 focus:ring-indigo-500"
              />
            </div>

            <div className="flex items-center gap-3 flex-wrap">
              <div className="flex items-center gap-1.5">
                <span className="text-slate-500">Product:</span>
                <select
                  value={productFilter}
                  onChange={e => setProductFilter(e.target.value)}
                  className="px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                >
                  <option value="all">All Products</option>
                  {products.map(p => (
                    <option key={p._id} value={p._id}>{p.name}</option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-1.5">
                <span className="text-slate-500">Status:</span>
                <select
                  value={statusFilter}
                  onChange={e => setStatusFilter(e.target.value as any)}
                  className="px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                >
                  <option value="all">All Statuses</option>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>

              <button
                onClick={loadMongooseData}
                disabled={loadingMongoose}
                className="p-1.5 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white rounded-lg border border-slate-200 dark:border-slate-700"
                title="Refresh Plans"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loadingMongoose ? 'animate-spin text-indigo-500' : ''}`} />
              </button>
            </div>
          </div>

          {/* Table */}
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50/80 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-wider">
                  <tr>
                    <th className="py-3 px-4">Plan Name & Code</th>
                    <th className="py-3 px-4">Associated Product</th>
                    <th className="py-3 px-4 text-right">Price</th>
                    <th className="py-3 px-4 text-center">Billing Cycle</th>
                    <th className="py-3 px-4 text-center">Lifecycle Policies</th>
                    <th className="py-3 px-4 text-center">Status</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
                  {loadingMongoose ? (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-slate-400">
                        <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-indigo-500" />
                        Loading subscription plans...
                      </td>
                    </tr>
                  ) : filteredPlans.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-slate-500">
                        <Layers className="w-8 h-8 mx-auto mb-2 text-slate-400 stroke-1" />
                        <p className="font-medium text-slate-700 dark:text-slate-300">No plans found</p>
                        <p className="text-xs text-slate-400 mt-1">Adjust filters or click "+ Create Plan" above.</p>
                      </td>
                    </tr>
                  ) : (
                    filteredPlans.map(plan => {
                      const prod = products.find(p => p._id === plan.product);
                      return (
                        <tr key={plan._id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors">
                          <td className="py-3.5 px-4">
                            <p className="font-semibold text-slate-900 dark:text-white">{plan.name}</p>
                            <span className="font-mono text-[10px] text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/40 px-1.5 py-0.5 rounded">
                              {plan.code}
                            </span>
                          </td>
                          <td className="py-3.5 px-4">
                            <span className="font-medium text-slate-800 dark:text-slate-200">
                              {prod ? prod.name : 'Linked Product'}
                            </span>
                            {prod && (
                              <p className="text-[10px] font-mono text-slate-400">{prod.code}</p>
                            )}
                          </td>
                          <td className="py-3.5 px-4 text-right font-mono font-semibold text-slate-900 dark:text-white tabular-nums">
                            {formatINR(plan.price, true)}
                          </td>
                          <td className="py-3.5 px-4 text-center">
                            <span className="inline-block px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 font-mono text-[11px] capitalize text-slate-700 dark:text-slate-300">
                              {plan.billingCycle}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 text-center">
                            <div className="flex items-center justify-center gap-1.5 text-[10px]">
                              <span 
                                title="Allow Pause"
                                className={`px-1.5 py-0.5 rounded font-mono ${
                                  plan.allowPause 
                                    ? 'bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300' 
                                    : 'bg-slate-100 text-slate-400 line-through'
                                }`}
                              >
                                Pause
                              </span>
                              <span 
                                title="Allow Early Close"
                                className={`px-1.5 py-0.5 rounded font-mono ${
                                  plan.allowEarlyClose 
                                    ? 'bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300' 
                                    : 'bg-slate-100 text-slate-400 line-through'
                                }`}
                              >
                                Close
                              </span>
                              <span 
                                title="Allow Auto-Renewal"
                                className={`px-1.5 py-0.5 rounded font-mono ${
                                  plan.allowRenewal 
                                    ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300' 
                                    : 'bg-slate-100 text-slate-400 line-through'
                                }`}
                              >
                                Renew
                              </span>
                            </div>
                          </td>
                          <td className="py-3.5 px-4 text-center">
                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                              plan.status === 'active'
                                ? 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700'
                            }`}>
                              {plan.status === 'active' ? 'Active' : 'Inactive'}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 text-right">
                            <div className="flex items-center justify-end gap-1">
                              <button
                                onClick={() => {
                                  setPlanToEdit(plan);
                                  setIsCreatePlanOpen(true);
                                }}
                                className="p-1.5 text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                                title="Edit Plan"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => handleTogglePlanStatus(plan)}
                                className="p-1.5 text-slate-500 hover:text-amber-600 dark:hover:text-amber-400 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                                title={plan.status === 'active' ? 'Deactivate' : 'Activate'}
                              >
                                <Power className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => handleDeletePlan(plan._id, plan.name)}
                                className="p-1.5 text-slate-500 hover:text-rose-600 dark:hover:text-rose-400 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                                title="Delete Plan"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : (
        /* ==================== TIER PRICING GRID ==================== */
        <div className="space-y-6">
          {/* Monthly / Annual Toggle */}
          <div className="flex justify-end">
            <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
              <button
                onClick={() => setBillingInterval('monthly')}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                  billingInterval === 'monthly'
                    ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                Monthly Billing
              </button>
              <button
                onClick={() => setBillingInterval('annual')}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors flex items-center gap-1.5 ${
                  billingInterval === 'annual'
                    ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                <span>Annual (Save ~20%)</span>
              </button>
            </div>
          </div>

          {/* Pricing Tier Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {contextPlans.map(plan => {
              const price = billingInterval === 'annual' ? plan.annualPrice : plan.monthlyPrice;
              const displayPeriod = billingInterval === 'annual' ? '/yr' : '/mo';

              return (
                <div
                  key={plan.id}
                  className={`relative rounded-2xl border p-6 flex flex-col justify-between transition-all ${
                    plan.isPopular
                      ? 'border-indigo-600 dark:border-indigo-500 bg-white dark:bg-slate-900 shadow-md ring-1 ring-indigo-500/20'
                      : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs hover:border-slate-300 dark:hover:border-slate-700'
                  }`}
                >
                  {plan.isPopular && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full bg-indigo-600 text-white text-[10px] font-semibold tracking-wide uppercase shadow-xs">
                      Most Popular
                    </div>
                  )}

                  <div>
                    <div className="flex items-center justify-between">
                      <h3 className="text-base font-bold text-slate-900 dark:text-white">
                        {plan.name}
                      </h3>
                      <span className="text-[11px] font-mono text-slate-600 dark:text-slate-300">
                        {plan.code}
                      </span>
                    </div>

                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 min-h-[36px]">
                      {plan.description}
                    </p>

                    {/* Price Display */}
                    <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800 flex items-baseline gap-1">
                      <span className="text-3xl font-extrabold text-slate-900 dark:text-white font-mono tabular-nums">
                        {formatINR(price)}
                      </span>
                      <span className="text-xs text-slate-500 dark:text-slate-400">
                        {displayPeriod}
                      </span>
                    </div>

                    {billingInterval === 'annual' && (
                      <p className="text-[11px] text-emerald-600 dark:text-emerald-400 mt-1 font-medium">
                        Equivalent to {formatINR(Math.round(price / 12))}/mo billed annually
                      </p>
                    )}

                    {/* Core Limits */}
                    <div className="mt-5 space-y-2 py-3 border-y border-slate-100 dark:border-slate-800 text-xs">
                      <div className="flex items-center justify-between text-slate-700 dark:text-slate-300">
                        <span className="flex items-center gap-1.5 text-slate-500">
                          <Users className="w-3.5 h-3.5" />
                          <span>Team Seats:</span>
                        </span>
                        <span className="font-semibold font-mono">{plan.maxSeats >= 250 ? 'Unlimited' : plan.maxSeats}</span>
                      </div>

                      <div className="flex items-center justify-between text-slate-700 dark:text-slate-300">
                        <span className="flex items-center gap-1.5 text-slate-500">
                          <Cpu className="w-3.5 h-3.5" />
                          <span>API Quota:</span>
                        </span>
                        <span className="font-semibold font-mono">{(plan.maxApiCalls / 1000).toLocaleString()}k reqs</span>
                      </div>

                      <div className="flex items-center justify-between text-slate-700 dark:text-slate-300">
                        <span className="flex items-center gap-1.5 text-slate-500">
                          <ShieldCheck className="w-3.5 h-3.5" />
                          <span>Service SLA:</span>
                        </span>
                        <span className="font-semibold">{plan.supportTier}</span>
                      </div>
                    </div>

                    {/* Feature Checklist */}
                    <ul className="mt-4 space-y-2.5 text-xs text-slate-600 dark:text-slate-400">
                      {plan.features.map((feat, idx) => (
                        <li key={idx} className="flex items-start gap-2">
                          <Check className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                          <span>{feat}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Bottom Actions */}
                  <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center gap-2">
                    <button
                      onClick={() => setIsCreateSubOpen(true)}
                      className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-colors text-center ${
                        plan.isPopular
                          ? 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs'
                          : 'bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-900 dark:text-white'
                      }`}
                    >
                      Subscribe Customer
                    </button>

                    {canPerformAction('edit_plan') && (
                      <button
                        onClick={() => startEditLegacyPlan(plan)}
                        className="p-2 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors"
                        title="Configure Tier Pricing & Quotas"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Mongoose Create / Edit Plan Modal */}
      <CreatePlanModal
        isOpen={isCreatePlanOpen}
        onClose={() => {
          setIsCreatePlanOpen(false);
          setPlanToEdit(null);
        }}
        planToEdit={planToEdit}
        onSaved={() => {
          loadMongooseData();
          triggerRefresh();
        }}
        addToast={addToast}
      />

      {/* Legacy Edit Plan Modal */}
      {editingPlan && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-xl animate-in fade-in zoom-in-95 duration-150">
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Edit Plan: {editingPlan.name}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Adjusting pricing and entitlements will apply to new subscriptions.
            </p>

            <form onSubmit={handleSaveLegacyPlan} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                  {billingInterval === 'annual' ? 'Annual Price (₹)' : 'Monthly Price (₹)'}
                </label>
                <input
                  type="number"
                  min="0"
                  value={editPrice}
                  onChange={e => setEditPrice(Number(e.target.value))}
                  className="mt-1 w-full px-3 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-1 focus:ring-indigo-500 font-mono"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Maximum Team Seats
                </label>
                <input
                  type="number"
                  min="1"
                  value={editSeats}
                  onChange={e => setEditSeats(Number(e.target.value))}
                  className="mt-1 w-full px-3 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-1 focus:ring-indigo-500 font-mono"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Monthly API Request Quota
                </label>
                <input
                  type="number"
                  min="1000"
                  step="1000"
                  value={editCalls}
                  onChange={e => setEditCalls(Number(e.target.value))}
                  className="mt-1 w-full px-3 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-1 focus:ring-indigo-500 font-mono"
                  required
                />
              </div>

              <div className="pt-4 flex items-center justify-end gap-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setEditingPlan(null)}
                  className="px-3 py-1.5 text-xs text-slate-600 dark:text-slate-400 hover:text-slate-900 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 text-xs font-medium rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white"
                >
                  Save Tier Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
