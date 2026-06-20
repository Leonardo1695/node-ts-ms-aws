import { useEffect, useRef, useState } from 'react';
import { usePrefersReducedMotion } from '../../hooks/use-prefers-reduced-motion';

export function parseMetricNumber(
  value: string,
): { number: number; decimals: number } | null {
  const cleaned = value.replace(/,/g, '');

  if (!/^-?\d+(\.\d+)?$/.test(cleaned)) {
    return null;
  }

  const number = Number(cleaned);
  const decimals = cleaned.includes('.') ? cleaned.split('.')[1]!.length : 0;

  return { number, decimals };
}

interface CountUpProps {
  value: string;
  durationMs?: number;
  className?: string;
}

export function CountUp({
  value,
  durationMs = 900,
  className = '',
}: CountUpProps) {
  const prefersReducedMotion = usePrefersReducedMotion();
  const parsed = parseMetricNumber(value);
  const [displayValue, setDisplayValue] = useState(value);
  const frameRef = useRef<number | undefined>(undefined);

  useEffect(() => {
    if (!parsed || prefersReducedMotion) {
      setDisplayValue(value);
      return;
    }

    const startValue = 0;
    const targetValue = parsed.number;
    const startTime = performance.now();

    const tick = (now: number) => {
      const progress = Math.min((now - startTime) / durationMs, 1);
      const eased = 1 - (1 - progress) ** 3;
      const current = startValue + (targetValue - startValue) * eased;

      setDisplayValue(current.toFixed(parsed.decimals));

      if (progress < 1) {
        frameRef.current = requestAnimationFrame(tick);
      }
    };

    frameRef.current = requestAnimationFrame(tick);

    return () => {
      if (frameRef.current !== undefined) {
        cancelAnimationFrame(frameRef.current);
      }
    };
  }, [durationMs, parsed, prefersReducedMotion, value]);

  return <span className={className}>{displayValue}</span>;
}
