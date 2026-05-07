import { useQuery, useMutation, useQueryClient, useInfiniteQuery } from '@tanstack/react-query';
import { fetchTransactions, createTransaction, deleteTransaction } from '@/api/client';
import { toast } from 'sonner';

/** Infinite-scroll transactions list */
export function useTransactions(limit = 20) {
  return useInfiniteQuery({
    queryKey: ['transactions'],
    queryFn: ({ pageParam }) => fetchTransactions({ limit, cursor: pageParam }),
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
    initialPageParam: undefined,
  });
}

/** Create a new transaction with optimistic toast */
export function useCreateTransaction() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: createTransaction,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['transactions'] });
      qc.invalidateQueries({ queryKey: ['stats'] });
      toast.success('Expense added');
    },
    onError: (err) => {
      toast.error(err.message || 'Failed to add expense');
    },
  });
}

/** Delete a transaction with optimistic update */
export function useDeleteTransaction() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: deleteTransaction,
    onMutate: async (id) => {
      await qc.cancelQueries({ queryKey: ['transactions'] });
      const prev = qc.getQueryData(['transactions']);

      // Optimistic removal
      qc.setQueryData(['transactions'], (old) => {
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
      qc.setQueryData(['transactions'], ctx.prev);
      toast.error('Failed to delete expense');
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: ['transactions'] });
      qc.invalidateQueries({ queryKey: ['stats'] });
    },
    onSuccess: () => {
      toast.success('Expense deleted');
    },
  });
}
