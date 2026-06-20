import { Link } from 'react-router-dom';
import { AnimatedListItem } from '../react-bits/animated-list';
import type { IdlingReportEntry, IdlingReportUnits } from '@verdiron/domain';
import { estimateIdleFuelCostUsd } from '../../lib/idling/summary';
import { siteLabel } from '../../lib/idling/site-label';

interface IdlingOffendersTableProps {
  entries: IdlingReportEntry[];
  units: IdlingReportUnits;
}

export function IdlingOffendersTable({
  entries,
  units,
}: IdlingOffendersTableProps) {
  return (
    <div className="overflow-hidden rounded-xl border border-slate-800 bg-slate-900/50">
      <div className="border-b border-slate-800 px-5 py-4">
        <h3 className="text-lg font-semibold text-slate-50">Ranked offenders</h3>
        <p className="text-sm text-slate-400">
          Ordered by idle CO₂ descending, matching the API report ranking.
        </p>
      </div>

      {entries.length === 0 ? (
        <p className="px-5 py-4 text-sm text-slate-400">
          No idle offenders in this range.
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-slate-950/60 text-slate-400">
              <tr>
                <th className="px-4 py-3 font-medium">Rank</th>
                <th className="px-4 py-3 font-medium">Asset</th>
                <th className="px-4 py-3 font-medium">Site</th>
                <th className="px-4 py-3 font-medium">Idle time</th>
                <th className="px-4 py-3 font-medium">Idle fuel</th>
                <th className="px-4 py-3 font-medium">Est. fuel cost</th>
                <th className="px-4 py-3 font-medium">Idle CO₂</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 text-slate-100">
              {entries.map((entry, index) => (
                <AnimatedListItem key={entry.assetId} index={index}>
                  <td className="px-4 py-3 tabular-nums text-slate-300">
                    {index + 1}
                  </td>
                  <td className="px-4 py-3">
                    <Link
                      to={`/assets/${entry.assetId}`}
                      className="font-medium text-verdiron-accent hover:text-slate-50"
                    >
                      {entry.assetName}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-slate-300">
                    {siteLabel(entry.siteId)}
                  </td>
                  <td className="px-4 py-3 tabular-nums">
                    {entry.idleMinutes.toFixed(0)} {units.idleMinutes}
                  </td>
                  <td className="px-4 py-3 tabular-nums">
                    {entry.idleFuelLiters.toFixed(1)} {units.idleFuelLiters}
                  </td>
                  <td className="px-4 py-3 tabular-nums">
                    ${estimateIdleFuelCostUsd(entry.idleFuelLiters).toFixed(2)}
                  </td>
                  <td className="px-4 py-3 tabular-nums">
                    {entry.idleCo2Kg.toFixed(1)} {units.idleCo2Kg}
                  </td>
                </AnimatedListItem>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
