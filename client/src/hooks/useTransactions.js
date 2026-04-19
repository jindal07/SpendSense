import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import { toast } from 'sonner';
import { api } from '@/lib/api';

const KEY = ['transactions'];

export function transactionsListKey(filters) {
  return [...KEY, 'list', filters ?? {}];
}

/** Paginated list (infinite scroll). */
export function useInfiniteTransactions(filters = {}) {
  return useInfiniteQuery({
    queryKey: transactionsListKey(filters),
    queryFn: ({ pageParam }) =>
      api.getTransactions({ ...filters, cursor: pageParam, limit: 20 }),
    initialPageParam: undefined,
    getNextPageParam: (last) => last.nextCursor ?? undefined,
  });
}

/** Flat recent list (e.g. dashboard "last N"). */
export function useRecentTransactions(limit = 5) {
  return useQuery({
    queryKey: [...KEY, 'recent', limit],
    queryFn: () => api.getTransactions({ limit }),
    select: (data) => data.items,
  });
}

export function useCreateTransaction() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body) => api.createTransaction(body),
    onMutate: async (body) => {
      await qc.cancelQueries({ queryKey: KEY });
      const optimistic = {
        id: `optimistic-${Date.now()}`,
        amount: Number(body.amount),
        category: body.category,
        date: body.date ? new Date(body.date).toISOString() : new Date().toISOString(),
        note: body.note ?? null,
        createdAt: new Date().toISOString(),
        __optimistic: true,
      };

      // Patch every cached transaction list.
      const snapshots = qc.getQueriesData({ queryKey: KEY });
      for (const [key, value] of snapshots) {
        if (!value) continue;
        if (value.pages) {
          // Infinite query.
          qc.setQueryData(key, {
            ...value,
            pages: value.pages.map((page, i) =>
              i === 0 ? { ...page, items: [optimistic, ...page.items] } : page
            ),
          });
        } else if (Array.isArray(value.items)) {
          qc.setQueryData(key, {
            ...value,
            items: [optimistic, ...value.items],
          });
        }
      }
      return { snapshots, optimistic };
    },
    onError: (err, _body, ctx) => {
      if (ctx?.snapshots) {
        for (const [key, value] of ctx.snapshots) qc.setQueryData(key, value);
      }
      toast.error(err?.message || 'Failed to add expense');
    },
    onSuccess: () => {
      toast.success('Expense added');
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: KEY });
      qc.invalidateQueries({ queryKey: ['stats'] });
    },
  });
}

export function useDeleteTransaction() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id) => api.deleteTransaction(id),
    onMutate: async (id) => {
      await qc.cancelQueries({ queryKey: KEY });
      const snapshots = qc.getQueriesData({ queryKey: KEY });
      for (const [key, value] of snapshots) {
        if (!value) continue;
        if (value.pages) {
          qc.setQueryData(key, {
            ...value,
            pages: value.pages.map((page) => ({
              ...page,
              items: page.items.filter((t) => t.id !== id),
            })),
          });
        } else if (Array.isArray(value.items)) {
          qc.setQueryData(key, {
            ...value,
            items: value.items.filter((t) => t.id !== id),
          });
        }
      }
      return { snapshots };
    },
    onError: (err, _id, ctx) => {
      if (ctx?.snapshots) {
        for (const [key, value] of ctx.snapshots) qc.setQueryData(key, value);
      }
      toast.error(err?.message || 'Failed to delete');
    },
    onSuccess: () => {
      toast.success('Expense deleted');
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: KEY });
      qc.invalidateQueries({ queryKey: ['stats'] });
    },
  });
}
