'use client';

interface SpinnerProps {
  size?: number;
  color?: string;
  label?: string;
}

export function Spinner({ size = 20, color = 'var(--accent-primary)', label = 'Loading' }: SpinnerProps) {
  return (
    <span role="status" aria-label={label} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        className="spinner-animation"
      >
        <circle cx="12" cy="12" r="10" stroke={color} strokeWidth="3" strokeOpacity="0.2" />
        <path
          d="M12 2a10 10 0 0 1 10 10"
          stroke={color}
          strokeWidth="3"
          strokeLinecap="round"
        />
      </svg>
      <span className="sr-only">{label}</span>
    </span>
  );
}
