import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ArrowLeft, Plus, Trash2, Shield } from 'lucide-react';
import toast from 'react-hot-toast';
import { useBusiness } from '../../contexts/BusinessContext';

const schema = z.object({
  vendorId: z.string().min(1, 'Select a vendor'),
  purchaseNumber: z.string().min(1, 'Purchase number required'),
  date: z.string().min(1, 'Date required'),
  lineItems: z.array(z.object({
    itemId: z.string().optional(),
    name: z.string().min(1, 'Item name required'),
    qty: z.number().positive(),
    rate: z.number().positive(),
    tax: z.number().min(0).max(100),
  })).min(1, 'Add at least one item'),
  discount: z.number().min(0).default(0),
});

type FormData = z.infer<typeof schema>;

export default function CreatePurchasePage() {
  const navigate = useNavigate();
  const { vendors, inventory, addPurchase, purchases } = useBusiness();
  const [loading, setLoading] = useState(false);

  // Auto-generate purchase number
  const defaultPurchaseNo = `PO-${new Date().getFullYear()}-${String(purchases.length + 1).padStart(3, '0')}`;
  
  const defaultDate = new Date().toISOString().split('T')[0];

  const { register, control, handleSubmit, watch, setValue, formState: { errors } } = useForm<any>({
    resolver: zodResolver(schema),
    defaultValues: {
      purchaseNumber: defaultPurchaseNo,
      date: defaultDate,
      lineItems: [{ itemId: '', name: '', qty: 1, rate: 0, tax: 0 }],
      discount: 0,
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'lineItems',
  });

  const watchItems = watch('lineItems');
  const watchDiscount = watch('discount');

  // Compute totals
  const subtotal = watchItems.reduce((acc: number, item: any) => acc + ((item.qty || 0) * (item.rate || 0)), 0);
  const taxAmount = watchItems.reduce((acc: number, item: any) => {
    const base = (item.qty || 0) * (item.rate || 0);
    return acc + (base * ((item.tax || 0) / 100));
  }, 0);
  const totalAmount = subtotal + taxAmount - (watchDiscount || 0);

  const onSubmit = async (data: FormData) => {
    setLoading(true);
    try {
      const vendor = vendors.find(v => v.id === data.vendorId);
      await addPurchase({
        purchaseNumber: data.purchaseNumber,
        vendorId: data.vendorId,
        vendorName: vendor?.name || 'Unknown',
        lineItems: data.lineItems,
        totalAmount,
        taxAmount,
        discount: data.discount,
        status: 'draft',
        date: data.date,
      });
      toast.success('Purchase recorded securely');
      navigate('/purchases');
    } catch (e: any) {
      console.error(e);
      toast.error('Failed to create purchase');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: 900 }}>
      <div className="page-header" style={{ marginBottom: 16 }}>
        <button className="btn btn-ghost btn-icon" onClick={() => navigate(-1)}>
          <ArrowLeft size={18} />
        </button>
        <div className="page-header-left" style={{ flex: 1 }}>
          <h2>Record Purchase</h2>
          <p>Add new stock and record a purchase from a vendor.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)}>
        {/* Top details */}
        <div className="card card-pad" style={{ marginBottom: 24 }}>
          <div className="form-grid form-grid-3">
            <div className="form-group">
              <label className="form-label required">Vendor</label>
              <select {...register('vendorId')} className={`form-control ${errors.vendorId ? 'error' : ''}`}>
                <option value="">Select Vendor</option>
                {vendors.map(v => (
                  <option key={v.id} value={v.id}>{v.name}</option>
                ))}
              </select>
              {errors.vendorId?.message && <span className="form-error">{String(errors.vendorId.message)}</span>}
              <div style={{ marginTop: 4, fontSize: 12 }}>
                <button type="button" className="btn btn-ghost" style={{ padding: 0, height: 'auto', color: 'var(--brand)' }}>
                  + New Vendor
                </button>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label required">Purchase Order No.</label>
              <input {...register('purchaseNumber')} className="form-control" />
            </div>

            <div className="form-group">
              <label className="form-label required">Date</label>
              <input type="date" {...register('date')} className="form-control" />
            </div>
          </div>
        </div>

        {/* Line items */}
        <div className="card" style={{ marginBottom: 24 }}>
          <div className="card-header">
            <h3 className="card-title">Line Items (Stock will be added to inventory)</h3>
          </div>
          <div className="table-container" style={{ border: 'none', borderRadius: 0 }}>
            <table>
              <thead>
                <tr>
                  <th>Item Name</th>
                  <th style={{ width: 100 }}>Qty</th>
                  <th style={{ width: 140 }}>Rate (₹)</th>
                  <th style={{ width: 120 }}>GST (%)</th>
                  <th style={{ width: 140, textAlign: 'right' }}>Amount</th>
                  <th style={{ width: 60 }}></th>
                </tr>
              </thead>
              <tbody>
                {fields.map((field, index) => {
                  const qty = watchItems[index]?.qty || 0;
                  const rate = watchItems[index]?.rate || 0;
                  const amt = qty * rate;
                  return (
                    <tr key={field.id}>
                      <td style={{ padding: '8px 16px' }}>
                        <select
                          className="form-control"
                          style={{ marginBottom: 4 }}
                          onChange={(e) => {
                            const val = e.target.value;
                            if (val) {
                              const item = inventory.find(i => i.id === val);
                              if (item) {
                                setValue(`lineItems.${index}.itemId`, item.id);
                                setValue(`lineItems.${index}.name`, item.name);
                                setValue(`lineItems.${index}.rate`, item.costPrice);
                              }
                            } else {
                              setValue(`lineItems.${index}.itemId`, '');
                            }
                          }}
                        >
                          <option value="">Select Inventory Item...</option>
                          {inventory.map(inv => (
                            <option key={inv.id} value={inv.id}>{inv.name} (Stock: {inv.quantity})</option>
                          ))}
                        </select>
                        <input {...register(`lineItems.${index}.name` as const)} className="form-control" placeholder="Item description" />
                      </td>
                      <td style={{ padding: '8px 16px' }}>
                        <input type="number" {...register(`lineItems.${index}.qty` as const, { valueAsNumber: true })} className="form-control" step="1" />
                      </td>
                      <td style={{ padding: '8px 16px' }}>
                        <input type="number" {...register(`lineItems.${index}.rate` as const, { valueAsNumber: true })} className="form-control" step="0.01" />
                      </td>
                      <td style={{ padding: '8px 16px' }}>
                        <select {...register(`lineItems.${index}.tax` as const, { valueAsNumber: true })} className="form-control">
                          <option value="0">0%</option>
                          <option value="5">5%</option>
                          <option value="12">12%</option>
                          <option value="18">18%</option>
                          <option value="28">28%</option>
                        </select>
                      </td>
                      <td style={{ padding: '8px 16px', textAlign: 'right', fontWeight: 500 }}>
                        {new Intl.NumberFormat('en-IN').format(amt)}
                      </td>
                      <td style={{ padding: '8px 16px', textAlign: 'right' }}>
                        {fields.length > 1 && (
                          <button type="button" className="btn btn-ghost btn-icon" onClick={() => remove(index)}>
                            <Trash2 size={16} color="var(--danger)" />
                          </button>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
          <div style={{ padding: '12px 16px', borderTop: '1px solid var(--border-color)' }}>
            <button type="button" className="btn btn-secondary btn-sm" onClick={() => append({ itemId: '', name: '', qty: 1, rate: 0, tax: 0 })}>
              <Plus size={14} /> Add Item
            </button>
          </div>
        </div>

        {/* Totals */}
        <div style={{ display: 'flex', gap: 24, alignItems: 'flex-start' }}>
          <div style={{ flex: 1 }}>
            <div className="alert-banner info">
              <Shield size={16} style={{ flexShrink: 0, marginTop: 2 }} />
              <div style={{ fontSize: 12 }}>
                Items, rates, amounts, and tax data will be end-to-end encrypted in your database.
              </div>
            </div>
          </div>

          <div className="card card-pad" style={{ width: 340 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
              <span style={{ color: 'var(--text-muted)' }}>Subtotal</span>
              <span>₹{new Intl.NumberFormat('en-IN').format(subtotal)}</span>
            </div>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <span style={{ color: 'var(--text-muted)' }}>Discount (₹)</span>
              <input type="number" {...register('discount', { valueAsNumber: true })} className="form-control" style={{ width: 120, height: 32 }} />
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
              <span style={{ color: 'var(--text-muted)' }}>Tax (GST)</span>
              <span>₹{new Intl.NumberFormat('en-IN').format(taxAmount)}</span>
            </div>

            <div style={{ borderTop: '1px solid var(--border-color)', margin: '0 -24px 16px', padding: '16px 24px 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontWeight: 600 }}>Total Amount</span>
              <span style={{ fontSize: 24, fontWeight: 700, fontFamily: 'var(--font-mono)' }}>₹{new Intl.NumberFormat('en-IN').format(totalAmount)}</span>
            </div>

            <button type="submit" className="btn btn-primary" style={{ width: '100%' }} disabled={loading}>
              {loading ? <span className="spinner spinner-sm" /> : 'Save Purchase'}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
