import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Receipt, Package, Users, Truck,
  FileText, BarChart3, ShoppingCart, BookOpen, ChevronLeft,
  ChevronRight, LogOut, Settings, Store, Shield,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

interface NavSection {
  label: string;
  items: NavItem[];
}

interface NavItem {
  to: string;
  icon: React.ReactNode;
  label: string;
  badge?: number;
}

export default function Sidebar({
  collapsed,
  onToggle,
  lowStockCount = 0,
}: {
  collapsed: boolean;
  onToggle: () => void;
  lowStockCount?: number;
}) {
  const { logout, profile } = useAuth();
  const navigate = useNavigate();

  const sections: NavSection[] = [
    {
      label: 'Overview',
      items: [
        { to: '/dashboard', icon: <LayoutDashboard size={18} />, label: 'Dashboard' },
      ],
    },
    {
      label: 'Finance',
      items: [
        { to: '/transactions', icon: <Receipt size={18} />, label: 'Transactions' },
        { to: '/accounting', icon: <BookOpen size={18} />, label: 'Accounting' },
        { to: '/billing', icon: <FileText size={18} />, label: 'Invoices' },
      ],
    },
    {
      label: 'Parties',
      items: [
        { to: '/customers', icon: <Users size={18} />, label: 'Customers' },
        { to: '/vendors', icon: <Truck size={18} />, label: 'Vendors' },
      ],
    },
    {
      label: 'Operations',
      items: [
        { to: '/inventory', icon: <Package size={18} />, label: 'Inventory', badge: lowStockCount || undefined },
        { to: '/orders', icon: <ShoppingCart size={18} />, label: 'Orders' },
      ],
    },
    {
      label: 'Analytics',
      items: [
        { to: '/reports', icon: <BarChart3 size={18} />, label: 'Reports' },
      ],
    },
  ];

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <aside className={`sidebar ${collapsed ? 'collapsed' : ''}`}>
      {/* Logo */}
      <div className="sidebar-logo">
        <div className="sidebar-logo-icon">
          <Store size={20} color="white" />
        </div>
        {!collapsed && (
          <div className="sidebar-logo-text">
            <h1>ShopBook Pro</h1>
            <span>{profile?.businessId ? 'Secure Books' : 'Loading...'}</span>
          </div>
        )}
      </div>

      {/* Nav */}
      <nav className="sidebar-nav">
        {sections.map(section => (
          <div key={section.label}>
            {!collapsed && (
              <div className="nav-section-label">{section.label}</div>
            )}
            {section.items.map(item => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
                title={collapsed ? item.label : undefined}
              >
                {item.icon}
                {!collapsed && <span className="nav-item-text">{item.label}</span>}
                {!collapsed && item.badge ? (
                  <span className="nav-badge">{item.badge}</span>
                ) : null}
              </NavLink>
            ))}
          </div>
        ))}
      </nav>

      {/* Footer */}
      <div className="sidebar-footer">
        {!collapsed && profile && (
          <div style={{
            padding: '10px 12px',
            marginBottom: 8,
            background: 'rgba(255,255,255,0.04)',
            borderRadius: 'var(--radius-md)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Shield size={14} color="var(--sidebar-active)" />
              <span style={{ fontSize: 11, color: 'var(--sidebar-text)', opacity: 0.7 }}>
                End-to-end encrypted
              </span>
            </div>
            <div style={{ fontSize: 12, color: 'white', fontWeight: 600, marginTop: 4 }}>
              {profile.displayName}
            </div>
            <div style={{ fontSize: 11, color: 'var(--sidebar-text)', opacity: 0.6 }}>
              {profile.role.toUpperCase()}
            </div>
          </div>
        )}

        <NavLink
          to="/settings"
          className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
          title={collapsed ? 'Settings' : undefined}
        >
          <Settings size={18} />
          {!collapsed && <span>Settings</span>}
        </NavLink>

        <button
          className="nav-item"
          onClick={handleLogout}
          title={collapsed ? 'Logout' : undefined}
        >
          <LogOut size={18} />
          {!collapsed && <span>Logout</span>}
        </button>

        {/* Collapse toggle */}
        <button
          className="nav-item"
          onClick={onToggle}
          style={{ marginTop: 4 }}
          title={collapsed ? 'Expand' : 'Collapse'}
        >
          {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
          {!collapsed && <span>Collapse</span>}
        </button>
      </div>
    </aside>
  );
}
