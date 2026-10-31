import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { 
  Customer, 
  Invoice, 
  Plan, 
  RevenueMetric, 
  Subscription, 
  UserRole,
  ActivityNotification,
  PopulatedQuotation,
  Quotation,
  PopulatedSubscription,
  Phase3Subscription,
  Product,
  UserModel,
  PopulatedPhase4Invoice,
  PopulatedPaymentModel
} from '../types';
import { BrightloopService } from '../services/api';
import { authService } from '../services/authService';

export type AppView = 
  | 'overview' 
  | 'quotations'
  | 'subscriptions' 
  | 'products'
  | 'plans' 
  | 'customers' 
  | 'invoices' 
  | 'payments'
  | 'analytics' 
  | 'gateway'
  | 'auth';

interface AppContextType {
  role: UserRole;
  setRole: (role: UserRole) => void;
  currentUser: UserModel | null;
  setCurrentUser: (user: UserModel | null) => void;
  logout: () => void;
  theme: 'light' | 'dark';
  toggleTheme: () => void;
  currentView: AppView;
  setCurrentView: (view: AppView) => void;
  
  // Data
  customers: Customer[];
  subscriptions: Subscription[];
  invoices: Invoice[];
  plans: Plan[];
  metrics: RevenueMetric | null;
  loading: boolean;
  refreshData: () => Promise<void>;
  refreshKey: number;
  triggerRefresh: () => void;
  
  // Selection and Modals
  selectedCustomer: Customer | null;
  setSelectedCustomer: (customer: Customer | null) => void;
  selectedInvoice: Invoice | null;
  setSelectedInvoice: (invoice: Invoice | null) => void;
  
  isCreateSubOpen: boolean;
  setIsCreateSubOpen: (open: boolean) => void;
  isCreateInvoiceOpen: boolean;
  setIsCreateInvoiceOpen: (open: boolean) => void;
  
  subscriptionToCancel: Subscription | null;
  setSubscriptionToCancel: (sub: Subscription | null) => void;

  // Phase 2 Product Modal States
  isCreateProductOpen: boolean;
  setIsCreateProductOpen: (open: boolean) => void;
  productToEdit: Product | null;
  setProductToEdit: (prod: Product | null) => void;

  // Phase 3 Quotation & Subscription States
  selectedQuotation: PopulatedQuotation | null;
  setSelectedQuotation: (q: PopulatedQuotation | null) => void;
  isCreateQuotationOpen: boolean;
  setIsCreateQuotationOpen: (open: boolean) => void;
  quotationToEdit: PopulatedQuotation | Quotation | null;
  setQuotationToEdit: (q: PopulatedQuotation | Quotation | null) => void;

  selectedSubscriptionPhase3: PopulatedSubscription | null;
  setSelectedSubscriptionPhase3: (s: PopulatedSubscription | null) => void;
  isCreateSubPhase3Open: boolean;
  setIsCreateSubPhase3Open: (open: boolean) => void;
  initialQuotationForSub: PopulatedQuotation | null;
  setInitialQuotationForSub: (q: PopulatedQuotation | null) => void;

  // Phase 4 Invoice & Payment States
  selectedPhase4Invoice: PopulatedPhase4Invoice | null;
  setSelectedPhase4Invoice: (inv: PopulatedPhase4Invoice | null) => void;
  isRecordPaymentOpen: boolean;
  setIsRecordPaymentOpen: (open: boolean) => void;
  selectedPaymentRecord: PopulatedPaymentModel | null;
  setSelectedPaymentRecord: (p: PopulatedPaymentModel | null) => void;
  paymentInvoicePreset: PopulatedPhase4Invoice | null;
  setPaymentInvoicePreset: (inv: PopulatedPhase4Invoice | null) => void;
  
  // Toasts
  toasts: ActivityNotification[];
  addToast: (title: string, message: string, type?: 'success' | 'warning' | 'info' | 'error') => void;
  removeToast: (id: string) => void;
  
