'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/Button';
import { Input } from '@/components/Input';
import { Briefcase, ArrowRight, Shield, Clock, BarChart3 } from 'lucide-react';

const features = [
  { icon: Briefcase, text: 'Project pipeline management' },
  { icon: Clock, text: 'Automated timesheet tracking' },
  { icon: BarChart3, text: 'Real-time financial insights' },
];

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Login failed');
      }

      router.push('/dashboard');
      router.refresh();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="animated-bg" style={{ display: 'flex', minHeight: '100vh' }}>
      {/* Brand Panel */}
      <div style={{
        flex: '1 1 50%',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        padding: '4rem',
        position: 'relative',
        overflow: 'hidden',
      }}>
        {/* Decorative circles */}
        <div style={{
          position: 'absolute',
          top: '-20%',
          right: '-10%',
          width: '500px',
          height: '500px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(16,185,129,0.12) 0%, transparent 70%)',
          pointerEvents: 'none',
        }} />
        <div style={{
          position: 'absolute',
          bottom: '-15%',
          left: '-5%',
          width: '400px',
          height: '400px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(245,158,11,0.08) 0%, transparent 70%)',
          pointerEvents: 'none',
        }} />

        <div style={{ position: 'relative', zIndex: 1, maxWidth: '480px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
            <div style={{
              width: '48px', height: '48px', borderRadius: '14px',
              background: 'linear-gradient(135deg, var(--accent-primary) 0%, #059669 100%)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 8px 24px rgba(16,185,129,0.3)',
            }}>
              <Shield size={24} color="white" />
            </div>
            <span className="app-heading" style={{ fontSize: '1.5rem', color: 'var(--text-heading)' }}>
              {process.env.NEXT_PUBLIC_APP_NAME || 'OfficeManager'}
            </span>
          </div>

          <h1 className="app-heading" style={{
            fontSize: 'clamp(2rem, 4vw, 3rem)',
            lineHeight: 1.15,
            marginBottom: '1rem',
          }}>
            Streamline your{' '}
            <span className="text-gradient-emerald">operations</span>
            {' '}from one place
          </h1>

          <p style={{ fontSize: '1rem', color: 'var(--text-secondary)', lineHeight: 1.7, marginBottom: '2.5rem' }}>
            A complete project management suite with pipeline tracking, timesheet management, and financial oversight for modern teams.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {features.map((f, i) => (
              <div key={i} className="fade-in" style={{
                display: 'flex', alignItems: 'center', gap: '1rem',
                padding: '0.75rem 1rem',
                background: 'rgba(255,255,255,0.03)',
                borderRadius: '10px',
                border: '1px solid rgba(255,255,255,0.05)',
              }}>
                <div style={{ color: 'var(--accent-primary)' }}>
                  <f.icon size={20} />
                </div>
                <span style={{ color: 'var(--text-primary)', fontWeight: 500, fontSize: '0.9rem' }}>{f.text}</span>
              </div>
            ))}
          </div>

          <div style={{ marginTop: '2rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{ display: 'flex' }}>
              {['#10b981', '#f59e0b', '#3b82f6', '#ef4444'].map((c, i) => (
                <div key={i} style={{
                  width: '28px', height: '28px', borderRadius: '50%',
                  background: c, border: '2px solid var(--bg-base)',
                  marginLeft: i > 0 ? '-8px' : '0',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '0.55rem', fontWeight: 800, color: 'white',
                }}>
                  {['J', 'M', 'A', 'S'][i]}
                </div>
              ))}
            </div>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              Trusted by project teams
            </span>
          </div>
        </div>
      </div>

      {/* Login Panel */}
      <div style={{
        flex: '1 1 50%',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        padding: '4rem',
        position: 'relative',
      }}>
        <div className="glass-elevated" style={{
          width: '100%',
          maxWidth: '420px',
          padding: '2.5rem',
          borderRadius: '20px',
          display: 'flex',
          flexDirection: 'column',
          gap: '1.75rem',
        }}>
          <div>
            <h2 className="app-heading" style={{ fontSize: '1.5rem', marginBottom: '0.35rem' }}>Welcome back</h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Sign in to your account to continue</p>
          </div>

          {error && (
            <div role="alert" style={{
              padding: '0.85rem 1rem',
              background: 'rgba(239, 68, 68, 0.1)',
              border: '1px solid rgba(239, 68, 68, 0.2)',
              borderRadius: '10px',
              color: 'var(--accent-danger)',
              fontSize: '0.85rem',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
            }}>
              <span style={{ fontSize: '1rem' }}>!</span>
              {error}
            </div>
          )}

          <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <Input
              label="Email Address"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@company.com"
              required
            />

            <div>
              <Input
                label="Password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                required
              />
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
                <Link href="/forgot-password" style={{
                  fontSize: '0.8rem',
                  color: 'var(--accent-primary)',
                  textDecoration: 'none',
                  fontWeight: 600,
                }}>
                  Forgot password?
                </Link>
              </div>
            </div>

            <Button type="submit" loading={loading} style={{ width: '100%', marginTop: '0.5rem' }} icon={<ArrowRight size={18} />}>
              Sign In
            </Button>
          </form>

          <div className="divider" />

          <p style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
            &copy; {new Date().getFullYear()} {process.env.NEXT_PUBLIC_COMPANY_NAME || 'OfficeManager'}. All rights reserved.
          </p>
        </div>
      </div>

      <style>{`
        @media (max-width: 768px) {
          .animated-bg { flex-direction: column; }
          .animated-bg > :first-child { display: none; }
          .animated-bg > :last-child { padding: 2rem 1.5rem; }
        }
      `}</style>
    </div>
  );
}
