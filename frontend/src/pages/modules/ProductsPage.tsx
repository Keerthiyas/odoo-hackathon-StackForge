import React, { useState, useEffect, useCallback } from 'react';
import {
  Package,
  Plus,
  Eye,
  Edit,
  Trash2,
  Power,
  RotateCcw,
} from 'lucide-react';
import { Product, CreateProductDTO, UpdateProductDTO } from '../../types';
import { productService, ProductQueryParams } from '../../api/productService';
import { StatusBadge } from '../../components/common/StatusBadge';
import { SearchBar } from '../../components/common/SearchBar';
import { Pagination } from '../../components/common/Pagination';
import { DataTable, Column } from '../../components/common/DataTable';
import { ConfirmationDialog } from '../../components/common/ConfirmationDialog';
import { ToastNotification, ToastProps } from '../../components/common/ToastNotification';
import { ProductFormModal } from './products/ProductFormModal';
import { ProductDetailsModal } from './products/ProductDetailsModal';
import { formatCurrency, formatDate } from '../../utils/formatters';

export const ProductsPage: React.FC = () => {
  // Data state
  const [products, setProducts] = useState<Product[]>([]);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(false);

  // Filter & Pagination state
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'true' | 'false'>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  // Modals state
  const [formModalOpen, setFormModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [viewingProduct, setViewingProduct] = useState<Product | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Confirmation dialogs
  const [deleteTarget, setDeleteTarget] = useState<Product | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [toggleTarget, setToggleTarget] = useState<Product | null>(null);
  const [isToggling, setIsToggling] = useState(false);

  // Toast
  const [toast, setToast] = useState<Omit<ToastProps, 'onClose'> | null>(null);

  const fetchProducts = useCallback(async () => {
    setIsLoading(true);
    try {
      const params: ProductQueryParams = {
        search: search.trim() || undefined,
        isActive: statusFilter === 'all' ? 'all' : statusFilter === 'true',
        page: currentPage,
        limit: itemsPerPage,
      };

      const res = await productService.getProducts(params);
      setProducts(res.data);
      setTotalItems(res.total);
      setTotalPages(res.totalPages);
    } catch (err: any) {
      setToast({
        type: 'error',
        message: err.message || 'Failed to load products',
      });
    } finally {
      setIsLoading(false);
    }
  }, [search, statusFilter, currentPage, itemsPerPage]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  // Handle Search Input
  const handleSearchChange = (val: string) => {
    setSearch(val);
    setCurrentPage(1);
  };

  // Handle Status Filter
  const handleStatusFilterChange = (val: 'all' | 'true' | 'false') => {
    setStatusFilter(val);
    setCurrentPage(1);
  };

  // Create or Update Product
  const handleFormSubmit = async (data: CreateProductDTO | UpdateProductDTO) => {
    setIsSubmitting(true);
    try {
      if (editingProduct) {
        await productService.updateProduct(editingProduct._id, data);
        setToast({
          type: 'success',
          title: 'Product Updated',
          message: `Product "${data.name}" has been updated successfully.`,
        });
      } else {
        await productService.createProduct(data as CreateProductDTO);
        setToast({
          type: 'success',
          title: 'Product Created',
          message: `Product "${data.name}" has been added to the catalog.`,
        });
      }
      setFormModalOpen(false);
      setEditingProduct(null);
      await fetchProducts();
    } catch (err: any) {
      setToast({
        type: 'error',
        title: 'Operation Failed',
        message: err.message || 'Unable to save product',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Toggle Active / Deactivate
  const handleConfirmToggle = async () => {
    if (!toggleTarget) return;
    setIsToggling(true);
    try {
      const nextStatus = !toggleTarget.isActive;
      await productService.toggleProductStatus(toggleTarget._id, nextStatus);
      setToast({
        type: 'success',
        title: nextStatus ? 'Product Activated' : 'Product Deactivated',
        message: `"${toggleTarget.name}" is now ${nextStatus ? 'active' : 'inactive'}.`,
      });
      setToggleTarget(null);
      await fetchProducts();
    } catch (err: any) {
      setToast({
        type: 'error',
        title: 'Status Update Failed',
        message: err.message || 'Unable to update product status.',
      });
    } finally {
      setIsToggling(false);
    }
  };

  // Delete Product
  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      await productService.deleteProduct(deleteTarget._id);
      setToast({
        type: 'success',
        title: 'Product Deleted',
        message: `Product "${deleteTarget.name}" was permanently removed.`,
      });
      setDeleteTarget(null);
      await fetchProducts();
    } catch (err: any) {
      // Backend error (e.g. referenced by plans)
      setToast({
        type: 'error',
        title: 'Delete Failed',
        message: err.message || 'Could not delete product due to database references.',
        duration: 6000,
      });
      setDeleteTarget(null);
    } finally {
      setIsDeleting(false);
    }
  };

  // Table Columns
  const columns: Column<Product>[] = [
    {
      header: 'Product Name',
      className: 'min-w-[200px]',
      render: (product) => (
        <div>
          <div className="font-semibold text-slate-900 flex items-center gap-1.5">
            <Package className="w-3.5 h-3.5 text-blue-600 shrink-0" />
            <span>{product.name}</span>
          </div>
          <div className="text-[10px] font-mono text-slate-400 mt-0.5">
            ID: {product._id.slice(0, 8)}...
          </div>
        </div>
      ),
    },
    {
      header: 'Description',
      className: 'max-w-xs',
      render: (product) => (
        <span className="text-slate-500 line-clamp-1 truncate block" title={product.description}>
          {product.description || '—'}
        </span>
      ),
    },
    {
      header: 'Base Price',
      align: 'right',
      render: (product) => (
        <span className="font-semibold text-slate-900 tabular-nums font-mono">
          {formatCurrency(product.basePrice)}
        </span>
      ),
    },
    {
      header: 'Status',
      align: 'center',
      render: (product) => <StatusBadge status={product.isActive} size="sm" />,
    },
    {
      header: 'Created Date',
      render: (product) => (
        <span className="text-slate-500 tabular-nums">{formatDate(product.createdAt)}</span>
      ),
    },
    {
      header: 'Updated Date',
      render: (product) => (
        <span className="text-slate-500 tabular-nums">
          {formatDate(product.updatedAt || product.createdAt)}
        </span>
      ),
    },
    {
      header: 'Actions',
      align: 'center',
      render: (product) => (
        <div className="inline-flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
          {/* View Button */}
          <button
            type="button"
            onClick={() => setViewingProduct(product)}
            className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-slate-100 rounded-md transition-colors"
            title="View Product Details"
          >
            <Eye className="w-3.5 h-3.5" />
          </button>

          {/* Edit Button */}
          <button
            type="button"
            onClick={() => {
              setEditingProduct(product);
              setFormModalOpen(true);
            }}
            className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-slate-100 rounded-md transition-colors"
            title="Edit Product"
          >
            <Edit className="w-3.5 h-3.5" />
          </button>

          {/* Activate / Deactivate Toggle Button */}
          <button
            type="button"
            onClick={() => setToggleTarget(product)}
            className={`p-1.5 rounded-md transition-colors ${
              product.isActive
                ? 'text-emerald-600 hover:bg-emerald-50'
                : 'text-slate-400 hover:bg-slate-100'
            }`}
            title={product.isActive ? 'Deactivate Product' : 'Activate Product'}
          >
            <Power className="w-3.5 h-3.5" />
          </button>

          {/* Delete Button */}
          <button
            type="button"
            onClick={() => setDeleteTarget(product)}
            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors"
            title="Delete Product"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-5">
      {/* Toast Notification */}
      {toast && <ToastNotification {...toast} onClose={() => setToast(null)} />}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900">Product Management</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage software catalog products, descriptions, base prices, and activation statuses
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => {
              setEditingProduct(null);
              setFormModalOpen(true);
            }}
            className="px-3.5 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-xs flex items-center gap-1.5 transition-colors self-start sm:self-auto cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add Product</span>
          </button>
        </div>
      </div>

      {/* Search and Filter Bar */}
      <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* Search */}
        <SearchBar
          value={search}
          onChange={handleSearchChange}
          placeholder="Search by product name or description..."
        />

        {/* Status Filters */}
        <div className="flex items-center gap-1 shrink-0 overflow-x-auto pb-1 sm:pb-0">
          <button
            type="button"
            onClick={() => handleStatusFilterChange('all')}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors whitespace-nowrap ${
              statusFilter === 'all'
                ? 'bg-blue-600 text-white font-semibold'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            All Products
          </button>
          <button
            type="button"
            onClick={() => handleStatusFilterChange('true')}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors whitespace-nowrap ${
              statusFilter === 'true'
                ? 'bg-blue-600 text-white font-semibold'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            Active Only
          </button>
          <button
            type="button"
            onClick={() => handleStatusFilterChange('false')}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors whitespace-nowrap ${
              statusFilter === 'false'
                ? 'bg-blue-600 text-white font-semibold'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            Inactive
          </button>
        </div>
      </div>

      {/* Data Table */}
      <DataTable
        columns={columns}
        data={products}
        rowKey={(p) => p._id}
        isLoading={isLoading}
        emptyTitle="No products found"
        emptyDescription={
          search || statusFilter !== 'all'
            ? 'No products match your current search and filter criteria.'
            : 'No software products have been registered yet. Add your first product to get started.'
        }
        emptyActionLabel={search || statusFilter !== 'all' ? 'Reset Filters' : 'Add First Product'}
        onEmptyAction={() => {
          if (search || statusFilter !== 'all') {
            setSearch('');
            setStatusFilter('all');
            setCurrentPage(1);
          } else {
            setEditingProduct(null);
            setFormModalOpen(true);
          }
        }}
        onRowClick={(product) => setViewingProduct(product)}
      />

      {/* Pagination */}
      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        totalItems={totalItems}
        itemsPerPage={itemsPerPage}
        onPageChange={(page) => setCurrentPage(page)}
      />

      {/* Product Add / Edit Modal */}
      <ProductFormModal
        isOpen={formModalOpen}
        product={editingProduct}
        isSubmitting={isSubmitting}
        onSubmit={handleFormSubmit}
        onClose={() => {
          setFormModalOpen(false);
          setEditingProduct(null);
        }}
      />

      {/* Product Details View Modal */}
      <ProductDetailsModal
        isOpen={!!viewingProduct}
        product={viewingProduct}
        onClose={() => setViewingProduct(null)}
        onEdit={(prod) => {
          setViewingProduct(null);
          setEditingProduct(prod);
          setFormModalOpen(true);
        }}
      />

      {/* Confirmation Dialog: Delete Product */}
      <ConfirmationDialog
        isOpen={!!deleteTarget}
        title="Delete Product"
        message={`Are you sure you want to permanently delete "${deleteTarget?.name}"? If any active plans or subscriptions depend on this product, deletion will be blocked.`}
        confirmLabel="Delete Product"
        cancelLabel="Cancel"
        variant="danger"
        isLoading={isDeleting}
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />

      {/* Confirmation Dialog: Activate / Deactivate */}
      <ConfirmationDialog
        isOpen={!!toggleTarget}
        title={toggleTarget?.isActive ? 'Deactivate Product' : 'Activate Product'}
        message={
          toggleTarget?.isActive
            ? `Are you sure you want to deactivate "${toggleTarget?.name}"? New subscriptions to associated plans may be suspended.`
            : `Are you sure you want to activate "${toggleTarget?.name}"? It will become visible for plan assignments.`
        }
        confirmLabel={toggleTarget?.isActive ? 'Deactivate' : 'Activate'}
        cancelLabel="Cancel"
        variant={toggleTarget?.isActive ? 'warning' : 'primary'}
        isLoading={isToggling}
        onConfirm={handleConfirmToggle}
        onCancel={() => setToggleTarget(null)}
      />
    </div>
  );
};
