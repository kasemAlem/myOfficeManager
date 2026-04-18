'use client';
import { forwardRef, type ReactNode } from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  leftIcon?: ReactNode;
}

const baseStyle: React.CSSProperties = {
  padding: '0.75rem 1rem', borderRadius: '10px',
  background: 'var(--input-bg)', border: '1px solid var(--input-border)',
  color: 'var(--custom-input-color, var(--text-primary))',
  width: '100%', boxSizing: 'border-box', fontSize: '0.9rem',
  outline: 'none', transition: 'border-color 0.2s ease, box-shadow 0.2s ease',
};

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, helperText, leftIcon, style, id, ...props }, ref) => {
    const inputId = id || `input-${label?.toLowerCase().replace(/\s+/g, '-')}`;
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
        {label && (
          <label htmlFor={inputId} style={{ fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--text-secondary)' }}>
            {label}
          </label>
        )}
        <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
          {leftIcon && (
            <span style={{ position: 'absolute', left: '1rem', color: 'var(--text-muted)', display: 'flex' }}>{leftIcon}</span>
          )}
          <input
            id={inputId}
            ref={ref}
            style={{
              ...baseStyle,
              paddingLeft: leftIcon ? '2.75rem' : '1rem',
              borderColor: error ? 'var(--accent-danger)' : 'var(--input-border)',
              ...style,
            } as React.CSSProperties}
            aria-invalid={!!error}
            aria-describedby={error ? `${inputId}-error` : undefined}
            {...props}
          />
        </div>
        {error && <span id={`${inputId}-error`} role="alert" style={{ fontSize: '0.8rem', color: 'var(--accent-danger)', fontWeight: 500 }}>{error}</span>}
        {helperText && !error && <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{helperText}</span>}
      </div>
    );
  }
);
Input.displayName = 'Input';
