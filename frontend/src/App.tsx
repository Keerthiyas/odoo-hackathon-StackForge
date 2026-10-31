import React from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { UserModel } from './types';
import { Header } from './components/layout/Header';
import { Sidebar } from './components/layout/Sidebar';
import { OverviewView } from './components/views/OverviewView';
import { QuotationsView } from './components/views/QuotationsView';
import { SubscriptionsView } from './components/views/SubscriptionsView';
import { ProductsView } from './components/views/ProductsView';
import { PlansCatalogView } from './components/views/PlansCatalogView';
import { CustomersView } from './components/views/CustomersView';
import { InvoicesView } from './components/views/InvoicesView';
import { PaymentsView } from './components/views/PaymentsView';
import { RevenueAnalyticsView } from './components/views/RevenueAnalyticsView';
import { GatewayWebhooksView } from './components/views/GatewayWebhooksView';
import { AuthView } from './components/views/AuthView';

// Modals
import { CreateProductModal } from './components/modals/CreateProductModal';
import { CreateQuotationModal } from './components/modals/CreateQuotationModal';
import { QuotationDetailModal } from './components/modals/QuotationDetailModal';
import { CreateSubscriptionPhase3Modal } from './components/modals/CreateSubscriptionPhase3Modal';
import { SubscriptionDetailPhase3Modal } from './components/modals/SubscriptionDetailPhase3Modal';
import { Phase4InvoiceDetailModal } from './components/modals/Phase4InvoiceDetailModal';
import { RecordPaymentModal } from './components/modals/RecordPaymentModal';
import { PaymentDetailModal } from './components/modals/PaymentDetailModal';
import { CreateSubscriptionModal } from './components/modals/CreateSubscriptionModal';
import { InvoiceDetailModal } from './components/modals/InvoiceDetailModal';
import { CancelSubscriptionModal } from './components/modals/CancelSubscriptionModal';
import { CustomerDrawer } from './components/modals/CustomerDrawer';
import { CreateInvoiceModal } from './components/modals/CreateInvoiceModal';
import { ToastContainer } from './components/common/ToastContainer';

