import React, { useState, useMemo } from 'react';
import { 
  Search, 
  Users, 
  ShieldCheck, 
  UserCheck, 
  Building2,
  Mail,
  Phone,
  Shield,
  Eye
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Customer, UserModel } from '../../types';
import { authService } from '../../services/authService';
import { formatINR } from '../../utils/formatters';

export const CustomersView: React.FC = () => {
  const { customers, setSelectedCustomer } = useApp();
  const [activeTab, setActiveTab] = useState<'customers' | 'team'>('customers');

  // Customer tab filters
  const [searchQuery, setSearchQuery] = useState('');
  const [healthFilter, setHealthFilter] = useState<string>('all');

  // Team tab state
  const [teamSearch, setTeamSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');

  const teamUsers = useMemo<UserModel[]>(() => {
    return authService.getAllUsers();
  }, []);

  const filteredTeamUsers = useMemo(() => {
    return teamUsers.filter(u => {
      const matchesSearch = 
        u.name.toLowerCase().includes(teamSearch.toLowerCase()) ||
        u.email.toLowerCase().includes(teamSearch.toLowerCase()) ||
        (u.company && u.company.toLowerCase().includes(teamSearch.toLowerCase()));
      const matchesRole = roleFilter === 'all' || u.role === roleFilter;
      return matchesSearch && matchesRole;
    });
  }, [teamUsers, teamSearch, roleFilter]);

  const filteredCustomers = useMemo(() => {
    return customers.filter(cust => {
      const matchesSearch = 
        cust.company.toLowerCase().includes(searchQuery.toLowerCase()) ||
        cust.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        cust.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        cust.tier.toLowerCase().includes(searchQuery.toLowerCase()) ||
        cust.csmName.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesHealth = healthFilter === 'all' || cust.healthScore === healthFilter;

      return matchesSearch && matchesHealth;
    });
  }, [customers, searchQuery, healthFilter]);

  const healthyCount = customers.filter(c => c.healthScore === 'healthy').length;
  const neutralCount = customers.filter(c => c.healthScore === 'neutral').length;
  const atRiskCount = customers.filter(c => c.healthScore === 'at_risk').length;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
            Users & Accounts
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Client accounts, subscription health metrics, and user access directory.
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center p-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-xs">
          <button
            onClick={() => setActiveTab('customers')}
            className={`px-3 py-1.5 rounded-md font-medium transition-colors ${
              activeTab === 'customers'
                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Customer Accounts ({customers.length})
          </button>
          <button
            onClick={() => setActiveTab('team')}
            className={`px-3 py-1.5 rounded-md font-medium transition-colors ${
              activeTab === 'team'
                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            User Directory ({teamUsers.length})
          </button>
        </div>
      </div>

      {activeTab === 'customers' ? (
        <>
          {/* Customer Health Overview Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div 
              onClick={() => setHealthFilter('healthy')}
              className={`p-4 rounded-xl border cursor-pointer transition-all ${
                healthFilter === 'healthy' 
                  ? 'border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/20 shadow-xs' 
                  : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-emerald-300'
              }`}
            >
              <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                <span>Healthy Accounts</span>
                <span className="text-emerald-600 dark:text-emerald-400 font-medium">Nominal</span>
              </div>
              <div className="text-2xl font-bold text-slate-900 dark:text-white mt-1.5 font-mono tabular-nums">
                {healthyCount}
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                Active logins, on-time payments & seamless renewals
              </p>
            </div>

            <div 
              onClick={() => setHealthFilter('neutral')}
              className={`p-4 rounded-xl border cursor-pointer transition-all ${
                healthFilter === 'neutral' 
                  ? 'border-amber-500 bg-amber-50/50 dark:bg-amber-950/20 shadow-xs' 
                  : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-amber-300'
              }`}
            >
              <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                <span>Neutral / Onboarding</span>
                <span className="text-amber-600 dark:text-amber-400 font-medium">Monitoring</span>
              </div>
              <div className="text-2xl font-bold text-slate-900 dark:text-white mt-1.5 font-mono tabular-nums">
                {neutralCount}
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                Active trials or standard engagement pending expansion
              </p>
            </div>

            <div 
              onClick={() => setHealthFilter('at_risk')}
              className={`p-4 rounded-xl border cursor-pointer transition-all ${
                healthFilter === 'at_risk' 
                  ? 'border-rose-500 bg-rose-50/50 dark:bg-rose-950/20 shadow-xs' 
                  : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-rose-300'
              }`}
            >
              <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                <span>At-Risk / Dunning</span>
                <span className="text-rose-600 dark:text-rose-400 font-medium">Intervention</span>
              </div>
              <div className="text-2xl font-bold text-slate-900 dark:text-white mt-1.5 font-mono tabular-nums">
                {atRiskCount}
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                Payment retries failed or low engagement indicators
              </p>
            </div>
          </div>

          {/* Filter and Search Bar */}
          <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search by company, contact, email, or CSM..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-hidden focus:ring-1 focus:ring-indigo-500"
              />
            </div>

            <div className="flex items-center gap-1.5 text-xs">
              {['all', 'healthy', 'neutral', 'at_risk'].map(h => (
                <button
                  key={h}
                  onClick={() => setHealthFilter(h)}
                  className={`px-3 py-1 rounded-md transition-colors capitalize text-xs font-medium ${
                    healthFilter === h
                      ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  {h.replace('_', ' ')}
                </button>
              ))}
            </div>
          </div>

          {/* Customer Accounts Table */}
          <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-slate-850 text-slate-600 dark:text-slate-300 border-b border-slate-200 dark:border-slate-800">
                  <tr>
                    <th className="py-3 px-4 font-semibold">Account / Company</th>
                    <th className="py-3 px-4 font-semibold">Primary Contact</th>
                    <th className="py-3 px-4 font-semibold">Current Tier</th>
                    <th className="py-3 px-4 font-semibold">Health Score</th>
                    <th className="py-3 px-4 font-semibold">MRR</th>
                    <th className="py-3 px-4 font-semibold">Lifetime Value</th>
                    <th className="py-3 px-4 font-semibold">CSM Lead</th>
                    <th className="py-3 px-4 font-semibold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                  {filteredCustomers.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-12 text-center text-slate-500 dark:text-slate-400">
                        No customers found matching current filters.
                      </td>
                    </tr>
                  ) : (
                    filteredCustomers.map(cust => {
                      return (
                        <tr 
                          key={cust.id} 
                          onClick={() => setSelectedCustomer(cust)}
                          className="hover:bg-slate-50/80 dark:hover:bg-slate-850/50 cursor-pointer transition-colors"
                        >
                          <td className="py-3.5 px-4">
                            <div className="font-semibold text-slate-900 dark:text-white">
                              {cust.company}
                            </div>
                            <div className="text-[11px] text-slate-500 dark:text-slate-400">
                              Joined {cust.joinedDate}
                            </div>
                          </td>

                          <td className="py-3.5 px-4">
                            <div className="font-medium text-slate-800 dark:text-slate-200">
                              {cust.name}
                            </div>
                            <div className="text-[11px] text-slate-500 dark:text-slate-400">
                              {cust.email}
                            </div>
                          </td>

                          <td className="py-3.5 px-4 font-medium text-slate-800 dark:text-slate-200">
                            {cust.tier}
                          </td>

                          <td className="py-3.5 px-4">
                            <span className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium capitalize ${
                              cust.healthScore === 'healthy'
                                ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300'
                                : cust.healthScore === 'neutral'
                                ? 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300'
                                : 'bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300 font-semibold'
                            }`}>
                              {cust.healthScore.replace('_', ' ')}
                            </span>
                          </td>

                          <td className="py-3.5 px-4 font-mono font-medium text-slate-900 dark:text-white tabular-nums">
                            {formatINR(cust.currentMrr)}
                          </td>

                          <td className="py-3.5 px-4 font-mono text-slate-700 dark:text-slate-300 tabular-nums">
                            {formatINR(cust.lifetimeValue)}
                          </td>

                          <td className="py-3.5 px-4 text-slate-600 dark:text-slate-400">
                            {cust.csmName}
                          </td>

                          <td className="py-3.5 px-4 text-right">
                            <button
                              onClick={e => {
                                e.stopPropagation();
                                setSelectedCustomer(cust);
                              }}
                              className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 rounded hover:bg-indigo-50 dark:hover:bg-indigo-950/30 transition-colors"
                            >
                              <Eye className="w-3.5 h-3.5" />
                              <span>View</span>
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      ) : (
        /* Team & User Directory Tab */
        <div className="space-y-4">
          <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search by name, email, or company..."
                value={teamSearch}
                onChange={e => setTeamSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-hidden focus:ring-1 focus:ring-indigo-500"
              />
            </div>

            <div className="flex items-center gap-1.5 text-xs">
              <span className="text-slate-400 text-[11px] mr-1">Role:</span>
              {['all', 'admin', 'staff', 'customer'].map(r => (
                <button
                  key={r}
                  onClick={() => setRoleFilter(r)}
                  className={`px-3 py-1 rounded-md transition-colors capitalize text-xs font-medium ${
                    roleFilter === r
                      ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  {r}
                </button>
              ))}
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-slate-850 text-slate-600 dark:text-slate-300 border-b border-slate-200 dark:border-slate-800">
                  <tr>
                    <th className="py-3 px-4 font-semibold">User</th>
                    <th className="py-3 px-4 font-semibold">Assigned Role</th>
                    <th className="py-3 px-4 font-semibold">Organization</th>
                    <th className="py-3 px-4 font-semibold">Contact Info</th>
                    <th className="py-3 px-4 font-semibold font-mono">User ID</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                  {filteredTeamUsers.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-12 text-center text-slate-500 dark:text-slate-400">
                        No users found matching current filters.
                      </td>
                    </tr>
                  ) : (
                    filteredTeamUsers.map(user => {
                      return (
                        <tr key={user._id} className="hover:bg-slate-50/80 dark:hover:bg-slate-850/50 transition-colors">
                          <td className="py-3.5 px-4">
                            <div className="font-semibold text-slate-900 dark:text-white">
                              {user.name}
                            </div>
                            <div className="text-[11px] text-slate-500 dark:text-slate-400">
                              {user.email}
                            </div>
                          </td>

                          <td className="py-3.5 px-4">
                            <span className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold capitalize border ${
                              user.role === 'admin'
                                ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800'
                                : user.role === 'staff'
                                ? 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300 border-amber-200 dark:border-amber-800'
                                : 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
                            }`}>
                              {user.role}
                            </span>
                          </td>

                          <td className="py-3.5 px-4 text-slate-800 dark:text-slate-200 font-medium">
                            {user.company || 'Enterprise Org'}
                          </td>

                          <td className="py-3.5 px-4 text-slate-600 dark:text-slate-400">
                            {user.phone || 'N/A'}
                          </td>

                          <td className="py-3.5 px-4 font-mono text-[11px] text-slate-400">
                            #{user._id.substring(0, 10)}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};