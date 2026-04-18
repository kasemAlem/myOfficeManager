'use client';
import { type ReactNode } from 'react';

type Accent = 'primary' | 'success' | 'warning' | 'danger' | 'info';

interface MetricCardProps {
  icon?: ReactNode;
  label: string;
  value: string;
  accent?: Accent;
  bordered?: boolean;
  onClick?: () => void;
}

const accentMap: Record<Accent, { color: string; bg: string }> = {
  primary: { color: 'var(--accent-primary)', bg: 'rgba(99,102,241,0.12)' },
  success: { color: 'var(--accent-success)', bg: 'rgba(16,185,129,0.12)' },
  warning: { color: 'var(--accent-warning)', bg: 'rgba(245,158,11,0.12)' },
  danger: { color: 'var(--accent-danger)', bg: 'rgba(248,113,113,0.12)' },
  info: { color: '#60a5fa', bg: 'rgba(59,130,246,0.1)' },
};

export function MetricCard({ icon, label, value, accent = 'primary', bordered, onClick }: MetricCardProps) {
  const a = accentMap[accent];
  return (
    <div
      onClick={onClick}
      style={{
        background: 'rgba(0,0,0,0.15)',
        borderRadius: '8px',
        padding: '1rem',
        border: bordered ? `2px solid ${a.color}` : '1px solid var(--border-color)',
        cursor: onClick ? 'pointer' : undefined,
        transition: 'all 0.15s ease',
      }}
    >
      <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
        {icon && <span style={{ display: 'flex' }}>{icon}</span>}
        {label}
      </p>
      <p style={{ margin: '0.25rem 0 0 0', fontSize: '1.2rem', fontWeight: 700, color: a.color }}>
        {value}
      </p>
    </div>
  );
}
