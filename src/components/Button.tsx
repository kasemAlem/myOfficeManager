'use client';
import { forwardRef } from 'react';
import { Spinner } from './Spinner';

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';
type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  icon?: React.ReactNode;
}

const variantStyles: Record<ButtonVariant, React.CSSProperties> = {
  primary: {
    background: 'var(--accent-primary)',
    color: 'white',
    border: 'none',
    boxShadow: '0 4px 14px 0 color-mix(in srgb, var(--accent-primary) 30%, transparent)',
  },
  secondary: {
    background: 'transparent',
    color: 'var(--text-primary)',
    border: '1px solid var(--border-color)',
  },
  ghost: {
    background: 'transparent',
    color: 'var(--text-secondary)',
    border: '1px solid transparent',
  },
  danger: {
    background: 'var(--accent-danger)1A',
    color: 'var(--accent-danger)',
    border: '1px solid var(--accent-danger)33',
  },
};

const sizeStyles: Record<ButtonSize, React.CSSProperties> = {
  sm: { padding: '0.4rem 0.9rem', fontSize: '0.82rem', borderRadius: 'var(--radius-sm)' },
  md: { padding: '0.75rem 1.25rem', fontSize: '0.9rem', borderRadius: 'var(--radius-md)' },
  lg: { padding: '1rem 2rem', fontSize: '1rem', borderRadius: 'var(--radius-lg)' },
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'primary', size = 'md', loading = false, icon, children, disabled, style, ...props }, ref) => {
    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className="btn-press btn-ripple transition-standard"
        style={{
          display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
          gap: '0.5rem', fontWeight: 600, cursor: (disabled || loading) ? 'not-allowed' : 'pointer',
          opacity: (disabled || loading) ? 0.7 : 1,
          ...variantStyles[variant],
          ...sizeStyles[size],
          ...style,
        } as React.CSSProperties}
        {...props}
      >
        {loading && <Spinner size={16} color={variant === 'primary' ? 'white' : 'var(--accent-primary)'} />}
        {!loading && icon}
        {children}
      </button>
    );
  }
);
Button.displayName = 'Button';
