'use client';
import { type ReactNode } from 'react';
import { Sparkline } from './Sparkline';
import { AnimatedCounter } from './AnimatedCounter';

type Accent = 'primary' | 'success' | 'warning' | 'danger' | 'info';

interface KpiCardProps {
  icon: ReactNode;
  label: string;
  value: number;
  prefix?: string;
  suffix?: string;
  accent?: Accent;
  trend?: number;
  trendLabel?: string;
  sparklineData?: number[];
  onClick?: () => void;
  decimals?: number;
  formatter?: (value: number) => string;
}

const accentMap: Record<Accent, { color: string; bg: string; border: string; iconBg: string }> = {
  primary: { color: 'var(--accent-primary)', bg: 'rgba(16,185,129,0.04)', border: 'rgba(16,185,129,0.15)', iconBg: 'rgba(16,185,129,0.12)' },
  success: { color: 'var(--accent-success)', bg: 'rgba(52,211,153,0.04)', border: 'rgba(52,211,153,0.15)', iconBg: 'rgba(52,211,153,0.12)' },
  warning: { color: 'var(--accent-warning)', bg: 'rgba(251,191,36,0.04)', border: 'rgba(251,191,36,0.15)', iconBg: 'rgba(251,191,36,0.12)' },
  danger: { color: 'var(--accent-danger)', bg: 'rgba(248,113,113,0.04)', border: 'rgba(248,113,113,0.15)', iconBg: 'rgba(248,113,113,0.12)' },
  info: { color: 'var(--accent-info)', bg: 'rgba(56,189,248,0.04)', border: 'rgba(56,189,248,0.15)', iconBg: 'rgba(56,189,248,0.12)' },
};

export function KpiCard({ icon, label, value, prefix = '', suffix = '', accent = 'primary', trend, trendLabel, sparklineData, onClick, decimals = 0, formatter }: KpiCardProps) {
  const a = accentMap[accent];

  return (
    <div
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={onClick ? (e) => { if (e.key === 'Enter') onClick(); } : undefined}
      className="card-lift transition-standard"
      style={{
        background: a.bg,
        borderRadius: '16px',
        padding: '1.5rem',
        border: `1px solid ${a.border}`,
        borderLeft: `4px solid ${a.color}`,
        cursor: onClick ? 'pointer' : undefined,
        display: 'flex',
        flexDirection: 'column',
        gap: '0.75rem',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div style={{
          padding: '0.6rem',
          background: a.iconBg,
          borderRadius: '10px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: a.color,
        }}>
          {icon}
        </div>
        {sparklineData && sparklineData.length > 1 && (
          <Sparkline data={sparklineData} color={a.color} />
        )}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.15rem' }}>
        <span style={{
          fontSize: 'clamp(1.35rem, 3vw, 2rem)',
          fontWeight: 800,
          color: 'var(--text-primary)',
          letterSpacing: '-0.02em',
          fontFamily: 'var(--font-heading)',
        }}>
          {formatter ? (
            <AnimatedCounter value={value} formatter={formatter} />
          ) : (
            <AnimatedCounter value={value} prefix={prefix} suffix={suffix} decimals={decimals} />
          )}
        </span>
        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
          {label}
        </span>
      </div>

      {trend !== undefined && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginTop: '0.25rem' }}>
          <span style={{
            fontSize: '0.75rem',
            fontWeight: 700,
            color: trend >= 0 ? 'var(--accent-success)' : 'var(--accent-danger)',
            display: 'flex',
            alignItems: 'center',
            gap: '0.2rem',
          }}>
            {trend >= 0 ? '↑' : '↓'} {Math.abs(trend)}%
          </span>
          {trendLabel && (
            <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{trendLabel}</span>
          )}
        </div>
      )}
    </div>
  );
}
