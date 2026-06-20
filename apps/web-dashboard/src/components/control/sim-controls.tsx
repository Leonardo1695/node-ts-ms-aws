import { useState } from 'react';
import { useStartSimulator, useStopSimulator } from '../../hooks';
import { ApiError } from '../../lib/api';

function actionErrorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    return `${error.message}: ${error.body}`;
  }

  if (error instanceof Error) {
    return error.message;
  }

  return 'Command failed';
}

export function SimControls() {
  const [fleetSize, setFleetSize] = useState(8);
  const [emitRatePerSecond, setEmitRatePerSecond] = useState(1);
  const startSimulator = useStartSimulator();
  const stopSimulator = useStopSimulator();

  const pending = startSimulator.isPending || stopSimulator.isPending;
  const feedback = startSimulator.isSuccess
    ? 'Simulator start command accepted.'
    : stopSimulator.isSuccess
      ? 'Simulator stop command accepted.'
      : startSimulator.isError
        ? actionErrorMessage(startSimulator.error)
        : stopSimulator.isError
          ? actionErrorMessage(stopSimulator.error)
          : null;

  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-4">
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-slate-50">Simulator</h3>
        <p className="text-sm text-slate-400">
          Start or stop telemetry emission through the API control routes.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <label className="flex flex-col gap-2 text-sm text-slate-300">
          Fleet size
          <input
            type="number"
            min={1}
            max={100}
            value={fleetSize}
            onChange={(event) => setFleetSize(Number(event.target.value))}
            className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-slate-100"
          />
        </label>

        <label className="flex flex-col gap-2 text-sm text-slate-300">
          Emit rate (events/s)
          <input
            type="number"
            min={0.1}
            max={100}
            step={0.1}
            value={emitRatePerSecond}
            onChange={(event) =>
              setEmitRatePerSecond(Number(event.target.value))
            }
            className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-slate-100"
          />
        </label>
      </div>

      <div className="mt-4 flex flex-wrap gap-3">
        <button
          type="button"
          disabled={pending}
          onClick={() => {
            stopSimulator.reset();
            startSimulator.mutate({ fleetSize, emitRatePerSecond });
          }}
          className="rounded-lg bg-verdiron-accent px-4 py-2 text-sm font-medium text-slate-950 transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {startSimulator.isPending ? 'Starting…' : 'Start simulator'}
        </button>

        <button
          type="button"
          disabled={pending}
          onClick={() => {
            startSimulator.reset();
            stopSimulator.mutate();
          }}
          className="rounded-lg border border-slate-700 bg-slate-950 px-4 py-2 text-sm font-medium text-slate-100 transition hover:border-slate-500 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {stopSimulator.isPending ? 'Stopping…' : 'Stop simulator'}
        </button>
      </div>

      {feedback ? (
        <p
          role={startSimulator.isError || stopSimulator.isError ? 'alert' : 'status'}
          className={`mt-4 text-sm ${
            startSimulator.isError || stopSimulator.isError
              ? 'text-red-300'
              : 'text-verdiron-accent'
          }`}
        >
          {feedback}
        </p>
      ) : null}
    </div>
  );
}
