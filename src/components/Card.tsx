'use client';

type CardVariant = 'glass' | 'surface' | 'elevated';
type CardPadding = 'sm' | 'md' | 'lg';

interface CardProps {
  variant?: CardVariant;
  padding?: CardPadding;
  hoverable?: boolean;
  onClick?: () => void;
  style?: React.CSSProperties;
  className?: string;
  children: React.ReactNode;
}

const variantStyles: Record<CardVariant, React.CSSProperties> = {
  glass: {
    background: 'var(--glass-bg)', backdropFilter: 'blur(20px) saturate(180%)',
    WebkitBackdropFilter: 'blur(20px) saturate(180%)',
    border: '1px solid var(--glass-border)', boxShadow: 'var(--glass-shadow)',
    borderRadius: 'var(--radius-lg)',
  },
  surface: {
    background: 'var(--bg-surface)', border: '1px solid var(--border-color)',
    borderRadius: 'var(--radius-md)',
  },
  elevated: {
    background: 'var(--bg-elevated)', border: '1px solid var(--border-color)',
    borderRadius: 'var(--radius-md)', boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
  },
};

const paddingStyles: Record<CardPadding, React.CSSProperties> = {
  sm: { padding: '1rem' },
  md: { padding: '1.5rem' },
  lg: { padding: '2rem' },
};

export function Card({ variant = 'glass', padding = 'md', hoverable, onClick, style, className, children }: CardProps) {
  return (
    <div
      className={`transition-standard ${hoverable ? 'card-lift' : ''} ${className || ''}`}
      onClick={onClick}
      style={{
        ...variantStyles[variant],
        ...paddingStyles[padding],
        cursor: onClick ? 'pointer' : undefined,
        ...style,
      } as React.CSSProperties}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={onClick ? (e) => { if (e.key === 'Enter') onClick(); } : undefined}
    >
      {children}
    </div>
  );
}
