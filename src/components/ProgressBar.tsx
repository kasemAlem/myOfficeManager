'use client';

interface ProgressBarProps {
  value: number;
  height?: number;
  color?: string;
  bgColor?: string;
}

export function ProgressBar({ value, height = 6, color = 'var(--accent-success)', bgColor = 'rgba(255,255,255,0.08)' }: ProgressBarProps) {
  const pct = Math.min(Math.max(value, 0), 100);
  return (
    <div style={{ height: `${height}px`, background: bgColor, borderRadius: `${height / 2}px`, overflow: 'hidden' }}>
      <div style={{ height: '100%', width: `${pct}%`, background: color, borderRadius: `${height / 2}px`, transition: 'width 0.3s ease' }} />
    </div>
  );
}
