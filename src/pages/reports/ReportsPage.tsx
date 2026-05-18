import React, { useMemo } from 'react';
import { useBusiness } from '../../contexts/BusinessContext';
import { Download, BarChart3 } from 'lucide-react';
import { format } from 'date-fns';

function formatINR(amount: number) {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount);
}

export default function ReportsPage() {
  const { transactions, inventory, cashBalance, bankBalance, totalReceivables, totalPayables } = useBusiness();

  // Simple Profit & Loss Calculation
  const pl = useMemo(() => {
    let income = 0;
    let expense = 0;
    transactions.forEach(t => {
      if (t.type === 'credit') income += t.amount;
      else expense += t.amount;
    });
    return { income, expense, profit: income - expense };
  }, [transactions]);

  // Inventory Valuation
  const inventoryValue = useMemo(() => {
    return inventory.reduce((acc, item) => acc + (item.quantity * item.costPrice), 0);
  }, [inventory]);

  return (
    <div>
      <div className="page-header">
        <div className="page-header-left">
          <h2>Financial Reports</h2>
          <p>Real-time decrypted view of your business health.</p>
        </div>
        <div className="page-header-actions">
          <button className="btn btn-secondary">
            <Download size={16} /> Export All (PDF)
          </button>
        </div>
      </div>

      <div className="row section-gap">
        <div className="card card-pad" style={{ flex: 1 }}>
          <h3 className="card-title" style={{ marginBottom: 16 }}>Profit & Loss Summary</h3>
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--border-color)' }}>
            <span style={{ color: 'var(--text-muted)' }}>Total Income</span>
            <span className="amount-positive">{formatINR(pl.income)}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--border-color)' }}>
            <span style={{ color: 'var(--text-muted)' }}>Total Expenses</span>
            <span className="amount-negative">{formatINR(pl.expense)}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '16px 0', marginTop: 8 }}>
            <span style={{ fontWeight: 600 }}>Net Profit</span>
            <span style={{ fontSize: 18, fontWeight: 700 }} className={pl.profit >= 0 ? 'amount-positive' : 'amount-negative'}>
              {formatINR(pl.profit)}
            </span>
          </div>
        </div>

        <div className="card card-pad" style={{ flex: 1 }}>
          <h3 className="card-title" style={{ marginBottom: 16 }}>Balance Sheet Summary</h3>
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontWeight: 600, fontSize: 12, textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 8 }}>Assets</div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0' }}>
              <span>Cash & Bank</span>
              <span>{formatINR(cashBalance + bankBalance)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0' }}>
              <span>Accounts Receivable</span>
              <span>{formatINR(totalReceivables)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0' }}>
              <span>Inventory (Cost)</span>
              <span>{formatINR(inventoryValue)}</span>
            </div>
          </div>
          <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: 16 }}>
            <div style={{ fontWeight: 600, fontSize: 12, textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 8 }}>Liabilities</div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0' }}>
              <span>Accounts Payable</span>
              <span>{formatINR(totalPayables)}</span>
            </div>
          </div>
        </div>
      </div>
      
      <div className="alert-banner info">
        <BarChart3 size={16} style={{ flexShrink: 0, marginTop: 2 }} />
        <span>These reports are generated dynamically on your device directly from the AES-256 encrypted Firestore records. No unencrypted data is ever sent to the server for analytics calculation.</span>
      </div>
    </div>
  );
}
