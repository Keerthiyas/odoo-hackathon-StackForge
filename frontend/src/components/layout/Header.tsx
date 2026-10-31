import React from 'react';
import { 
  Sun, 
  Moon, 
  Plus, 
  RefreshCw, 
  LogOut,
  User as UserIcon
} from 'lucide-react';
import { useApp } from '../../context/AppContext';

export const Header: React.FC = () => {
  const { 
    theme, 
    toggleTheme, 
    currentView,
    currentUser,
    setIsCreateQuotationOpen,
    setIsCreateSubPhase3Open,
    setIsCreateProductOpen,
    setIsCreateInvoiceOpen,
    setIsRecordPaymentOpen,
    refreshData,
    loading,
    logout 
  } = useApp();

  const userRole = currentUser?.role || 'admin';

  // Dynamic titles depending on user role
  const getViewTitle = (): string => {
    if (userRole === 'customer') {
      switch (currentView) {
        case 'overview': return 'My Dashboard';
        case 'quotations': return 'My Quotations';
        case 'subscriptions': return 'My Subscriptions';
        case 'invoices': return 'My Invoices';
        case 'payments': return 'My Payments';
        default: return 'Dashboard';
      }
    }

    switch (currentView) {
      case 'overview': return 'Dashboard';
      case 'products':
      case 'plans': return 'Products & Plans';
      case 'quotations': return 'Quotations';
      case 'subscriptions': return 'Subscriptions';
      case 'invoices': return 'Invoices';
      case 'payments': return 'Payments';
      case 'customers': return 'Users';
      case 'analytics': return 'Analytics';
      case 'gateway': return 'Gateways';
      default: return 'Console';
    }
  };

  const getRoleBadge = () => {
    switch (userRole) {
      case 'admin':
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold tracking-wide bg-indigo-50 text-indigo-700 dark:bg-indigo-950/70 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
            Admin
          </span>
        );
      case 'staff':
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold tracking-wide bg-blue-50 text-blue-700 dark:bg-blue-950/70 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
            Staff
          </span>
        );
      case 'customer':
      default:
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold tracking-wide bg-emerald-50 text-emerald-700 dark:bg-emerald-950/70 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
            Customer
          </span>
        );
    }
  };

  return (
    <header className="sticky top-0 z-30 h-16 border-b border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md px-6 flex items-center justify-between gap-6 transition-colors">
      {/* Left: Breadcrumbs */}
      <div className="flex items-center gap-2.5 min-w-0">
        <span className="text-xs uppercase tracking-wider text-slate-400 dark:text-slate-500 font-semibold whitespace-nowrap">
          StackForge
        </span>
        <span className="text-slate-300 dark:text-slate-700 select-none">/</span>
        <h1 className="text-sm font-semibold text-slate-900 dark:text-white truncate">
          {getViewTitle()}
        </h1>
      </div>

      {/* Right: Actions & User Profile */}
      <div className="flex items-center gap-3 shrink-0">
        {/* Refresh Data */}
        <button
          onClick={() => refreshData()}
          disabled={loading}
          className="p-2 text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-100 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          title="Refresh Data"
          aria-label="Refresh Data"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-indigo-600' : ''}`} />
        </button>

        {/* Theme Toggle */}
        <button
          onClick={toggleTheme}
          className="p-2 text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-100 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          aria-label="Toggle Theme"
        >
          {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-600" />}
        </button>

        {/* Primary Actions (Guarded by Role) */}
        {userRole !== 'customer' && (
          <>
            {currentView === 'quotations' && (
              <button
                onClick={() => setIsCreateQuotationOpen(true)}
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white text-xs font-semibold transition-colors shadow-xs"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Create Quotation</span>
              </button>
            )}

            {currentView === 'subscriptions' && (
              <button
                onClick={() => setIsCreateSubPhase3Open(true)}
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white text-xs font-semibold transition-colors shadow-xs"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>New Subscription</span>
              </button>
            )}

            {userRole === 'admin' && (
              <>
                {(currentView === 'products' || currentView === 'plans') && (
                  <button
                    onClick={() => setIsCreateProductOpen(true)}
                    className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white text-xs font-semibold transition-colors shadow-xs"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Create Product</span>
                  </button>
                )}

                {currentView === 'invoices' && (
                  <button
                    onClick={() => setIsCreateInvoiceOpen(true)}
                    className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white text-xs font-semibold transition-colors shadow-xs"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Create Invoice</span>
                  </button>
                )}

                {currentView === 'payments' && (
                  <button
                    onClick={() => setIsRecordPaymentOpen(true)}
                    className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white text-xs font-semibold transition-colors shadow-xs"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Record Payment</span>
                  </button>
                )}
              </>
            )}
          </>
        )}

        {/* Minimal User Profile Area */}
        <div className="flex items-center gap-2 pl-3 border-l border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 flex items-center justify-center text-xs font-bold">
              {currentUser?.name ? currentUser.name.charAt(0).toUpperCase() : <UserIcon className="w-3.5 h-3.5" />}
            </div>
            <div className="hidden sm:flex flex-col text-left">
              <span className="text-xs font-medium text-slate-900 dark:text-slate-100 leading-tight">
                {currentUser?.name || 'User'}
              </span>
              <div className="mt-0.5">
                {getRoleBadge()}
              </div>
            </div>
          </div>

          <button
            onClick={() => logout()}
            className="p-1.5 ml-1 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
            title="Sign Out"
            aria-label="Sign Out"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
};
