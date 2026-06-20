import type { FleetFiltersValue } from '../../lib/fleet/query';

interface FleetFiltersProps {
  value: FleetFiltersValue;
  onChange: (value: FleetFiltersValue) => void;
}

export function FleetFilters({ value, onChange }: FleetFiltersProps) {
  return (
    <div className="grid gap-4 rounded-xl border border-slate-800 bg-slate-900/50 p-4 md:grid-cols-4">
      <label className="flex flex-col gap-2 text-sm text-slate-300">
        Site
        <select
          value={value.siteId}
          onChange={(event) =>
            onChange({ ...value, siteId: event.target.value })
          }
          className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-slate-100"
        >
          <option value="">All sites</option>
          <option value="site-north-yard">North Yard</option>
          <option value="site-south-quarry">South Quarry</option>
          <option value="site-west-depot">West Depot</option>
        </select>
      </label>

      <label className="flex flex-col gap-2 text-sm text-slate-300">
        From
        <input
          type="date"
          value={value.fromDate}
          onChange={(event) =>
            onChange({ ...value, fromDate: event.target.value })
          }
          className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-slate-100"
        />
      </label>

      <label className="flex flex-col gap-2 text-sm text-slate-300">
        To
        <input
          type="date"
          value={value.toDate}
          onChange={(event) =>
            onChange({ ...value, toDate: event.target.value })
          }
          className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-slate-100"
        />
      </label>

      <label className="flex flex-col gap-2 text-sm text-slate-300">
        Bucket
        <select
          value={value.bucket}
          onChange={(event) =>
            onChange({
              ...value,
              bucket: event.target.value as FleetFiltersValue['bucket'],
            })
          }
          className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-slate-100"
        >
          <option value="hour">Hourly</option>
          <option value="day">Daily</option>
          <option value="week">Weekly</option>
        </select>
      </label>
    </div>
  );
}
