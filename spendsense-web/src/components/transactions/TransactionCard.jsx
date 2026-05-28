import { memo, useState } from 'react';
import { Trash2 } from 'lucide-react';
import { formatCurrency, formatRelativeTime } from '@/utils/format';
import { useDeleteTransaction } from '@/hooks/useTransactions';
import ConfirmDialog from '@/components/ui/confirm-dialog';
import { cn } from '@/lib/utils';

const CATEGORY_ICONS = {
  Food: '🍔',
  Travel: '✈️',
  Bills: '📄',
  Shopping: '🛍️',
  Health: '💊',
  Entertainment: '🎬',
  Education: '📚',
  Groceries: '🛒',
  Rent: '🏠',
  Utilities: '💡',
  Other: '📌',
};

function TransactionCard({ transaction }) {
  const deleteTx = useDeleteTransaction();
  const [confirmOpen, setConfirmOpen] = useState(false);

  const openConfirm = (e) => {
    e.stopPropagation();
    setConfirmOpen(true);
  };

  const handleConfirmDelete = async () => {
    try {
      await deleteTx.mutateAsync(transaction.id);
      setConfirmOpen(false);
    } catch {
      /* dialog stays open so user sees error */
    }
  };

  const emoji = CATEGORY_ICONS[transaction.category] || '📌';

  return (
    <div
      className={cn(
        'group flex items-center gap-3.5 rounded-xl p-3.5 transition-colors duration-150',
        'bg-secondary/50 hover:bg-secondary/70',
        transaction._optimistic && 'opacity-50'
      )}
    >
      <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-secondary/80 text-base">
        {emoji}
      </div>

      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">{transaction.category}</p>
        <p className="text-xs text-muted-foreground truncate mt-0.5">
          {transaction.note || formatRelativeTime(transaction.createdAt)}
        </p>
      </div>

      <div className="text-right flex-shrink-0">
        <p className="text-sm font-semibold tabular-nums text-destructive/90">
          -{formatCurrency(transaction.amount)}
        </p>
        <p className="text-[10px] text-muted-foreground mt-0.5">
          {formatRelativeTime(transaction.createdAt)}
        </p>
      </div>

      <button
        onClick={openConfirm}
        disabled={deleteTx.isPending || transaction._optimistic}
        className={cn(
          'flex-shrink-0 flex h-8 w-8 items-center justify-center rounded-lg transition-colors',
          'text-muted-foreground/50 sm:opacity-0 sm:group-hover:opacity-100 sm:focus-visible:opacity-100',
          'hover:bg-destructive/10 hover:text-destructive active:text-destructive',
          (deleteTx.isPending || transaction._optimistic) && 'opacity-30'
        )}
        aria-label="Delete expense"
      >
        <Trash2 className="h-3.5 w-3.5" />
      </button>

      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title="Delete this expense?"
        description={
          <>
            <span className="font-medium text-foreground">
              {transaction.category}
            </span>{' '}
            ·{' '}
            <span className="font-semibold text-destructive">
              -{formatCurrency(transaction.amount)}
            </span>
            <br />
            This action can&apos;t be undone.
          </>
        }
        confirmLabel="Delete"
        cancelLabel="Cancel"
        variant="destructive"
        loading={deleteTx.isPending}
        onConfirm={handleConfirmDelete}
      />
    </div>
  );
}

export default memo(TransactionCard);
