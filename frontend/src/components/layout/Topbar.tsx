import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search,
  Menu,
  LogOut,
  User as UserIcon,
  Shield,
  HelpCircle,
  ExternalLink,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { RoleSwitcher } from './RoleSwitcher';
import { NotificationsPanel } from './NotificationsPanel';

interface TopbarProps {
  onOpenMobileSidebar: () => void;
  onSearchFocus?: () => void;
}

export const Topbar: React.FC<TopbarProps> = ({ onOpenMobileSidebar, onSearchFocus }) => {
  const { user, logout, role } = useAuth();
  const navigate = useNavigate();
  const [profileOpen, setProfileOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const profileRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setProfileOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      // Navigate to subscriptions or customers with search param
      navigate(`/subscriptions?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  return (
    <header className="h-16 bg-white border-b border-slate-200 px-4 sm:px-6 flex items-center justify-between gap-4 sticky top-0 z-20">
      {/* Left: Mobile hamburger & Global Search */}
      <div className="flex items-center gap-3 flex-1 max-w-xl">
        <button
          onClick={onOpenMobileSidebar}
          className="lg:hidden p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
          aria-label="Open navigation menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Search Bar */}
        <form onSubmit={handleSearchSubmit} className="relative w-full max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onFocus={onSearchFocus}
            placeholder="Search subscriptions, invoices, customers..."
            className="w-full pl-9 pr-12 py-2 text-xs bg-slate-50 hover:bg-slate-100/70 focus:bg-white text-slate-900 placeholder:text-slate-400 rounded-lg border border-slate-200 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 transition-colors"
          />
          <span className="hidden sm:inline-flex items-center absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] text-slate-400 border border-slate-200 px-1.5 py-0.5 rounded bg-white font-mono">
            ⌘K
          </span>
        </form>
      </div>

      {/* Right: Actions, Role Switcher, Notifications & Profile */}
      <div className="flex items-center gap-2 sm:gap-3 shrink-0">
        {/* Role Switcher */}
        <RoleSwitcher />

        {/* Notifications */}
        <NotificationsPanel />

        {/* Divider */}
        <div className="h-6 w-px bg-slate-200 hidden sm:block" />

        {/* Profile Dropdown */}
        <div className="relative" ref={profileRef}>
          <button
            onClick={() => setProfileOpen(!profileOpen)}
            className="flex items-center gap-2.5 p-1 hover:bg-slate-100 rounded-lg transition-colors text-left"
            aria-label="User profile menu"
          >
            <div className="relative">
              <img
                src={
                  user?.avatar ||
                  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150'
                }
                alt={user?.name || 'User avatar'}
                className="w-8 h-8 rounded-full object-cover border border-slate-200"
                referrerPolicy="no-referrer"
              />
              <span className="absolute bottom-0 right-0 w-2 h-2 rounded-full bg-emerald-500 ring-2 ring-white"></span>
            </div>
            <div className="hidden md:block min-w-0 text-left">
              <div className="text-xs font-semibold text-slate-900 truncate max-w-[120px]">
                {user?.name || 'User'}
              </div>
              <div className="text-[10px] text-slate-500 truncate">{role}</div>
            </div>
          </button>

          {profileOpen && (
            <div className="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-xl border border-slate-200 py-1.5 z-50 animate-in fade-in zoom-in-95 duration-100">
              {/* User overview */}
              <div className="px-4 py-3 border-b border-slate-100">
                <div className="text-xs font-semibold text-slate-900 truncate">{user?.name}</div>
                <div className="text-[11px] text-slate-500 truncate">{user?.email}</div>
                <div className="mt-2 inline-flex items-center gap-1.5 text-[10px] font-medium text-blue-700 bg-blue-50 px-2 py-0.5 rounded">
                  <Shield className="w-3 h-3" />
                  {role} Access Level
                </div>
              </div>

              {/* Menu items */}
              <div className="py-1">
                <button
                  onClick={() => {
                    navigate('/settings');
                    setProfileOpen(false);
                  }}
                  className="w-full text-left px-4 py-2 text-xs text-slate-700 hover:bg-slate-50 flex items-center gap-2.5 transition-colors"
                >
                  <UserIcon className="w-4 h-4 text-slate-400" />
                  <span>My Profile & Account</span>
                </button>
                <button
                  onClick={() => {
                    navigate('/settings');
                    setProfileOpen(false);
                  }}
                  className="w-full text-left px-4 py-2 text-xs text-slate-700 hover:bg-slate-50 flex items-center gap-2.5 transition-colors"
                >
                  <HelpCircle className="w-4 h-4 text-slate-400" />
                  <span>Documentation & Support</span>
                  <ExternalLink className="w-3 h-3 ml-auto text-slate-400" />
                </button>
              </div>

              <div className="border-t border-slate-100 pt-1">
                <button
                  onClick={handleLogout}
                  className="w-full text-left px-4 py-2 text-xs text-rose-600 hover:bg-rose-50 flex items-center gap-2.5 transition-colors font-medium"
                >
                  <LogOut className="w-4 h-4 text-rose-500" />
                  <span>Sign Out</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
