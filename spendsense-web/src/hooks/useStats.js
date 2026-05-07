import { useQuery } from '@tanstack/react-query';
import { fetchStats } from '@/api/client';

export function useStats({ from, to } = {}) {
  return useQuery({
    queryKey: ['stats', from, to],
    queryFn: () => fetchStats({ from, to }),
    staleTime: 30_000,
  });
}
