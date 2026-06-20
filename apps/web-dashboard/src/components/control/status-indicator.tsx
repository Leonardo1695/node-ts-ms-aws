import type { DependencyStatus } from '../../lib/api';

interface StatusIndicatorProps {
  label: string;
  status: DependencyStatus;
}

export function StatusIndicator({ label, status }: StatusIndicatorProps) {
  const isOk = status === 'ok';

  return (
    <div className="flex items-center gap-3 rounded-lg border border-slate-800 bg-slate-950/60 px-4 py-3">
      <span
        aria-hidden
        className={`h-2.5 w-2.5 rounded-full ${
          isOk ? 'bg-verdiron-accent' : 'bg-red-500'
        }`}
      />
      <div>
        <p className="text-sm font-medium text-slate-100">{label}</p>
        <p className="text-xs uppercase tracking-wide text-slate-400">
          {isOk ? 'Connected' : 'Unavailable'}
        </p>
      </div>
    </div>
  );
}
