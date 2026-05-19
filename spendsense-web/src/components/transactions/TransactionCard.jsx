import { memo } from 'react';
import { motion } from 'framer-motion';
import { Trash2 } from 'lucide-react';
import { formatCurrency, formatRelativeTime } from '@/utils/format';
import { useDeleteTransaction } from '@/hooks/useTransactions';
import { cn } from '@/lib/utils';

// Map category names to emoji icons
const CATEGORY_ICONS = {
  Food: '🍔',
  Travel: '✈️',
  Bills: '📄',
  Shopping: '🛍️',
  Health: '💊',
  Entertainment: '🎬',
  Other: '📌',
};

// Cap the per-item stagger so long lists don't take seconds to animate in.
const MAX_STAGGER_DELAY = 0.32;
const STAGGER_STEP = 0.04;

function TransactionCard({ transaction, index = 0 }) {
  const deleteTx = useDeleteTransaction();

  const handleDelete = (e) => {
    e.stopPropagation();
    if (window.confirm('Delete this expense?')) {
      deleteTx.mutate(transaction.id);
    }
  };

  const emoji = CATEGORY_ICONS[transaction.category] || '📌';
  const delay = Math.min(index * STAGGER_STEP, MAX_STAGGER_DELAY);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -50 }}
      transition={{ delay, duration: 0.25 }}
      className={cn(
        'glass-card flex items-center gap-3 p-3 transition-colors hover:border-primary/20',
        transaction._optimistic && 'opacity-70'
      )}
    >
      {/* Category icon */}
      <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-secondary text-lg">
        {emoji}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">{transaction.category}</p>
        <p className="text-xs text-muted-foreground truncate">
          {transaction.note || formatRelativeTime(transaction.createdAt)}
        </p>
      </div>

      {/* Amount */}
      <div className="text-right flex-shrink-0">
        <p className="text-sm font-semibold text-red-400">
          -{formatCurrency(transaction.amount)}
        </p>
        <p className="text-[10px] text-muted-foreground">
          {formatRelativeTime(transaction.createdAt)}
        </p>
      </div>

      {/* Delete */}
      <button
        onClick={handleDelete}
        disabled={deleteTx.isPending || transaction._optimistic}
        className={cn(
          'flex-shrink-0 rounded-lg p-2 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-red-400',
          (deleteTx.isPending || transaction._optimistic) && 'opacity-50'
        )}
        aria-label="Delete expense"
      >
        <Trash2 className="h-4 w-4" />
      </button>
    </motion.div>
  );
}

export default memo(TransactionCard);
