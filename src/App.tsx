import React, { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { BusinessProvider } from './contexts/BusinessContext';

// Layout
import AppLayout from './components/layout/AppLayout';

// Auth Pages
import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';

// Dash & Overview
import Dashboard from './pages/Dashboard';

// Finance & Acc
import TransactionListPage from './pages/transactions/TransactionListPage';
import AddTransactionPage from './pages/transactions/AddTransactionPage';
import LedgerPage from './pages/accounting/LedgerPage';
import JournalPage from './pages/accounting/JournalPage';

// Billing & Purchases
import InvoiceListPage from './pages/billing/InvoiceListPage';
import CreateInvoicePage from './pages/billing/CreateInvoicePage';
import InvoiceViewPage from './pages/billing/InvoiceViewPage';
import PurchaseListPage from './pages/purchases/PurchaseListPage';
import CreatePurchasePage from './pages/purchases/CreatePurchasePage';

// Parties
import CustomerListPage from './pages/parties/CustomerListPage';
import VendorListPage from './pages/parties/VendorListPage';

// Inventory & Orders
import InventoryListPage from './pages/inventory/InventoryListPage';
import AddProductPage from './pages/inventory/AddProductPage';
import OrdersPage from './pages/orders/OrdersPage';

// Reports
import ReportsPage from './pages/reports/ReportsPage';

// --- Route Protection Component ---
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading, encryptionKey } = useAuth();

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="spinner spinner-lg"></div>
        <div style={{ color: 'var(--text-muted)' }}>Verifying secure session...</div>
      </div>
    );
  }

  // Require both authentication AND the derived encryption key in memory.
  // If user refreshes, key is gone from memory, they must log in again.
  if (!user || !encryptionKey) {
    return <Navigate to="/login" replace />;
  }

  // Wrap authenticated routes with the BusinessProvider 
  // so data listeners activate only when secure.
  return <BusinessProvider>{children}</BusinessProvider>;
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Toaster 
          position="top-right" 
          toastOptions={{
            style: {
              background: 'var(--bg-card)',
              color: 'var(--text-primary)',
              border: '1px solid var(--border-color)',
            }
          }} 
        />
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <AppLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Navigate to="/dashboard" replace />} />
            
            <Route path="dashboard" element={<Dashboard />} />
            
            <Route path="transactions" element={<TransactionListPage />} />
            <Route path="transactions/new" element={<AddTransactionPage />} />
            
            <Route path="accounting" element={<LedgerPage />} />
            <Route path="accounting/journal" element={<JournalPage />} />
            
            <Route path="billing" element={<InvoiceListPage />} />
            <Route path="billing/new" element={<CreateInvoicePage />} />
            <Route path="billing/:id" element={<InvoiceViewPage />} />

            <Route path="purchases" element={<PurchaseListPage />} />
            <Route path="purchases/new" element={<CreatePurchasePage />} />
            
            <Route path="customers" element={<CustomerListPage />} />
            <Route path="vendors" element={<VendorListPage />} />
            
            <Route path="inventory" element={<InventoryListPage />} />
            <Route path="inventory/new" element={<AddProductPage />} />
            
            <Route path="orders" element={<OrdersPage />} />
            
            <Route path="reports" element={<ReportsPage />} />

            <Route path="settings" element={
              <div className="card" style={{ padding: 48, textAlign: 'center' }}>
                <h3>Settings Module</h3>
                <p>Tax configuration and print templates coming soon.</p>
              </div>
            } />
          </Route>
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
