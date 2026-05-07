import { useCallback, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import PageContainer from '@/components/layout/PageContainer';
import TransactionList from '@/components/transactions/TransactionList';
import { useTransactions } from '@/hooks/useTransactions';

export default function History() {
  const navigate = useNavigate();
  const {
    data,
    isLoading,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
  } = useTransactions(20);

  const transactions = data?.pages?.flatMap((p) => p.items) ?? [];

  // Infinite scroll sentinel
  const sentinelRef = useRef(null);
  const handleIntersect = useCallback(
    (entries) => {
      if (entries[0].isIntersecting && hasNextPage && !isFetchingNextPage) {
        fetchNextPage();
      }
    },
    [hasNextPage, isFetchingNextPage, fetchNextPage]
  );

  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(handleIntersect, { rootMargin: '200px' });
    obs.observe(el);
    return () => obs.disconnect();
  }, [handleIntersect]);

  return (
    <>
      {/* Header */}
      <header className="flex items-center gap-3 px-4 pt-6 pb-2">
        <button
          onClick={() => navigate(-1)}
          className="flex h-9 w-9 items-center justify-center rounded-lg bg-secondary text-muted-foreground transition-colors hover:text-foreground"
          aria-label="Go back"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div>
          <h1 className="text-xl font-bold tracking-tight">History</h1>
          <p className="text-xs text-muted-foreground">
            {transactions.length} expense{transactions.length !== 1 ? 's' : ''}
          </p>
        </div>
      </header>

      <PageContainer className="mt-2">
        <TransactionList transactions={transactions} isLoading={isLoading} />

        {/* Infinite scroll sentinel */}
        <div ref={sentinelRef} className="h-4" />

        {isFetchingNextPage && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex justify-center py-6"
          >
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </motion.div>
        )}

        {!hasNextPage && transactions.length > 0 && (
          <p className="py-6 text-center text-xs text-muted-foreground">
            You've reached the end
          </p>
        )}
      </PageContainer>
    </>
  );
}
