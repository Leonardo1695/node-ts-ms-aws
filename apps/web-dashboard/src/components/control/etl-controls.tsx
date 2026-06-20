import { useState } from 'react';
import { useRunEtl } from '../../hooks';
import { ApiError } from '../../lib/api';
import { defaultRangeDates } from '../../lib/fleet/query';

export function EtlControls() {
  const defaultRange = defaultRangeDates();
  const [fromDate, setFromDate] = useState(defaultRange.fromDate);
  const [toDate, setToDate] = useState(defaultRange.toDate);
  const runEtl = useRunEtl();

  const feedback = runEtl.isSuccess
    ? 'ETL run command accepted.'
    : runEtl.isError
      ? runEtl.error instanceof ApiError
        ? `${runEtl.error.message}: ${runEtl.error.body}`
        : runEtl.error instanceof Error
          ? runEtl.error.message
          : 'ETL command failed'
      : null;

  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-4">
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-slate-50">Python ETL</h3>
        <p className="text-sm text-slate-400">
          Trigger the reporting batch worker via RabbitMQ. Leave dates blank to
          use worker defaults.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <label className="flex flex-col gap-2 text-sm text-slate-300">
          From (optional)
          <input
            type="date"
            value={fromDate}
            onChange={(event) => setFromDate(event.target.value)}
            className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-slate-100"
          />
        </label>

        <label className="flex flex-col gap-2 text-sm text-slate-300">
          To (optional)
          <input
            type="date"
            value={toDate}
            onChange={(event) => setToDate(event.target.value)}
            className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-slate-100"
          />
        </label>
      </div>

      <button
        type="button"
        disabled={runEtl.isPending}
        onClick={() =>
          runEtl.mutate({
            from: fromDate
              ? new Date(`${fromDate}T00:00:00.000Z`).toISOString()
              : undefined,
            to: toDate
              ? new Date(`${toDate}T23:59:59.999Z`).toISOString()
              : undefined,
          })
        }
        className="mt-4 rounded-lg bg-amber-500 px-4 py-2 text-sm font-medium text-slate-950 transition hover:bg-amber-400 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {runEtl.isPending ? 'Triggering ETL…' : 'Run ETL'}
      </button>

      {feedback ? (
        <p
          role={runEtl.isError ? 'alert' : 'status'}
          className={`mt-4 text-sm ${
            runEtl.isError ? 'text-red-300' : 'text-verdiron-accent'
          }`}
        >
          {feedback}
        </p>
      ) : null}
    </div>
  );
}
