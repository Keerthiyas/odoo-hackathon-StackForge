/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { AppLayout } from './components/layout/AppLayout';

// Auth Pages
import { LoginPage } from './pages/auth/LoginPage';
import { RegisterPage } from './pages/auth/RegisterPage';
import { ForgotPasswordPage } from './pages/auth/ForgotPasswordPage';

// Main Dashboard & Modules
import { AdminDashboardPage } from './pages/dashboard/AdminDashboardPage';
import { SubscriptionsPage } from './pages/modules/SubscriptionsPage';
import { InvoicesPage } from './pages/modules/InvoicesPage';
import { PaymentsPage } from './pages/modules/PaymentsPage';
import { CustomersPage } from './pages/modules/CustomersPage';
import { ProductsPage } from './pages/modules/ProductsPage';
import { PlansPage } from './pages/modules/PlansPage';
import { QuotationsPage } from './pages/modules/QuotationsPage';
import { DiscountsPage } from './pages/modules/DiscountsPage';
import { TaxesPage } from './pages/modules/TaxesPage';
import { AnalyticsPage } from './pages/modules/AnalyticsPage';
import { SettingsPage } from './pages/modules/SettingsPage';

// Protected Route Guard
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated } = useAuth();
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  return <>{children}</>;
};

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public Auth Routes */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />

          {/* Authenticated Dashboard Routes */}
          <Route
            element={
              <ProtectedRoute>
                <AppLayout />
              </ProtectedRoute>
            }
          >
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<AdminDashboardPage />} />
            <Route path="/products" element={<ProductsPage />} />
            <Route path="/plans" element={<PlansPage />} />
            <Route path="/quotations" element={<QuotationsPage />} />
            <Route path="/subscriptions" element={<SubscriptionsPage />} />
            <Route path="/invoices" element={<InvoicesPage />} />
            <Route path="/discounts" element={<DiscountsPage />} />
            <Route path="/payments" element={<PaymentsPage />} />
            <Route path="/taxes" element={<TaxesPage />} />
            <Route path="/analytics" element={<AnalyticsPage />} />
            <Route path="/customers" element={<CustomersPage />} />
            <Route path="/settings" element={<SettingsPage />} />
          </Route>

          {/* Catch-all */}
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
