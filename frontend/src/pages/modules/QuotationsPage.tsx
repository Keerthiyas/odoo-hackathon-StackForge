import React, { useEffect, useState, useCallback } from 'react';
import {
  FileSpreadsheet,
  Plus,
  Eye,
  Edit2,
  Send,
  Trash2,
  RefreshCw,
  Search,
  ArrowRight,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { CreateQuotationDTO, Plan, Product, Quotation, QuotationStatus, UpdateQuotationDTO } from '../../types';
import { quotationService } from '../../api/quotationService';
import { productService } from '../../api/productService';
import { planService } from '../../api/planService';
import { DataTable } from '../../components/common/DataTable';
import { StatusBadge } from '../../components/common/StatusBadge';
import { Pagination } from '../../components/common/Pagination';
import { ConfirmationDialog } from '../../components/common/ConfirmationDialog';
import { ToastNotification } from '../../components/common/ToastNotification';
import { EmptyState } from '../../components/common/EmptyState';
import { QuotationFormModal } from './quotations/QuotationFormModal';
import { QuotationDetailsModal } from './quotations/QuotationDetailsModal';
import { formatCurrency, formatDate } from '../../utils/formatters';

export const QuotationsPage: React.FC = () => {
  const navigate = useNavigate();

  // Quotations List state
  const [quotations, setQuotations] = useState<Quotation[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [total, setTotal] = useState<number>(0);
  const [page, setPage] = useState<number>(1);
  const [limit] = useState<number>(10);

  // Filters & Search
  const [search, setSearch] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [productFilter, setProductFilter] = useState<string>('all');
  const [planFilter, setPlanFilter] = useState<string>('all');
  const [dateFilter, setDateFilter] = useState<string>('all');

  // Filter options
  const [products, setProducts] = useState<Product[]>([]);
  const [plans, setPlans] = useState<Plan[]>([]);

  // Modals state
  const [isFormOpen, setIsFormOpen] = useState<boolean>(false);
  const [selectedQuotation, setSelectedQuotation] = useState<Quotation | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const [detailsQuotation, setDetailsQuotation] = useState<Quotation | null>(null);

  // Delete dialog
  const [deleteTarget, setDeleteTarget] = useState<Quotation | null>(null);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);

  // Toast
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

  // Fetch filter options
  useEffect(() => {
    productService.getProducts({ limit: 100 }).then((res) => setProducts(res.data));
    planService.getPlans({ limit: 100 }).then((res) => setPlans(res.data));
  }, []);

  // Fetch quotations list
  const fetchQuotations = useCallback(async () => {
    setLoading(true);
    try {
      const res = await quotationService.getQuotations({
        search: search.trim() || undefined,
        status: statusFilter === 'all' ? undefined : (statusFilter as QuotationStatus),
        productId: productFilter === 'all' ? undefined : productFilter,
        planId: planFilter === 'all' ? undefined : planFilter,
        dateRange: dateFilter === 'all' ? undefined : dateFilter,
        page,
        limit,
      });
      setQuotations(res.data);
      setTotal(res.total);
    } catch (err: any) {
      setToast({
        message: err.message || 'Failed to fetch quotations from backend.',
        type: 'error',
      });
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter, productFilter, planFilter, dateFilter, page, limit]);

  useEffect(() => {
    fetchQuotations();
  }, [fetchQuotations]);

  // Handle Create / Edit Submit
  const handleFormSubmit = async (dto: CreateQuotationDTO | UpdateQuotationDTO) => {
    setIsSubmitting(true);
    try {
      if (selectedQuotation && (selectedQuotation._id || selectedQuotation.id)) {
        const id = selectedQuotation._id || selectedQuotation.id || '';
        await quotationService.updateQuotation(id, dto);
        setToast({ message: 'Quotation updated successfully.', type: 'success' });
      } else {
        await quotationService.createQuotation(dto as CreateQuotationDTO);
        setToast({ message: 'Quotation created successfully.', type: 'success' });
      }
      setIsFormOpen(false);
      setSelectedQuotation(null);
      await fetchQuotations();
    } catch (err: any) {
      setToast({ message: err.message || 'Failed to save quotation.', type: 'error' });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle Send Quotation
  const handleSendQuotation = async (id: string) => {
    try {
      await quotationService.sendQuotation(id);
      setToast({ message: 'Quotation marked as sent to customer.', type: 'success' });
      if (detailsQuotation && (detailsQuotation._id === id || detailsQuotation.id === id)) {
        setDetailsQuotation((prev) => (prev ? { ...prev, status: 'sent' } : null));
      }
      await fetchQuotations();
    } catch (err: any) {
      setToast({ message: err.message || 'Failed to send quotation.', type: 'error' });
    }
  };

  // Handle Accept Quotation
  const handleAcceptQuotation = async (id: string) => {
    try {
      await quotationService.acceptQuotation(id);
      setToast({ message: 'Quotation marked as accepted by customer.', type: 'success' });
      if (detailsQuotation && (detailsQuotation._id === id || detailsQuotation.id === id)) {
        setDetailsQuotation((prev) => (prev ? { ...prev, status: 'accepted' } : null));
      }
      await fetchQuotations();
    } catch (err: any) {
      setToast({ message: err.message || 'Failed to accept quotation.', type: 'error' });
    }
  };

  // Handle Reject Quotation
  const handleRejectQuotation = async (id: string) => {
    try {
      await quotationService.rejectQuotation(id);
      setToast({ message: 'Quotation marked as rejected.', type: 'info' });
      if (detailsQuotation && (detailsQuotation._id === id || detailsQuotation.id === id)) {
        setDetailsQuotation((prev) => (prev ? { ...prev, status: 'rejected' } : null));
      }
      await fetchQuotations();
    } catch (err: any) {
      setToast({ message: err.message || 'Failed to reject quotation.', type: 'error' });
    }
  };

  // Handle Delete Draft Quotation
  const handleDeleteDraft = async () => {
    if (!deleteTarget) return;
    const targetId = deleteTarget._id || deleteTarget.id || '';
    setIsDeleting(true);
    try {
      await quotationService.deleteQuotation(targetId);
      setToast({ message: 'Draft quotation deleted successfully.', type: 'success' });
      setDeleteTarget(null);
      await fetchQuotations();
    } catch (err: any) {
      setToast({ message: err.message || 'Failed to delete quotation.', type: 'error' });
    } finally {
      setIsDeleting(false);
    }
  };

  // Convert to Subscription
  const handleConvertToSubscription = (quote: Quotation) => {
    setDetailsQuotation(null);
    const targetId = quote._id || quote.id || '';
    navigate(`/subscriptions?convertQuotationId=${targetId}`);
  };

  // Table Columns
  const columns = [
    {
      header: 'Quotation ID',
      accessor: (q: Quotation) => (
        <span className="font-mono font-medium text-slate-900 whitespace-nowrap">
          {q.quotationNumber || `QTE-${(q._id || q.id || '').slice(-6).toUpperCase()}`}
        </span>
      ),
    },
    {
      header: 'Customer Name',
      accessor: (q: Quotation) => {
        const custName =
          typeof q.customer === 'object' && q.customer !== null && 'name' in q.customer
            ? (q.customer as any).name
            : q.customerName || 'Customer';
        const company =
          typeof q.customer === 'object' && q.customer !== null
            ? (q.customer as any).companyName || (q.customer as any).company
            : null;
        return (
          <div>
            <div className="font-semibold text-slate-900">{custName}</div>
            {company && <div className="text-[11px] text-slate-400">{company}</div>}
          </div>
        );
      },
    },
    {
      header: 'Product Name',
      accessor: (q: Quotation) => {
        const prodName =
          typeof q.product === 'object' && q.product !== null && 'name' in q.product
            ? (q.product as any).name
            : 'Software Product';
        return <span className="font-medium text-slate-800">{prodName}</span>;
      },
    },
    {
      header: 'Plan Name',
      accessor: (q: Quotation) => {
        const plName =
          typeof q.plan === 'object' && q.plan !== null && 'name' in q.plan
            ? (q.plan as any).name
            : 'Plan';
        return <span className="text-slate-700">{plName}</span>;
      },
    },
    {
      header: 'Quantity',
      accessor: (q: Quotation) => (
        <span className="font-mono tabular-nums text-slate-900">{q.quantity}</span>
      ),
      className: 'text-center',
    },
    {
      header: 'Unit Price',
      accessor: (q: Quotation) => (
        <span className="font-mono tabular-nums text-slate-900">
          {formatCurrency(q.unitPrice)}
        </span>
      ),
      className: 'text-right',
    },
    {
      header: 'Total Amount',
      accessor: (q: Quotation) => (
        <span className="font-mono font-semibold tabular-nums text-slate-900">
          {formatCurrency(q.totalAmount)}
        </span>
      ),
      className: 'text-right',
    },
    {
      header: 'Status',
      accessor: (q: Quotation) => <StatusBadge status={q.status} size="sm" />,
    },
    {
      header: 'Valid Until',
      accessor: (q: Quotation) => (
        <span className="text-slate-500 tabular-nums whitespace-nowrap">
          {q.validUntil ? formatDate(q.validUntil) : 'No Expiry'}
        </span>
      ),
    },
    {
      header: 'Created By',
      accessor: (q: Quotation) => {
        const name =
          typeof q.createdBy === 'object' && q.createdBy !== null && 'name' in q.createdBy
            ? (q.createdBy as any).name
            : 'Sales Agent';
        return <span className="text-slate-600 text-[11px] truncate max-w-[110px] block">{name}</span>;
      },
    },
    {
      header: 'Actions',
      accessor: (q: Quotation) => {
        const status = q.status ? q.status.toLowerCase() : 'draft';
        const isDraft = status === 'draft';
        const isAccepted = status === 'accepted';
        const qId = q._id || q.id || '';

        return (
          <div className="flex items-center justify-end gap-1">
            {/* View Details */}
            <button
              onClick={() => setDetailsQuotation(q)}
              className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-slate-100 rounded transition-colors"
              title="View & Print Quotation"
            >
              <Eye className="w-3.5 h-3.5" />
            </button>

            {/* Edit (only if draft) */}
            {isDraft && (
              <button
                onClick={() => {
                  setSelectedQuotation(q);
                  setIsFormOpen(true);
                }}
                className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-slate-100 rounded transition-colors"
                title="Edit Draft"
              >
                <Edit2 className="w-3.5 h-3.5" />
              </button>
            )}

            {/* Send (if draft) */}
            {isDraft && (
              <button
                onClick={() => handleSendQuotation(qId)}
                className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-slate-100 rounded transition-colors"
                title="Send Quotation to Customer"
              >
                <Send className="w-3.5 h-3.5" />
              </button>
            )}

            {/* Convert (if accepted) */}
            {isAccepted && (
              <button
                onClick={() => handleConvertToSubscription(q)}
                className="px-2 py-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded transition-colors flex items-center gap-1"
                title="Convert this accepted quotation to an active subscription"
              >
                <span>Convert</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            )}

            {/* Delete Draft (only if draft) */}
            {isDraft && (
              <button
                onClick={() => setDeleteTarget(q)}
                className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors"
                title="Delete Draft"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        );
      },
      className: 'text-right',
    },
  ];

  return (
    <div className="space-y-5">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900">Quotation Management</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Commercial proposals, formal price estimates, customer approvals, and subscription conversions
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              setSelectedQuotation(null);
              setIsFormOpen(true);
            }}
            className="px-3.5 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-xs flex items-center gap-1.5 transition-colors self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            <span>Create Quotation</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs space-y-3">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          {/* Search */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              placeholder="Search by quotation number or customer name..."
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-blue-600 focus:bg-white transition-colors"
            />
          </div>

          {/* Status Filter Tabs */}
          <div className="flex items-center gap-1 overflow-x-auto pb-1 md:pb-0">
            {['all', 'draft', 'sent', 'accepted', 'rejected'].map((st) => (
              <button
                key={st}
                onClick={() => {
                  setStatusFilter(st);
                  setPage(1);
                }}
                className={`px-3 py-1 text-xs font-medium rounded-lg transition-colors whitespace-nowrap capitalize ${
                  statusFilter === st
                    ? 'bg-blue-600 text-white font-semibold'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                {st === 'all' ? 'All Status' : st}
              </button>
            ))}
          </div>
        </div>

        {/* Secondary Filter Dropdowns */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-2 border-t border-slate-100 text-xs">
          {/* Product Filter */}
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-medium text-slate-500 whitespace-nowrap">Product:</span>
            <select
              value={productFilter}
              onChange={(e) => {
                setProductFilter(e.target.value);
                setPage(1);
              }}
              className="w-full py-1 px-2.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-blue-600 focus:bg-white transition-colors"
            >
              <option value="all">All Products</option>
              {products.map((p) => (
                <option key={p._id} value={p._id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>

          {/* Plan Filter */}
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-medium text-slate-500 whitespace-nowrap">Plan:</span>
            <select
              value={planFilter}
              onChange={(e) => {
                setPlanFilter(e.target.value);
                setPage(1);
              }}
              className="w-full py-1 px-2.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-blue-600 focus:bg-white transition-colors"
            >
              <option value="all">All Plans</option>
              {plans.map((pl) => (
                <option key={pl._id} value={pl._id}>
                  {pl.name}
                </option>
              ))}
            </select>
          </div>

          {/* Date Filter */}
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-medium text-slate-500 whitespace-nowrap">Date:</span>
            <select
              value={dateFilter}
              onChange={(e) => {
                setDateFilter(e.target.value);
                setPage(1);
              }}
              className="w-full py-1 px-2.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-blue-600 focus:bg-white transition-colors"
            >
              <option value="all">All Time</option>
              <option value="30days">Last 30 Days</option>
              <option value="month">This Month</option>
            </select>
          </div>
        </div>
      </div>

      {/* Table & Pagination */}
      {loading ? (
        <div className="bg-white p-8 rounded-xl border border-slate-200 flex items-center justify-center">
          <div className="flex items-center gap-2 text-slate-500 text-xs">
            <RefreshCw className="w-4 h-4 animate-spin text-blue-600" />
            <span>Loading commercial quotations from backend...</span>
          </div>
        </div>
      ) : quotations.length === 0 ? (
        <EmptyState
          title="No quotations found"
          description="Try adjusting your search terms or filters, or create a new quotation for a customer."
          icon={FileSpreadsheet}
          actionLabel="Create Quotation"
          onAction={() => {
            setSelectedQuotation(null);
            setIsFormOpen(true);
          }}
        />
      ) : (
        <div className="space-y-3">
          <DataTable<Quotation>
            columns={columns}
            data={quotations}
            rowKey={(q) => q._id || q.id || ''}
          />

          <Pagination
            currentPage={page}
            totalPages={Math.ceil(total / limit) || 1}
            totalItems={total}
            itemsPerPage={limit}
            onPageChange={setPage}
          />
        </div>
      )}

      {/* Create / Edit Form Modal */}
      <QuotationFormModal
        isOpen={isFormOpen}
        quotation={selectedQuotation}
        isSubmitting={isSubmitting}
        onSubmit={handleFormSubmit}
        onClose={() => {
          setIsFormOpen(false);
          setSelectedQuotation(null);
        }}
      />

      {/* Details / Preview / Print Modal */}
      <QuotationDetailsModal
        isOpen={!!detailsQuotation}
        quotation={detailsQuotation}
        onClose={() => setDetailsQuotation(null)}
        onEdit={(quote) => {
          setDetailsQuotation(null);
          setSelectedQuotation(quote);
          setIsFormOpen(true);
        }}
        onSend={handleSendQuotation}
        onAccept={handleAcceptQuotation}
        onReject={handleRejectQuotation}
        onConvertToSubscription={handleConvertToSubscription}
      />

      {/* Delete Draft Confirmation */}
      <ConfirmationDialog
        isOpen={!!deleteTarget}
        title="Delete Draft Quotation"
        message={`Are you sure you want to permanently delete quotation ${
          deleteTarget?.quotationNumber || deleteTarget?._id || deleteTarget?.id
        }? This operation cannot be undone.`}
        confirmLabel="Delete Draft"
        cancelLabel="Cancel"
        variant="danger"
        isLoading={isDeleting}
        onConfirm={handleDeleteDraft}
        onCancel={() => setDeleteTarget(null)}
      />

      {/* Toast Notification */}
      {toast && (
        <ToastNotification
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
};
