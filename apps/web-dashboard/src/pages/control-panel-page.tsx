import { EtlControls } from '../components/control/etl-controls';
import { HealthIndicators } from '../components/control/health-indicators';
import { LiveSimStatus } from '../components/control/live-sim-status';
import { SimControls } from '../components/control/sim-controls';
import { PageHeading } from '../components/ui/page-heading';

export function ControlPanelPage() {
  return (
    <section className="space-y-6">
      <PageHeading
        eyebrow="Control Panel"
        title="Demo controls"
        description="Run the full Verdiron demo from the browser — start telemetry, trigger ETL, and watch live ingestion without terminal access."
      />

      <HealthIndicators />

      <div className="grid gap-6 xl:grid-cols-2">
        <SimControls />
        <EtlControls />
      </div>

      <LiveSimStatus />
    </section>
  );
}
