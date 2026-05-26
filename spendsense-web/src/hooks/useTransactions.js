import {
  useMutation,
  useQueryClient,
  useInfiniteQuery,
} from '@tanstack/react-query';
import {
  fetchTransactions,
  createTransaction,
  deleteTransaction,
} from '@/api/client';
import { toast } from 'sonner';
import { friendlyError } from '@/utils/friendlyError';

const TX_PREFIX = ['transactions'];
const STATS_KEY = ['stats'];

/** Infinite-scroll transactions list */
export function useTransactions(limit = 20) {
  return useInfiniteQuery({
    queryKey: ['transactions', limit],
    queryFn: ({ pageParam }) => fetchTransactions({ limit, cursor: pageParam }),
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
    initialPageParam: undefined,
    staleTime: 30_000,
    gcTime: 5 * 60_000,
  });
}

export function useCreateTransaction() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: createTransaction,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: TX_PREFIX });
      qc.invalidateQueries({ queryKey: STATS_KEY });
      toast.success('Expense added');
    },
    onError: (err) => {
      toast.error(friendlyError(err));
    },
  });
}

/** Delete a transaction with optimistic update */
export function useDeleteTransaction() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: deleteTransaction,
    onMutate: async (id) => {
      await qc.cancelQueries({ queryKey: TX_PREFIX });
      const caches = qc.getQueriesData({ queryKey: TX_PREFIX });

      caches.forEach(([key, data]) => {
        if (!data) return;
        qc.setQueryData(key, {
          ...data,
          pages: data.pages.map((page) => ({
            ...page,
            items: page.items.filter((t) => t.id !== id),
          })),
        });
      });

      return { caches };
    },
    onError: (_err, _id, ctx) => {
      ctx?.caches?.forEach(([key, data]) => {
        qc.setQueryData(key, data);
      });
      toast.error('Failed to delete expense');
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: TX_PREFIX });
      qc.invalidateQueries({ queryKey: STATS_KEY });
    },
    onSuccess: () => {
      toast.success('Expense deleted');
    },
  });
}
