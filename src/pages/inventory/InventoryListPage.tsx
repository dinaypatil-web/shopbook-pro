import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useBusiness } from '../../contexts/BusinessContext';
import { Plus, Search, AlertTriangle, Shield } from 'lucide-react';

function formatINR(amount: number) {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 2 }).format(amount);
}

export default function InventoryListPage() {
  const navigate = useNavigate();
  const { inventory } = useBusiness();
  const [search, setSearch] = useState('');
  const [showLowStockOnly, setShowLowStockOnly] = useState(false);

  const filtered = inventory.filter(item => {
    if (showLowStockOnly && item.quantity > item.reorderLevel) return false;
    if (search) {
      const q = search.toLowerCase();
      return item.name.toLowerCase().includes(q) || item.sku.toLowerCase().includes(q) || (item.barcode && item.barcode.includes(q));
    }
    return true;
  });

  return (
    <div>
      <div className="page-header">
        <div className="page-header-left">
          <h2>Inventory</h2>
          <p>Track stock levels and pricing limits securely.</p>
        </div>
        <div className="page-header-actions">
          <button className="btn btn-primary" onClick={() => navigate('/inventory/new')}>
            <Plus size={16} /> Add Product
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
              placeholder="Search item name, SKU, or barcode..."
              style={{ height: 40, paddingLeft: 36 }}
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div className="tabs" style={{ marginBottom: 0 }}>
              <button className={`tab-item ${!showLowStockOnly ? 'active' : ''}`} onClick={() => setShowLowStockOnly(false)}>All Items</button>
              <button className={`tab-item ${showLowStockOnly ? 'active' : ''}`} onClick={() => setShowLowStockOnly(true)}>Low Stock Alerts</button>
            </div>
            <div className="badge badge-brand" style={{ padding: '6px 12px', fontSize: 12 }}>
              <Shield size={12} /> Prices Encrypted
            </div>
          </div>
        </div>

        {filtered.length === 0 ? (
          <div className="empty-state">
            <p>No inventory items found.</p>
          </div>
        ) : (
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Item Code / Batch</th>
                  <th>Product Name</th>
                  <th>Category</th>
                  <th style={{ textAlign: 'center' }}>In Stock</th>
                  <th style={{ textAlign: 'right' }}>Cost Price (CP)</th>
                  <th style={{ textAlign: 'right' }}>Selling Price (SP)</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(item => {
                  const isLow = item.quantity <= item.reorderLevel;
                  return (
                    <tr key={item.id}>
                      <td style={{ fontSize: 12, fontFamily: 'var(--font-mono)' }}>{item.sku || item.barcode || '-'}</td>
                      <td style={{ fontWeight: 600 }}>{item.name}</td>
                      <td>{item.category}</td>
                      <td style={{ textAlign: 'center' }}>
                        <span className={`badge ${isLow ? 'badge-danger' : 'badge-neutral'}`}>
                          {item.quantity} {item.unit}
                          {isLow && <AlertTriangle size={12} style={{ marginLeft: 4 }} />}
                        </span>
                      </td>
                      <td style={{ textAlign: 'right', color: 'var(--text-muted)' }}>{formatINR(item.costPrice)}</td>
                      <td style={{ textAlign: 'right', fontWeight: 600 }}>{formatINR(item.sellingPrice)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
