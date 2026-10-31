import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Package,
  Layers,
  FileSpreadsheet,
  RefreshCw,
  FileText,
  Percent,
  CreditCard,
  Receipt,
  BarChart3,
  Users,
  Settings,
  ChevronLeft,
  ChevronRight,
  Sparkles,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { UserRole } from '../../types';

interface SidebarProps {
  collapsed: boolean;
  onToggleCollapse: () => void;
  mobileOpen: boolean;
  onCloseMobile: () => void;
}

interface NavItemConfig {
  path: string;
  label: string;
  icon: React.ElementType;
  roles: string[];
  badge?: string;
}

export const NAV_ITEMS: NavItemConfig[] = [
  {
    path: '/dashboard',
    label: 'Dashboard',
    icon: LayoutDashboard,
    roles: ['admin', 'staff', 'customer'],
  },
  {
    path: '/customers',
    label: 'Customers',
    icon: Users,
    roles: ['admin', 'staff'],
    badge: '892',
  },
  {
    path: '/products',
    label: 'Products',
    icon: Package,
    roles: ['admin', 'staff'],
    badge: '24',
  },
  {
    path: '/plans',
    label: 'Plans',
    icon: Layers,
    roles: ['admin', 'staff'],
  },
  {
    path: '/quotations',
    label: 'Quotations',
    icon: FileSpreadsheet,
    roles: ['admin', 'staff', 'customer'],
  },
  {
    path: '/subscriptions',
    label: 'Subscriptions',
    icon: RefreshCw,
    roles: ['admin', 'staff', 'customer'],
    badge: '1.4k',
  },
  {
    path: '/invoices',
    label: 'Invoices',
    icon: FileText,
    roles: ['admin', 'staff', 'customer'],
    badge: '5',
  },
  {
    path: '/payments',
    label: 'Payments',
    icon: CreditCard,
    roles: ['admin', 'staff', 'customer'],
  },
  {
    path: '/settings',
    label: 'Settings',
    icon: Settings,
    roles: ['admin', 'staff', 'customer'],
  },
];

export const Sidebar: React.FC<SidebarProps> = ({
  collapsed,
  onToggleCollapse,
  mobileOpen,
  onCloseMobile,
}) => {
  const { role } = useAuth();
  const normalizedRole = (role || 'admin').toLowerCase();

  const filteredNavItems = NAV_ITEMS.filter((item) =>
    item.roles.map((r) => r.toLowerCase()).includes(normalizedRole)
  );

  const sidebarContent = (
    <div className="flex flex-col h-full bg-white border-r border-slate-200 select-none">
      {/* Brand Header */}
      <div
        className={`h-16 flex items-center border-b border-slate-200 px-4 transition-all duration-200 ${
          collapsed ? 'justify-center' : 'justify-between'
        }`}
      >
        <NavLink to="/dashboard" className="flex items-center gap-2.5 min-w-0" onClick={onCloseMobile}>
          <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center text-white font-bold text-lg shadow-sm shadow-blue-500/20 shrink-0">
            <span className="leading-none">B</span>
          </div>
          {!collapsed && (
            <div className="flex flex-col min-w-0">
              <span className="font-bold text-sm tracking-tight text-slate-900 truncate">
                Brightloop
              </span>
              <span className="text-[10px] font-medium text-slate-400 uppercase tracking-wider">
                Software
              </span>
            </div>
          )}
        </NavLink>

        {/* Desktop Collapse Toggle */}
        <button
          onClick={onToggleCollapse}
          className="hidden lg:flex p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>

      {/* Role Indicator Banner */}
      {!collapsed && (
        <div className="mx-3 mt-3 px-3 py-2 bg-slate-50 border border-slate-200/70 rounded-lg">
          <div className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">
            Current Workspace
          </div>
          <div className="text-xs font-semibold text-slate-800 flex items-center justify-between mt-0.5">
            <span>{normalizedRole === 'admin' ? 'Admin Center' : normalizedRole === 'staff' ? 'Staff Portal' : 'Customer Account'}</span>
            <span className="w-2 h-2 rounded-full bg-blue-600"></span>
          </div>
        </div>
      )}

      {/* Nav Items List */}
      <nav className="flex-1 overflow-y-auto px-2 py-3 space-y-1">
        {filteredNavItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={onCloseMobile}
              className={({ isActive }) =>
                `group relative flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-medium transition-all ${
                  isActive
                    ? 'bg-blue-50 text-blue-700 font-semibold shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                } ${collapsed ? 'justify-center px-2' : ''}`
              }
              title={collapsed ? item.label : undefined}
            >
              <Icon className="w-4 h-4 shrink-0 transition-transform group-hover:scale-105" />
              {!collapsed && (
                <>
                  <span className="flex-1 truncate">{item.label}</span>
                  {item.badge && (
                    <span
                      className={`text-[10px] px-1.5 py-0.2 rounded font-semibold tabular-nums ${
                        item.path === '/invoices'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </>
              )}

              {/* Tooltip on collapsed desktop view */}
              {collapsed && (
                <div className="hidden lg:group-hover:flex absolute left-full ml-2 px-2.5 py-1 bg-slate-900 text-white text-[11px] font-medium rounded shadow-lg whitespace-nowrap z-50 pointer-events-none items-center gap-1.5">
                  {item.label}
                  {item.badge && (
                    <span className="text-[9px] bg-slate-700 px-1 py-0.2 rounded text-slate-200">
                      {item.badge}
                    </span>
                  )}
                </div>
              )}
            </NavLink>
          );
        })}
      </nav>

      {/* Footer Info Box */}
      <div className="p-3 border-t border-slate-200">
        {!collapsed ? (
          <div className="p-3 bg-blue-50/60 border border-blue-100 rounded-xl text-xs">
            <div className="flex items-center gap-1.5 font-semibold text-blue-900">
              <Sparkles className="w-3.5 h-3.5 text-blue-600" />
              <span>Phase 1 Frontend</span>
            </div>
            <p className="text-[11px] text-blue-700/80 mt-1 leading-snug">
              Subscription Management UI ready for backend integration.
            </p>
          </div>
        ) : (
          <div className="flex justify-center text-blue-600" title="Phase 1 Ready">
            <Sparkles className="w-4 h-4" />
          </div>
        )}
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <aside
        className={`hidden lg:block shrink-0 transition-all duration-200 h-screen sticky top-0 z-30 ${
          collapsed ? 'w-[72px]' : 'w-64'
        }`}
      >
        {sidebarContent}
      </aside>

      {/* Mobile Drawer Overlay */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs transition-opacity"
            onClick={onCloseMobile}
            aria-hidden="true"
          />
          <div className="relative w-72 max-w-[80vw] h-full shadow-2xl z-10 animate-in slide-in-from-left duration-200">
            {sidebarContent}
          </div>
        </div>
      )}
    </>
  );
};