  // Backend Status
  backendStatus: { online: boolean; url: string };
  checkBackend: () => Promise<void>;
  
  // Actions with permission checks
  canPerformAction: (action: 'cancel_sub' | 'create_sub' | 'edit_plan' | 'issue_invoice' | 'refund' | 'view_analytics') => boolean;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<UserModel | null>(() => authService.getCurrentUser());
  const [role, setRoleState] = useState<UserRole>(() => {
    const user = authService.getCurrentUser();
    if (user?.role === 'admin') return 'super_admin';
    if (user?.role === 'staff') return 'sales_rep';
    if (user?.role === 'customer') return 'csm';
    return 'super_admin';
  });
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [currentView, setCurrentView] = useState<AppView>(() => {
    const user = authService.getCurrentUser();
    if (!user) return 'auth';
    if (user.role === 'admin') return 'overview';
    if (user.role === 'staff') return 'quotations';
    return 'subscriptions';
  });

  const [customers, setCustomers] = useState<Customer[]>([]);
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [metrics, setMetrics] = useState<RevenueMetric | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [isCreateSubOpen, setIsCreateSubOpen] = useState(false);
  const [isCreateInvoiceOpen, setIsCreateInvoiceOpen] = useState(false);
  const [subscriptionToCancel, setSubscriptionToCancel] = useState<Subscription | null>(null);

  // Phase 2 Product Modal States
  const [isCreateProductOpen, setIsCreateProductOpen] = useState(false);
  const [productToEdit, setProductToEdit] = useState<Product | null>(null);

  // Phase 3 States
  const [selectedQuotation, setSelectedQuotation] = useState<PopulatedQuotation | null>(null);
  const [isCreateQuotationOpen, setIsCreateQuotationOpen] = useState(false);
  const [quotationToEdit, setQuotationToEdit] = useState<PopulatedQuotation | Quotation | null>(null);

  const [selectedSubscriptionPhase3, setSelectedSubscriptionPhase3] = useState<PopulatedSubscription | null>(null);
  const [isCreateSubPhase3Open, setIsCreateSubPhase3Open] = useState(false);
  const [initialQuotationForSub, setInitialQuotationForSub] = useState<PopulatedQuotation | null>(null);

  // Phase 4 Invoice & Payment States
  const [selectedPhase4Invoice, setSelectedPhase4Invoice] = useState<PopulatedPhase4Invoice | null>(null);
  const [isRecordPaymentOpen, setIsRecordPaymentOpen] = useState(false);
  const [selectedPaymentRecord, setSelectedPaymentRecord] = useState<PopulatedPaymentModel | null>(null);
  const [paymentInvoicePreset, setPaymentInvoicePreset] = useState<PopulatedPhase4Invoice | null>(null);

  const [refreshKey, setRefreshKey] = useState<number>(0);
  const triggerRefresh = useCallback(() => {
    setRefreshKey(prev => prev + 1);
  }, []);

  const [toasts, setToasts] = useState<ActivityNotification[]>([]);
  const [backendStatus, setBackendStatus] = useState<{ online: boolean; url: string }>({
    online: false,
    url: import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api',
  });

