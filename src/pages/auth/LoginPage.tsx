import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Store, Mail, Lock, Eye, EyeOff, AlertCircle, Shield } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import toast from 'react-hot-toast';

const schema = z.object({
  email: z.string().email('Enter a valid email'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

type FormData = z.infer<typeof schema>;

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data: FormData) => {
    setLoading(true);
    try {
      await login(data.email, data.password);
      toast.success('Welcome back! Data decrypted ✓');
      navigate('/dashboard');
    } catch (err: any) {
      const msg = err?.code === 'auth/invalid-credential'
        ? 'Invalid email or password'
        : 'Login failed. Please try again.';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
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

        {/* Encryption notice */}
        <div className="alert-banner info" style={{ marginBottom: 20 }}>
          <Shield size={16} style={{ flexShrink: 0, marginTop: 2 }} />
          <div>
            <strong>End-to-End Encrypted</strong><br />
            <span style={{ fontSize: 12 }}>
              Your password derives the encryption key. Data in Firestore is always encrypted.
            </span>
          </div>
        </div>

        <h2 className="auth-title">Sign in</h2>
        <p className="auth-subtitle">Access your secure business dashboard</p>

        <form className="auth-form" onSubmit={handleSubmit(onSubmit)}>
          {/* Email */}
          <div className="form-group">
            <label className="form-label required">Email</label>
            <div style={{ position: 'relative' }}>
              <Mail size={16} style={{
                position: 'absolute', left: 12, top: '50%',
                transform: 'translateY(-50%)', color: 'var(--text-muted)'
              }} />
              <input
                {...register('email')}
                type="email"
                className={`form-control ${errors.email ? 'error' : ''}`}
                style={{ paddingLeft: 38 }}
                placeholder="you@example.com"
                autoComplete="email"
              />
            </div>
            {errors.email && (
              <span className="form-error">
                <AlertCircle size={12} /> {errors.email.message}
              </span>
            )}
          </div>

          {/* Password */}
          <div className="form-group">
            <label className="form-label required">Password</label>
            <div style={{ position: 'relative' }}>
              <Lock size={16} style={{
                position: 'absolute', left: 12, top: '50%',
                transform: 'translateY(-50%)', color: 'var(--text-muted)'
              }} />
              <input
                {...register('password')}
                type={showPwd ? 'text' : 'password'}
                className={`form-control ${errors.password ? 'error' : ''}`}
                style={{ paddingLeft: 38, paddingRight: 44 }}
                placeholder="Your password"
                autoComplete="current-password"
              />
              <button
                type="button"
                className="icon-btn"
                style={{
                  position: 'absolute', right: 4, top: '50%',
                  transform: 'translateY(-50%)',
                }}
                onClick={() => setShowPwd(s => !s)}
              >
                {showPwd ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            {errors.password && (
              <span className="form-error">
                <AlertCircle size={12} /> {errors.password.message}
              </span>
            )}
          </div>

          <button
            type="submit"
            className="btn btn-primary btn-lg"
            disabled={loading}
            style={{ width: '100%', marginTop: 4 }}
            id="login-submit-btn"
          >
            {loading ? (
              <><span className="spinner" style={{ width: 18, height: 18 }} /> Signing in & decrypting…</>
            ) : 'Sign In'}
          </button>
        </form>

        <div className="auth-footer">
          Don't have an account?{' '}
          <Link to="/register" style={{ fontWeight: 600 }}>Create one free</Link>
        </div>
      </div>
    </div>
  );
}
