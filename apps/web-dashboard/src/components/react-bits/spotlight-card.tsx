import type { MouseEvent, ReactNode } from 'react';
import { useRef, useState } from 'react';
import { usePrefersReducedMotion } from '../../hooks/use-prefers-reduced-motion';

interface SpotlightCardProps {
  children: ReactNode;
  className?: string;
}

export function SpotlightCard({ children, className = '' }: SpotlightCardProps) {
  const prefersReducedMotion = usePrefersReducedMotion();
  const containerRef = useRef<HTMLElement>(null);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [visible, setVisible] = useState(false);

  const handleMouseMove = (event: MouseEvent<HTMLElement>) => {
    if (prefersReducedMotion || !containerRef.current) {
      return;
    }

    const rect = containerRef.current.getBoundingClientRect();
    setPosition({
      x: event.clientX - rect.left,
      y: event.clientY - rect.top,
    });
    setVisible(true);
  };

  return (
    <article
      ref={containerRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={() => setVisible(false)}
      className={`relative overflow-hidden rounded-xl border border-slate-800 bg-slate-900/50 p-5 ${className}`}
    >
      {!prefersReducedMotion ? (
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 transition-opacity duration-300"
          style={{
            opacity: visible ? 1 : 0,
            background: `radial-gradient(220px circle at ${position.x}px ${position.y}px, rgba(31, 157, 85, 0.18), transparent 65%)`,
          }}
        />
      ) : null}
      <div className="relative z-10">{children}</div>
    </article>
  );
}
