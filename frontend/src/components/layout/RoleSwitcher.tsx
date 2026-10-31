import React, { useState, useRef, useEffect } from 'react';
import { Shield, ChevronDown, Check, UserCheck } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { UserRole } from '../../types';

export const RoleSwitcher: React.FC = () => {
  const { role, switchRole } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const currentRole = (role || 'admin').toLowerCase();

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const roles: { id: UserRole; label: string; desc: string }[] = [
    { id: 'admin', label: 'Admin Role', desc: 'Full access to subscriptions, invoices, settings & staff' },
    { id: 'staff', label: 'Staff Role', desc: 'Operational billing, products, orders & customer support' },
    { id: 'customer', label: 'Customer Role', desc: 'Self-serve client portal, subscriptions & invoices' },
  ];

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-2.5 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200/80 rounded-lg transition-colors border border-slate-200"
        title="Switch user perspective to preview role-based navigation"
      >
        <Shield className="w-3.5 h-3.5 text-blue-600" />
        <span className="font-semibold text-slate-900 capitalize">{currentRole}</span>
        <span className="hidden sm:inline text-slate-400">View</span>
        <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-72 bg-white rounded-xl shadow-lg border border-slate-200 py-1.5 z-50 animate-in fade-in zoom-in-95 duration-100">
          <div className="px-3 py-2 border-b border-slate-100">
            <div className="text-xs font-semibold text-slate-900 flex items-center gap-1.5">
              <UserCheck className="w-3.5 h-3.5 text-blue-600" />
              Role-Based Access Preview
            </div>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Test how the navigation adapts for different personas.
            </p>
          </div>

          <div className="p-1 space-y-0.5">
            {roles.map((item) => {
              const isActive = currentRole === item.id.toLowerCase();
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    switchRole(item.id);
                    setIsOpen(false);
                  }}
                  className={`w-full text-left px-3 py-2 rounded-lg text-xs flex items-start justify-between gap-2 transition-colors ${
                    isActive ? 'bg-blue-50 text-blue-900 font-medium' : 'text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <div>
                    <div className="font-semibold flex items-center gap-1.5">
                      {item.label}
                      {isActive && (
                        <span className="text-[10px] bg-blue-600 text-white px-1.5 py-0.2 rounded font-normal">
                          Active
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] text-slate-500 mt-0.5 leading-snug">{item.desc}</div>
                  </div>
                  {isActive && <Check className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
