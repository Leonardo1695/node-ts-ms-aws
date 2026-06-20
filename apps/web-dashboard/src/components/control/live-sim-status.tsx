import { MetricCard } from '../ui/metric-card';
import { QueryState } from '../ui/query-state';
import { useSimStatus } from '../../hooks';
import type { SimStatusResponse } from '../../lib/api';

export function LiveSimStatus() {
  const simStatus = useSimStatus({ refetchInterval: 5000 });

  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-4">
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-slate-50">Live simulator status</h3>
        <p className="text-sm text-slate-400">
          Polls every 5 seconds. Events emitted is the live ingestion counter.
        </p>
      </div>

      <QueryState<SimStatusResponse>
        query={simStatus}
        loadingLabel="Loading simulator status…"
      >
        {(response) => (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <MetricCard
              label="Running"
              value={response.data.running ? 'Yes' : 'No'}
              unit=""
            />
            <MetricCard
              label="Fleet size"
              value={response.data.fleetSize.toString()}
              unit="assets"
            />
            <MetricCard
              label="Emit rate"
              value={response.data.emitRatePerSecond.toString()}
              unit="/s"
            />
            <MetricCard
              label="Events emitted"
              value={response.data.eventsEmitted.toLocaleString()}
              unit="events"
              emphasize
            />
          </div>
        )}
      </QueryState>
    </div>
  );
}
