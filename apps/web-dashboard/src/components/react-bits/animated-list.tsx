import type { ReactNode } from 'react';
import { usePrefersReducedMotion } from '../../hooks/use-prefers-reduced-motion';

interface AnimatedListItemProps {
  index: number;
  children: ReactNode;
  className?: string;
}

export function AnimatedListItem({
  index,
  children,
  className = '',
}: AnimatedListItemProps) {
  const prefersReducedMotion = usePrefersReducedMotion();

  return (
    <tr
      className={`${className} ${
        prefersReducedMotion ? '' : 'animate-fade-in-up opacity-0 [animation-fill-mode:forwards]'
      }`}
      style={
        prefersReducedMotion
          ? undefined
          : { animationDelay: `${Math.min(index * 70, 420)}ms` }
      }
    >
      {children}
    </tr>
  );
}
