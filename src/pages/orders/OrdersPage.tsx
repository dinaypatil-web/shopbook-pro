import React from 'react';
import { ShoppingCart } from 'lucide-react';

export default function OrdersPage() {
  return (
    <div>
      <div className="page-header">
        <div className="page-header-left">
          <h2>Purchase & Sales Orders</h2>
          <p>Manage inventory orders from vendors and to customers.</p>
        </div>
      </div>
      
      <div className="empty-state card" style={{ height: 400 }}>
        <div className="empty-state-icon"><ShoppingCart /></div>
        <h3>Orders Module Coming Soon</h3>
        <p>This premium feature is currently being rolled out to our ShopBook Pro users.</p>
        <button className="btn btn-primary" style={{ marginTop: 16 }}>Request Early Access</button>
      </div>
    </div>
  );
}
