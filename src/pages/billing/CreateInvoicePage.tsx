import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ArrowLeft, Plus, Trash2, Shield } from 'lucide-react';
import toast from 'react-hot-toast';
import { useBusiness } from '../../contexts/BusinessContext';

const schema = z.object({
  customerId: z.string().min(1, 'Select a customer'),
  invoiceNumber: z.string().min(1, 'Invoice number required'),
  dueDate: z.string().min(1, 'Due date required'),
  lineItems: z.array(z.object({
    name: z.string().min(1, 'Item name required'),
    qty: z.number().positive(),
    rate: z.number().positive(),
    tax: z.number().min(0).max(100),
  })).min(1, 'Add at least one item'),
  discount: z.number().min(0).default(0),
});

type FormData = z.infer<typeof schema>;

export default function CreateInvoicePage() {
  const navigate = useNavigate();
  const { customers, addInvoice, invoices } = useBusiness();
  const [loading, setLoading] = useState(false);

  // Auto-generate invoice number based on history
  const defaultInvoiceNo = `INV-${new Date().getFullYear()}-${String(invoices.length + 1).padStart(3, '0')}`;
  
  const defaultDueDate = new Date();
  defaultDueDate.setDate(defaultDueDate.getDate() + 15);

  const { register, control, handleSubmit, watch, setValue, formState: { errors } } = useForm<any>({
    resolver: zodResolver(schema),
    defaultValues: {
      invoiceNumber: defaultInvoiceNo,
      dueDate: defaultDueDate.toISOString().split('T')[0],
      lineItems: [{ name: '', qty: 1, rate: 0, tax: 0 }],
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
      const cust = customers.find(c => c.id === data.customerId);
      await addInvoice({
        invoiceNumber: data.invoiceNumber,
        customerId: data.customerId,
        customerName: cust?.name || 'Unknown',
        lineItems: data.lineItems,
        totalAmount,
        taxAmount,
        discount: data.discount,
        status: 'draft',
        dueDate: data.dueDate,
      });
      toast.success('Invoice created securely');
      navigate('/billing');
    } catch (e: any) {
      console.error(e);
      toast.error('Failed to create invoice');
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
          <h2>Create Invoice</h2>
          <p>Generate a GST-ready, encrypted invoice.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)}>
        {/* Top details */}
        <div className="card card-pad" style={{ marginBottom: 24 }}>
          <div className="form-grid form-grid-3">
            <div className="form-group">
              <label className="form-label required">Customer</label>
              <select {...register('customerId')} className={`form-control ${errors.customerId ? 'error' : ''}`}>
                <option value="">Select Customer</option>
                {customers.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
              {errors.customerId?.message && <span className="form-error">{String(errors.customerId.message)}</span>}
              <div style={{ marginTop: 4, fontSize: 12 }}>
                <button type="button" className="btn btn-ghost" style={{ padding: 0, height: 'auto', color: 'var(--brand)' }}>
                  + New Customer
                </button>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label required">Invoice Number</label>
              <input {...register('invoiceNumber')} className="form-control" />
            </div>

            <div className="form-group">
              <label className="form-label required">Due Date</label>
              <input type="date" {...register('dueDate')} className="form-control" />
            </div>
          </div>
        </div>

        {/* Line items */}
        <div className="card" style={{ marginBottom: 24 }}>
          <div className="card-header">
            <h3 className="card-title">Line Items</h3>
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
            <button type="button" className="btn btn-secondary btn-sm" onClick={() => append({ name: '', qty: 1, rate: 0, tax: 0 })}>
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
              {loading ? <span className="spinner spinner-sm" /> : 'Save Invoice'}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
