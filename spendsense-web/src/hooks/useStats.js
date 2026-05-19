import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { fetchStats } from '@/api/client';

export function useStats({ from, to } = {}) {
  return useQuery({
    queryKey: ['stats', from, to],
    queryFn: () => fetchStats({ from, to }),
    staleTime: 60_000,
    gcTime: 5 * 60_000,
    // Show the last successful response while refetching for a new range
    // so charts don't flash to a skeleton on every range change.
    placeholderData: keepPreviousData,
  });
}
