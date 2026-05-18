import React, { useState, useMemo } from 'react';
import { useBusiness } from '../../contexts/BusinessContext';
import { Download, Filter } from 'lucide-react';
import { format } from 'date-fns';

function formatINR(amount: number) {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 2 }).format(amount);
}

export default function LedgerPage() {
  const { transactions, accounts } = useBusiness();
  const [selectedAccount, setSelectedAccount] = useState<string>('Cash');

  // Compute ledger entries for selected account
  const ledgerEntries = useMemo(() => {
    // Basic filter
    const accountTxns = transactions.filter(t => t.account === selectedAccount);
    // Sort chronological for running balance calculation (oldest to newest)
    const sorted = [...accountTxns].sort((a, b) => {
      const ta = a.timestamp?.toMillis() || 0;
      const tb = b.timestamp?.toMillis() || 0;
      return ta - tb;
    });

    let balance = 0;
    return sorted.map(txn => {
      // Assuming for assets Cash/Bank: Debit increases balance, Credit decreases balance.
      // But in our simplified UI: Type "credit" meant Income (increasing balance), "debit" meant Expense (decreasing balance).
      // Wait, standard accounting: 
      // Asset accounts: dr in, cr out.
      // Our UI used Credit = Income, Debit = Expense. So we'll map Income => positive impact, Expense => negative.
      
      const change = txn.type === 'credit' ? txn.amount : -txn.amount;
      balance += change;
      return { ...txn, runningBalance: balance };
    }).reverse(); // Reverse back to newest first for UI
  }, [transactions, selectedAccount]);

  const currentBalance = ledgerEntries.length > 0 ? ledgerEntries[0].runningBalance : 0;

  return (
    <div>
      <div className="page-header">
        <div className="page-header-left">
          <h2>Ledger</h2>
          <p>Account statements and running balances.</p>
        </div>
      </div>

      <div className="card">
        <div className="card-header" style={{ display: 'flex', gap: 16 }}>
          <div style={{ flex: 1, maxWidth: 300 }}>
            <label className="form-label" style={{ marginBottom: 4 }}>Select Account</label>
            <select className="form-control" value={selectedAccount} onChange={e => setSelectedAccount(e.target.value)}>
              <option value="Cash">Cash Account</option>
              <option value="Bank">Bank Account</option>
              {accounts.map(a => (
                <option key={a.id} value={a.name}>{a.name}</option>
              ))}
            </select>
          </div>
          <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'flex-end', gap: 8 }}>
            <button className="btn btn-secondary btn-icon"><Filter size={16} /></button>
            <button className="btn btn-secondary"><Download size={16} /> Export PDF</button>
          </div>
        </div>

        <div style={{ padding: '16px 24px', background: 'var(--bg-secondary)', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>Closing Balance</div>
            <div style={{ fontSize: 24, fontWeight: 700, fontFamily: 'var(--font-mono)' }}>{formatINR(currentBalance)}</div>
          </div>
        </div>

        {ledgerEntries.length === 0 ? (
          <div className="empty-state">
            <p>No entries for this account.</p>
          </div>
        ) : (
          <div className="table-container" style={{ border: 'none', borderRadius: 0 }}>
            <table>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Particulars</th>
                  <th>Ref no.</th>
                  <th style={{ textAlign: 'right' }}>Debit Out (-)</th>
                  <th style={{ textAlign: 'right' }}>Credit In (+)</th>
                  <th style={{ textAlign: 'right' }}>Balance</th>
                </tr>
              </thead>
              <tbody>
                {ledgerEntries.map(entry => (
                  <tr key={entry.id}>
                    <td>{entry.timestamp ? format(entry.timestamp.toDate(), 'dd MMM yyyy') : '—'}</td>
                    <td>
                      <div style={{ fontWeight: 500 }}>{entry.category}</div>
                      <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{entry.notes || '-'}</div>
                    </td>
                    <td style={{ fontSize: 12 }}>{entry.reference || '-'}</td>
                    <td style={{ textAlign: 'right' }}>
                      {entry.type === 'debit' ? formatINR(entry.amount) : ''}
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      {entry.type === 'credit' ? formatINR(entry.amount) : ''}
                    </td>
                    <td style={{ textAlign: 'right', fontWeight: 600 }}>
                      {formatINR(entry.runningBalance)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
