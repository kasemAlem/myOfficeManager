import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export default function NotFound() {
  return (
    <div style={{ display: 'flex', minHeight: '100vh', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-base)' }}>
      <div style={{ textAlign: 'center', maxWidth: '400px', padding: '2rem' }}>
        <h1 style={{ fontSize: '4rem', fontWeight: 800, color: 'var(--accent-primary)', margin: 0, letterSpacing: '-0.03em' }}>404</h1>
        <p style={{ color: 'var(--text-secondary)', margin: '1rem 0 2rem', fontSize: '1rem', lineHeight: 1.6 }}>
          This page doesn&apos;t exist or has been moved.
        </p>
        <Link href="/dashboard" style={{
          display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
          padding: '0.75rem 1.5rem', borderRadius: '10px',
          background: 'var(--accent-primary)', color: 'white', fontWeight: 600,
          fontSize: '0.9rem', textDecoration: 'none',
        }}>
          <ArrowLeft size={16} /> Back to Dashboard
        </Link>
      </div>
    </div>
  );
}
