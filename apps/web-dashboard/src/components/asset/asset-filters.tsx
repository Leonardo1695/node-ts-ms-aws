import { useNavigate } from 'react-router-dom';
import { assetOptions } from '../../lib/asset/asset-options';
import type { AssetFiltersValue } from '../../lib/asset/query';

interface AssetFiltersProps {
  assetId: string;
  value: AssetFiltersValue;
  onChange: (value: AssetFiltersValue) => void;
}

export function AssetFilters({ assetId, value, onChange }: AssetFiltersProps) {
  const navigate = useNavigate();

  return (
    <div className="grid gap-4 rounded-xl border border-slate-800 bg-slate-900/50 p-4 md:grid-cols-4">
      <label className="flex flex-col gap-2 text-sm text-slate-300">
        Asset
        <select
          value={assetId}
          onChange={(event) => {
            navigate(`/assets/${encodeURIComponent(event.target.value)}`);
          }}
          className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-slate-100"
        >
          {assetOptions.map((option) => (
            <option key={option.assetId} value={option.assetId}>
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
        Recent events
        <select
          value={value.recentLimit}
          onChange={(event) =>
            onChange({
              ...value,
              recentLimit: Number(event.target.value),
            })
          }
          className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-slate-100"
        >
          <option value={10}>10</option>
          <option value={20}>20</option>
          <option value={50}>50</option>
        </select>
      </label>
    </div>
  );
}