  const addToast = useCallback((
    title: string, 
    message: string, 
    type: 'success' | 'warning' | 'info' | 'error' = 'info'
  ) => {
    const id = `toast_${Date.now()}_${Math.random().toString(36).substring(2, 5)}`;
    const newToast: ActivityNotification = {
      id,
      title,
      message,
      type,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };
    setToasts(prev => [newToast, ...prev.slice(0, 4)]);

    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 4500);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const toggleTheme = () => {
    const nextTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(nextTheme);
    if (nextTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  const setRole = (newRole: UserRole) => {
    setRoleState(newRole);
    const roleLabels: Record<UserRole, string> = {
      super_admin: 'Super Admin',
      finance_manager: 'Finance & Billing Manager',
      csm: 'Customer Success Manager',
      sales_rep: 'Enterprise Sales Rep',
      auditor: 'Compliance Auditor (Read-Only)',
    };
    addToast('Role Switched', `Active session switched to ${roleLabels[newRole]}.`, 'info');
  };

  const logout = useCallback(() => {
    authService.logout();
    setCurrentUser(null);
    setCurrentView('auth');
    addToast('Signed Out', 'You have been securely signed out.', 'info');
  }, [addToast]);

  const checkBackend = useCallback(async () => {
    const status = await BrightloopService.checkBackendHealth();
    setBackendStatus(status);
  }, []);

  const refreshData = useCallback(async () => {
    setRefreshKey(prev => prev + 1);
    setLoading(true);
    try {
      const [fetchedPlans, fetchedCustomers, fetchedSubs, fetchedInvoices, fetchedMetrics] = 
        await Promise.all([
          BrightloopService.getPlans(),
          BrightloopService.getCustomers(),
          BrightloopService.getSubscriptions(),
          BrightloopService.getInvoices(),
          BrightloopService.getMetrics(),
        ]);

      setPlans(fetchedPlans);
      setCustomers(fetchedCustomers);
      setSubscriptions(fetchedSubs);
      setInvoices(fetchedInvoices);
      setMetrics(fetchedMetrics);
    } catch (err) {
      console.error('Failed loading Brightloop data:', err);
      addToast('Data Sync Issue', 'Could not sync latest metrics. Falling back to cached state.', 'warning');
    } finally {
      setLoading(false);
    }
  }, [addToast]);

  useEffect(() => {
    checkBackend();
    refreshData();
  }, [checkBackend, refreshData]);

  // Permission Matrix based on UserRole
  const canPerformAction = (action: 'cancel_sub' | 'create_sub' | 'edit_plan' | 'issue_invoice' | 'refund' | 'view_analytics'): boolean => {
    if (role === 'super_admin') return true;
    if (role === 'auditor') return false; // purely read-only

    switch (action) {
      case 'cancel_sub':
        return role === 'csm';
      case 'create_sub':
        return role === 'sales_rep' || role === 'csm';
      case 'edit_plan':
        return false;
      case 'issue_invoice':
      case 'refund':
        return role === 'finance_manager';
      case 'view_analytics':
        return true;
      default:
        return false;
    }
  };

  return (
    <AppContext.Provider
      value={{
        role,
        setRole,
        currentUser,
        setCurrentUser,
        logout,
        theme,
        toggleTheme,
        currentView,
        setCurrentView,
        customers,
        subscriptions,
        invoices,
        plans,
        metrics,
        loading,
        refreshData,
        refreshKey,
        triggerRefresh,
        selectedCustomer,
        setSelectedCustomer,
        selectedInvoice,
        setSelectedInvoice,
        isCreateSubOpen,
        setIsCreateSubOpen,
        isCreateInvoiceOpen,
        setIsCreateInvoiceOpen,
        subscriptionToCancel,
        setSubscriptionToCancel,
        isCreateProductOpen,
        setIsCreateProductOpen,
        productToEdit,
        setProductToEdit,
        selectedQuotation,
        setSelectedQuotation,
        isCreateQuotationOpen,
        setIsCreateQuotationOpen,
        quotationToEdit,
        setQuotationToEdit,
        selectedSubscriptionPhase3,
        setSelectedSubscriptionPhase3,
        isCreateSubPhase3Open,
        setIsCreateSubPhase3Open,
        initialQuotationForSub,
        setInitialQuotationForSub,
        selectedPhase4Invoice,
        setSelectedPhase4Invoice,
        isRecordPaymentOpen,
        setIsRecordPaymentOpen,
        selectedPaymentRecord,
        setSelectedPaymentRecord,
        paymentInvoicePreset,
        setPaymentInvoicePreset,
        toasts,
        addToast,
        removeToast,
        backendStatus,
        checkBackend,
        canPerformAction,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
