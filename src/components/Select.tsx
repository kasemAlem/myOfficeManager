'use client';

interface SelectOption {
  value: string;
  label: string;
}

interface SelectProps extends Omit<React.SelectHTMLAttributes<HTMLSelectElement>, 'children'> {
  label?: string;
  options: SelectOption[];
  placeholder?: string;
  error?: string;
}

export function Select({ label, options, placeholder, error, style, id, value, ...props }: SelectProps) {
  const selectId = id || `select-${label?.toLowerCase().replace(/\s+/g, '-')}`;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
      {label && (
        <label htmlFor={selectId} style={{ fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--text-secondary)' }}>
          {label}
        </label>
      )}
      <select
        id={selectId}
        value={value}
        style={{
          padding: '0.75rem 1rem', borderRadius: '10px',
          background: 'var(--input-bg)', border: `1px solid ${error ? 'var(--accent-danger)' : 'var(--input-border)'}`,
          color: 'var(--custom-input-color, var(--text-primary))',
          width: '100%', boxSizing: 'border-box', fontSize: '0.9rem',
          outline: 'none', cursor: 'pointer',
          ...style,
        } as React.CSSProperties}
        {...props}
      >
        {placeholder && <option value="" disabled style={{ background: 'var(--bg-surface)', color: 'var(--text-muted)' }}>{placeholder}</option>}
        {options.map(opt => (
          <option key={opt.value} value={opt.value} style={{ background: 'var(--bg-surface)', color: 'var(--text-primary)' }}>
            {opt.label}
          </option>
        ))}
      </select>
      {error && <span role="alert" style={{ fontSize: '0.8rem', color: 'var(--accent-danger)', fontWeight: 500 }}>{error}</span>}
    </div>
  );
}
