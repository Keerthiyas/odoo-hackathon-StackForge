import React, { useState, useEffect } from 'react';
import {
  RefreshCw,
  Users,
  Package,
  DollarSign,
  FileText,
  AlertOctagon,
  ShieldCheck,
  AlertCircle,
  CreditCard,
} from 'lucide-react';
import { DateFilterBar } from '../../components/dashboard/DateFilterBar';
import { MetricCard } from '../../components/dashboard/MetricCard';
import { RevenueChart } from '../../components/dashboard/RevenueChart';
import { GrowthChart } from '../../components/dashboard/GrowthChart';
import { PaymentStatusChart } from '../../components/dashboard/PaymentStatusChart';
import { RecentSubscriptionsTable } from '../../components/dashboard/RecentSubscriptionsTable';
import { RecentInvoicesTable } from '../../components/dashboard/RecentInvoicesTable';
import { RecentPaymentsTable } from '../../components/dashboard/RecentPaymentsTable';
import {
  dashboardService,
  subscriptionsService,
  invoicesService,
  paymentsService,
} from '../../api/services';
import {
  DashboardMetrics,
  DateFilterType,
  Invoice,
  MonthlyRevenueData,
  Payment,
  PaymentStatusDistribution,
  Subscription,
  SubscriptionGrowthData,
} from '../../types';
import { formatCurrency } from '../../utils/formatters';

