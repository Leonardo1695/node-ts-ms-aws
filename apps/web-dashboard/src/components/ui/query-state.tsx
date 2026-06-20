import type { ReactNode } from 'react';
import type { UseQueryResult } from '@tanstack/react-query';
import { ApiError } from '../../lib/api';

function LoadingState({ label = 'Loading data…' }: { label?: string }) {
  return (
    <div
      role="status"
      className="rounded-xl border border-slate-800 bg-slate-900/50 p-6 text-sm text-slate-300"
    >
      {label}
    </div>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="rounded-xl border border-dashed border-slate-700 bg-slate-900/30 p-6 text-sm text-slate-400">
      {message}
    </div>
  );
}

function ErrorState({ error }: { error: unknown }) {
  const message =
    error instanceof ApiError
      ? `${error.message}: ${error.body}`
      : error instanceof Error
        ? error.message
        : 'Unknown error';

  return (
    <div
      role="alert"
      className="rounded-xl border border-red-900/60 bg-red-950/40 p-6 text-sm text-red-200"
    >
      {message}
    </div>
  );
}

interface QueryStateProps<TData> {
  query: UseQueryResult<TData>;
  loadingLabel?: string;
  emptyMessage?: string;
  isEmpty?: (data: TData) => boolean;
  children: (data: TData) => ReactNode;
}

export function QueryState<TData>({
  query,
  loadingLabel,
  emptyMessage = 'No data available for this range.',
  isEmpty,
  children,
}: QueryStateProps<TData>) {
  if (query.isPending) {
    return <LoadingState label={loadingLabel} />;
  }

  if (query.isError) {
    return <ErrorState error={query.error} />;
  }

  if (!query.data || isEmpty?.(query.data)) {
    return <EmptyState message={emptyMessage} />;
  }

  return children(query.data);
}
