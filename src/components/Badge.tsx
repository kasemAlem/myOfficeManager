'use client';

type BadgeVariant = 'default' | 'success' | 'warning' | 'danger' | 'info';

interface BadgeProps {
  variant?: BadgeVariant;
  size?: 'sm' | 'md';
  icon?: React.ReactNode;
  pulse?: boolean;
  children: React.ReactNode;
}

const variantMap: Record<BadgeVariant, { bg: string; color: string }> = {
  default: { bg: 'rgba(255,255,255,0.05)', color: 'var(--text-muted)' },
  success: { bg: 'rgba(16, 185, 129, 0.15)', color: 'var(--accent-success)' },
  warning: { bg: 'rgba(245, 158, 11, 0.15)', color: 'var(--accent-warning)' },
  danger: { bg: 'rgba(248, 113, 113, 0.15)', color: 'var(--accent-danger)' },
  info: { bg: 'rgba(59, 130, 246, 0.15)', color: 'var(--accent-info)' },
};

const labelMap: Record<BadgeVariant, string> = {
  default: 'Neutral status',
  success: 'Success status',
  warning: 'Warning status',
  danger: 'Critical status',
  info: 'Information status',
};

export function Badge({ variant = 'default', size = 'sm', icon, pulse, children }: BadgeProps) {
  const v = variantMap[variant];
  return (
    <span role="status" aria-label={labelMap[variant]} className={pulse ? 'badge-pulse' : undefined} style={{
      display: 'inline-flex', alignItems: 'center', gap: '0.3rem',
      padding: size === 'sm' ? '0.3rem 0.6rem' : '0.4rem 0.8rem',
      borderRadius: '8px', fontSize: size === 'sm' ? '0.7rem' : '0.8rem',
      fontWeight: 800, letterSpacing: '0.05em', textTransform: 'uppercase',
      background: v.bg, color: v.color, border: `1px solid ${v.color}33`,
      '--pulse-color': `${v.color}66`,
      whiteSpace: 'nowrap',
    } as React.CSSProperties}>
      {icon}
      {children}
    </span>
  );
}
