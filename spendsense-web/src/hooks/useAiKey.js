import { useQuery } from '@tanstack/react-query';
import { fetchAiKey } from '@/api/ai';

export function useAiKey() {
  const q = useQuery({
    queryKey: ['ai-key'],
    queryFn: fetchAiKey,
    staleTime: 60_000,
    retry: false,
  });

  return {
    hasKey: q.data?.hasKey ?? false,
    fingerprint: q.data?.fingerprint,
    usage: q.data?.usage,
    dailyCap: q.data?.dailyCap ?? 200,
    isLoading: q.isLoading,
    refetch: q.refetch,
  };
}
