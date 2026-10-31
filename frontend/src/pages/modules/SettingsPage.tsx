import React, { useState, useEffect } from 'react';
import {
  Settings,
  Save,
  Shield,
  CreditCard,
  Building,
  Mail,
  CheckCircle2,
  Users,
  UserPlus,
  Trash2,
  Key,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { usersService } from '../../api/services';
import { User } from '../../types';

export const SettingsPage: React.FC = () => {
  const { user, role } = useAuth();
  const isAdmin = (role || '').toLowerCase() === 'admin';

  const [companyName, setCompanyName] = useState('Brightloop Systems Inc.');
  const [billingEmail, setBillingEmail] = useState(user?.email || 'admin@brightloop.io');
  const [currency, setCurrency] = useState('USD');
  const [invoicePrefix, setInvoicePrefix] = useState('INV-2026');
  const [autoRenewDefault, setAutoRenewDefault] = useState(true);
  const [toast, setToast] = useState<string | null>(null);

  // Staff Management State (Admin only)
  const [staffMembers, setStaffMembers] = useState<User[]>([]);
  const [showAddStaffModal, setShowAddStaffModal] = useState(false);
  const [newStaffName, setNewStaffName] = useState('');
  const [newStaffEmail, setNewStaffEmail] = useState('');

  useEffect(() => {
    if (isAdmin) {
      usersService.getStaffMembers().then((data) => {
        setStaffMembers(data);
      });
    }
  }, [isAdmin]);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setToast('Configuration saved successfully.');
    setTimeout(() => setToast(null), 3000);
  };

  const handleAddStaff = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStaffName.trim() || !newStaffEmail.trim()) return;

    const newStaff: User = {
      id: `usr_staff_${Date.now()}`,
      name: newStaffName.trim(),
      email: newStaffEmail.trim(),
      role: 'staff',
      companyName: companyName,
      createdAt: new Date().toISOString(),
    };

    setStaffMembers((prev) => [...prev, newStaff]);
    setNewStaffName('');
    setNewStaffEmail('');
    setShowAddStaffModal(false);
    setToast(`Staff account created for ${newStaff.name}`);
    setTimeout(() => setToast(null), 3000);
  };

  const handleRemoveStaff = (staffId?: string, staffName?: string) => {
    setStaffMembers((prev) => prev.filter((s) => s.id !== staffId && s._id !== staffId));
    setToast(`Removed staff access for ${staffName || 'user'}`);
    setTimeout(() => setToast(null), 3000);
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-xl font-bold tracking-tight text-slate-900">System & Workspace Settings</h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Configure subscription rules, default billing currencies, automated invoice numbering and access controls
        </p>
      </div>

      {toast && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>{toast}</span>
        </div>
      )}

      {/* Staff Management (Admin Only) */}
      {isAdmin && (
        <div className="bg-white rounded-xl border border-blue-200 p-6 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                <Users className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-sm font-semibold text-slate-900">Staff Management</h2>
                <p className="text-[11px] text-slate-500">
                  Provision operations staff, billing associates, and manage administrative privileges
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setShowAddStaffModal(true)}
              className="px-3 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-xs flex items-center gap-1.5 transition-colors self-start sm:self-auto"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>Add Staff Member</span>
            </button>
          </div>

          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-100 text-slate-400 font-semibold text-[11px]">
                  <th className="py-2.5 px-3">Staff Name</th>
                  <th className="py-2.5 px-3">Email Address</th>
                  <th className="py-2.5 px-3">Role</th>
                  <th className="py-2.5 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {staffMembers.map((member) => (
                  <tr key={member.id || member._id || member.email} className="hover:bg-slate-50/60">
                    <td className="py-2.5 px-3 font-medium text-slate-900">{member.name}</td>
                    <td className="py-2.5 px-3 font-mono text-slate-600">{member.email}</td>
                    <td className="py-2.5 px-3">
                      <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-blue-50 text-blue-700 border border-blue-100 uppercase">
                        {member.role}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-right">
                      <button
                        type="button"
                        onClick={() => handleRemoveStaff(member.id || member._id, member.name)}
                        className="text-slate-400 hover:text-rose-600 p-1 rounded transition-colors"
                        title="Revoke staff access"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add Staff Modal */}
      {showAddStaffModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 max-w-md w-full p-6 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <UserPlus className="w-4 h-4 text-blue-600" />
                Add Staff Member
              </h3>
              <button
                type="button"
                onClick={() => setShowAddStaffModal(false)}
                className="text-slate-400 hover:text-slate-600 text-xs"
              >
                ✕
              </button>
            </div>
            <form onSubmit={handleAddStaff} className="mt-4 space-y-3">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  value={newStaffName}
                  onChange={(e) => setNewStaffName(e.target.value)}
                  placeholder="e.g. Rachel Zane"
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:border-blue-600"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Email Address</label>
                <input
                  type="email"
                  required
                  value={newStaffEmail}
                  onChange={(e) => setNewStaffEmail(e.target.value)}
                  placeholder="rachel@brightloop.io"
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:border-blue-600"
                />
              </div>
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-[11px] text-slate-600 flex items-start gap-2">
                <Key className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                <span>
                  The user will receive an activation email to establish their password with the <strong>Staff</strong> role.
                </span>
              </div>
              <div className="pt-3 flex items-center justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddStaffModal(false)}
                  className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg"
                >
                  Confirm & Provision
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-6">
        {/* Organization Information */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs">
          <div className="flex items-center gap-2.5 pb-4 border-b border-slate-100">
            <Building className="w-4 h-4 text-blue-600" />
            <h2 className="text-sm font-semibold text-slate-900">Organization Profile</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Company Legal Name</label>
              <input
                type="text"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:border-blue-600"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Billing Contact Email</label>
              <input
                type="email"
                value={billingEmail}
                onChange={(e) => setBillingEmail(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:border-blue-600"
              />
            </div>
          </div>
        </div>

        {/* Billing & Invoice Defaults */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs">
          <div className="flex items-center gap-2.5 pb-4 border-b border-slate-100">
            <CreditCard className="w-4 h-4 text-blue-600" />
            <h2 className="text-sm font-semibold text-slate-900">Billing & Invoice Defaults</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Base Currency</label>
              <select
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:border-blue-600 bg-white"
              >
                <option value="USD">USD ($) - United States Dollar</option>
                <option value="EUR">EUR (€) - Euro</option>
                <option value="GBP">GBP (£) - British Pound</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Invoice Number Prefix</label>
              <input
                type="text"
                value={invoicePrefix}
                onChange={(e) => setInvoicePrefix(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:border-blue-600 font-mono"
              />
            </div>
          </div>

          <div className="mt-4 pt-4 border-t border-slate-100">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={autoRenewDefault}
                onChange={(e) => setAutoRenewDefault(e.target.checked)}
                className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500"
              />
              <span className="text-xs text-slate-700">
                Default new subscriptions to <strong>Automatic Renewal</strong>
              </span>
            </label>
          </div>
        </div>

        {/* Current User Session Info */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs">
          <div className="flex items-center gap-2.5 pb-4 border-b border-slate-100">
            <Shield className="w-4 h-4 text-blue-600" />
            <h2 className="text-sm font-semibold text-slate-900">Current User Session</h2>
          </div>

          <div className="mt-4 flex items-center justify-between text-xs">
            <div>
              <div className="font-semibold text-slate-900">{user?.name}</div>
              <div className="text-slate-500 font-mono mt-0.5">{user?.email}</div>
              {user?.companyName && (
                <div className="text-slate-400 text-[11px] mt-0.5">{user.companyName}</div>
              )}
            </div>
            <div className="text-right">
              <span className="inline-block px-2.5 py-1 bg-blue-50 text-blue-700 font-semibold rounded-md border border-blue-100 uppercase">
                {role} Role Active
              </span>
            </div>
          </div>
        </div>

        {/* Submit */}
        <div className="flex justify-end">
          <button
            type="submit"
            className="px-5 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Save className="w-4 h-4" />
            <span>Save Preferences</span>
          </button>
        </div>
      </form>
    </div>
  );
};
