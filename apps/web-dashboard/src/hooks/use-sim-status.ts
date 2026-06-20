import { useQuery } from '@tanstack/react-query';
import { getSimStatus } from '../lib/api';
import { queryKeys } from '../lib/query-keys';

export function useSimStatus(options?: { refetchInterval?: number }) {
  return useQuery({
    queryKey: queryKeys.simStatus(),
    queryFn: getSimStatus,
    refetchInterval: options?.refetchInterval,
  });
}
