'use client';

import { useState } from 'react';
import Link from 'next/link';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      if (!res.ok) {
        throw new Error('Failed to submit request');
      }

      setSubmitted(true);
    } catch (err: any) {
      setError(err.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', alignItems: 'center', justifyContent: 'center' }}>
      <div className="glass-panel" style={{ padding: '2.5rem', width: '100%', maxWidth: '420px', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        <div style={{ textAlign: 'center' }}>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--accent-primary)', marginBottom: '0.5rem' }}>Recover Password</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
            {submitted 
              ? "Check your email for instructions" 
              : "Enter your registered email address"
            }
          </p>
        </div>

        {error && (
          <div style={{ background: 'rgba(239, 68, 68, 0.1)', color: 'var(--accent-danger)', padding: '0.75rem', borderRadius: '8px', fontSize: '0.85rem' }}>
            {error}
          </div>
        )}

        {submitted ? (
          <div style={{ background: 'rgba(59, 130, 246, 0.1)', color: '#60a5fa', padding: '1rem', borderRadius: '8px', fontSize: '0.9rem', textAlign: 'center' }}>
            If an account exists for <strong>{email}</strong>, a password reset link has been sent. Check your terminal output locally!
            <div style={{ marginTop: '1.5rem' }}>
              <Link href="/login" style={{ color: 'white', textDecoration: 'none', background: 'var(--accent-primary)', padding: '0.6rem 1.2rem', borderRadius: '8px', fontWeight: 600 }}>
                Return to Login
              </Link>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <label style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Email Address</label>
              <input 
                type="email" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="name@company.com"
                style={{
                  width: '100%', padding: '0.75rem', borderRadius: '8px', 
                  background: 'rgba(0,0,0,0.2)', border: '1px solid var(--border-color)', outline: 'none', color: 'white'
                }}
              />
            </div>

            <button 
              type="submit" 
              disabled={loading}
              style={{
                width: '100%', padding: '0.75rem', borderRadius: '8px', fontWeight: 600,
                background: 'var(--accent-primary)', color: 'white', border: 'none', 
                cursor: loading ? 'not-allowed' : 'pointer', transition: 'all 0.2s',
                opacity: loading ? 0.7 : 1
              }}
            >
              {loading ? 'Processing...' : 'Send Reset Link'}
            </button>
            <div style={{ textAlign: 'center', marginTop: '0.5rem' }}>
               <Link href="/login" style={{ fontSize: '0.85rem', color: 'var(--text-muted)', textDecoration: 'none' }}>
                 Back to login
               </Link>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
