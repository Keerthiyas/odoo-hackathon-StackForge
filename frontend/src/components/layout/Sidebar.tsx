import React from 'react';
import { 
  LayoutDashboard, 
  CreditCard, 
  Users, 
  FileText, 
  Layers, 
  Zap, 
  Package, 
  FileSpreadsheet, 
  Receipt, 
  LogOut 
} from 'lucide-react';
import { useApp, AppView } from '../../context/AppContext';
import { formatINR } from '../../utils/formatters';

export const Sidebar: React.FC = () => {
  const { currentView, setCurrentView, subscriptions, invoices, metrics, currentUser, logout } = useApp();

  const userRole = currentUser?.role || 'admin';

  // Calculate live badge counters
  const pastDueSubsCount = subscriptions.filter(s => s.status === 'past_due').length;
  const overdueInvoicesCount = invoices.filter(i => i.status === 'overdue').length;

  // Role-based navigation specification
  let navItems: { 
    id: AppView; 
    label: string; 
    icon: React.FC<{ className?: string }>; 
    badge?: number; 
    badgeColor?: string;
  }[] = [];

  if (userRole === 'admin') {
    navItems = [
      { id: 'overview', label: 'Dashboard', icon: LayoutDashboard },
      { id: 'products', label: 'Products & Plans', icon: Package },
      { id: 'quotations', label: 'Quotations', icon: FileSpreadsheet },
      { 
        id: 'subscriptions', 
        label: 'Subscriptions', 
        icon: CreditCard, 
        badge: pastDueSubsCount > 0 ? pastDueSubsCount : undefined,
        badgeColor: 'bg-rose-500 text-white',
      },
      { 
        id: 'invoices', 
        label: 'Invoices', 
        icon: FileText,
        badge: overdueInvoicesCount > 0 ? overdueInvoicesCount : undefined,
        badgeColor: 'bg-amber-500 text-white',
      },
      { id: 'payments', label: 'Payments', icon: Receipt },
      { id: 'customers', label: 'Users', icon: Users },
    ];
  } else if (userRole === 'staff') {
    navItems = [
      { id: 'overview', label: 'Dashboard', icon: LayoutDashboard },
      { id: 'products', label: 'Products & Plans', icon: Package },
      { id: 'quotations', label: 'Quotations', icon: FileSpreadsheet },
      { 
        id: 'subscriptions', 
        label: 'Subscriptions', 
        icon: CreditCard, 
        badge: pastDueSubsCount > 0 ? pastDueSubsCount : undefined,
        badgeColor: 'bg-rose-500 text-white',
      },
    ];
  } else {
    // Customer Role
    navItems = [
      { id: 'overview', label: 'My Dashboard', icon: LayoutDashboard },
      { id: 'quotations', label: 'My Quotations', icon: FileSpreadsheet },
      { id: 'subscriptions', label: 'My Subscriptions', icon: CreditCard },
      { id: 'invoices', label: 'My Invoices', icon: FileText },
      { id: 'payments', label: 'My Payments', icon: Receipt },
    ];
  }

  const roleDisplayLabels: Record<string, string> = {
    admin: 'Administrator',
    staff: 'Staff',
    customer: 'Customer',
  };

  return (
    <aside className="w-64 shrink-0 flex flex-col border-r border-slate-800 bg-slate-900 text-slate-300 h-screen sticky top-0 z-40 select-none">
      {/* Brand Header */}
      <div className="h-16 flex items-center px-6 border-b border-slate-800/80 gap-3">
        <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white font-bold text-base shadow-sm shadow-indigo-600/30">
          <Zap className="w-4 h-4 fill-current text-white" />
        </div>
        <div className="flex flex-col">
          <span className="text-sm font-bold tracking-tight text-white leading-none">
            StackForge
          </span>
          <span className="text-[11px] text-slate-400 font-medium tracking-wide mt-1">
            Subscription Platform
          </span>
        </div>
      </div>

      {/* Navigation List */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        <div className="px-3 pb-2 text-[10px] font-semibold tracking-wider text-slate-500 uppercase">
          Navigation
        </div>

        {navItems.map(item => {
          const Icon = item.icon;
          // Match 'plans' with 'products' in active state when navigating Products & Plans
          const isActive = currentView === item.id || (item.id === 'products' && currentView === 'plans');

          return (
            <button
              key={item.id}
              onClick={() => setCurrentView(item.id)}
              className={`w-full flex items-center justify-between px-3 py-2 text-xs font-medium rounded-lg transition-colors group cursor-pointer ${
                isActive
                  ? 'bg-indigo-600/20 text-indigo-400 font-semibold border border-indigo-500/20'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/70'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Icon
                  className={`w-4 h-4 transition-colors ${
                    isActive
                      ? 'text-indigo-400'
                      : 'text-slate-500 group-hover:text-slate-300'
                  }`}
                />
                <span>{item.label}</span>
              </div>

              {item.badge !== undefined && (
                <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded-full ${item.badgeColor || 'bg-slate-800 text-slate-300'}`}>
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Financial Health Mini Bar (Admin & Staff Only, with INR formatting) */}
      {userRole !== 'customer' && (
        <div className="p-3 mx-3 mb-3 rounded-xl border border-slate-800 bg-slate-850/60">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span>Active MRR</span>
            <span className="text-[11px] text-emerald-400 font-medium">+14.8%</span>
          </div>
          <div className="text-sm font-bold text-white font-mono tabular-nums">
            {formatINR(metrics?.mrr || 148250)}
          </div>
          <div className="mt-2 pt-2 border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
            <span>ARR Pace</span>
            <span className="font-mono text-slate-300 font-medium">
              {formatINR(metrics?.arr || 1780000)}
            </span>
          </div>
        </div>
      )}

      {/* User / Workspace Footer */}
      <div className="p-3 border-t border-slate-800 flex items-center justify-between gap-2 bg-slate-900/80">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 text-indigo-400 flex items-center justify-center text-xs font-bold shrink-0">
            {currentUser?.name ? currentUser.name.charAt(0).toUpperCase() : 'U'}
          </div>
          <div className="flex flex-col min-w-0">
            <span className="text-xs font-semibold text-white truncate">
              {currentUser?.name || 'Active User'}
            </span>
            <span className="text-[10px] text-slate-400 truncate capitalize">
              {roleDisplayLabels[userRole] || 'User'}
            </span>
          </div>
        </div>
        
        <button
          onClick={() => logout()}
          className="p-1.5 text-slate-400 hover:text-rose-400 rounded-lg hover:bg-slate-800 transition-colors shrink-0 cursor-pointer"
          title="Sign Out"
          aria-label="Sign Out"
        >
          <LogOut className="w-4 h-4" />
        </button>
      </div>
    </aside>
  );
};
