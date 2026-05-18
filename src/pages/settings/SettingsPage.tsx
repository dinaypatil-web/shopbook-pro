import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import { useBusiness } from '../../contexts/BusinessContext';
import { useAuth } from '../../contexts/AuthContext';
import { Store, Percent, Users, Shield } from 'lucide-react';

const profileSchema = z.object({
  name: z.string().min(2, 'Business Name is required'),
  gstNumber: z.string().optional(),
  address: z.string().optional(),
});

const taxSchema = z.object({
  taxRate: z.number().min(0).max(100).optional(),
  invoiceTerms: z.string().optional(),
});

export default function SettingsPage() {
  const { business, updateBusinessSettings } = useBusiness();
  const { profile } = useAuth();
  const [activeTab, setActiveTab] = useState<'profile' | 'tax' | 'team'>('profile');
  const [loading, setLoading] = useState(false);

  const { register: regProfile, handleSubmit: submitProfile, reset: resetProfile } = useForm({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: '',
      gstNumber: '',
      address: '',
    }
  });

  const { register: regTax, handleSubmit: submitTax, reset: resetTax } = useForm({
    resolver: zodResolver(taxSchema),
    defaultValues: {
      taxRate: 0,
      invoiceTerms: '',
    }
  });

  useEffect(() => {
    if (business) {
      resetProfile({
        name: business.name || '',
        gstNumber: business.gstNumber || '',
        address: business.address || '',
      });
      resetTax({
        taxRate: business.taxRate || 0,
        invoiceTerms: business.invoiceTerms || '',
      });
    }
  }, [business, resetProfile, resetTax]);

  const onSaveProfile = async (data: any) => {
    setLoading(true);
    try {
      await updateBusinessSettings(data);
      toast.success('Business profile updated');
    } catch (e) {
      toast.error('Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const onSaveTax = async (data: any) => {
    setLoading(true);
    try {
      await updateBusinessSettings(data);
      toast.success('Tax & Invoice settings updated');
    } catch (e) {
      toast.error('Failed to update settings');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: 900 }}>
      <div className="page-header" style={{ marginBottom: 24 }}>
        <div className="page-header-left">
          <h2>Settings</h2>
          <p>Manage your business profile, tax rates, and team access.</p>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 24, alignItems: 'flex-start' }}>
        
        {/* Sidebar Nav */}
        <div className="card" style={{ width: 240, padding: 8 }}>
          <button 
            className={`nav-item ${activeTab === 'profile' ? 'active' : ''}`}
            onClick={() => setActiveTab('profile')}
            style={{ width: '100%', justifyContent: 'flex-start' }}
          >
            <Store size={18} /> <span>Business Profile</span>
          </button>
          <button 
            className={`nav-item ${activeTab === 'tax' ? 'active' : ''}`}
            onClick={() => setActiveTab('tax')}
            style={{ width: '100%', justifyContent: 'flex-start', marginTop: 4 }}
          >
            <Percent size={18} /> <span>Tax & Invoices</span>
          </button>
          <button 
            className={`nav-item ${activeTab === 'team' ? 'active' : ''}`}
            onClick={() => setActiveTab('team')}
            style={{ width: '100%', justifyContent: 'flex-start', marginTop: 4 }}
          >
            <Users size={18} /> <span>Team Management</span>
          </button>
        </div>

        {/* Content Area */}
        <div style={{ flex: 1 }}>
          
          {activeTab === 'profile' && (
            <div className="card card-pad">
              <h3 style={{ marginBottom: 16 }}>Business Profile</h3>
              <form onSubmit={submitProfile(onSaveProfile)}>
                <div className="form-group">
                  <label className="form-label required">Business Name</label>
                  <input {...regProfile('name')} className="form-control" />
                </div>
                <div className="form-group">
                  <label className="form-label">GSTIN</label>
                  <input {...regProfile('gstNumber')} className="form-control" placeholder="22AAAAA0000A1Z5" />
                </div>
                <div className="form-group">
                  <label className="form-label">Business Address</label>
                  <textarea {...regProfile('address')} className="form-control" rows={3} placeholder="Full address for invoices..." />
                </div>
                <div style={{ marginTop: 24, display: 'flex', justifyContent: 'flex-end' }}>
                  <button type="submit" className="btn btn-primary" disabled={loading}>
                    {loading ? <span className="spinner spinner-sm" /> : 'Save Profile'}
                  </button>
                </div>
              </form>
            </div>
          )}

          {activeTab === 'tax' && (
            <div className="card card-pad">
              <h3 style={{ marginBottom: 16 }}>Tax & Invoice Preferences</h3>
              <form onSubmit={submitTax(onSaveTax)}>
                <div className="form-group" style={{ maxWidth: 200 }}>
                  <label className="form-label">Default GST Rate (%)</label>
                  <select {...regTax('taxRate', { valueAsNumber: true })} className="form-control">
                    <option value="0">0% (Exempt)</option>
                    <option value="5">5%</option>
                    <option value="12">12%</option>
                    <option value="18">18%</option>
                    <option value="28">28%</option>
                  </select>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>Applied to new products automatically</div>
                </div>
                <div className="form-group" style={{ marginTop: 16 }}>
                  <label className="form-label">Default Invoice Terms & Conditions</label>
                  <textarea {...regTax('invoiceTerms')} className="form-control" rows={4} placeholder="1. Goods once sold will not be taken back..." />
                </div>
                <div style={{ marginTop: 24, display: 'flex', justifyContent: 'flex-end' }}>
                  <button type="submit" className="btn btn-primary" disabled={loading}>
                    {loading ? <span className="spinner spinner-sm" /> : 'Save Tax Settings'}
                  </button>
                </div>
              </form>
            </div>
          )}

          {activeTab === 'team' && (
            <div className="card card-pad">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <h3>Team Members</h3>
                <button className="btn btn-primary btn-sm">Invite Member</button>
              </div>
              <div className="alert-banner info" style={{ marginBottom: 16 }}>
                <Shield size={16} /> 
                <span style={{ fontSize: 12 }}>Team invites require cloud functions (coming soon). For now, view your active secure session.</span>
              </div>
              
              <div className="table-container" style={{ border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)' }}>
                <table>
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Email / Phone</th>
                      <th>Role</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td style={{ fontWeight: 500 }}>{profile?.displayName}</td>
                      <td>{profile?.email || profile?.phone}</td>
                      <td>
                        <span className="badge badge-brand">{profile?.role.toUpperCase()}</span>
                      </td>
                      <td><span className="badge badge-success">Active</span></td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
