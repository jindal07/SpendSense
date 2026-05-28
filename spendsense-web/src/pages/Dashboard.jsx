import { useMemo, useRef } from 'react';
import { motion } from 'framer-motion';
import { TrendingDown, Wallet, ArrowDownRight, Tag } from 'lucide-react';
import Header from '@/components/layout/Header';
import PageContainer from '@/components/layout/PageContainer';
import TransactionList from '@/components/transactions/TransactionList';
import CategoryPieChart from '@/components/charts/CategoryPieChart';
import { Skeleton } from '@/components/ui/skeleton';
import { useTransactions } from '@/hooks/useTransactions';
import { useStats } from '@/hooks/useStats';
import { formatCurrency } from '@/utils/format';

const stagger = {
  show: { opacity: 1, transition: { staggerChildren: 0.06 } },
};
const fadeUp = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { duration: 0.35, ease: [0.16, 1, 0.3, 1] } },
};

export default function Dashboard() {
  const { data: txData, isLoading: txLoading } = useTransactions(5);
  const { data: stats, isLoading: statsLoading } = useStats();
  const hasAnimated = useRef(false);

  const transactions = useMemo(
    () => txData?.pages?.flatMap((p) => p.items) ?? [],
    [txData]
  );

  const txCount =
    stats?.count ?? stats?.byCategory?.reduce((s, c) => s + c.count, 0) ?? 0;
  const avgPerTxn = txCount > 0 ? (stats?.total ?? 0) / txCount : 0;
  const topCategory = stats?.byCategory?.[0]?.category ?? '—';

  const shouldAnimate = !hasAnimated.current;
  if (!statsLoading && !txLoading) hasAnimated.current = true;

  return (
    <>
      <Header title="SpendSense" subtitle="Track your spending" />
      <PageContainer className="space-y-6 pt-6">
        <motion.div variants={stagger} initial={shouldAnimate ? 'hidden' : false} animate="show">
          {/* Hero spend card */}
          <motion.div variants={fadeUp} className="gradient-card p-6 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-white/[0.08] to-transparent pointer-events-none" />
            <p className="text-sm font-medium text-white/70 relative">This Month</p>
            {statsLoading ? (
              <Skeleton className="mt-3 h-10 w-44 bg-white/20 rounded-lg" />
            ) : (
              <h2 className="mt-2 text-4xl font-bold text-white tracking-tight relative">
                {formatCurrency(stats?.total ?? 0)}
              </h2>
            )}
            <div className="mt-4 flex items-center gap-1.5 text-xs text-white/50 relative">
              <TrendingDown className="h-3.5 w-3.5" />
              Total spending this month
            </div>
          </motion.div>

          {/* Quick stats row */}
          <motion.div variants={fadeUp} className="grid grid-cols-3 gap-3 mt-5">
            <QuickStat
              icon={<ArrowDownRight className="h-4 w-4 text-destructive/80" />}
              label="Expenses"
              value={statsLoading ? null : `${txCount}`}
            />
            <QuickStat
              icon={<Wallet className="h-4 w-4 text-primary/80" />}
              label="Avg / txn"
              value={statsLoading ? null : formatCurrency(avgPerTxn)}
            />
            <QuickStat
              icon={<Tag className="h-4 w-4 text-accent/80" />}
              label="Top Cat."
              value={statsLoading ? null : topCategory}
            />
          </motion.div>

          {/* Category breakdown */}
          {stats?.byCategory?.length > 0 && (
            <motion.section variants={fadeUp} className="glass-card p-5 mt-5">
              <h3 className="text-sm font-semibold text-foreground/90 mb-4">Category Breakdown</h3>
              <CategoryPieChart data={stats.byCategory} compact />
            </motion.section>
          )}

          {/* Recent transactions */}
          <motion.section variants={fadeUp} className="mt-6">
            <h3 className="text-sm font-semibold text-foreground/90 mb-3">Recent Transactions</h3>
            <TransactionList transactions={transactions} isLoading={txLoading} />
          </motion.section>
        </motion.div>
      </PageContainer>
    </>
  );
}

function QuickStat({ icon, label, value }) {
  return (
    <div className="glass-card flex flex-col items-center gap-2 p-4 text-center">
      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-secondary/80">
        {icon}
      </div>
      {value === null ? (
        <Skeleton className="h-4 w-14" />
      ) : (
        <p className="text-sm font-semibold truncate w-full text-foreground">{value}</p>
      )}
      <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">{label}</p>
    </div>
  );
}
