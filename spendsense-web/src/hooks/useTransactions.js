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

const TX_KEY = ['transactions'];
const STATS_KEY = ['stats'];

/** Infinite-scroll transactions list */
export function useTransactions(limit = 20) {
  return useInfiniteQuery({
    queryKey: TX_KEY,
    queryFn: ({ pageParam }) => fetchTransactions({ limit, cursor: pageParam }),
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
    initialPageParam: undefined,
    staleTime: 30_000,
    gcTime: 5 * 60_000,
  });
}

/**
 * Create a transaction with an optimistic UI update.
 *
 * The previous implementation invalidated the entire transactions list on
 * success, forcing every cached page to be re-fetched. We now:
 *   1. Cancel any in-flight queries to avoid racing.
 *   2. Prepend a placeholder row into the first cached page.
 *   3. On success, swap the placeholder for the server payload (which now
 *      includes the resolved category color).
 *   4. On error, roll back to the previous cache snapshot.
 * Stats still get invalidated so aggregations remain correct.
 */
export function useCreateTransaction() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: createTransaction,
    onMutate: async (input) => {
      await qc.cancelQueries({ queryKey: TX_KEY });
      const prev = qc.getQueryData(TX_KEY);

      const optimistic = {
        id: `optimistic-${Date.now()}`,
        amount: input.amount,
        category: input.category,
        date: input.date,
        note: input.note ?? null,
        createdAt: new Date().toISOString(),
        _optimistic: true,
      };

      qc.setQueryData(TX_KEY, (old) => {
        if (!old?.pages?.length) {
          return {
            pages: [{ items: [optimistic], nextCursor: null, hasMore: false }],
            pageParams: [undefined],
          };
        }
        const [first, ...rest] = old.pages;
        return {
          ...old,
          pages: [{ ...first, items: [optimistic, ...first.items] }, ...rest],
        };
      });

      return { prev, optimisticId: optimistic.id };
    },
    onError: (err, _input, ctx) => {
      if (ctx?.prev) qc.setQueryData(TX_KEY, ctx.prev);
      toast.error(err.message || 'Failed to add expense');
    },
    onSuccess: (created, _input, ctx) => {
      qc.setQueryData(TX_KEY, (old) => {
        if (!old?.pages?.length) return old;
        return {
          ...old,
          pages: old.pages.map((page, i) =>
            i === 0
              ? {
                  ...page,
                  items: page.items.map((t) =>
                    t.id === ctx?.optimisticId ? created : t
                  ),
                }
              : page
          ),
        };
      });
      toast.success('Expense added');
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: STATS_KEY });
    },
  });
}

/** Delete a transaction with optimistic update */
export function useDeleteTransaction() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: deleteTransaction,
    onMutate: async (id) => {
      await qc.cancelQueries({ queryKey: TX_KEY });
      const prev = qc.getQueryData(TX_KEY);

      qc.setQueryData(TX_KEY, (old) => {
        if (!old) return old;
        return {
          ...old,
          pages: old.pages.map((page) => ({
            ...page,
            items: page.items.filter((t) => t.id !== id),
          })),
        };
      });

      return { prev };
    },
    onError: (_err, _id, ctx) => {
      if (ctx?.prev) qc.setQueryData(TX_KEY, ctx.prev);
      toast.error('Failed to delete expense');
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: STATS_KEY });
    },
    onSuccess: () => {
      toast.success('Expense deleted');
    },
  });
}
