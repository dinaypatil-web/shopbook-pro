import React, { useMemo } from 'react';
import {
  TrendingUp, TrendingDown, Wallet, Building2,
  Users, Truck, Package, AlertTriangle, ArrowUpRight, ArrowDownRight,
  Clock, CheckCircle,
} from 'lucide-react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart,
} from 'recharts';
import { useBusiness } from '../contexts/BusinessContext';
import { useAuth } from '../contexts/AuthContext';
import { format } from 'date-fns';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatINR(amount: number) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount);
}

// ─── Stat Card ────────────────────────────────────────────────────────────────

function StatCard({
  label, value, icon, iconBg, change, changeDir,
}: {
  label: string;
  value: string;
  icon: React.ReactNode;
  iconBg: string;
  change?: string;
  changeDir?: 'up' | 'down';
}) {
  return (
    <div className="stat-card">
      <div className="stat-card-top">
        <div>
          <div className="stat-card-label">{label}</div>
        </div>
        <div className="stat-card-icon" style={{ background: iconBg }}>
          {icon}
        </div>
      </div>
      <div className="stat-card-value">{value}</div>
      {change && (
        <div className={`stat-card-change ${changeDir}`}>
          {changeDir === 'up' ? <ArrowUpRight size={13} /> : <ArrowDownRight size={13} />}
          {change}
        </div>
      )}
    </div>
  );
}

// ─── Recent Transactions ──────────────────────────────────────────────────────

