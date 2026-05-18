import React, { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import Topbar from './Topbar';
import { useBusiness } from '../../contexts/BusinessContext';

const PAGE_TITLES: Record<string, string> = {
  '/dashboard': 'Dashboard',
  '/transactions': 'Transactions',
  '/accounting': 'Accounting & Ledger',
  '/billing': 'Invoices & Billing',
  '/customers': 'Customers',
  '/vendors': 'Vendors',
  '/inventory': 'Inventory',
  '/orders': 'Orders',
  '/reports': 'Reports & Analytics',
  '/settings': 'Settings',
};

export default function AppLayout() {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();
  const { lowStockCount } = useBusiness();

  const title = PAGE_TITLES[location.pathname] || 'ShopBook Pro';

  return (
    <div className="app-shell">
      <Sidebar
        collapsed={collapsed}
        onToggle={() => setCollapsed(c => !c)}
        lowStockCount={lowStockCount}
      />
      <div className={`main-content ${collapsed ? 'sidebar-collapsed' : ''}`}>
        <Topbar title={title} />
        <div className="page-body">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
