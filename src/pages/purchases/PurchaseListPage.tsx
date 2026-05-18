import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useBusiness } from '../../contexts/BusinessContext';
import { format } from 'date-fns';
import { Plus, Search, FileText } from 'lucide-react';

function formatINR(amount: number) {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 2 }).format(amount);
}

export default function PurchaseListPage() {
  const navigate = useNavigate();
  const { purchases } = useBusiness();
  const [search, setSearch] = useState('');

  const filtered = purchases.filter(purch => {
    if (search) {
      const q = search.toLowerCase();
      return (
        purch.purchaseNumber.toLowerCase().includes(q) ||
        purch.vendorName.toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div>
      <div className="page-header">
        <div className="page-header-left">
          <h2>Purchases</h2>
          <p>Manage inbound stock and vendor purchase orders.</p>
        </div>
        <div className="page-header-actions">
          <button className="btn btn-primary" onClick={() => navigate('/purchases/new')}>
            <Plus size={16} /> Record Purchase
          </button>
        </div>
      </div>

      <div className="card">
        <div className="card-header" style={{ display: 'flex', gap: 16 }}>
          <div style={{ position: 'relative', flex: 1, maxWidth: 300 }}>
            <Search size={16} style={{ position: 'absolute', left: 12, top: 12, color: 'var(--text-muted)' }} />
            <input
              type="text"
              className="form-control"
              placeholder="Search PO # or vendor..."
              style={{ height: 40, paddingLeft: 36 }}
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
        </div>

        {filtered.length === 0 ? (
          <div className="empty-state">
            <FileText size={48} color="var(--text-muted)" />
            <p>No purchases found.</p>
          </div>
        ) : (
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>PO #</th>
                  <th>Vendor</th>
                  <th>Date</th>
                  <th>Status</th>
                  <th style={{ textAlign: 'right' }}>Total Amount</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(purch => (
                  <tr key={purch.id}>
                    <td style={{ fontWeight: 600 }}>{purch.purchaseNumber}</td>
                    <td>{purch.vendorName}</td>
                    <td style={{ color: 'var(--text-muted)' }}>
                      {purch.date ? format(new Date(purch.date), 'dd MMM yyyy') : '—'}
                    </td>
                    <td>
                      <span className={`badge ${
                        purch.status === 'paid' ? 'badge-success' :
                        purch.status === 'received' ? 'badge-brand' : 'badge-neutral'
                      }`}>
                        {purch.status.toUpperCase()}
                      </span>
                    </td>
                    <td style={{ textAlign: 'right', fontWeight: 600 }}>
                      {formatINR(purch.totalAmount)}
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
