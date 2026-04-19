import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';

export function useStats(range = {}) {
  const { from, to } = range;
  return useQuery({
    queryKey: ['stats', { from: from?.toISOString?.() ?? from, to: to?.toISOString?.() ?? to }],
    queryFn: () => api.getStats({ from, to }),
  });
}
