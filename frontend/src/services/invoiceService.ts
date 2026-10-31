import { apiClient } from './api';
import { 
  Phase4Invoice, 
  PopulatedPhase4Invoice, 
  Phase4InvoiceStatus,
  UserModel,
  Phase3Subscription,
  PopulatedSubscription 
} from '../types';
import { INITIAL_PHASE4_INVOICES } from './mockData';
import { quotationService } from './quotationService';
import { subscriptionService } from './subscriptionService';

const STORAGE_KEY = 'brightloop_phase4_invoices';

function getStoredInvoices(): Phase4Invoice[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_PHASE4_INVOICES));
      return INITIAL_PHASE4_INVOICES;
    }
    return JSON.parse(raw) as Phase4Invoice[];
  } catch {
    return INITIAL_PHASE4_INVOICES;
  }
}

function setStoredInvoices(invoices: Phase4Invoice[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(invoices));
  } catch (err) {
    console.warn('Could not persist Phase 4 invoices to localStorage:', err);
  }
}

export interface ListInvoicesFilter {
  search?: string;
  status?: string;
  dueDate?: string;
  page?: number;
  limit?: number;
}

export interface ListInvoicesResponse {
  invoices: PopulatedPhase4Invoice[];
  total: number;
  page: number;
  totalPages: number;
}

