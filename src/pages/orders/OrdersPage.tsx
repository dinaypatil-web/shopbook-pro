import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useBusiness, type Order } from '../../contexts/BusinessContext';
import { format } from 'date-fns';
import { Plus, Search, FileText, CheckCircle } from 'lucide-react';
import toast from 'react-hot-toast';

function formatINR(amount: number) {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 2 }).format(amount);
}

export default function OrdersPage() {
  const navigate = useNavigate();
  const { orders, updateOrderStatus } = useBusiness();
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState<'sale' | 'purchase'>('sale');
  const [processingId, setProcessingId] = useState<string | null>(null);

  const filtered = orders.filter(order => {
    if (order.type !== activeTab) return false;
    if (search) {
      const q = search.toLowerCase();
      return (
        order.orderNumber.toLowerCase().includes(q) ||
        order.partyName.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const handleFulfill = async (order: Order) => {
    if (!window.confirm(`Mark ${order.orderNumber} as fulfilled? This will generate a ${order.type === 'sale' ? 'Sales Invoice' : 'Purchase Record'} and automatically update inventory stock.`)) {
      return;
    }
    
    setProcessingId(order.id);
    try {
      await updateOrderStatus(order.id, 'fulfilled', true);
      toast.success(`Order fulfilled successfully!`);
    } catch (e) {
      toast.error('Failed to fulfill order');
      console.error(e);
    } finally {
      setProcessingId(null);
    }
  };

  return (
    <div>
      <div className="page-header">
        <div className="page-header-left">
          <h2>Orders</h2>
          <p>Manage unfulfilled sales and purchase orders.</p>
        </div>
        <div className="page-header-actions">
          <button className="btn btn-primary" onClick={() => navigate('/orders/new')}>
            <Plus size={16} /> Create Order
          </button>
        </div>
      </div>

      <div className="card">
        <div className="card-header" style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
          <div style={{ display: 'flex', background: 'var(--bg-secondary)', padding: 4, borderRadius: 'var(--radius-md)' }}>
            <button 
              className={`btn ${activeTab === 'sale' ? 'btn-primary' : 'btn-ghost'} btn-sm`}
              onClick={() => setActiveTab('sale')}
            >
              Sales Orders
            </button>
            <button 
              className={`btn ${activeTab === 'purchase' ? 'btn-primary' : 'btn-ghost'} btn-sm`}
              onClick={() => setActiveTab('purchase')}
            >
              Purchase Orders
            </button>
          </div>

          <div style={{ position: 'relative', flex: 1, maxWidth: 300, marginLeft: 'auto' }}>
            <Search size={16} style={{ position: 'absolute', left: 12, top: 12, color: 'var(--text-muted)' }} />
            <input
              type="text"
              className="form-control"
              placeholder="Search order # or party..."
              style={{ height: 40, paddingLeft: 36 }}
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
        </div>

        {filtered.length === 0 ? (
          <div className="empty-state">
            <FileText size={48} color="var(--text-muted)" />
            <p>No {activeTab} orders found.</p>
          </div>
        ) : (
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Order #</th>
                  <th>{activeTab === 'sale' ? 'Customer' : 'Vendor'}</th>
                  <th>Date</th>
                  <th>Status</th>
                  <th style={{ textAlign: 'right' }}>Amount</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(order => (
                  <tr key={order.id}>
                    <td style={{ fontWeight: 600 }}>{order.orderNumber}</td>
                    <td>{order.partyName}</td>
                    <td style={{ color: 'var(--text-muted)' }}>
                      {order.date ? format(new Date(order.date), 'dd MMM yyyy') : '—'}
                    </td>
                    <td>
                      <span className={`badge ${
                        order.status === 'fulfilled' ? 'badge-success' :
                        order.status === 'pending' ? 'badge-brand' : 'badge-neutral'
                      }`}>
                        {order.status.toUpperCase()}
                      </span>
                    </td>
                    <td style={{ textAlign: 'right', fontWeight: 600 }}>
                      {formatINR(order.totalAmount)}
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      {order.status === 'pending' ? (
                        <button 
                          className="btn btn-secondary btn-sm"
                          onClick={() => handleFulfill(order)}
                          disabled={processingId === order.id}
                        >
                          {processingId === order.id ? <span className="spinner spinner-sm" /> : <><CheckCircle size={14} /> Fulfill</>}
                        </button>
                      ) : (
                        <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Locked</span>
                      )}
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
