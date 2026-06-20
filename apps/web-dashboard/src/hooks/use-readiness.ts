import { useQuery } from '@tanstack/react-query';
import { getReadiness } from '../lib/api';
import { queryKeys } from '../lib/query-keys';

export function useReadiness(options?: { refetchInterval?: number }) {
  return useQuery({
    queryKey: queryKeys.readiness(),
    queryFn: getReadiness,
    refetchInterval: options?.refetchInterval,
  });
}
