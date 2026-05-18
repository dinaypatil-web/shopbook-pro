import React, { useState } from 'react';
import { useBusiness } from '../../contexts/BusinessContext';
import { Plus, Search, Shield, Phone, Mail } from 'lucide-react';
import toast from 'react-hot-toast';

function formatINR(amount: number) {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount);
}

export default function CustomerListPage() {
  const { customers, addCustomer } = useBusiness();
  const [search, setSearch] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [newCustomer, setNewCustomer] = useState({ name: '', phone: '', email: '', gstin: '', address: '' });

  const filtered = customers.filter(c => 
    c.name.toLowerCase().includes(search.toLowerCase()) || 
    (c.phone || '').includes(search)
  );

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await addCustomer({ ...newCustomer, balance: 0 });
      toast.success('Customer added securely');
      setShowAddModal(false);
      setNewCustomer({ name: '', phone: '', email: '', gstin: '', address: '' });
    } catch {
      toast.error('Failed to add customer');
    }
  };

  return (
    <div>
      <div className="page-header">
        <div className="page-header-left">
          <h2>Customers</h2>
          <p>Manage your clients and their outstanding balances.</p>
        </div>
        <div className="page-header-actions">
          <button className="btn btn-primary" onClick={() => setShowAddModal(true)}>
            <Plus size={16} /> Add Customer
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
              placeholder="Search by name or phone..."
              style={{ height: 40, paddingLeft: 36 }}
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
        </div>

        {filtered.length === 0 ? (
          <div className="empty-state">
            <p>No customers found.</p>
          </div>
        ) : (
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Contact Info</th>
                  <th>GSTIN</th>
                  <th style={{ textAlign: 'right' }}>Outstanding Balance</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(cust => (
                  <tr key={cust.id}>
                    <td style={{ fontWeight: 600 }}>{cust.name}</td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13 }}>
                        <Phone size={13} color="var(--text-muted)" /> {cust.phone || '-'}
                      </div>
                      {cust.email && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, marginTop: 4 }}>
                          <Mail size={13} color="var(--text-muted)" /> {cust.email}
                        </div>
                      )}
                    </td>
                    <td>{cust.gstin || '-'}</td>
                    <td style={{ textAlign: 'right', fontWeight: 600 }} className={cust.balance > 0 ? 'amount-negative' : ''}>
                      {formatINR(cust.balance)} {cust.balance > 0 ? ' (Dr)' : ''}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showAddModal && (
        <div className="modal-overlay">
          <div className="modal">
            <form onSubmit={handleAdd}>
              <div className="modal-header">
                <h3 className="modal-title">Add Customer</h3>
                <button type="button" className="btn btn-ghost btn-icon" onClick={() => setShowAddModal(false)}>×</button>
              </div>
              <div className="modal-body">
                <div className="alert-banner info" style={{ marginBottom: 20 }}>
                  <Shield size={16} style={{ flexShrink: 0, marginTop: 2 }} />
                  <span style={{ fontSize: 12 }}>Contact details & balances are AES-256 encrypted.</span>
                </div>
                <div className="form-grid">
                  <div className="form-group">
                    <label className="form-label required">Customer Name</label>
                    <input required className="form-control" value={newCustomer.name} onChange={e => setNewCustomer({ ...newCustomer, name: e.target.value })} />
                  </div>
                  <div className="form-grid form-grid-2">
                    <div className="form-group">
                      <label className="form-label">Phone Number</label>
                      <input className="form-control" value={newCustomer.phone} onChange={e => setNewCustomer({ ...newCustomer, phone: e.target.value })} />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Email</label>
                      <input type="email" className="form-control" value={newCustomer.email} onChange={e => setNewCustomer({ ...newCustomer, email: e.target.value })} />
                    </div>
                  </div>
                  <div className="form-group">
                    <label className="form-label">GSTIN (Optional)</label>
                    <input className="form-control" value={newCustomer.gstin} onChange={e => setNewCustomer({ ...newCustomer, gstin: e.target.value })} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Address (Optional)</label>
                    <textarea className="form-control" value={newCustomer.address} onChange={e => setNewCustomer({ ...newCustomer, address: e.target.value })} />
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowAddModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Save Customer</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
