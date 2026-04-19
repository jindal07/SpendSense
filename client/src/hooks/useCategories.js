import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';

export function useCategories() {
  return useQuery({
    queryKey: ['categories'],
    queryFn: () => api.getCategories(),
    staleTime: 5 * 60 * 1000,
    select: (data) => data.items,
  });
}
