import { Trash2 } from 'lucide-react';
import { useCategories } from '@/hooks/useCategories';
import { useDeleteTransaction } from '@/hooks/useTransactions';
import { formatCurrency, formatShortDate } from '@/lib/format';
import { cn } from '@/lib/utils';

export function TransactionItem({ transaction, showDelete = true }) {
  const { data: categories = [] } = useCategories();
  const del = useDeleteTransaction();

  const matchedCategory = categories.find(
    (c) => c.name === transaction.category
  );
  const otherCategory = categories.find((c) => c.name === 'Other');
  const color = matchedCategory?.color ?? otherCategory?.color ?? '#4c35fd';

  const isOptimistic = transaction.__optimistic;

  return (
    <div
      className={cn(
        'group flex items-center gap-3 py-3 px-3 rounded-2xl transition-colors',
        'hover:bg-white/[0.03]',
        isOptimistic && 'opacity-70'
      )}
    >
      <div
        className="h-11 w-11 rounded-2xl flex items-center justify-center shrink-0 font-semibold text-sm ring-1 ring-inset ring-white/5"
        style={{
          background: `linear-gradient(135deg, ${color}33, ${color}11)`,
          color,
          boxShadow: `inset 0 0 0 1px ${color}22`,
        }}
        aria-hidden
      >
        {initials(transaction.category)}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline justify-between gap-2">
          <p className="font-semibold truncate">{transaction.category}</p>
          <p className="font-semibold tabular-nums">
            {formatCurrency(transaction.amount)}
          </p>
        </div>
        <div className="flex items-center justify-between gap-2 text-xs text-muted-foreground">
          <span className="truncate">{transaction.note || 'No note'}</span>
          <span className="shrink-0">{formatShortDate(transaction.date)}</span>
        </div>
      </div>
      {showDelete && !isOptimistic && (
        <button
          type="button"
          aria-label={`Delete ${transaction.category} expense`}
          onClick={() => del.mutate(transaction.id)}
          className={cn(
            'ml-1 p-2 rounded-xl text-muted-foreground opacity-0 group-hover:opacity-100',
            'hover:bg-danger/15 hover:text-danger transition',
            'focus:opacity-100 focus:outline-none focus:ring-2 focus:ring-danger'
          )}
        >
          <Trash2 className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}

function initials(name = '') {
  const parts = name.trim().split(/\s+/);
  return (parts[0]?.[0] ?? '?').toUpperCase();
}