export const invoiceService = {
  /**
   * Populate references (customer User and Subscription)
   */
  async populateInvoice(inv: Phase4Invoice): Promise<PopulatedPhase4Invoice> {
    const [users, subsRes] = await Promise.all([
      quotationService.getUsers(),
      subscriptionService.listSubscriptions({ limit: 100 }),
    ]);

    const subs = subsRes.subscriptions;

    const customer = users.find(u => u._id === inv.customer) || {
      _id: inv.customer,
      name: 'Customer ' + inv.customer.slice(-6),
      email: 'client@company.com',
      role: 'customer' as const,
      company: 'Client Organization',
    };

    const foundSub = subs.find(s => s._id === inv.subscription);
    const subscription: PopulatedSubscription | Phase3Subscription = foundSub || {
      _id: inv.subscription,
      customer: inv.customer,
      product: '65f1b1000000000000000001',
      plan: '65f1c1000000000000000001',
      quotation: '65f1d1000000000000000001',
      quantity: 1,
      startDate: inv.generatedAt,
      nextBillingDate: inv.dueDate,
      status: 'active',
    };

    return {
      ...inv,
      customer,
      subscription,
    };
  },

  /**
   * List Invoices with backend API and offline fallback
   */
  async listInvoices(params: ListInvoicesFilter = {}): Promise<ListInvoicesResponse> {
    try {
      const response = await apiClient.get('/invoices', { params });
      if (response.data && Array.isArray(response.data.invoices)) {
        return response.data;
      }
      if (Array.isArray(response.data)) {
        const rawList = response.data as Phase4Invoice[];
        const populated = await Promise.all(rawList.map(inv => this.populateInvoice(inv)));
        return {
          invoices: populated,
          total: populated.length,
          page: 1,
          totalPages: 1,
        };
      }
    } catch {
      // Offline fallback: query local storage
    }

    const stored = getStoredInvoices();
    let populated = await Promise.all(stored.map(inv => this.populateInvoice(inv)));

    // Search filter
    if (params.search && params.search.trim() !== '') {
      const q = params.search.toLowerCase().trim();
      populated = populated.filter(inv => 
        inv._id.toLowerCase().includes(q) ||
        inv.customer.name.toLowerCase().includes(q) ||
        (inv.customer.company && inv.customer.company.toLowerCase().includes(q)) ||
        inv.customer.email.toLowerCase().includes(q) ||
        inv.subscription._id.toLowerCase().includes(q)
      );
    }

    // Status filter
    if (params.status && params.status !== 'all') {
      populated = populated.filter(inv => inv.status === params.status);
    }

    // Due date filter (exact or up to)
    if (params.dueDate) {
      populated = populated.filter(inv => inv.dueDate.startsWith(params.dueDate!));
    }

    // Sort newest first
    populated.sort((a, b) => new Date(b.generatedAt).getTime() - new Date(a.generatedAt).getTime());

    const page = params.page || 1;
    const limit = params.limit || 8;
    const total = populated.length;
    const totalPages = Math.max(1, Math.ceil(total / limit));
    const paginated = populated.slice((page - 1) * limit, page * limit);

    return {
      invoices: paginated,
      total,
      page,
      totalPages,
    };
  },

  /**
   * Get single invoice by ID
   */
  async getInvoiceById(id: string): Promise<PopulatedPhase4Invoice> {
    try {
      const response = await apiClient.get(`/invoices/${id}`);
      if (response.data) {
        if (typeof response.data.customer === 'object') {
          return response.data;
        }
        return await this.populateInvoice(response.data);
      }
    } catch {
      // Offline fallback
    }

    const stored = getStoredInvoices();
    const found = stored.find(i => i._id === id);
    if (!found) {
      throw new Error(`Invoice ${id} not found`);
    }
    return await this.populateInvoice(found);
  },

  /**
   * Create an invoice (adheres strictly to MongoDB Invoice schema)
   */
  async createInvoice(data: {
    customer: string;
    subscription: string;
    amount: number;
    dueDate: string;
    status?: Phase4InvoiceStatus;
    generatedAt?: string;
  }): Promise<Phase4Invoice> {
    const payload: Phase4Invoice = {
      _id: '65f1f1' + Math.random().toString(16).substring(2, 18).padEnd(18, '0'),
      customer: data.customer,
      subscription: data.subscription,
      amount: Number(data.amount),
      dueDate: data.dueDate,
      status: data.status || 'draft',
      generatedAt: data.generatedAt || new Date().toISOString().split('T')[0],
      createdAt: new Date().toISOString(),
    };

    try {
      const response = await apiClient.post('/invoices', data);
      if (response.data) {
        const created = response.data;
        const stored = getStoredInvoices();
        setStoredInvoices([created, ...stored]);
        return created;
      }
    } catch {
      // Fallback
    }

    const stored = getStoredInvoices();
    const updated = [payload, ...stored];
    setStoredInvoices(updated);
    return payload;
  },

  /**
   * Send Invoice (transitions status from draft -> sent if permitted)
   */
  async sendInvoice(id: string): Promise<Phase4Invoice> {
    try {
      const response = await apiClient.post(`/invoices/${id}/send`);
      if (response.data) {
        return response.data;
      }
    } catch {
      // Fallback
    }

    const stored = getStoredInvoices();
    const index = stored.findIndex(i => i._id === id);
    if (index === -1) {
      throw new Error(`Invoice with ID ${id} not found.`);
    }

    const updated = [...stored];
    updated[index] = {
      ...updated[index],
      status: 'sent',
      updatedAt: new Date().toISOString(),
    };
    setStoredInvoices(updated);
    return updated[index];
  },

  /**
   * Update Invoice Status (e.g., when payment completed -> paid)
   */
  async updateInvoiceStatus(id: string, status: Phase4InvoiceStatus): Promise<Phase4Invoice> {
    try {
      const response = await apiClient.patch(`/invoices/${id}/status`, { status });
      if (response.data) return response.data;
    } catch {
      // Fallback
    }

    const stored = getStoredInvoices();
    const index = stored.findIndex(i => i._id === id);
    if (index !== -1) {
      const updated = [...stored];
      updated[index] = {
        ...updated[index],
        status,
        updatedAt: new Date().toISOString(),
      };
      setStoredInvoices(updated);
      return updated[index];
    }
    throw new Error('Invoice not found');
  },

  /**
   * Trigger backend or frontend print/PDF download
   */
  downloadInvoicePdf(invoice: PopulatedPhase4Invoice): void {
    // Generate clean printable text/document representation
    const textContent = `
========================================================================
                      BRIGHTLOOP SUBSCRIPTION INVOICE
========================================================================

Invoice ID:        ${invoice._id}
Status:            ${invoice.status.toUpperCase()}
Issue Date:        ${invoice.generatedAt}
Due Date:          ${invoice.dueDate}

------------------------------------------------------------------------
CUSTOMER INFORMATION
------------------------------------------------------------------------
Customer Name:     ${invoice.customer.name}
Company:           ${invoice.customer.company || 'N/A'}
Email:             ${invoice.customer.email}
Phone:             ${invoice.customer.phone || 'N/A'}

------------------------------------------------------------------------
SUBSCRIPTION DETAILS
------------------------------------------------------------------------
Subscription ID:   ${invoice.subscription._id}
Plan Code:         ${'plan' in invoice.subscription && typeof invoice.subscription.plan === 'object' ? invoice.subscription.plan.name : 'Subscription Service'}
Quantity:          ${invoice.subscription.quantity}

------------------------------------------------------------------------
AMOUNT DUE
------------------------------------------------------------------------
Total Amount Due:  $${invoice.amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USD

========================================================================
Brightloop Systems, Inc. | Enterprise Billing & Subscription Automation
========================================================================
`.trim();

    const blob = new Blob([textContent], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Invoice-${invoice._id.slice(-8).toUpperCase()}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }
};
