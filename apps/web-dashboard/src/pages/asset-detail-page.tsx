import { useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { AssetFilters } from '../components/asset/asset-filters';
import { AssetHistoryChart } from '../components/asset/asset-history-chart';
import { RecentTelemetryTable } from '../components/asset/recent-telemetry-table';
import { MetricCard } from '../components/ui/metric-card';
import { PageHeading } from '../components/ui/page-heading';
import { QueryState } from '../components/ui/query-state';
import { useAssetDetail } from '../hooks';
import { assetLabel } from '../lib/asset/asset-options';
import { buildAssetHistoryPoints } from '../lib/asset/chart-data';
import {
  assetFiltersToQuery,
  createDefaultAssetFilters,
  type AssetFiltersValue,
} from '../lib/asset/query';
import type { AssetDetailResponse } from '../lib/api';

export function AssetDetailPage() {
  const { assetId = 'asset-exc-101' } = useParams();
  const [filters, setFilters] = useState<AssetFiltersValue>(() =>
    createDefaultAssetFilters(),
  );
  const query = useMemo(() => assetFiltersToQuery(filters), [filters]);
  const assetDetail = useAssetDetail(assetId, query);

  return (
    <section className="space-y-6">
      <PageHeading
        eyebrow="Asset Detail"
        title={assetLabel(assetId)}
        description={assetId}
      />

      <AssetFilters
        assetId={assetId}
        value={filters}
        onChange={setFilters}
      />

      <QueryState<AssetDetailResponse>
        query={assetDetail}
        loadingLabel="Loading asset metrics…"
        emptyMessage="No asset metrics found."
      >
        {(response) => (
          <div className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
              <MetricCard
                label="CO₂"
                value={response.data.metrics.co2Kg.toFixed(1)}
                unit={response.meta.units.co2Kg}
              />
              <MetricCard
                label="Fuel"
                value={response.data.metrics.fuelLiters.toFixed(1)}
                unit={response.meta.units.fuelLiters}
              />
              <MetricCard
                label="Idle time"
                value={response.data.metrics.idleMinutes.toFixed(0)}
                unit={response.meta.units.idleMinutes}
              />
              <MetricCard
                label="Idle %"
                value={response.data.metrics.idlePct.toFixed(1)}
                unit={response.meta.units.idlePct}
              />
              <MetricCard
                label="Utilization"
                value={response.data.metrics.utilizationPct.toFixed(1)}
                unit={response.meta.units.utilizationPct}
              />
              <MetricCard
                label="Fuel efficiency"
                value={response.data.metrics.fuelEfficiencyLph.toFixed(2)}
                unit={response.meta.units.fuelEfficiencyLph}
              />
            </div>

            <AssetHistoryChart
              data={buildAssetHistoryPoints(response.data.recentTelemetry)}
            />

            <RecentTelemetryTable events={response.data.recentTelemetry} />
          </div>
        )}
      </QueryState>
    </section>
  );
}
