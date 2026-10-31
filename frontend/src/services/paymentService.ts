import { apiClient } from './api';
import { 
  PaymentModel, 
  PopulatedPaymentModel, 
  PaymentMethod, 
  PaymentStatus,
  UserModel,
  PopulatedPhase4Invoice 
} from '../types';
import { INITIAL_PAYMENTS } from './mockData';
import { quotationService } from './quotationService';
import { invoiceService } from './invoiceService';

const STORAGE_KEY = 'brightloop_phase4_payments';

function getStoredPayments(): PaymentModel[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_PAYMENTS));
      return INITIAL_PAYMENTS;
    }
    return JSON.parse(raw) as PaymentModel[];
  } catch {
    return INITIAL_PAYMENTS;
  }
}

function setStoredPayments(payments: PaymentModel[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(payments));
  } catch (err) {
    console.warn('Could not persist payments to localStorage:', err);
  }
}

export interface ListPaymentsFilter {
  search?: string;
  method?: string;
  status?: string;
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
}

export interface ListPaymentsResponse {
  payments: PopulatedPaymentModel[];
  total: number;
  page: number;
  totalPages: number;
}

export const paymentService = {
  /**
   * Populate references (invoice and customer)
   */
  async populatePayment(payment: PaymentModel): Promise<PopulatedPaymentModel> {
    const [users, invoiceRes] = await Promise.all([
      quotationService.getUsers(),
      invoiceService.getInvoiceById(payment.invoice).catch(() => null),
    ]);

    const customer = users.find(u => u._id === payment.customer) || {
      _id: payment.customer,
      name: 'Customer ' + payment.customer.slice(-6),
      email: 'client@company.com',
      role: 'customer' as const,
      company: 'Corporate Client',
    };

    const invoice: PopulatedPhase4Invoice = invoiceRes || {
      _id: payment.invoice,
      customer,
      subscription: {
        _id: 'sub_ref',
        customer: payment.customer,
        product: 'prod_ref',
        plan: 'plan_ref',
        quotation: 'q_ref',
        quantity: 1,
        startDate: payment.paymentDate,
        nextBillingDate: payment.paymentDate,
        status: 'active',
      },
      amount: payment.amount,
      dueDate: payment.paymentDate,
      status: payment.status === 'completed' ? 'paid' : 'sent',
      generatedAt: payment.paymentDate,
    };

    return {
      ...payment,
      customer,
      invoice,
    };
  },

  /**
   * List Payments with API and fallback
   */
  async listPayments(params: ListPaymentsFilter = {}): Promise<ListPaymentsResponse> {
    try {
      const response = await apiClient.get('/payments', { params });
      if (response.data && Array.isArray(response.data.payments)) {
        return response.data;
      }
      if (Array.isArray(response.data)) {
        const rawList = response.data as PaymentModel[];
        const populated = await Promise.all(rawList.map(p => this.populatePayment(p)));
        return {
          payments: populated,
          total: populated.length,
          page: 1,
          totalPages: 1,
        };
      }
    } catch {
      // Fallback
    }

    const stored = getStoredPayments();
    let populated = await Promise.all(stored.map(p => this.populatePayment(p)));

    // Search filter
    if (params.search && params.search.trim() !== '') {
      const q = params.search.toLowerCase().trim();
      populated = populated.filter(p =>
        p._id.toLowerCase().includes(q) ||
        p.invoice._id.toLowerCase().includes(q) ||
        p.customer.name.toLowerCase().includes(q) ||
        (p.customer.company && p.customer.company.toLowerCase().includes(q)) ||
        p.customer.email.toLowerCase().includes(q)
      );
    }

    // Payment method filter
    if (params.method && params.method !== 'all') {
      populated = populated.filter(p => p.paymentMethod === params.method);
    }

    // Payment status filter
    if (params.status && params.status !== 'all') {
      populated = populated.filter(p => p.status === params.status);
    }

    // Date range filter
    if (params.startDate) {
      populated = populated.filter(p => p.paymentDate >= params.startDate!);
    }
    if (params.endDate) {
      populated = populated.filter(p => p.paymentDate <= params.endDate!);
    }

    // Sort newest first
    populated.sort((a, b) => new Date(b.paymentDate).getTime() - new Date(a.paymentDate).getTime());

    const page = params.page || 1;
    const limit = params.limit || 8;
    const total = populated.length;
    const totalPages = Math.max(1, Math.ceil(total / limit));
    const paginated = populated.slice((page - 1) * limit, page * limit);

    return {
      payments: paginated,
      total,
      page,
      totalPages,
    };
  },

  /**
   * Get single payment by ID
   */
  async getPaymentById(id: string): Promise<PopulatedPaymentModel> {
    try {
      const response = await apiClient.get(`/payments/${id}`);
      if (response.data) {
        if (typeof response.data.customer === 'object') {
          return response.data;
        }
        return await this.populatePayment(response.data);
      }
    } catch {
      // Fallback
    }

    const stored = getStoredPayments();
    const found = stored.find(p => p._id === id);
    if (!found) {
      throw new Error(`Payment ${id} not found`);
    }
    return await this.populatePayment(found);
  },

  /**
   * Record a payment (POST /payments)
   * Strictly follows the Payment schema:
   * invoice, customer, amount, paymentMethod, paymentDate, status
   */
  async createPayment(data: {
    invoice: string;
    customer: string;
    amount: number;
    paymentMethod: PaymentMethod;
    paymentDate: string;
    status: PaymentStatus;
  }): Promise<PaymentModel> {
    const payload: PaymentModel = {
      _id: '65f1p1' + Math.random().toString(16).substring(2, 18).padEnd(18, '0'),
      invoice: data.invoice,
      customer: data.customer,
      amount: Number(data.amount),
      paymentMethod: data.paymentMethod,
      paymentDate: data.paymentDate,
      status: data.status,
      createdAt: new Date().toISOString(),
    };

    try {
      const response = await apiClient.post('/payments', data);
      if (response.data) {
        const created = response.data;
        const stored = getStoredPayments();
        setStoredPayments([created, ...stored]);

        // If completed, attempt to update invoice status to paid
        if (created.status === 'completed') {
          try {
            await invoiceService.updateInvoiceStatus(created.invoice, 'paid');
          } catch {
            // Ignored if handled automatically by backend
          }
        }
        return created;
      }
    } catch {
      // Offline fallback
    }

    const stored = getStoredPayments();
    setStoredPayments([payload, ...stored]);

    // Update invoice status to 'paid' if completed
    if (payload.status === 'completed') {
      try {
        await invoiceService.updateInvoiceStatus(payload.invoice, 'paid');
      } catch (err) {
        console.warn('Could not auto-update invoice status on payment record:', err);
      }
    }

    return payload;
  },

  /**
   * Get payments for a specific invoice
   */
  async getPaymentsByInvoice(invoiceId: string): Promise<PopulatedPaymentModel[]> {
    const res = await this.listPayments({ limit: 100 });
    return res.payments.filter(p => p.invoice._id === invoiceId);
  }
};
