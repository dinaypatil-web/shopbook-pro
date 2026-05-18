import React, { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowLeft, CheckCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { useBusiness } from '../../contexts/BusinessContext';

const schema = z.object({
  type: z.enum(['credit', 'debit']),
  account: z.string().min(1, 'Select an account'),
  amount: z.number().positive('Must be greater than 0'),
  category: z.string().min(1, 'Category is required'),
  notes: z.string().optional(),
  reference: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

const CATEGORIES = {
  credit: ['Sales', 'Service', 'Interest', 'Refund', 'Other Income'],
  debit: ['Purchases', 'Rent', 'Utilities', 'Salary', 'Marketing', 'Taxes', 'Other Expense'],
};

export default function AddTransactionPage() {
  const navigate = useNavigate();
  const { accounts, addTransaction } = useBusiness();
  const [loading, setLoading] = useState(false);

  const { register, handleSubmit, watch, control, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      type: 'credit',
      amount: undefined,
    },
  });

  const type = watch('type');
  const availableCategories = CATEGORIES[type];

  const onSubmit = async (data: FormData) => {
    setLoading(true);
    try {
      await addTransaction(data as any);
      toast.success('Transaction added & encrypted!');
      navigate('/transactions');
    } catch (e: any) {
      toast.error('Failed to add transaction');
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: 640 }}>
      <div className="page-header" style={{ marginBottom: 16 }}>
        <button className="btn btn-ghost btn-icon" onClick={() => navigate(-1)}>
          <ArrowLeft size={18} />
        </button>
        <div className="page-header-left" style={{ flex: 1 }}>
          <h2>Add Transaction</h2>
          <p>Record a new income or expense.</p>
        </div>
      </div>

      <div className="card card-pad">
        <form className="auth-form" onSubmit={handleSubmit(onSubmit)}>
          
          <div className="form-group">
            <label className="form-label required">Transaction Type</label>
            <div className="tabs" style={{ width: '100%' }}>
              <button
                type="button"
                className={`tab-item ${type === 'credit' ? 'active' : ''}`}
                style={{ flex: 1, textAlign: 'center' }}
                onClick={() => {
                  const el = document.getElementsByName('type')[0] as any;
                  el.value = 'credit';
                  el.dispatchEvent(new Event('change', { bubbles: true }));
                }}
              >
                Income (Credit)
              </button>
              <button
                type="button"
                className={`tab-item ${type === 'debit' ? 'active' : ''}`}
                style={{ flex: 1, textAlign: 'center' }}
                onClick={() => {
                  const el = document.getElementsByName('type')[0] as any;
                  el.value = 'debit';
                  el.dispatchEvent(new Event('change', { bubbles: true }));
                }}
              >
                Expense (Debit)
              </button>
            </div>
            {/* hidden input for form state */}
            <select {...register('type')} style={{ display: 'none' }}>
              <option value="credit">Credit</option>
              <option value="debit">Debit</option>
            </select>
          </div>

          <div className="form-grid form-grid-2">
            <div className="form-group">
              <label className="form-label required">Amount (₹)</label>
              <input
                {...register('amount', { valueAsNumber: true })}
                type="number"
                step="0.01"
                className={`form-control ${errors.amount ? 'error' : ''}`}
                placeholder="0.00"
              />
              {errors.amount && <span className="form-error">{errors.amount.message}</span>}
            </div>

            <div className="form-group">
              <label className="form-label required">Payment Account</label>
              <select {...register('account')} className={`form-control ${errors.account ? 'error' : ''}`}>
                <option value="">Select Account</option>
                <option value="Cash">Cash Account (Default)</option>
                <option value="Bank">Bank Account (Default)</option>
                {accounts.map(a => (
                  <option key={a.id} value={a.name}>{a.name}</option>
                ))}
              </select>
              {errors.account && <span className="form-error">{errors.account.message}</span>}
            </div>
          </div>

          <div className="form-group">
            <label className="form-label required">Category</label>
            <select {...register('category')} className={`form-control ${errors.category ? 'error' : ''}`}>
              <option value="">Select Category</option>
              {availableCategories.map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
            {errors.category && <span className="form-error">{errors.category.message}</span>}
          </div>

          <div className="form-group">
            <label className="form-label">Reference / Bill No. (Optional)</label>
            <input {...register('reference')} className="form-control" placeholder="e.g. INV-2023-001" />
          </div>

          <div className="form-group">
            <label className="form-label">Notes (Optional)</label>
            <textarea {...register('notes')} className="form-control" placeholder="Additional details..." />
          </div>

          <div style={{ fontSize: 12, color: 'var(--text-muted)', display: 'flex', gap: 6 }}>
            <CheckCircle size={14} color="var(--success)" />
            Amount, notes, and reference will be securely encrypted.
          </div>

          <div style={{ marginTop: 16, display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
            <button type="button" className="btn btn-secondary" onClick={() => navigate('/transactions')}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? <span className="spinner spinner-sm" /> : 'Save Transaction'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
