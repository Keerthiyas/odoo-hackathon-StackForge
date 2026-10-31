import React, { useState, useEffect, useCallback } from 'react';
import {
  Layers,
  Plus,
  Eye,
  Edit,
  Trash2,
  Power,
  RotateCcw,
  Check,
  X as XIcon,
  Package,
} from 'lucide-react';
import { Plan, CreatePlanDTO, UpdatePlanDTO, Product, PlanBillingCycle } from '../../types';
import { planService, PlanQueryParams } from '../../api/planService';
import { productService } from '../../api/productService';
import { StatusBadge } from '../../components/common/StatusBadge';
import { SearchBar } from '../../components/common/SearchBar';
import { Pagination } from '../../components/common/Pagination';
import { DataTable, Column } from '../../components/common/DataTable';
import { ConfirmationDialog } from '../../components/common/ConfirmationDialog';
import { ToastNotification, ToastProps } from '../../components/common/ToastNotification';
import { PlanFormModal } from './plans/PlanFormModal';
import { PlanDetailsModal } from './plans/PlanDetailsModal';
import { formatCurrency } from '../../utils/formatters';

export const PlansPage: React.FC = () => {
  // Data state
  const [plans, setPlans] = useState<Plan[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(false);

  // Filter & Pagination state
  const [search, setSearch] = useState('');
  const [productFilter, setProductFilter] = useState<string>('all');
  const [cycleFilter, setCycleFilter] = useState<'all' | PlanBillingCycle>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'true' | 'false'>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  // Modals state
  const [formModalOpen, setFormModalOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState<Plan | null>(null);
  const [viewingPlan, setViewingPlan] = useState<Plan | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Confirmation dialogs
  const [deleteTarget, setDeleteTarget] = useState<Plan | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [toggleTarget, setToggleTarget] = useState<Plan | null>(null);
  const [isToggling, setIsToggling] = useState(false);

  // Toast notifications
  const [toast, setToast] = useState<Omit<ToastProps, 'onClose'> | null>(null);

  // Load products for the product filter dropdown
  useEffect(() => {
    productService
      .getProducts({ limit: 100 })
      .then((res) => setProducts(res.data))
      .catch(() => {});
  }, []);

  // Fetch plans query
  const fetchPlans = useCallback(async () => {
    setIsLoading(true);
    try {
      const params: PlanQueryParams = {
        search: search.trim() || undefined,
        productId: productFilter === 'all' ? undefined : productFilter,
        billingCycle: cycleFilter === 'all' ? undefined : cycleFilter,
        isActive: statusFilter === 'all' ? 'all' : statusFilter === 'true',
        page: currentPage,
        limit: itemsPerPage,
      };

      const res = await planService.getPlans(params);
      setPlans(res.data);
      setTotalItems(res.total);
      setTotalPages(res.totalPages);
    } catch (err: any) {
      setToast({
        type: 'error',
        message: err.message || 'Failed to load plans.',
      });
    } finally {
      setIsLoading(false);
    }
  }, [search, productFilter, cycleFilter, statusFilter, currentPage, itemsPerPage]);

  useEffect(() => {
    fetchPlans();
  }, [fetchPlans]);

  // Filter change handlers
  const handleSearchChange = (val: string) => {
    setSearch(val);
    setCurrentPage(1);
  };

  const handleProductFilterChange = (val: string) => {
    setProductFilter(val);
    setCurrentPage(1);
  };

  const handleCycleFilterChange = (val: 'all' | PlanBillingCycle) => {
    setCycleFilter(val);
    setCurrentPage(1);
  };

  const handleStatusFilterChange = (val: 'all' | 'true' | 'false') => {
    setStatusFilter(val);
    setCurrentPage(1);
  };

  const handleResetFilters = () => {
    setSearch('');
    setProductFilter('all');
    setCycleFilter('all');
    setStatusFilter('all');
    setCurrentPage(1);
  };

  // Helper to extract product name
  const getProductName = (plan: Plan): string => {
    if (typeof plan.product === 'object' && plan.product !== null && plan.product.name) {
      return plan.product.name;
    }
    const matched = products.find((p) => p._id === (typeof plan.product === 'string' ? plan.product : plan.product?._id));
    return matched?.name || 'Associated Product';
  };

  // Create or Update Plan submit
  const handleFormSubmit = async (data: CreatePlanDTO | UpdatePlanDTO) => {
    setIsSubmitting(true);
    try {
      if (editingPlan) {
        await planService.updatePlan(editingPlan._id, data);
        setToast({
          type: 'success',
          title: 'Plan Updated',
          message: `Subscription plan "${data.name}" has been updated successfully.`,
        });
      } else {
        await planService.createPlan(data as CreatePlanDTO);
        setToast({
          type: 'success',
          title: 'Plan Created',
          message: `New plan "${data.name}" has been configured and added.`,
        });
      }
      setFormModalOpen(false);
      setEditingPlan(null);
      await fetchPlans();
    } catch (err: any) {
      setToast({
        type: 'error',
        title: 'Operation Failed',
        message: err.message || 'Unable to save subscription plan.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Toggle Plan Status
  const handleConfirmToggle = async () => {
    if (!toggleTarget) return;
    setIsToggling(true);
    try {
      const nextStatus = !toggleTarget.isActive;
      await planService.togglePlanStatus(toggleTarget._id, nextStatus);
      setToast({
        type: 'success',
        title: nextStatus ? 'Plan Activated' : 'Plan Deactivated',
        message: `"${toggleTarget.name}" is now ${nextStatus ? 'active' : 'inactive'}.`,
      });
      setToggleTarget(null);
      await fetchPlans();
    } catch (err: any) {
      setToast({
        type: 'error',
        title: 'Status Update Failed',
        message: err.message || 'Unable to update plan status.',
      });
    } finally {
      setIsToggling(false);
    }
  };

  // Delete Plan
  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      await planService.deletePlan(deleteTarget._id);
      setToast({
        type: 'success',
        title: 'Plan Deleted',
        message: `Plan "${deleteTarget.name}" was permanently removed.`,
      });
      setDeleteTarget(null);
      await fetchPlans();
    } catch (err: any) {
      setToast({
        type: 'error',
        title: 'Delete Failed',
        message: err.message || 'Could not delete plan due to existing subscriptions.',
        duration: 5000,
      });
      setDeleteTarget(null);
    } finally {
      setIsDeleting(false);
    }
  };

  // Table Columns
  const columns: Column<Plan>[] = [
    {
      header: 'Plan Name',
      className: 'min-w-[190px]',
      render: (plan) => (
        <div>
          <div className="font-semibold text-slate-900 flex items-center gap-1.5">
            <Layers className="w-3.5 h-3.5 text-blue-600 shrink-0" />
            <span>{plan.name}</span>
          </div>
          <div className="text-[10px] font-mono text-slate-400 mt-0.5">
            ID: {plan._id.slice(0, 8)}...
          </div>
        </div>
      ),
    },
    {
      header: 'Associated Product',
      className: 'min-w-[170px]',
      render: (plan) => {
        const prodName = getProductName(plan);
        return (
          <div className="flex items-center gap-1.5 text-slate-800">
            <Package className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span className="font-medium truncate max-w-[160px]">{prodName}</span>
          </div>
        );
      },
    },
    {
      header: 'Billing Cycle',
      align: 'center',
      render: (plan) => (
        <span
          className={`inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-semibold uppercase tracking-wider ${
            plan.billingCycle === 'monthly'
              ? 'bg-blue-50 text-blue-700 border border-blue-200/60'
              : 'bg-purple-50 text-purple-700 border border-purple-200/60'
          }`}
        >
          {plan.billingCycle}
        </span>
      ),
    },
    {
      header: 'Price',
      align: 'right',
      render: (plan) => (
        <div className="text-right">
          <span className="font-bold text-slate-900 tabular-nums font-mono text-xs">
            {formatCurrency(plan.price)}
          </span>
          <span className="text-[10px] text-slate-400 block">
            /{plan.billingCycle === 'monthly' ? 'mo' : 'yr'}
          </span>
        </div>
      ),
    },
    {
      header: 'Allow Pause',
      align: 'center',
      render: (plan) =>
        plan.allowPause ? (
          <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700">
            <Check className="w-3 h-3" /> Yes
          </span>
        ) : (
          <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[10px] font-medium bg-slate-100 text-slate-500">
            <XIcon className="w-3 h-3" /> No
          </span>
        ),
    },
    {
      header: 'Allow Renewal',
      align: 'center',
      render: (plan) =>
        plan.allowRenewal ? (
          <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700">
            <Check className="w-3 h-3" /> Yes
          </span>
        ) : (
          <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[10px] font-medium bg-slate-100 text-slate-500">
            <XIcon className="w-3 h-3" /> No
          </span>
        ),
    },
    {
      header: 'Early Close',
      align: 'center',
      render: (plan) =>
        plan.allowEarlyClose ? (
          <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700">
            <Check className="w-3 h-3" /> Yes
          </span>
        ) : (
          <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[10px] font-medium bg-slate-100 text-slate-500">
            <XIcon className="w-3 h-3" /> No
          </span>
        ),
    },
    {
      header: 'Status',
      align: 'center',
      render: (plan) => <StatusBadge status={plan.isActive} size="sm" />,
    },
    {
      header: 'Actions',
      align: 'center',
      render: (plan) => (
        <div className="inline-flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
          {/* View Button */}
          <button
            type="button"
            onClick={() => setViewingPlan(plan)}
            className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-slate-100 rounded-md transition-colors"
            title="View Plan Details"
            aria-label={`View ${plan.name}`}
          >
            <Eye className="w-4 h-4" />
          </button>

          {/* Edit Button */}
          <button
            type="button"
            onClick={() => {
              setEditingPlan(plan);
              setFormModalOpen(true);
            }}
            className="p-1.5 text-slate-500 hover:text-amber-600 hover:bg-slate-100 rounded-md transition-colors"
            title="Edit Plan"
            aria-label={`Edit ${plan.name}`}
          >
            <Edit className="w-4 h-4" />
          </button>

          {/* Activate / Deactivate Toggle */}
          <button
            type="button"
            onClick={() => setToggleTarget(plan)}
            className={`p-1.5 rounded-md transition-colors ${
              plan.isActive
                ? 'text-slate-500 hover:text-amber-600 hover:bg-amber-50'
                : 'text-slate-500 hover:text-emerald-600 hover:bg-emerald-50'
            }`}
            title={plan.isActive ? 'Deactivate Plan' : 'Activate Plan'}
            aria-label={plan.isActive ? 'Deactivate Plan' : 'Activate Plan'}
          >
            <Power className="w-4 h-4" />
          </button>

          {/* Delete Button */}
          <button
            type="button"
            onClick={() => setDeleteTarget(plan)}
            className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors"
            title="Delete Plan"
            aria-label={`Delete ${plan.name}`}
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      ),
    },
  ];

  const hasActiveFilters =
    Boolean(search) || productFilter !== 'all' || cycleFilter !== 'all' || statusFilter !== 'all';

  return (
    <div className="space-y-5">
      {/* Toast Notification Container */}
      {toast && (
        <ToastNotification
          type={toast.type}
          title={toast.title}
          message={toast.message}
          duration={toast.duration}
          onClose={() => setToast(null)}
        />
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold tracking-tight text-slate-900">Plan Management</h1>
            <span className="px-2 py-0.5 text-[11px] font-semibold bg-blue-50 text-blue-700 rounded-md border border-blue-200/60">
              {totalItems} {totalItems === 1 ? 'plan' : 'plans'}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Configure subscription tiers, recurring billing cadences (monthly/yearly), pricing and lifecycle policies
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            setEditingPlan(null);
            setFormModalOpen(true);
          }}
          className="px-3.5 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-xs flex items-center gap-1.5 transition-colors self-start sm:self-auto focus:outline-none focus:ring-2 focus:ring-blue-600 focus:ring-offset-1"
        >
          <Plus className="w-4 h-4" />
          <span>Add Plan</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-xs space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
          {/* Search by plan name */}
          <div className="md:col-span-4">
            <SearchBar
              value={search}
              onChange={handleSearchChange}
              placeholder="Search plans by name..."
            />
          </div>

          {/* Product Filter */}
          <div className="md:col-span-3">
            <select
              value={productFilter}
              onChange={(e) => handleProductFilterChange(e.target.value)}
              className="w-full px-3 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              aria-label="Filter by product"
            >
              <option value="all">All Associated Products</option>
              {products.map((p) => (
                <option key={p._id} value={p._id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>

          {/* Billing Cycle Filter */}
          <div className="md:col-span-2">
            <select
              value={cycleFilter}
              onChange={(e) => handleCycleFilterChange(e.target.value as any)}
              className="w-full px-3 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              aria-label="Filter by billing cycle"
            >
              <option value="all">All Cycles</option>
              <option value="monthly">Monthly</option>
              <option value="yearly">Yearly</option>
            </select>
          </div>

          {/* Status Filter */}
          <div className="md:col-span-2">
            <select
              value={statusFilter}
              onChange={(e) => handleStatusFilterChange(e.target.value as any)}
              className="w-full px-3 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              aria-label="Filter by status"
            >
              <option value="all">All Statuses</option>
              <option value="true">Active Only</option>
              <option value="false">Inactive Only</option>
            </select>
          </div>

          {/* Reset Filters button */}
          <div className="md:col-span-1 flex justify-end">
            {hasActiveFilters && (
              <button
                type="button"
                onClick={handleResetFilters}
                className="w-full px-2.5 py-2 text-xs font-medium text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors flex items-center justify-center gap-1"
                title="Reset filters"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span className="hidden lg:inline">Reset</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Plans Data Table */}
      <DataTable<Plan>
        columns={columns}
        data={plans}
        keyExtractor={(item: Plan) => item._id}
        isLoading={isLoading}
        emptyMessage="No subscription plans found matching your criteria."
        onRowClick={(plan: Plan) => setViewingPlan(plan)}
      />

      {/* Pagination Controls */}
      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        totalItems={totalItems}
        itemsPerPage={itemsPerPage}
        onPageChange={(page) => setCurrentPage(page)}
      />

      {/* Form Modal (Add / Edit) */}
      <PlanFormModal
        isOpen={formModalOpen}
        plan={editingPlan}
        isSubmitting={isSubmitting}
        onSubmit={handleFormSubmit}
        onClose={() => {
          setFormModalOpen(false);
          setEditingPlan(null);
        }}
      />

      {/* Details Modal (View) */}
      <PlanDetailsModal
        isOpen={!!viewingPlan}
        plan={viewingPlan}
        productName={viewingPlan ? getProductName(viewingPlan) : undefined}
        onClose={() => setViewingPlan(null)}
        onEdit={(planToEdit) => {
          setViewingPlan(null);
          setEditingPlan(planToEdit);
          setFormModalOpen(true);
        }}
      />

      {/* Status Toggle Confirmation */}
      <ConfirmationDialog
        isOpen={!!toggleTarget}
        title={toggleTarget?.isActive ? 'Deactivate Subscription Plan' : 'Activate Subscription Plan'}
        message={
          toggleTarget?.isActive
            ? `Are you sure you want to deactivate "${toggleTarget?.name}"? New subscribers will no longer be able to select this plan.`
            : `Are you sure you want to activate "${toggleTarget?.name}"? This plan will immediately become available in the subscription catalog.`
        }
        confirmText={toggleTarget?.isActive ? 'Deactivate' : 'Activate'}
        confirmVariant={toggleTarget?.isActive ? 'warning' : 'primary'}
        isLoading={isToggling}
        onConfirm={handleConfirmToggle}
        onCancel={() => setToggleTarget(null)}
      />

      {/* Delete Confirmation */}
      <ConfirmationDialog
        isOpen={!!deleteTarget}
        title="Delete Subscription Plan"
        message={`Are you sure you want to permanently delete "${deleteTarget?.name}"? This operation cannot be undone. Plans referenced by active subscriptions cannot be deleted.`}
        confirmText="Delete Plan"
        confirmVariant="danger"
        isLoading={isDeleting}
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
};
