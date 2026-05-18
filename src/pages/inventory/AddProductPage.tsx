import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ArrowLeft, Shield } from 'lucide-react';
import toast from 'react-hot-toast';
import { useBusiness } from '../../contexts/BusinessContext';

const schema = z.object({
  name: z.string().min(2, 'Product name required'),
  sku: z.string().min(1, 'SKU / Batch Number required'),
  barcode: z.string().optional(),
  category: z.string().min(1, 'Select a category'),
  unit: z.string().min(1, 'Select a unit of measurement'),
  quantity: z.number().min(0, 'Quantity cannot be negative'),
  reorderLevel: z.number().min(0),
  costPrice: z.number().positive('Cost price must be positive'),
  sellingPrice: z.number().positive('Selling price must be positive'),
});

type FormData = z.infer<typeof schema>;

const CATEGORIES = ['Groceries', 'Electronics', 'Clothing', 'Medicine', 'Hardware', 'Other'];
const UNITS = ['pcs', 'kg', 'ltr', 'box', 'pack', 'meter'];

export default function AddProductPage() {
  const navigate = useNavigate();
  const { addInventoryItem } = useBusiness();
  const [loading, setLoading] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      quantity: 0,
      reorderLevel: 5,
    },
  });

  const onSubmit = async (data: FormData) => {
    setLoading(true);
    try {
      await addInventoryItem(data);
      toast.success('Product added & prices encrypted!');
      navigate('/inventory');
    } catch (e) {
      toast.error('Failed to add product');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: 720 }}>
      <div className="page-header" style={{ marginBottom: 16 }}>
        <button className="btn btn-ghost btn-icon" onClick={() => navigate(-1)}>
          <ArrowLeft size={18} />
        </button>
        <div className="page-header-left" style={{ flex: 1 }}>
          <h2>Add New Product</h2>
          <p>Register a new product in your inventory.</p>
        </div>
      </div>

      <div className="card card-pad">
        <form className="auth-form" onSubmit={handleSubmit(onSubmit)}>
          
          <div className="form-group">
            <label className="form-label required">Product Name</label>
            <input {...register('name')} className={`form-control ${errors.name ? 'error' : ''}`} placeholder="e.g. Parle-G 100g" />
            {errors.name && <span className="form-error">{errors.name.message}</span>}
          </div>

          <div className="form-grid form-grid-2">
            <div className="form-group">
              <label className="form-label required">SKU / Item Code</label>
              <input {...register('sku')} className={`form-control ${errors.sku ? 'error' : ''}`} placeholder="PARLE-G-100" />
              {errors.sku && <span className="form-error">{errors.sku.message}</span>}
            </div>
            <div className="form-group">
              <label className="form-label">Barcode Number (Optional)</label>
              <input {...register('barcode')} className="form-control" placeholder="Scan or enter barcode" />
            </div>
          </div>

          <div className="form-grid form-grid-2">
            <div className="form-group">
              <label className="form-label required">Category</label>
              <select {...register('category')} className={`form-control ${errors.category ? 'error' : ''}`}>
                <option value="">Select Category</option>
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
              {errors.category && <span className="form-error">{errors.category.message}</span>}
            </div>
            <div className="form-group">
              <label className="form-label required">Unit / Measure</label>
              <select {...register('unit')} className={`form-control ${errors.unit ? 'error' : ''}`}>
                {UNITS.map(u => <option key={u} value={u}>{u}</option>)}
              </select>
              {errors.unit && <span className="form-error">{errors.unit.message}</span>}
            </div>
          </div>

          <div style={{ height: 1, background: 'var(--border-color)', margin: '16px 0' }} />

          <div className="form-grid form-grid-2">
            <div className="form-group">
              <label className="form-label required">Opening Stock</label>
              <input type="number" {...register('quantity', { valueAsNumber: true })} className="form-control" />
              {errors.quantity && <span className="form-error">{errors.quantity.message}</span>}
            </div>
            <div className="form-group">
              <label className="form-label required">Low Stock Alert Level</label>
              <input type="number" {...register('reorderLevel', { valueAsNumber: true })} className="form-control" />
              <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>Notify when stock drops below this</div>
            </div>
          </div>

          <div style={{ background: 'var(--bg-secondary)', padding: 16, borderRadius: 'var(--radius-md)', marginTop: 16 }}>
            <div className="alert-banner info" style={{ marginBottom: 16 }}>
              <Shield size={16} /> <span style={{ fontSize: 12 }}>Pricing data is AES-256 encrypted in Firestore.</span>
            </div>
            <div className="form-grid form-grid-2">
              <div className="form-group">
                <label className="form-label required">Cost Price (CP)</label>
                <div style={{ position: 'relative' }}>
                  <span style={{ position: 'absolute', left: 12, top: 10, color: 'var(--text-muted)' }}>₹</span>
                  <input type="number" step="0.01" {...register('costPrice', { valueAsNumber: true })} className={`form-control ${errors.costPrice ? 'error' : ''}`} style={{ paddingLeft: 24 }} />
                </div>
                {errors.costPrice && <span className="form-error">{errors.costPrice.message}</span>}
              </div>
              <div className="form-group">
                <label className="form-label required">Selling Price (SP)</label>
                <div style={{ position: 'relative' }}>
                  <span style={{ position: 'absolute', left: 12, top: 10, color: 'var(--text-muted)' }}>₹</span>
                  <input type="number" step="0.01" {...register('sellingPrice', { valueAsNumber: true })} className={`form-control ${errors.sellingPrice ? 'error' : ''}`} style={{ paddingLeft: 24 }} />
                </div>
                {errors.sellingPrice && <span className="form-error">{errors.sellingPrice.message}</span>}
              </div>
            </div>
          </div>

          <div style={{ marginTop: 24, display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
            <button type="button" className="btn btn-secondary" onClick={() => navigate('/inventory')}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? <span className="spinner spinner-sm" /> : 'Save Product'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
