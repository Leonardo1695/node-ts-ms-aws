import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  runEtl,
  startSimulator,
  stopSimulator,
  type EtlRunCommand,
  type SimStartCommand,
} from '../lib/api';
import { queryKeys } from '../lib/query-keys';

export function useStartSimulator() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (command: SimStartCommand) => startSimulator(command),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.simStatus() });
    },
  });
}

export function useStopSimulator() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: stopSimulator,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.simStatus() });
    },
  });
}

export function useRunEtl() {
  return useMutation({
    mutationFn: (command: EtlRunCommand = {}) => runEtl(command),
  });
}
