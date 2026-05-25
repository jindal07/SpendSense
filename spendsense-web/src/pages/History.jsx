import { useCallback, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Loader2 } from 'lucide-react';
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
      <header className="sticky top-0 z-30 border-b border-border/40 bg-background/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-xl items-center gap-3 px-4 sm:px-6 py-4">
          <button
            onClick={() => navigate(-1)}
            className="flex h-9 w-9 items-center justify-center rounded-xl bg-secondary/50 text-muted-foreground transition-all hover:bg-secondary hover:text-foreground"
            aria-label="Go back"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <div>
            <h1 className="text-lg font-semibold tracking-tight">History</h1>
            <p className="text-xs text-muted-foreground">
              {transactions.length} expense{transactions.length !== 1 ? 's' : ''}
            </p>
          </div>
        </div>
      </header>

      <PageContainer className="pt-4">
        <TransactionList transactions={transactions} isLoading={isLoading} />

        <div ref={sentinelRef} className="h-4" />

        {isFetchingNextPage && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex justify-center py-8"
          >
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </motion.div>
        )}

        {!hasNextPage && transactions.length > 0 && (
          <p className="py-8 text-center text-xs text-muted-foreground">
            You've reached the end
          </p>
        )}
      </PageContainer>
    </>
  );
}
