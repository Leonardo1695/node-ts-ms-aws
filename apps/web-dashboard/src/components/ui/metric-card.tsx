import { CountUp, parseMetricNumber } from '../react-bits/count-up';
import { SpotlightCard } from '../react-bits/spotlight-card';

interface MetricCardProps {
  label: string;
  value: string;
  unit: string;
  emphasize?: boolean;
}

export function MetricCard({
  label,
  value,
  unit,
  emphasize = false,
}: MetricCardProps) {
  const numeric = parseMetricNumber(value);

  return (
    <SpotlightCard
      className={
        emphasize
          ? 'border-verdiron-primary/40 shadow-[0_0_24px_rgba(31,157,85,0.12)]'
          : ''
      }
    >
      <p className="text-sm text-slate-400">{label}</p>
      <p className="mt-2 text-2xl font-semibold tabular-nums text-slate-50">
        {numeric ? <CountUp value={value} /> : value}
        {unit ? (
          <span className="ml-2 text-sm font-normal text-slate-400">{unit}</span>
        ) : null}
      </p>
    </SpotlightCard>
  );
}
