import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useBusiness } from '../../contexts/BusinessContext';
import { format } from 'date-fns';
import { Plus, Search, Eye, FileText } from 'lucide-react';

function formatINR(amount: number) {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 2 }).format(amount);
}

export default function InvoiceListPage() {
  const navigate = useNavigate();
  const { invoices } = useBusiness();
  const [search, setSearch] = useState('');

  const filtered = invoices.filter(inv => {
    if (search) {
      const q = search.toLowerCase();
      return (
        inv.invoiceNumber.toLowerCase().includes(q) ||
        inv.customerName.toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div>
      <div className="page-header">
        <div className="page-header-left">
          <h2>Invoices</h2>
          <p>Manage customer billing and GST invoices.</p>
        </div>
        <div className="page-header-actions">
          <button className="btn btn-primary" onClick={() => navigate('/billing/new')}>
            <Plus size={16} /> Create Invoice
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
              placeholder="Search invoice # or customer..."
              style={{ height: 40, paddingLeft: 36 }}
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
        </div>

        {filtered.length === 0 ? (
          <div className="empty-state">
            <FileText size={48} color="var(--text-muted)" />
            <p>No invoices found.</p>
          </div>
        ) : (
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Invoice #</th>
                  <th>Customer</th>
                  <th>Date</th>
                  <th>Status</th>
                  <th style={{ textAlign: 'right' }}>Total Amount</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(inv => (
                  <tr key={inv.id}>
                    <td style={{ fontWeight: 600 }}>{inv.invoiceNumber}</td>
                    <td>{inv.customerName}</td>
                    <td style={{ color: 'var(--text-muted)' }}>
                      {inv.createdAt ? format(inv.createdAt.toDate(), 'dd MMM yyyy') : '—'}
                    </td>
                    <td>
                      <span className={`badge ${
                        inv.status === 'paid' ? 'badge-success' :
                        inv.status === 'overdue' ? 'badge-danger' :
                        inv.status === 'sent' ? 'badge-brand' : 'badge-neutral'
                      }`}>
                        {inv.status.toUpperCase()}
                      </span>
                    </td>
                    <td style={{ textAlign: 'right', fontWeight: 600 }}>
                      {formatINR(inv.totalAmount)}
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <button className="btn btn-ghost btn-icon" onClick={() => navigate(`/billing/${inv.id}`)}>
                        <Eye size={16} />
                      </button>
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
