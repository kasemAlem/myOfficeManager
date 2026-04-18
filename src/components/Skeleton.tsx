'use client';

interface SkeletonProps {
  variant?: 'text' | 'card' | 'row' | 'page' | 'circle';
  width?: string;
  height?: string;
  count?: number;
}

function SkeletonPulse({ width = '100%', height = '1rem', borderRadius = '6px' }: { width?: string; height?: string; borderRadius?: string }) {
  return (
    <div
      aria-hidden="true"
      style={{
        width,
        height,
        borderRadius,
        background: 'linear-gradient(90deg, var(--bg-surface-hover) 25%, var(--border-color) 50%, var(--bg-surface-hover) 75%)',
        backgroundSize: '200% 100%',
        animation: 'skeleton-shimmer 1.5s ease-in-out infinite',
      }}
    />
  );
}

export function Skeleton({ variant = 'text', width, height, count = 1 }: SkeletonProps) {
  if (variant === 'circle') {
    return <SkeletonPulse width={width || '40px'} height={height || '40px'} borderRadius="50%" />;
  }

  if (variant === 'card') {
    return (
      <div role="status" aria-label="Loading" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {Array.from({ length: count }).map((_, i) => (
          <div key={i} className="glass-panel" style={{ padding: '1.5rem' }}>
            <SkeletonPulse width="40%" height="1.25rem" />
            <div style={{ height: '0.75rem' }} />
            <SkeletonPulse width="70%" height="0.875rem" />
            <div style={{ height: '0.5rem' }} />
            <SkeletonPulse width="55%" height="0.875rem" />
          </div>
        ))}
        <span className="sr-only">Loading content...</span>
      </div>
    );
  }

  if (variant === 'row') {
    return (
      <div role="status" aria-label="Loading" style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        {Array.from({ length: count }).map((_, i) => (
          <div key={i} style={{ display: 'flex', gap: '1rem', alignItems: 'center', padding: '0.75rem', borderRadius: '8px', background: 'var(--bg-surface)' }}>
            <SkeletonPulse width="32px" height="32px" borderRadius="50%" />
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <SkeletonPulse width="50%" height="0.875rem" />
              <SkeletonPulse width="30%" height="0.75rem" />
            </div>
            <SkeletonPulse width="80px" height="2rem" borderRadius="8px" />
          </div>
        ))}
        <span className="sr-only">Loading content...</span>
      </div>
    );
  }

  if (variant === 'page') {
    return (
      <div role="status" aria-label="Loading page" style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <SkeletonPulse width="200px" height="1.5rem" />
            <SkeletonPulse width="300px" height="0.875rem" />
          </div>
          <SkeletonPulse width="120px" height="2.5rem" borderRadius="10px" />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem' }}>
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="glass-panel" style={{ padding: '1.25rem' }}>
              <SkeletonPulse width="60%" height="1rem" />
              <div style={{ height: '0.75rem' }} />
              <SkeletonPulse width="80%" height="0.75rem" />
              <div style={{ height: '0.5rem' }} />
              <SkeletonPulse width="40%" height="0.75rem" />
              <div style={{ height: '1rem' }} />
              <SkeletonPulse height="6px" borderRadius="3px" />
            </div>
          ))}
        </div>
        <span className="sr-only">Loading page content...</span>
      </div>
    );
  }

  return (
    <div role="status" aria-label="Loading" style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonPulse key={i} width={width} height={height} />
      ))}
      <span className="sr-only">Loading content...</span>
    </div>
  );
}
