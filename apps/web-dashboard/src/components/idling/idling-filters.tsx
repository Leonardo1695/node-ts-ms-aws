import type { IdlingFiltersValue } from '../../lib/idling/query';
import { siteFilterOptions } from '../../lib/fleet/site-options';

interface IdlingFiltersProps {
  value: IdlingFiltersValue;
  onChange: (value: IdlingFiltersValue) => void;
}

export function IdlingFilters({ value, onChange }: IdlingFiltersProps) {
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
          {siteFilterOptions.map((option) => (
            <option key={option.value || 'all'} value={option.value}>
              {option.label}
            </option>
          ))}
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
        Limit
        <select
          value={value.limit}
          onChange={(event) =>
            onChange({
              ...value,
              limit: Number(event.target.value),
            })
          }
          className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-slate-100"
        >
          <option value={10}>Top 10</option>
          <option value={20}>Top 20</option>
          <option value={50}>Top 50</option>
        </select>
      </label>
    </div>
  );
}
