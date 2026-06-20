import { QueryState } from '../ui/query-state';
import { useReadiness } from '../../hooks';
import type { ReadinessResult } from '../../lib/api';
import { StatusIndicator } from './status-indicator';

export function HealthIndicators() {
  const readiness = useReadiness({ refetchInterval: 15000 });

  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-4">
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-slate-50">Platform health</h3>
        <p className="text-sm text-slate-400">
          Readiness checks from the API service every 15 seconds.
        </p>
      </div>

      <QueryState<ReadinessResult>
        query={readiness}
        loadingLabel="Checking dependencies…"
      >
        {(response) => (
          <div className="grid gap-3 md:grid-cols-3">
            <StatusIndicator
              label="PostgreSQL"
              status={response.checks.postgres}
            />
            <StatusIndicator
              label="RabbitMQ"
              status={response.checks.rabbitmq}
            />
            <StatusIndicator
              label="DynamoDB"
              status={response.checks.dynamodb}
            />
          </div>
        )}
      </QueryState>
    </div>
  );
}
