import { useMemo, useState } from 'react';
import { SlidersHorizontal, PlusCircle } from 'lucide-react';

import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { TransactionItem } from '@/components/TransactionItem';
import { EmptyState } from '@/components/EmptyState';
import { ErrorState } from '@/components/ErrorState';
import { FilterDrawer } from '@/components/FilterDrawer';
import { useInfiniteTransactions } from '@/hooks/useTransactions';

export default function History({ onAdd }) {
  const [filters, setFilters] = useState({ from: '', to: '', category: '' });
  const [drawerOpen, setDrawerOpen] = useState(false);

  const queryFilters = useMemo(() => {
    const out = {};
    if (filters.from) out.from = new Date(filters.from).toISOString();
    if (filters.to) {
      const d = new Date(filters.to);
      d.setHours(23, 59, 59, 999);
      out.to = d.toISOString();
    }
    if (filters.category) out.category = filters.category;
    return out;
  }, [filters]);

  const query = useInfiniteTransactions(queryFilters);

  const items =
    query.data?.pages.flatMap((p) => p.items) ?? [];

  const activeFilterCount =
    (filters.from ? 1 : 0) + (filters.to ? 1 : 0) + (filters.category ? 1 : 0);

  return (
    <div className="space-y-5 animate-fade-in">
      <header className="flex items-end justify-between gap-3">
        <div>
          <p className="text-[11px] text-muted-foreground uppercase tracking-[0.14em]">
            All expenses
          </p>
          <h1 className="text-2xl sm:text-3xl font-bold mt-0.5 tracking-tight">History</h1>
        </div>
        <Button
          variant="secondary"
          size="sm"
          onClick={() => setDrawerOpen(true)}
          className="relative"
        >
          <SlidersHorizontal className="h-4 w-4" />
          Filters
          {activeFilterCount > 0 && (
            <span className="absolute -top-1 -right-1 h-5 min-w-5 px-1 rounded-full bg-brand-gradient text-white text-[10px] font-semibold flex items-center justify-center ring-2 ring-background">
              {activeFilterCount}
            </span>
          )}
        </Button>
      </header>

      {query.isLoading && <ListSkeleton />}

      {query.error && (
        <ErrorState error={query.error} onRetry={query.refetch} />
      )}

      {!query.isLoading && !query.error && items.length === 0 && (
        <EmptyState
          icon={PlusCircle}
          title={
            activeFilterCount > 0
              ? 'No matching transactions'
              : 'No expenses yet'
          }
          description={
            activeFilterCount > 0
              ? 'Try adjusting filters or clearing them.'
              : 'Add your first expense to get started.'
          }
          actionLabel={activeFilterCount === 0 ? 'Add expense' : undefined}
          onAction={activeFilterCount === 0 ? onAdd : undefined}
        />
      )}

      {items.length > 0 && (
        <Card>
          <CardContent className="p-1.5">
            <div className="divide-y divide-white/5">
              {items.map((t) => (
                <TransactionItem key={t.id} transaction={t} />
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {query.hasNextPage && (
        <div className="flex justify-center">
          <Button
            variant="secondary"
            onClick={() => query.fetchNextPage()}
            disabled={query.isFetchingNextPage}
          >
            {query.isFetchingNextPage ? 'Loading...' : 'Load more'}
          </Button>
        </div>
      )}

      <FilterDrawer
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
        value={filters}
        onApply={setFilters}
      />
    </div>
  );
}

function ListSkeleton() {
  return (
    <Card>
      <CardContent className="p-2 space-y-1">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="flex items-center gap-3 py-3 px-2">
            <Skeleton className="h-10 w-10 rounded-2xl" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-3.5 w-1/2" />
              <Skeleton className="h-3 w-1/3" />
            </div>
            <Skeleton className="h-4 w-12" />
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
