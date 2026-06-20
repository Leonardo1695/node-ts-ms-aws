import { usePrefersReducedMotion } from '../../hooks/use-prefers-reduced-motion';

interface ShinyTextProps {
  text: string;
  className?: string;
}

export function ShinyText({ text, className = '' }: ShinyTextProps) {
  const prefersReducedMotion = usePrefersReducedMotion();

  if (prefersReducedMotion) {
    return <span className={`text-slate-50 ${className}`}>{text}</span>;
  }

  return (
    <span
      className={`relative inline-block animate-shiny-sweep ${className}`}
      style={{
        backgroundImage:
          'linear-gradient(120deg, #e2e8f0 35%, #ffffff 50%, #e2e8f0 65%)',
        backgroundSize: '200% auto',
        WebkitBackgroundClip: 'text',
        backgroundClip: 'text',
        color: 'transparent',
      }}
    >
      {text}
    </span>
  );
}
