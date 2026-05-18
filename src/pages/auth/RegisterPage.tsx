import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Store, User, Mail, Lock, Building2, Phone, Hash, Eye, EyeOff, AlertCircle, Shield, CheckCircle
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import toast from 'react-hot-toast';

const schema = z.object({
  displayName: z.string().min(2, 'Name is required'),
  email: z.string().email('Enter a valid email'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  confirmPassword: z.string(),
  businessName: z.string().min(2, 'Business name is required'),
  phone: z.string().optional(),
  gstNumber: z.string().optional(),
}).refine(d => d.password === d.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});

type FormData = z.infer<typeof schema>;

export default function RegisterPage() {
  const { register: authRegister } = useAuth();
  const navigate = useNavigate();
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data: FormData) => {
    setLoading(true);
    try {
      await authRegister({
        email: data.email,
        password: data.password,
        displayName: data.displayName,
        businessName: data.businessName,
        phone: data.phone,
        gstNumber: data.gstNumber,
      });
      toast.success('Account created! Your encryption key has been generated.');
      navigate('/dashboard');
    } catch (err: any) {
      const msg = err?.code === 'auth/email-already-in-use'
        ? 'Email already registered.'
        : 'Registration failed. Please try again.';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card" style={{ maxWidth: 520 }}>
        {/* Logo */}
        <div className="auth-logo">
          <div className="auth-logo-icon">
            <Store size={24} color="white" />
          </div>
          <div className="auth-logo-text">
            <h1>ShopBook Pro</h1>
            <p>Secure Business Accounting</p>
          </div>
        </div>

        {/* Security callout */}
        <div className="alert-banner success" style={{ marginBottom: 20 }}>
          <Shield size={16} style={{ flexShrink: 0, marginTop: 2 }} />
          <div>
            <strong>Bank-grade security</strong><br />
            <span style={{ fontSize: 12 }}>
              A unique AES-256 encryption key will be derived from your password. All sensitive data is encrypted before reaching Firestore.
            </span>
          </div>
        </div>

        <h2 className="auth-title">Create your account</h2>
        <p className="auth-subtitle">Get started with ShopBook Pro — free forever for 1 business</p>

        <form className="auth-form" onSubmit={handleSubmit(onSubmit)}>
          <div className="form-grid form-grid-2">
            {/* Name */}
            <div className="form-group">
              <label className="form-label required">Your Name</label>
              <div style={{ position: 'relative' }}>
                <User size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input {...register('displayName')} className={`form-control ${errors.displayName ? 'error' : ''}`} style={{ paddingLeft: 36 }} placeholder="Ramesh Sharma" />
              </div>
              {errors.displayName && <span className="form-error"><AlertCircle size={12} /> {errors.displayName.message}</span>}
            </div>

            {/* Business */}
            <div className="form-group">
              <label className="form-label required">Business Name</label>
              <div style={{ position: 'relative' }}>
                <Building2 size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input {...register('businessName')} className={`form-control ${errors.businessName ? 'error' : ''}`} style={{ paddingLeft: 36 }} placeholder="Sharma General Store" />
              </div>
              {errors.businessName && <span className="form-error"><AlertCircle size={12} /> {errors.businessName.message}</span>}
            </div>
          </div>

          {/* Email */}
          <div className="form-group">
            <label className="form-label required">Email</label>
            <div style={{ position: 'relative' }}>
              <Mail size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input {...register('email')} type="email" className={`form-control ${errors.email ? 'error' : ''}`} style={{ paddingLeft: 36 }} placeholder="ramesh@example.com" />
            </div>
            {errors.email && <span className="form-error"><AlertCircle size={12} /> {errors.email.message}</span>}
          </div>

          <div className="form-grid form-grid-2">
            {/* Phone */}
            <div className="form-group">
              <label className="form-label">Phone (India)</label>
              <div style={{ position: 'relative' }}>
                <Phone size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input {...register('phone')} className="form-control" style={{ paddingLeft: 36 }} placeholder="+91 98765 43210" />
              </div>
            </div>

            {/* GST */}
            <div className="form-group">
              <label className="form-label">GST Number</label>
              <div style={{ position: 'relative' }}>
                <Hash size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input {...register('gstNumber')} className="form-control" style={{ paddingLeft: 36 }} placeholder="27AAAAA0000A1Z5" />
              </div>
            </div>
          </div>

          <div className="form-grid form-grid-2">
            {/* Password */}
            <div className="form-group">
              <label className="form-label required">Password</label>
              <div style={{ position: 'relative' }}>
                <Lock size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input
                  {...register('password')}
                  type={showPwd ? 'text' : 'password'}
                  className={`form-control ${errors.password ? 'error' : ''}`}
                  style={{ paddingLeft: 36, paddingRight: 40 }}
                  placeholder="Min. 8 chars"
                />
                <button type="button" className="icon-btn" style={{ position: 'absolute', right: 4, top: '50%', transform: 'translateY(-50%)' }} onClick={() => setShowPwd(s => !s)}>
                  {showPwd ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
              {errors.password && <span className="form-error"><AlertCircle size={12} /> {errors.password.message}</span>}
            </div>

            {/* Confirm */}
            <div className="form-group">
              <label className="form-label required">Confirm Password</label>
              <input {...register('confirmPassword')} type="password" className={`form-control ${errors.confirmPassword ? 'error' : ''}`} placeholder="Repeat password" />
              {errors.confirmPassword && <span className="form-error"><AlertCircle size={12} /> {errors.confirmPassword.message}</span>}
            </div>
          </div>

          <div style={{ fontSize: 12, color: 'var(--text-muted)', display: 'flex', gap: 6, alignItems: 'flex-start' }}>
            <CheckCircle size={13} style={{ flexShrink: 0, marginTop: 1, color: 'var(--success)' }} />
            Your password is used to derive your encryption key and is <strong>&nbsp;never stored&nbsp;</strong> in plaintext anywhere.
          </div>

          <button
            type="submit"
            className="btn btn-primary btn-lg"
            disabled={loading}
            style={{ width: '100%' }}
            id="register-submit-btn"
          >
            {loading ? (
              <><span className="spinner" style={{ width: 18, height: 18 }} /> Creating account…</>
            ) : 'Create Account'}
          </button>
        </form>

        <div className="auth-footer">
          Already have an account? <Link to="/login" style={{ fontWeight: 600 }}>Sign in</Link>
        </div>
      </div>
    </div>
  );
}
