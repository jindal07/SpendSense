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

export default function Dashboard() {
  const { data: txData, isLoading: txLoading } = useTransactions(5);
  const { data: stats, isLoading: statsLoading } = useStats();

  const transactions = txData?.pages?.flatMap((p) => p.items) ?? [];

  return (
    <>
      <Header title="SpendSense" subtitle="Track your spending" />
      <PageContainer className="space-y-5">
        {/* Hero spend card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="gradient-card p-5"
        >
          <p className="text-sm font-medium text-white/70">This Month</p>
          {statsLoading ? (
            <Skeleton className="mt-2 h-9 w-40 bg-white/20" />
          ) : (
            <h2 className="mt-1 text-3xl font-bold text-white">
              {formatCurrency(stats?.total ?? 0)}
            </h2>
          )}
          <div className="mt-3 flex items-center gap-1 text-xs text-white/60">
            <TrendingDown className="h-3.5 w-3.5" />
            Total spending this month
          </div>
        </motion.div>

        {/* Quick stats row */}
        <div className="grid grid-cols-3 gap-3">
          <QuickStat
            icon={<ArrowDownRight className="h-4 w-4 text-red-400" />}
            label="Expenses"
            value={
              statsLoading
                ? null
                : `${stats?.byCategory?.reduce((s, c) => s + c.count, 0) ?? 0}`
            }
          />
          <QuickStat
            icon={<Wallet className="h-4 w-4 text-indigo-400" />}
            label="Avg / txn"
            value={
              statsLoading
                ? null
                : formatCurrency(
                    stats?.byCategory?.reduce((s, c) => s + c.count, 0)
                      ? stats.total / stats.byCategory.reduce((s, c) => s + c.count, 0)
                      : 0
                  )
            }
          />
          <QuickStat
            icon={<Tag className="h-4 w-4 text-emerald-400" />}
            label="Top Cat."
            value={
              statsLoading ? null : stats?.byCategory?.[0]?.category ?? '—'
            }
          />
        </div>

        {/* Category breakdown */}
        {stats?.byCategory?.length > 0 && (
          <motion.section
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="glass-card p-4"
          >
            <h3 className="mb-3 text-sm font-semibold">Category Breakdown</h3>
            <CategoryPieChart data={stats.byCategory} compact />
          </motion.section>
        )}

        {/* Recent transactions */}
        <section>
          <h3 className="mb-3 text-sm font-semibold">Recent Transactions</h3>
          <TransactionList transactions={transactions} isLoading={txLoading} />
        </section>
      </PageContainer>
    </>
  );
}

function QuickStat({ icon, label, value }) {
  return (
    <div className="glass-card flex flex-col items-center gap-1.5 p-3 text-center">
      {icon}
      {value === null ? (
        <Skeleton className="h-4 w-12" />
      ) : (
        <p className="text-sm font-semibold truncate w-full">{value}</p>
      )}
      <p className="text-[10px] text-muted-foreground">{label}</p>
    </div>
  );
}
