import { AnimatePresence } from 'framer-motion';
import TransactionCard from './TransactionCard';
import EmptyState from './EmptyState';
import { Skeleton } from '@/components/ui/skeleton';

export default function TransactionList({ transactions, isLoading }) {
  if (isLoading) {
    return (
      <div className="space-y-2.5">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex items-center gap-3.5 rounded-xl bg-secondary/30 p-3.5">
            <Skeleton className="h-10 w-10 rounded-xl" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-3.5 w-28" />
              <Skeleton className="h-3 w-16" />
            </div>
            <Skeleton className="h-4 w-16" />
          </div>
        ))}
      </div>
    );
  }

  if (!transactions || transactions.length === 0) {
    return <EmptyState />;
  }

  return (
    <div className="space-y-2">
      <AnimatePresence mode="popLayout">
        {transactions.map((tx, i) => (
          <TransactionCard key={tx.id} transaction={tx} index={i} />
        ))}
      </AnimatePresence>
    </div>
  );
}
