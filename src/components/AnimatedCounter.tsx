'use client';
import { useEffect, useState, useRef } from 'react';

interface AnimatedCounterProps {
  value: number;
  duration?: number;
  prefix?: string;
  suffix?: string;
  decimals?: number;
  formatter?: (value: number) => string;
}

export function AnimatedCounter({ value, duration = 800, prefix = '', suffix = '', decimals = 0, formatter }: AnimatedCounterProps) {
  const [display, setDisplay] = useState(0);
  const startTime = useRef<number | null>(null);
  const raf = useRef<number | null>(null);
  const fromRef = useRef(0);

  useEffect(() => {
    fromRef.current = display;
    startTime.current = null;

    function step(timestamp: number) {
      if (!startTime.current) startTime.current = timestamp;
      const elapsed = timestamp - startTime.current;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(fromRef.current + (value - fromRef.current) * eased);
      if (progress < 1) {
        raf.current = requestAnimationFrame(step);
      }
    }

    raf.current = requestAnimationFrame(step);
    return () => { if (raf.current) cancelAnimationFrame(raf.current); };
  }, [value, duration]);

  if (formatter) {
    return <>{formatter(display)}</>;
  }

  return <>{prefix}{display.toFixed(decimals)}{suffix}</>;
}
