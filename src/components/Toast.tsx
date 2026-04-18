'use client';

import { useState, useCallback, useEffect } from 'react';
import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

export interface ToastMessage {
  id: string;
  message: string;
  type: ToastType;
  duration?: number;
}

const ICONS: Record<ToastType, typeof CheckCircle> = {
  success: CheckCircle,
  error: AlertCircle,
  info: Info,
  warning: AlertTriangle,
};

const COLORS: Record<ToastType, string> = {
  success: 'var(--accent-success)',
  error: 'var(--accent-danger)',
  info: 'var(--accent-primary)',
  warning: 'var(--accent-warning)',
};

export function useToast() {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const showToast = useCallback((message: string, type: ToastType = 'info', duration = 4000) => {
    const id = crypto.randomUUID();
    setToasts(prev => [...prev, { id, message, type, duration }]);
  }, []);

  const dismissToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  return { toasts, showToast, dismissToast };
}

function ToastItem({ toast, onDismiss }: { toast: ToastMessage; onDismiss: (id: string) => void }) {
  const [isExiting, setIsExiting] = useState(false);
  const [touchX, setTouchX] = useState(0);
  const [translateX, setTranslateX] = useState(0);
  const [isSwiping, setIsSwiping] = useState(false);
  const Icon = ICONS[toast.type];

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsExiting(true);
      setTimeout(() => onDismiss(toast.id), 300);
    }, toast.duration || 4000);
    return () => clearTimeout(timer);
  }, [toast.id, toast.duration, onDismiss]);

  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchX(e.touches[0].clientX);
    setIsSwiping(true);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isSwiping) return;
    const diff = e.touches[0].clientX - touchX;
    if (diff > 0) setTranslateX(diff);
  };

  const handleTouchEnd = () => {
    if (translateX > 80) {
      setIsExiting(true);
      setTimeout(() => onDismiss(toast.id), 300);
    }
    setTranslateX(0);
    setIsSwiping(false);
  };

  return (
    <div
      role="alert"
      aria-live="polite"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '0.75rem',
        padding: '0.875rem 1rem',
        borderRadius: '12px',
        background: 'var(--bg-surface)',
        border: `1px solid ${COLORS[toast.type]}33`,
        boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
        backdropFilter: 'blur(16px)',
        color: 'var(--text-primary)',
        fontSize: '0.9rem',
        minWidth: '300px',
        width: 'calc(100vw - 3rem)',
        maxWidth: '480px',
        transform: translateX > 0 ? `translateX(${translateX}px)` : undefined,
        opacity: isSwiping && translateX > 0 ? 1 - translateX / 400 : undefined,
        transition: isSwiping ? 'none' : undefined,
        animation: isExiting ? 'toast-exit 0.3s ease forwards' : (!isSwiping && !translateX ? 'toast-enter 0.3s ease forwards' : undefined),
        touchAction: isSwiping ? 'none' : undefined,
        cursor: 'default',
      }}
    >
      <Icon size={20} style={{ color: COLORS[toast.type], flexShrink: 0 }} />
      <span style={{ flex: 1 }}>{toast.message}</span>
      <button
        onClick={() => {
          setIsExiting(true);
          setTimeout(() => onDismiss(toast.id), 300);
        }}
        aria-label="Dismiss notification"
        style={{
          background: 'none',
          border: 'none',
          color: 'var(--text-muted)',
          cursor: 'pointer',
          padding: '8px',
          borderRadius: '4px',
          display: 'flex',
          flexShrink: 0,
          minHeight: '36px',
          minWidth: '36px',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <X size={16} />
      </button>
    </div>
  );
}

export function ToastContainer({ toasts, onDismiss }: { toasts: ToastMessage[]; onDismiss: (id: string) => void }) {
  if (toasts.length === 0) return null;

  return (
    <div
      aria-label="Notifications"
      style={{
        position: 'fixed',
        bottom: '1.5rem',
        right: '1.5rem',
        zIndex: 9999,
        display: 'flex',
        flexDirection: 'column',
        gap: '0.5rem',
      }}
    >
      {toasts.map(toast => (
        <ToastItem key={toast.id} toast={toast} onDismiss={onDismiss} />
      ))}
    </div>
  );
}
