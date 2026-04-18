'use client';

import { AlertCircle, RefreshCw } from 'lucide-react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div style={{ display: 'flex', minHeight: '100vh', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-base)' }}>
      <div style={{ textAlign: 'center', maxWidth: '400px', padding: '2rem' }}>
        <div style={{
          width: '64px', height: '64px', borderRadius: '16px',
          background: 'rgba(248, 113, 113, 0.1)', display: 'flex',
          alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.25rem',
        }}>
          <AlertCircle size={28} style={{ color: 'var(--accent-danger)' }} />
        </div>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.5rem' }}>Something went wrong</h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginBottom: '1.5rem', lineHeight: 1.6 }}>
          An unexpected error occurred. Please try again or contact support if the issue persists.
        </p>
        <button
          onClick={reset}
          style={{
            display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
            padding: '0.75rem 1.5rem', borderRadius: '10px', border: 'none',
            background: 'var(--accent-primary)', color: 'white', fontWeight: 600,
            cursor: 'pointer', fontSize: '0.9rem',
          }}
        >
          <RefreshCw size={16} /> Try Again
        </button>
      </div>
    </div>
  );
}