function RecentTransactions() {
  const { transactions } = useBusiness();
  const recent = transactions.slice(0, 8);

  if (recent.length === 0) {
    return (
      <div className="empty-state" style={{ padding: 40 }}>
        <div className="empty-state-icon"><Wallet /></div>
        <h3>No transactions yet</h3>
        <p>Add your first transaction to get started.</p>
      </div>
    );
  }

  return (
    <div className="table-container">
      <table>
        <thead>
          <tr>
            <th>Date</th>
            <th>Category</th>
            <th>Account</th>
            <th>Notes</th>
            <th style={{ textAlign: 'right' }}>Amount</th>
          </tr>
        </thead>
        <tbody>
          {recent.map(txn => (
            <tr key={txn.id}>
              <td style={{ color: 'var(--text-muted)', fontSize: 12 }}>
                {txn.timestamp ? format(txn.timestamp.toDate(), 'dd MMM') : '—'}
              </td>
              <td>{txn.category}</td>
              <td>
                <span className="badge badge-neutral">{txn.account}</span>
              </td>
              <td style={{ color: 'var(--text-muted)', maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {txn.notes || '—'}
              </td>
              <td style={{ textAlign: 'right' }}>
                <span className={txn.type === 'credit' ? 'amount-positive' : 'amount-negative'}>
                  {txn.type === 'credit' ? '+' : '-'}{formatINR(txn.amount)}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ─── Revenue Chart ────────────────────────────────────────────────────────────

function RevenueChart() {
  const { transactions } = useBusiness();

  const chartData = useMemo(() => {
    const days: Record<string, { income: number; expense: number }> = {};
    const now = new Date();

    for (let i = 6; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const key = format(d, 'dd MMM');
      days[key] = { income: 0, expense: 0 };
    }

    transactions.forEach(txn => {
      if (!txn.timestamp) return;
      const d = txn.timestamp.toDate();
      const key = format(d, 'dd MMM');
      if (!days[key]) return;
      if (txn.type === 'credit') days[key].income += txn.amount;
      else days[key].expense += txn.amount;
    });

    return Object.entries(days).map(([date, v]) => ({ date, ...v }));
  }, [transactions]);

  return (
    <ResponsiveContainer width="100%" height={200}>
      <AreaChart data={chartData} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id="incomeGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="hsl(230, 70%, 60%)" stopOpacity={0.25} />
            <stop offset="95%" stopColor="hsl(230, 70%, 60%)" stopOpacity={0} />
          </linearGradient>
          <linearGradient id="expGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="hsl(4, 75%, 52%)" stopOpacity={0.18} />
            <stop offset="95%" stopColor="hsl(4, 75%, 52%)" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" vertical={false} />
        <XAxis dataKey="date" tick={{ fontSize: 11, fill: 'var(--text-muted)' }} tickLine={false} axisLine={false} />
        <YAxis tick={{ fontSize: 11, fill: 'var(--text-muted)' }} tickLine={false} axisLine={false} tickFormatter={v => `₹${(v / 1000).toFixed(0)}k`} />
        <Tooltip
          contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 8, fontSize: 12 }}
          formatter={(v: any, name: any) => [formatINR(Number(v)), name === 'income' ? 'Income' : 'Expense']}
        />
        <Area type="monotone" dataKey="income" stroke="hsl(230, 70%, 60%)" fill="url(#incomeGrad)" strokeWidth={2} dot={false} />
        <Area type="monotone" dataKey="expense" stroke="hsl(4, 75%, 52%)" fill="url(#expGrad)" strokeWidth={2} dot={false} />
      </AreaChart>
    </ResponsiveContainer>
  );
}

// ─── Low Stock Alerts ─────────────────────────────────────────────────────────

function LowStockAlerts() {
  const { inventory } = useBusiness();
  const lowStock = inventory.filter(i => i.quantity <= i.reorderLevel).slice(0, 6);

  if (lowStock.length === 0) {
    return (
      <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>
        <CheckCircle size={28} style={{ margin: '0 auto 8px', color: 'var(--success)' }} />
        All stock levels are healthy.
      </div>
    );
  }

  return (
    <div style={{ padding: '0 4px' }}>
      {lowStock.map(item => (
        <div key={item.id} style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '10px 16px',
          borderBottom: '1px solid var(--border-color)',
        }}>
          <div>
            <div style={{ fontWeight: 500, fontSize: 13 }}>{item.name}</div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{item.category} · {item.sku}</div>
          </div>
          <span className={`badge ${item.quantity === 0 ? 'badge-danger' : 'badge-warning'}`}>
            {item.quantity === 0 ? 'Out of stock' : `${item.quantity} ${item.unit} left`}
          </span>
        </div>
      ))}
    </div>
  );
}

// ─── Overdue Invoices ─────────────────────────────────────────────────────────

function OverdueInvoices() {
  const { invoices } = useBusiness();
  const overdue = invoices.filter(i => i.status === 'overdue').slice(0, 5);

  if (overdue.length === 0) {
    return (
      <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>
        <CheckCircle size={28} style={{ margin: '0 auto 8px', color: 'var(--success)' }} />
        No overdue invoices.
      </div>
    );
  }

  return (
    <div>
      {overdue.map(inv => (
        <div key={inv.id} style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '10px 16px',
          borderBottom: '1px solid var(--border-color)',
        }}>
          <div>
            <div style={{ fontWeight: 500, fontSize: 13 }}>{inv.customerName}</div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Due {inv.dueDate}</div>
          </div>
          <span className="amount-negative">{formatINR(inv.totalAmount)}</span>
        </div>
      ))}
    </div>
  );
}

// ─── Dashboard Page ───────────────────────────────────────────────────────────

export default function Dashboard() {
  const {
    cashBalance, bankBalance, totalReceivables, totalPayables,
    lowStockCount, loading,
  } = useBusiness();
  const { profile } = useAuth();

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 400 }}>
        <div style={{ textAlign: 'center' }}>
          <div className="spinner spinner-lg" style={{ margin: '0 auto 16px' }} />
          <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>Decrypting your data…</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Greeting */}
      <div className="page-header">
        <div className="page-header-left">
          <h2>Good {getGreeting()}, {profile?.displayName?.split(' ')[0] || 'there'}! 👋</h2>
          <p>Here's your business snapshot for today — all data decrypted and secure.</p>
        </div>
        <div className="page-header-actions">
          <div style={{ fontSize: 12, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 6 }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--success)', boxShadow: '0 0 6px var(--success)' }} />
            All data encrypted in Firestore
          </div>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="stat-grid">
        <StatCard
          label="Cash in Hand"
          value={formatINR(cashBalance)}
          icon={<Wallet size={20} color="white" />}
          iconBg="linear-gradient(135deg, hsl(142, 65%, 42%) 0%, hsl(162, 60%, 40%) 100%)"
          change="Updated live"
          changeDir="up"
        />
        <StatCard
          label="Bank Balance"
          value={formatINR(bankBalance)}
          icon={<Building2 size={20} color="white" />}
          iconBg="linear-gradient(135deg, hsl(230, 70%, 58%) 0%, hsl(262, 65%, 60%) 100%)"
          change="All accounts"
          changeDir="up"
        />
        <StatCard
          label="Receivables"
          value={formatINR(totalReceivables)}
          icon={<TrendingUp size={20} color="white" />}
          iconBg="linear-gradient(135deg, hsl(38, 90%, 52%) 0%, hsl(28, 88%, 52%) 100%)"
          change="To be collected"
          changeDir="up"
        />
        <StatCard
          label="Payables"
          value={formatINR(totalPayables)}
          icon={<TrendingDown size={20} color="white" />}
          iconBg="linear-gradient(135deg, hsl(4, 75%, 52%) 0%, hsl(340, 70%, 52%) 100%)"
          change="To be paid"
          changeDir="down"
        />
        <StatCard
          label="Low Stock Items"
          value={String(lowStockCount)}
          icon={<Package size={20} color="white" />}
          iconBg={lowStockCount > 0
            ? "linear-gradient(135deg, hsl(38, 90%, 52%) 0%, hsl(28, 88%, 52%) 100%)"
            : "linear-gradient(135deg, hsl(142, 65%, 42%) 0%, hsl(162, 60%, 40%) 100%)"}
          change={lowStockCount > 0 ? 'Action needed' : 'All healthy'}
          changeDir={lowStockCount > 0 ? 'down' : 'up'}
        />
      </div>

      {/* Charts row */}
      <div className="row section-gap">
        {/* Revenue chart */}
        <div className="card" style={{ flex: 2 }}>
          <div className="card-header">
            <div>
              <div className="card-title">Revenue Trend</div>
              <div className="card-subtitle">Last 7 days</div>
            </div>
            <span className="badge badge-brand">Live</span>
          </div>
          <div style={{ padding: '16px 8px' }}>
            <RevenueChart />
          </div>
        </div>

        {/* Overdue invoices */}
        <div className="card" style={{ flex: 1 }}>
          <div className="card-header">
            <div>
              <div className="card-title">Overdue Invoices</div>
              <div className="card-subtitle">Requires attention</div>
            </div>
            <Clock size={16} color="var(--danger)" />
          </div>
          <OverdueInvoices />
        </div>
      </div>

      {/* Bottom row */}
      <div className="row section-gap">
        {/* Recent transactions */}
        <div className="card" style={{ flex: 2 }}>
          <div className="card-header">
            <div>
              <div className="card-title">Recent Transactions</div>
              <div className="card-subtitle">Latest 8 entries — decrypted</div>
            </div>
          </div>
          <RecentTransactions />
        </div>

        {/* Low stock */}
        <div className="card" style={{ flex: 1 }}>
          <div className="card-header">
            <div>
              <div className="card-title">Low Stock Alerts</div>
              <div className="card-subtitle">Items below reorder level</div>
            </div>
            {lowStockCount > 0 && (
              <AlertTriangle size={16} color="var(--warning)" />
            )}
          </div>
          <LowStockAlerts />
        </div>
      </div>
    </div>
  );
}

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'morning';
  if (h < 17) return 'afternoon';
  return 'evening';
}
