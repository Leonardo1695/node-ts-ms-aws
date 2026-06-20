import type { TelemetryEvent } from '@verdiron/domain';

interface RecentTelemetryTableProps {
  events: TelemetryEvent[];
}

export function RecentTelemetryTable({ events }: RecentTelemetryTableProps) {
  return (
    <div className="overflow-hidden rounded-xl border border-slate-800 bg-slate-900/50">
      <div className="border-b border-slate-800 px-5 py-4">
        <h3 className="text-lg font-semibold text-slate-50">Recent telemetry</h3>
        <p className="text-sm text-slate-400">
          Latest events from the DynamoDB hot store.
        </p>
      </div>

      {events.length === 0 ? (
        <p className="px-5 py-4 text-sm text-slate-400">
          No recent telemetry events returned.
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-slate-950/60 text-slate-400">
              <tr>
                <th className="px-4 py-3 font-medium">Time</th>
                <th className="px-4 py-3 font-medium">Engine</th>
                <th className="px-4 py-3 font-medium">RPM</th>
                <th className="px-4 py-3 font-medium">Speed</th>
                <th className="px-4 py-3 font-medium">Fuel rate</th>
                <th className="px-4 py-3 font-medium">Fuel level</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 text-slate-100">
              {events.map((event) => (
                <tr key={event.eventId}>
                  <td className="px-4 py-3 tabular-nums">
                    {new Date(event.ts).toLocaleString()}
                  </td>
                  <td className="px-4 py-3">
                    {event.engineOn ? 'On' : 'Off'}
                  </td>
                  <td className="px-4 py-3 tabular-nums">{event.rpm.toFixed(0)}</td>
                  <td className="px-4 py-3 tabular-nums">
                    {event.speedKph.toFixed(1)} km/h
                  </td>
                  <td className="px-4 py-3 tabular-nums">
                    {event.fuelRateLph.toFixed(2)} L/h
                  </td>
                  <td className="px-4 py-3 tabular-nums">
                    {event.fuelLevelPct.toFixed(1)}%
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
