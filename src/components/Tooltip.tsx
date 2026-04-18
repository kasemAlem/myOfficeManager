'use client';
import { useState, useRef, type ReactNode } from 'react';

interface TooltipProps {
  content: string;
  children: ReactNode;
  position?: 'top' | 'bottom' | 'left' | 'right';
  delay?: number;
}

export function Tooltip({ content, children, position = 'top', delay = 300 }: TooltipProps) {
  const [visible, setVisible] = useState(false);
  const timeout = useRef<ReturnType<typeof setTimeout>>(undefined);

  const show = () => {
    clearTimeout(timeout.current);
    timeout.current = setTimeout(() => setVisible(true), delay);
  };

  const hide = () => {
    clearTimeout(timeout.current);
    setVisible(false);
  };

  return (
    <div
      style={{ position: 'relative', display: 'inline-flex' }}
      onMouseEnter={show}
      onMouseLeave={hide}
      onFocus={show}
      onBlur={hide}
    >
      {children}
      {visible && (
        <div
          role="tooltip"
          className="fade-in"
          style={{
            position: 'absolute',
            zIndex: 1000,
            pointerEvents: 'none',
            ...(position === 'top' ? { bottom: 'calc(100% + 6px)', left: '50%', transform: 'translateX(-50%)' } : {}),
            ...(position === 'bottom' ? { top: 'calc(100% + 6px)', left: '50%', transform: 'translateX(-50%)' } : {}),
            ...(position === 'left' ? { right: 'calc(100% + 6px)', top: '50%', transform: 'translateY(-50%)' } : {}),
            ...(position === 'right' ? { left: 'calc(100% + 6px)', top: '50%', transform: 'translateY(-50%)' } : {}),
            background: 'var(--bg-elevated)',
            color: 'var(--text-primary)',
            padding: '0.4rem 0.7rem',
            borderRadius: '6px',
            fontSize: '0.75rem',
            fontWeight: 500,
            whiteSpace: 'nowrap',
            border: '1px solid var(--border-color)',
            boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
          }}
        >
          {content}
        </div>
      )}
    </div>
  );
}
