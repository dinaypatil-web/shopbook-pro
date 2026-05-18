import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Filter, Download, Search } from 'lucide-react';
import { useBusiness } from '../../contexts/BusinessContext';
import { format } from 'date-fns';

function formatINR(amount: number) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount);
}

export default function TransactionListPage() {
  const navigate = useNavigate();
  const { transactions } = useBusiness();
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'credit' | 'debit'>('all');

  const filtered = transactions.filter(t => {
    if (filterType !== 'all' && t.type !== filterType) return false;
    if (search) {
      const q = search.toLowerCase();
      return (
        t.category.toLowerCase().includes(q) ||
        (t.notes || '').toLowerCase().includes(q) ||
        (t.reference || '').toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div>
      <div className="page-header">
        <div className="page-header-left">
          <h2>Transactions</h2>
          <p>Decrypted view of your income and expenses.</p>
        </div>
        <div className="page-header-actions">
          <button className="btn btn-primary" onClick={() => navigate('/transactions/new')}>
            <Plus size={16} /> Add Transaction
          </button>
        </div>
      </div>

      <div className="card">
        <div className="card-header" style={{ flexWrap: 'wrap', gap: 16 }}>
          <div style={{ display: 'flex', gap: 8, flex: 1, minWidth: 200 }}>
            <div style={{ position: 'relative', flex: 1, maxWidth: 300 }}>
              <Search size={16} style={{ position: 'absolute', left: 12, top: 12, color: 'var(--text-muted)' }} />
              <input
                type="text"
                className="form-control"
                placeholder="Search notes, categories..."
                style={{ height: 40, paddingLeft: 36 }}
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
          </div>
          
          <div style={{ display: 'flex', gap: 8 }}>
            <div className="tabs" style={{ marginBottom: 0 }}>
              <button className={`tab-item ${filterType === 'all' ? 'active' : ''}`} onClick={() => setFilterType('all')}>All</button>
              <button className={`tab-item ${filterType === 'credit' ? 'active' : ''}`} onClick={() => setFilterType('credit')}>Income</button>
              <button className={`tab-item ${filterType === 'debit' ? 'active' : ''}`} onClick={() => setFilterType('debit')}>Expense</button>
            </div>
            <button className="btn btn-secondary btn-icon"><Filter size={16} /></button>
            <button className="btn btn-secondary btn-icon"><Download size={16} /></button>
          </div>
        </div>

        {filtered.length === 0 ? (
          <div className="empty-state">
            <p>No transactions found.</p>
          </div>
        ) : (
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Type</th>
                  <th>Category</th>
                  <th>Account</th>
                  <th>Ref & Notes</th>
                  <th style={{ textAlign: 'right' }}>Amount</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(txn => (
                  <tr key={txn.id}>
                    <td>
                      <div style={{ fontWeight: 500 }}>{txn.timestamp ? format(txn.timestamp.toDate(), 'dd MMM yyyy') : '—'}</div>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{txn.timestamp ? format(txn.timestamp.toDate(), 'hh:mm a') : '—'}</div>
                    </td>
                    <td>
                      <span className={`badge ${txn.type === 'credit' ? 'badge-success' : 'badge-danger'}`}>
                        {txn.type === 'credit' ? 'INCOME' : 'EXPENSE'}
                      </span>
                    </td>
                    <td style={{ fontWeight: 500 }}>{txn.category}</td>
                    <td><span className="badge badge-neutral">{txn.account}</span></td>
                    <td style={{ maxWidth: 200 }}>
                      <div style={{ fontSize: 12, fontWeight: 500 }}>{txn.reference || '-'}</div>
                      <div style={{ fontSize: 12, color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {txn.notes || '-'}
                      </div>
                    </td>
                    <td style={{ textAlign: 'right', fontWeight: 600 }} className={txn.type === 'credit' ? 'amount-positive' : 'amount-negative'}>
                      {txn.type === 'credit' ? '+' : '-'}{formatINR(txn.amount)}
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
