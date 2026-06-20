import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { FleetFilters } from '../components/fleet/fleet-filters';
import { FleetTrendChart } from '../components/fleet/fleet-trend-chart';
import { MetricCard } from '../components/ui/metric-card';
import { PageHeading } from '../components/ui/page-heading';
import { QueryState } from '../components/ui/query-state';
import { useFleetMetrics } from '../hooks';
import { buildFleetTrendPoints } from '../lib/fleet/chart-data';
import {
  createDefaultFleetFilters,
  fleetFiltersToQuery,
  type FleetFiltersValue,
} from '../lib/fleet/query';
import type { FleetMetricsResponse } from '../lib/api';
import { assetOptions } from '../lib/asset/asset-options';

export function OverviewPage() {
  const [filters, setFilters] = useState<FleetFiltersValue>(() =>
    createDefaultFleetFilters(),
  );
  const query = useMemo(() => fleetFiltersToQuery(filters), [filters]);
  const fleetMetrics = useFleetMetrics(query);

  return (
    <section className="space-y-6">
      <PageHeading
        aurora
        eyebrow="Fleet Overview"
        title="Sustainability KPIs"
        description="Filter by site and period to refresh fleet CO₂, fuel, idle waste, and utilization metrics."
      />

      <FleetFilters value={filters} onChange={setFilters} />

      <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-4">
        <p className="text-sm font-medium text-slate-300">Asset drilldown</p>
        <div className="mt-3 flex flex-wrap gap-2">
          {assetOptions.map((asset) => (
            <Link
              key={asset.assetId}
              to={`/assets/${asset.assetId}`}
              className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-1.5 text-sm text-verdiron-accent transition hover:border-verdiron-accent/60 hover:text-slate-50"
            >
              {asset.label}
            </Link>
          ))}
        </div>
      </div>

      <QueryState<FleetMetricsResponse>
        query={fleetMetrics}
        loadingLabel="Loading fleet metrics…"
        emptyMessage="No fleet metrics returned for this range."
        isEmpty={(response) => response.data.buckets.length === 0}
      >
        {(response) => (
          <div className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              <MetricCard
                label="CO₂"
                value={response.data.totals.co2Kg.toFixed(1)}
                unit={response.meta.units.co2Kg}
              />
              <MetricCard
                label="Fuel"
                value={response.data.totals.fuelLiters.toFixed(1)}
                unit={response.meta.units.fuelLiters}
              />
              <MetricCard
                label="Idle waste"
                value={response.data.totals.idleMinutes.toFixed(0)}
                unit={response.meta.units.idleMinutes}
              />
              <MetricCard
                label="Utilization"
                value={response.data.totals.utilizationPct.toFixed(1)}
                unit={response.meta.units.utilizationPct}
              />
            </div>

            <FleetTrendChart
              data={buildFleetTrendPoints(response.data.buckets)}
            />
          </div>
        )}
      </QueryState>
    </section>
  );
}
