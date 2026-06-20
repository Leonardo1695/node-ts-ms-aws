import { useMemo, useState } from 'react';
import { IdlingFilters } from '../components/idling/idling-filters';
import { IdlingOffendersTable } from '../components/idling/idling-offenders-table';
import { MetricCard } from '../components/ui/metric-card';
import { PageHeading } from '../components/ui/page-heading';
import { QueryState } from '../components/ui/query-state';
import { useIdlingReport } from '../hooks';
import {
  createDefaultIdlingFilters,
  idlingFiltersToQuery,
  type IdlingFiltersValue,
} from '../lib/idling/query';
import { summarizeIdlingReport } from '../lib/idling/summary';
import type { IdlingReportResponse } from '../lib/api';

export function IdlingReportPage() {
  const [filters, setFilters] = useState<IdlingFiltersValue>(() =>
    createDefaultIdlingFilters(),
  );
  const query = useMemo(() => idlingFiltersToQuery(filters), [filters]);
  const idlingReport = useIdlingReport(query);

  return (
    <section className="space-y-6">
      <PageHeading
        eyebrow="Idling Report"
        title="Idling & waste"
        description="Ranked idle offenders with estimated fuel waste cost and CO₂ impact."
      />

      <IdlingFilters value={filters} onChange={setFilters} />

      <QueryState<IdlingReportResponse>
        query={idlingReport}
        loadingLabel="Loading idling report…"
        emptyMessage="No idle offenders in this range."
        isEmpty={(response) => response.data.entries.length === 0}
      >
        {(response) => {
          const summary = summarizeIdlingReport(response.data.entries);

          return (
            <div className="space-y-6">
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
                <MetricCard
                  label="Offenders"
                  value={summary.offenderCount.toString()}
                  unit="assets"
                />
                <MetricCard
                  label="Idle time"
                  value={summary.totalIdleMinutes.toFixed(0)}
                  unit={response.meta.units.idleMinutes}
                />
                <MetricCard
                  label="Idle fuel waste"
                  value={summary.totalIdleFuelLiters.toFixed(1)}
                  unit={response.meta.units.idleFuelLiters}
                />
                <MetricCard
                  label="Est. fuel cost"
                  value={summary.totalIdleFuelCostUsd.toFixed(2)}
                  unit="USD"
                />
                <MetricCard
                  label="Idle CO₂"
                  value={summary.totalIdleCo2Kg.toFixed(1)}
                  unit={response.meta.units.idleCo2Kg}
                />
              </div>

              <IdlingOffendersTable
                entries={response.data.entries}
                units={response.meta.units}
              />
            </div>
          );
        }}
      </QueryState>
    </section>
  );
}
