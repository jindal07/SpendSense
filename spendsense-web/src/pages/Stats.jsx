import { motion } from 'framer-motion';
import Header from '@/components/layout/Header';
import PageContainer from '@/components/layout/PageContainer';
import CategoryPieChart from '@/components/charts/CategoryPieChart';
import DailyBarChart from '@/components/charts/DailyBarChart';
import MonthlyLineChart from '@/components/charts/MonthlyLineChart';
import { Skeleton } from '@/components/ui/skeleton';
import EmptyState from '@/components/transactions/EmptyState';
import { useStats } from '@/hooks/useStats';
import { formatCurrency } from '@/utils/format';

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.08 } },
};
const item = {
  hidden: { opacity: 0, y: 15 },
  show: { opacity: 1, y: 0 },
};

export default function Stats() {
  const { data: stats, isLoading } = useStats();

  const hasData = stats && stats.total > 0;

  return (
    <>
      <Header title="Analytics" subtitle="Your spending insights" />
      <PageContainer>
        {isLoading ? (
          <div className="space-y-4">
            <Skeleton className="h-8 w-32" />
            <Skeleton className="h-[220px] w-full rounded-xl" />
            <Skeleton className="h-[220px] w-full rounded-xl" />
          </div>
        ) : !hasData ? (
          <EmptyState
            message="No data yet"
            subtitle="Add some expenses to see your analytics here."
          />
        ) : (
          <motion.div variants={container} initial="hidden" animate="show" className="space-y-5">
            {/* Total */}
            <motion.div variants={item} className="glass-card p-4">
              <p className="text-sm text-muted-foreground">Total Spending</p>
              <p className="mt-1 text-2xl font-bold text-gradient">
                {formatCurrency(stats.total)}
              </p>
            </motion.div>

            {/* Category Pie */}
            {stats.byCategory?.length > 0 && (
              <motion.section variants={item} className="glass-card p-4">
                <h3 className="mb-3 text-sm font-semibold">By Category</h3>
                <CategoryPieChart data={stats.byCategory} />
                {/* Category details */}
                <div className="mt-4 space-y-2">
                  {stats.byCategory.map((c, i) => (
                    <div key={i} className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: c.color }} />
                        <span>{c.category}</span>
                        <span className="text-xs text-muted-foreground">({c.count})</span>
                      </div>
                      <span className="font-medium">{formatCurrency(Number(c.total))}</span>
                    </div>
                  ))}
                </div>
              </motion.section>
            )}

            {/* Daily Trend */}
            {stats.dailyTrend?.length > 0 && (
              <motion.section variants={item} className="glass-card p-4">
                <h3 className="mb-3 text-sm font-semibold">Daily Spending</h3>
                <DailyBarChart data={stats.dailyTrend} />
              </motion.section>
            )}

            {/* Monthly Trend */}
            {stats.monthlyTotals?.length > 0 && (
              <motion.section variants={item} className="glass-card p-4">
                <h3 className="mb-3 text-sm font-semibold">Monthly Trend</h3>
                <MonthlyLineChart data={stats.monthlyTotals} />
              </motion.section>
            )}
          </motion.div>
        )}
      </PageContainer>
    </>
  );
}