export const AdminDashboardPage: React.FC = () => {
  const [filter, setFilter] = useState<DateFilterType>('month');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showApiBanner, setShowApiBanner] = useState(false);
  const [activeTableTab, setActiveTableTab] = useState<'all' | 'subscriptions' | 'invoices' | 'payments'>('all');

  // Dynamic state populated from backend API services
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [revenueData, setRevenueData] = useState<MonthlyRevenueData[]>([]);
  const [growthData, setGrowthData] = useState<SubscriptionGrowthData[]>([]);
  const [paymentStatusData, setPaymentStatusData] = useState<PaymentStatusDistribution[]>([]);
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);

  const fetchDashboardData = async (currentFilter: DateFilterType) => {
    setIsRefreshing(true);
    try {
      const [
        fetchedMetrics,
        fetchedRevenue,
        fetchedGrowth,
        fetchedPaymentStatus,
        fetchedSubs,
        fetchedInvs,
        fetchedPays,
      ] = await Promise.all([
        dashboardService.getMetrics(currentFilter),
        dashboardService.getMonthlyRevenue(),
        dashboardService.getSubscriptionGrowth(),
        dashboardService.getPaymentStatusDistribution(),
        subscriptionsService.getSubscriptions(),
        invoicesService.getInvoices(),
        paymentsService.getPayments(),
      ]);

      setMetrics(fetchedMetrics);
      setRevenueData(fetchedRevenue);
      setGrowthData(fetchedGrowth);
      setPaymentStatusData(fetchedPaymentStatus);
      setSubscriptions(fetchedSubs);
      setInvoices(fetchedInvs);
      setPayments(fetchedPays);
    } catch (error) {
      console.error('Failed to load dashboard data via API service:', error);
    } finally {
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchDashboardData(filter);
  }, [filter]);

  const handleFilterChange = (newFilter: DateFilterType) => {
    setFilter(newFilter);
  };

  const handleRefresh = () => {
    fetchDashboardData(filter);
  };

  return (
    <div className="space-y-6">
      {/* Date Filter & Title Bar */}
      <DateFilterBar
        currentFilter={filter}
        onFilterChange={handleFilterChange}
        onRefresh={handleRefresh}
        isRefreshing={isRefreshing}
      />

      {/* Backend Collections Alignment Notice */}
      <div className="p-3.5 bg-white border border-slate-200/90 rounded-xl shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600 shrink-0">
            <ShieldCheck className="w-4 h-4" />
          </div>
          <div>
            <span className="font-semibold text-slate-900">
              Database Schema Compatibility: MongoDB / Mongoose Collections Active
            </span>
            <p className="text-slate-500 text-[11px] mt-0.5">
              Aggregating live API feeds from <code className="text-blue-600 font-mono">Users</code>,{' '}
              <code className="text-blue-600 font-mono">Products</code>,{' '}
              <code className="text-blue-600 font-mono">Subscriptions</code>,{' '}
              <code className="text-blue-600 font-mono">Invoices</code>, and{' '}
              <code className="text-blue-600 font-mono">Payments</code>.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => setShowApiBanner(!showApiBanner)}
            className="text-[11px] font-medium text-slate-500 hover:text-slate-800 px-2 py-1 bg-slate-100 hover:bg-slate-200 rounded transition-colors"
          >
            {showApiBanner ? 'Hide API Status' : 'Check API Status'}
          </button>
        </div>
      </div>

      {showApiBanner && (
        <div className="p-3 bg-blue-50 border border-blue-200 text-blue-900 rounded-xl text-xs flex items-center justify-between animate-in fade-in">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-blue-600 shrink-0" />
            <span>
              <strong>API Service Layer:</strong> Dynamically loads backend responses from{' '}
              <code className="font-mono">/src/api/services.ts</code> with automatic fallback cache if the server is offline.
            </span>
          </div>
          <button
            onClick={() => setShowApiBanner(false)}
            className="text-blue-700 hover:text-blue-900 text-xs font-semibold underline ml-3"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* 1. Summary Cards from Backend Collections */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {/* Users: Total Customers */}
        <MetricCard
          title="Users: Total Customers"
          value={metrics ? metrics.totalCustomers.toLocaleString() : '...'}
          change={metrics?.customersGrowth}
          subtitle="Customers collection"
          icon={Users}
          variant="default"
          isLoading={isRefreshing || !metrics}
        />

        {/* Products: Total Products */}
        <MetricCard
          title="Products: Total Products"
          value={metrics ? metrics.totalProducts.toLocaleString() : '...'}
          change={metrics?.productsGrowth}
          subtitle="Active SKUs in catalog"
          icon={Package}
          variant="default"
          isLoading={isRefreshing || !metrics}
        />

        {/* Subscriptions: Active Subscriptions */}
        <MetricCard
          title="Subscriptions: Active"
          value={metrics ? metrics.activeSubscriptions.toLocaleString() : '...'}
          change={metrics?.activeSubscriptionsGrowth}
          subtitle="Recurring contracts"
          icon={RefreshCw}
          variant="default"
          isLoading={isRefreshing || !metrics}
        />

        {/* Invoices: Total Invoices */}
        <MetricCard
          title="Invoices: Total Billed"
          value={metrics ? metrics.totalInvoices.toLocaleString() : '...'}
          subtitle="All generated invoices"
          icon={FileText}
          variant="default"
          isLoading={isRefreshing || !metrics}
        />

        {/* Invoices: Overdue Invoices */}
        <MetricCard
          title="Invoices: Overdue"
          value={metrics ? formatCurrency(metrics.overdueInvoices) : '...'}
          subtitle={metrics ? `${metrics.overdueCount} accounts past due` : '...'}
          icon={AlertOctagon}
          variant="error"
          isLoading={isRefreshing || !metrics}
        />

        {/* Payments: Revenue Received & Completed */}
        <MetricCard
          title="Payments: Revenue Received"
          value={metrics ? formatCurrency(metrics.revenueReceived) : '...'}
          change={metrics?.revenueGrowth}
          subtitle={metrics ? `${metrics.completedPayments} completed txns` : '...'}
          icon={DollarSign}
          variant="success"
          isLoading={isRefreshing || !metrics}
        />
      </div>

      {/* 2. Charts Section from API Responses */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Monthly Revenue Chart */}
        <RevenueChart data={revenueData} isLoading={isRefreshing || !metrics} />

        {/* Subscription Growth Chart */}
        <GrowthChart data={growthData} isLoading={isRefreshing || !metrics} />
      </div>

      {/* Payment Status Chart (Donut) */}
      <div className="grid grid-cols-1 gap-6">
        <PaymentStatusChart
          data={paymentStatusData}
          isLoading={isRefreshing || !metrics}
        />
      </div>

      {/* 3. Tables Section Header with Tab Filtering */}
      <div className="pt-2">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div>
            <h2 className="text-base font-bold text-slate-900">Collection Records & Ledgers</h2>
            <p className="text-xs text-slate-500">
              Synchronized records for Subscriptions, Invoices, and Payments collections
            </p>
          </div>

          {/* Table Tab Selector */}
          <div className="flex items-center p-1 bg-white border border-slate-200 rounded-lg shadow-xs self-start">
            <button
              onClick={() => setActiveTableTab('all')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
                activeTableTab === 'all'
                  ? 'bg-blue-600 text-white font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              All Tables
            </button>
            <button
              onClick={() => setActiveTableTab('subscriptions')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
                activeTableTab === 'subscriptions'
                  ? 'bg-blue-600 text-white font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Subscriptions
            </button>
            <button
              onClick={() => setActiveTableTab('invoices')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
                activeTableTab === 'invoices'
                  ? 'bg-blue-600 text-white font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Invoices
            </button>
            <button
              onClick={() => setActiveTableTab('payments')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
                activeTableTab === 'payments'
                  ? 'bg-blue-600 text-white font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Payments
            </button>
          </div>
        </div>

        {/* Tables populated from services */}
        <div className="space-y-6">
          {(activeTableTab === 'all' || activeTableTab === 'subscriptions') && (
            <RecentSubscriptionsTable subscriptions={subscriptions} />
          )}

          {(activeTableTab === 'all' || activeTableTab === 'invoices') && (
            <RecentInvoicesTable invoices={invoices} />
          )}

          {(activeTableTab === 'all' || activeTableTab === 'payments') && (
            <RecentPaymentsTable payments={payments} />
          )}
        </div>
      </div>
    </div>
  );
};
