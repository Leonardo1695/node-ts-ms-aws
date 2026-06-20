import type { ReactNode } from 'react';
import { usePrefersReducedMotion } from '../../hooks/use-prefers-reduced-motion';

interface GradientTextProps {
  children: ReactNode;
  className?: string;
}

export function GradientText({ children, className = '' }: GradientTextProps) {
  const prefersReducedMotion = usePrefersReducedMotion();

  return (
    <span
      className={`bg-[length:200%_auto] bg-gradient-to-r from-verdiron-primary via-emerald-300 to-verdiron-accent bg-clip-text text-transparent ${
        prefersReducedMotion ? '' : 'animate-gradient-shift'
      } ${className}`}
    >
      {children}
    </span>
  );
}
