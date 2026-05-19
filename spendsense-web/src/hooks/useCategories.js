import { useQuery } from '@tanstack/react-query';
import { fetchCategories } from '@/api/client';

export function useCategories() {
  return useQuery({
    queryKey: ['categories'],
    queryFn: fetchCategories,
    // Categories change rarely — keep them fresh for 10 minutes and
    // garbage-collect after an hour. The server also sends a
    // Cache-Control header for browser/CDN caching.
    staleTime: 10 * 60_000,
    gcTime: 60 * 60_000,
    select: (data) => data.items,
  });
}