const MainLayout: React.FC = () => {
  const { 
    currentView,
    setCurrentView,
    currentUser,
    setCurrentUser,
    setRole,
    addToast,
    refreshData,
    isCreateProductOpen,
    setIsCreateProductOpen,
    productToEdit,
    setProductToEdit,
    isCreateQuotationOpen,
    setIsCreateQuotationOpen,
    quotationToEdit,
    setQuotationToEdit,
    selectedQuotation,
    setSelectedQuotation,
    isCreateSubPhase3Open,
    setIsCreateSubPhase3Open,
    initialQuotationForSub,
    setInitialQuotationForSub,
    selectedSubscriptionPhase3,
    setSelectedSubscriptionPhase3,
    selectedPhase4Invoice,
    setSelectedPhase4Invoice,
    isRecordPaymentOpen,
    setIsRecordPaymentOpen,
    selectedPaymentRecord,
    setSelectedPaymentRecord,
    paymentInvoicePreset,
    setPaymentInvoicePreset,
  } = useApp();

  const handleAuthenticated = (user: UserModel) => {
    setCurrentUser(user);
    // Role-based dashboard redirection
    if (user.role === 'admin') {
      setRole('super_admin');
      setCurrentView('overview');
    } else if (user.role === 'staff') {
      setRole('sales_rep');
      setCurrentView('quotations');
    } else {
      setRole('csm');
      setCurrentView('subscriptions');
    }
  };

  // Dedicated full-screen authentication view without sidebar or header
  if (!currentUser || currentView === 'auth') {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100">
        <AuthView
          onAuthenticated={handleAuthenticated}
          addToast={addToast}
        />
        <ToastContainer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100">
      {/* Fixed Sidebar */}
      <Sidebar />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        <Header />

        <main className="flex-1 p-6 lg:p-8 max-w-7xl w-full mx-auto">
          {/* Phase 1: Dashboard Overview */}
          {currentView === 'overview' && <OverviewView />}

          {/* Phase 3: Quotations Management */}
          {currentView === 'quotations' && (
            <QuotationsView
              onOpenCreate={() => {
                setQuotationToEdit(null);
                setIsCreateQuotationOpen(true);
              }}
              onOpenEdit={q => {
                setQuotationToEdit(q);
                setIsCreateQuotationOpen(true);
              }}
              onViewDetails={q => setSelectedQuotation(q)}
              onConvertToSubscription={q => {
                setInitialQuotationForSub(q);
                setIsCreateSubPhase3Open(true);
              }}
              addToast={addToast}
            />
          )}

          {/* Phase 3: Subscription Management */}
          {currentView === 'subscriptions' && (
            <SubscriptionsView
              onOpenCreate={q => {
                setInitialQuotationForSub(q || null);
                setIsCreateSubPhase3Open(true);
              }}
              onViewDetails={s => setSelectedSubscriptionPhase3(s)}
              addToast={addToast}
            />
          )}

          {/* Phase 2: Product Management */}
          {currentView === 'products' && (
            <ProductsView
              onOpenCreate={() => {
                setProductToEdit(null);
                setIsCreateProductOpen(true);
              }}
              onOpenEdit={p => {
                setProductToEdit(p);
                setIsCreateProductOpen(true);
              }}
              addToast={addToast}
            />
          )}

          {/* Phase 2: Plan Management */}
          {currentView === 'plans' && <PlansCatalogView />}

          {/* CRM, Invoices, Payments, Analytics, Gateway */}
          {currentView === 'customers' && <CustomersView />}
          {currentView === 'invoices' && (
            <InvoicesView
              onViewInvoice={inv => setSelectedPhase4Invoice(inv)}
              onRecordPayment={inv => {
                setPaymentInvoicePreset(inv);
                setIsRecordPaymentOpen(true);
              }}
              addToast={addToast}
            />
          )}
          {currentView === 'payments' && (
            <PaymentsView
              onOpenRecordPayment={() => {
                setPaymentInvoicePreset(null);
                setIsRecordPaymentOpen(true);
              }}
              onViewPayment={p => setSelectedPaymentRecord(p)}
              onViewInvoice={inv => setSelectedPhase4Invoice(inv)}
              addToast={addToast}
            />
          )}
          {currentView === 'analytics' && <RevenueAnalyticsView />}
          {currentView === 'gateway' && <GatewayWebhooksView />}
        </main>
      </div>

      {/* Phase 2 Product Modal */}
      <CreateProductModal
        isOpen={isCreateProductOpen}
        onClose={() => {
          setIsCreateProductOpen(false);
          setProductToEdit(null);
        }}
        productToEdit={productToEdit}
        onSaved={refreshData}
        addToast={addToast}
      />

      {/* Phase 3 Quotation Modals */}
      <CreateQuotationModal
        isOpen={isCreateQuotationOpen}
        onClose={() => {
          setIsCreateQuotationOpen(false);
          setQuotationToEdit(null);
        }}
        quotationToEdit={quotationToEdit}
        onSaved={refreshData}
        addToast={addToast}
      />

      <QuotationDetailModal
        quotation={selectedQuotation}
        onClose={() => setSelectedQuotation(null)}
        onRefresh={refreshData}
        onConvertToSubscription={q => {
          setInitialQuotationForSub(q);
          setIsCreateSubPhase3Open(true);
        }}
        addToast={addToast}
      />

      {/* Phase 3 Subscription Modals */}
      <CreateSubscriptionPhase3Modal
        isOpen={isCreateSubPhase3Open}
        onClose={() => {
          setIsCreateSubPhase3Open(false);
          setInitialQuotationForSub(null);
        }}
        initialQuotation={initialQuotationForSub}
        onCreated={refreshData}
        addToast={addToast}
      />

      <SubscriptionDetailPhase3Modal
        subscription={selectedSubscriptionPhase3}
        onClose={() => setSelectedSubscriptionPhase3(null)}
        onRefresh={refreshData}
        addToast={addToast}
      />

      {/* Phase 4 Invoice & Payment Modals */}
      <Phase4InvoiceDetailModal
        invoice={selectedPhase4Invoice}
        onClose={() => setSelectedPhase4Invoice(null)}
        onRefresh={refreshData}
        onRecordPayment={inv => {
          setPaymentInvoicePreset(inv);
          setIsRecordPaymentOpen(true);
        }}
        addToast={addToast}
      />

      <RecordPaymentModal
        isOpen={isRecordPaymentOpen}
        onClose={() => {
          setIsRecordPaymentOpen(false);
          setPaymentInvoicePreset(null);
        }}
        presetInvoice={paymentInvoicePreset}
        onPaymentRecorded={refreshData}
        addToast={addToast}
      />

      <PaymentDetailModal
        payment={selectedPaymentRecord}
        onClose={() => setSelectedPaymentRecord(null)}
        onViewInvoice={inv => setSelectedPhase4Invoice(inv)}
      />

      {/* Core Phase 1 Modals & Drawers */}
      <CreateSubscriptionModal />
      <InvoiceDetailModal />
      <CancelSubscriptionModal />
      <CustomerDrawer />
      <CreateInvoiceModal />
      <ToastContainer />
    </div>
  );
};

export default function App() {
  return (
    <AppProvider>
      <MainLayout />
    </AppProvider>
  );
}
