import { usePrefersReducedMotion } from '../../hooks/use-prefers-reduced-motion';

interface AuroraProps {
  className?: string;
}

export function Aurora({ className = '' }: AuroraProps) {
  const prefersReducedMotion = usePrefersReducedMotion();

  if (prefersReducedMotion) {
    return (
      <div
        aria-hidden
        className={`pointer-events-none absolute inset-0 bg-gradient-to-br from-verdiron-primary/10 via-transparent to-verdiron-accent/10 ${className}`}
      />
    );
  }

  return (
    <div
      aria-hidden
      className={`pointer-events-none absolute inset-0 overflow-hidden ${className}`}
    >
      <div className="absolute -left-1/4 top-0 h-56 w-56 rounded-full bg-verdiron-primary/20 blur-3xl animate-aurora-drift" />
      <div className="absolute right-0 top-1/4 h-48 w-48 rounded-full bg-emerald-400/10 blur-3xl animate-aurora-drift-reverse" />
      <div className="absolute bottom-0 left-1/3 h-40 w-40 rounded-full bg-verdiron-accent/10 blur-3xl animate-aurora-drift" />
    </div>
  );
}
