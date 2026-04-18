'use client';
import { useEffect, useState } from 'react';

interface Particle {
  id: number;
  x: number;
  y: number;
  color: string;
  size: number;
  rotation: number;
  shape: 'square' | 'circle';
  fallDuration: number;
  delay: number;
}

interface ConfettiProps {
  active: boolean;
  count?: number;
}

const COLORS = ['#10b981', '#34d399', '#3b82f6', '#fbbf24', '#f472b6', '#a78bfa', '#f87171', '#38bdf8'];

export function Confetti({ active, count = 40 }: ConfettiProps) {
  const [particles, setParticles] = useState<Particle[]>([]);

  useEffect(() => {
    if (!active) {
      setParticles([]);
      return;
    }

    const newParticles: Particle[] = Array.from({ length: count }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: -10 - Math.random() * 20,
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
      size: 4 + Math.random() * 6,
      rotation: Math.random() * 360,
      shape: Math.random() > 0.5 ? 'square' : 'circle',
      fallDuration: 2 + Math.random() * 2,
      delay: Math.random() * 0.5,
    }));

    setParticles(newParticles);

    const timer = setTimeout(() => setParticles([]), 4000);
    return () => clearTimeout(timer);
  }, [active, count]);

  if (particles.length === 0) return null;

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      pointerEvents: 'none',
      zIndex: 9999,
      overflow: 'hidden',
    }} aria-hidden="true">
      {particles.map((p) => (
        <div
          key={p.id}
          style={{
            position: 'absolute',
            left: `${p.x}%`,
            top: `${p.y}%`,
            width: `${p.size}px`,
            height: p.shape === 'circle' ? `${p.size}px` : `${p.size * 0.6}px`,
            borderRadius: p.shape === 'circle' ? '50%' : '2px',
            background: p.color,
            transform: `rotate(${p.rotation}deg)`,
            animation: `confetti-fall ${p.fallDuration}s ease-in forwards`,
            animationDelay: `${p.delay}s`,
            opacity: 1,
          }}
        />
      ))}
    </div>
  );
}
