import React, { useState, useEffect } from 'react';
import { 
  Package, 
  Search, 
  Plus, 
  Edit3, 
  Trash2, 
  Layers, 
  Power,
  RefreshCw,
  TrendingUp,
  Tag
} from 'lucide-react';
import { Product, PlanModel } from '../../types';
import { productService } from '../../services/productService';
import { planService } from '../../services/planService';
import { useApp } from '../../context/AppContext';
import { formatINR } from '../../utils/formatters';

interface ProductsViewProps {
  onOpenCreate: () => void;
  onOpenEdit: (product: Product) => void;
  addToast: (title: string, message: string, type?: 'success' | 'warning' | 'info' | 'error') => void;
}

export const ProductsView: React.FC<ProductsViewProps> = ({
  onOpenCreate,
  onOpenEdit,
  addToast,
}) => {
  const { canPerformAction, setCurrentView, refreshKey, triggerRefresh } = useApp();
  const [products, setProducts] = useState<Product[]>([]);
  const [plans, setPlans] = useState<PlanModel[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [search, setSearch] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const [fetchedProducts, fetchedPlans] = await Promise.all([
        productService.getProducts(),
        planService.getPlans()
      ]);
      setProducts(fetchedProducts);
      setPlans(fetchedPlans);
    } catch (err: any) {
      addToast('Error', err.message || 'Could not load products.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [refreshKey]);

  const handleToggleStatus = async (product: Product) => {
    const nextStatus = product.status === 'active' ? 'inactive' : 'active';
    try {
      await productService.updateProduct(product._id, { status: nextStatus });
      addToast('Product Status Updated', `${product.name} marked as ${nextStatus}.`, 'success');
      triggerRefresh();
    } catch (err: any) {
      addToast('Error', err.message || 'Could not update product status.', 'error');
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete product "${name}"? This action cannot be undone.`)) {
      return;
    }
    setDeletingId(id);
    try {
      await productService.deleteProduct(id);
      addToast('Product Deleted', `Removed ${name} from product catalog.`, 'success');
      triggerRefresh();
    } catch (err: any) {
      addToast('Error', err.message || 'Could not delete product.', 'error');
    } finally {
      setDeletingId(null);
    }
  };

  // Filtered list
  const filteredProducts = products.filter(p => {
    const matchesSearch = 
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.code.toLowerCase().includes(search.toLowerCase()) ||
      p.description.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'all' || p.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const totalCount = products.length;
  const activeCount = products.filter(p => p.status === 'active').length;
  const inactiveCount = products.filter(p => p.status === 'inactive').length;
  const avgPrice = totalCount > 0 
    ? (products.reduce((acc, p) => acc + (p.basePrice || 0), 0) / totalCount).toFixed(2)
    : '0.00';

  return (
    <div className="space-y-6">
      {/* Top Banner & Sub-Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
            Products & Plans
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Software products, catalog items, and baseline pricing tiers.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Sub-Tab Navigation */}
          <div className="flex items-center p-1 bg-slate-100 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 text-xs">
            <button
              onClick={() => setCurrentView('products')}
              className="px-3 py-1.5 rounded-md font-semibold bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs"
            >
              Products ({products.length})
            </button>
            <button
              onClick={() => setCurrentView('plans')}
              className="px-3 py-1.5 rounded-md font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
            >
              Plans ({plans.length})
            </button>
          </div>

          <button
            onClick={loadData}
            disabled={loading}
            className="p-2 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 transition-colors"
            title="Refresh Products"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-indigo-600' : ''}`} />
          </button>
          
          <button
            onClick={onOpenCreate}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-xs transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Create Product</span>
          </button>
        </div>
      </div>

      {/* KPI Stats Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
            <span className="text-xs font-medium">Total Products</span>
            <Package className="w-4 h-4 text-indigo-500" />
          </div>
          <p className="text-2xl font-bold font-mono text-slate-900 dark:text-white mt-2 tabular-nums">
            {totalCount}
          </p>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
            <span className="text-xs font-medium">Active Products</span>
            <Tag className="w-4 h-4 text-emerald-500" />
          </div>
          <p className="text-2xl font-bold font-mono text-emerald-600 dark:text-emerald-400 mt-2 tabular-nums">
            {activeCount}
          </p>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
            <span className="text-xs font-medium">Inactive</span>
            <Power className="w-4 h-4 text-slate-400" />
          </div>
          <p className="text-2xl font-bold font-mono text-slate-600 dark:text-slate-400 mt-2 tabular-nums">
            {inactiveCount}
          </p>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
            <span className="text-xs font-medium">Avg Base Price</span>
            <TrendingUp className="w-4 h-4 text-amber-500" />
          </div>
          <p className="text-2xl font-bold font-mono text-slate-900 dark:text-white mt-2 tabular-nums">
            {formatINR(Number(avgPrice))}
          </p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by product name, SKU or description..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 focus:ring-1 focus:ring-indigo-500"
          />
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-500 dark:text-slate-400">Status:</span>
          <div className="flex items-center p-0.5 bg-slate-100 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 text-xs">
            {(['all', 'active', 'inactive'] as const).map(st => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`px-3 py-1 rounded-md capitalize font-medium transition-colors ${
                  statusFilter === st
                    ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                {st}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Products Table */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/80 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-wider">
              <tr>
                <th className="py-3 px-4">SKU / Code</th>
                <th className="py-3 px-4">Product Name & Description</th>
                <th className="py-3 px-4 text-right">Base Price</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-center">Associated Plans</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-indigo-500" />
                    Loading products catalog...
                  </td>
                </tr>
              ) : filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-500">
                    <Package className="w-8 h-8 mx-auto mb-2 text-slate-400 stroke-1" />
                    <p className="font-medium text-sm text-slate-700 dark:text-slate-300">No products found</p>
                    <p className="text-xs text-slate-400 mt-1">Try adjusting your filters or click "+ Create Product".</p>
                  </td>
                </tr>
              ) : (
                filteredProducts.map(product => {
                  const associatedPlans = plans.filter(pl => pl.product === product._id);
                  return (
                    <tr 
                      key={product._id}
                      className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors"
                    >
                      <td className="py-3.5 px-4 font-mono font-semibold text-slate-900 dark:text-white">
                        <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200">
                          {product.code}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 max-w-xs">
                        <p className="font-semibold text-slate-900 dark:text-white">{product.name}</p>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate mt-0.5">
                          {product.description}
                        </p>
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono font-medium text-slate-900 dark:text-white tabular-nums">
                        {formatINR(product.basePrice || 0)}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                          product.status === 'active'
                            ? 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700'
                        }`}>
                          {product.status === 'active' ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 font-mono text-xs">
                          <Layers className="w-3 h-3" />
                          <span>{associatedPlans.length} {associatedPlans.length === 1 ? 'plan' : 'plans'}</span>
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => onOpenEdit(product)}
                            className="p-1.5 text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                            title="Edit Product"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleToggleStatus(product)}
                            className="p-1.5 text-slate-500 hover:text-amber-600 dark:hover:text-amber-400 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                            title={product.status === 'active' ? 'Deactivate Product' : 'Activate Product'}
                          >
                            <Power className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDelete(product._id, product.name)}
                            disabled={deletingId === product._id}
                            className="p-1.5 text-slate-500 hover:text-rose-600 dark:hover:text-rose-400 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors disabled:opacity-50"
                            title="Delete Product"
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
  );
};
