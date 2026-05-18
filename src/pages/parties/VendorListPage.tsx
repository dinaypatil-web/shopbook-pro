import React, { useState } from 'react';
import { useBusiness } from '../../contexts/BusinessContext';
import { Plus, Search, Shield, Phone, Building } from 'lucide-react';
import toast from 'react-hot-toast';

function formatINR(amount: number) {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount);
}

export default function VendorListPage() {
  const { vendors, addVendor } = useBusiness();
  const [search, setSearch] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [newVendor, setNewVendor] = useState({ name: '', phone: '', email: '', gstin: '', bankAccount: '' });

  const filtered = vendors.filter(v => 
    v.name.toLowerCase().includes(search.toLowerCase()) || 
    (v.phone || '').includes(search)
  );

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await addVendor({ ...newVendor, balance: 0 });
      toast.success('Vendor added securely');
      setShowAddModal(false);
      setNewVendor({ name: '', phone: '', email: '', gstin: '', bankAccount: '' });
    } catch {
      toast.error('Failed to add vendor');
    }
  };

  return (
    <div>
      <div className="page-header">
        <div className="page-header-left">
          <h2>Vendors (Suppliers)</h2>
          <p>Manage your suppliers and payable balances.</p>
        </div>
        <div className="page-header-actions">
          <button className="btn btn-primary" onClick={() => setShowAddModal(true)}>
            <Plus size={16} /> Add Vendor
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
            <p>No vendors found.</p>
          </div>
        ) : (
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Vendor Name</th>
                  <th>Contact Info</th>
                  <th>GSTIN & Bank Details</th>
                  <th style={{ textAlign: 'right' }}>Payable Balance</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(vendor => (
                  <tr key={vendor.id}>
                    <td style={{ fontWeight: 600 }}>{vendor.name}</td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13 }}>
                        <Phone size={13} color="var(--text-muted)" /> {vendor.phone || '-'}
                      </div>
                    </td>
                    <td>
                      <div style={{ fontSize: 13 }}>GST: {vendor.gstin || '-'}</div>
                      {vendor.bankAccount && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, marginTop: 4 }}>
                          <Building size={13} color="var(--text-muted)" /> A/c: {vendor.bankAccount}
                        </div>
                      )}
                    </td>
                    <td style={{ textAlign: 'right', fontWeight: 600 }} className={vendor.balance > 0 ? 'amount-negative' : ''}>
                      {formatINR(vendor.balance)} {vendor.balance > 0 ? ' (Cr)' : ''}
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
                <h3 className="modal-title">Add Vendor</h3>
                <button type="button" className="btn btn-ghost btn-icon" onClick={() => setShowAddModal(false)}>×</button>
              </div>
              <div className="modal-body">
                <div className="alert-banner info" style={{ marginBottom: 20 }}>
                  <Shield size={16} style={{ flexShrink: 0, marginTop: 2 }} />
                  <span style={{ fontSize: 12 }}>Contact and bank details are AES-256 encrypted.</span>
                </div>
                <div className="form-grid">
                  <div className="form-group">
                    <label className="form-label required">Vendor Name</label>
                    <input required className="form-control" value={newVendor.name} onChange={e => setNewVendor({ ...newVendor, name: e.target.value })} />
                  </div>
                  <div className="form-grid form-grid-2">
                    <div className="form-group">
                      <label className="form-label">Phone Number</label>
                      <input className="form-control" value={newVendor.phone} onChange={e => setNewVendor({ ...newVendor, phone: e.target.value })} />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Email</label>
                      <input type="email" className="form-control" value={newVendor.email} onChange={e => setNewVendor({ ...newVendor, email: e.target.value })} />
                    </div>
                  </div>
                  <div className="form-group">
                    <label className="form-label">GSTIN (Optional)</label>
                    <input className="form-control" value={newVendor.gstin} onChange={e => setNewVendor({ ...newVendor, gstin: e.target.value })} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Bank Account (Optional)</label>
                    <input className="form-control" placeholder="A/c Number / IFSC" value={newVendor.bankAccount} onChange={e => setNewVendor({ ...newVendor, bankAccount: e.target.value })} />
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowAddModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Save Vendor</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
