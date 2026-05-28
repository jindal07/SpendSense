import { useRef } from 'react';
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

const stagger = {
  show: { opacity: 1, transition: { staggerChildren: 0.08 } },
};
const fadeUp = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { duration: 0.35, ease: [0.16, 1, 0.3, 1] } },
};

export default function Stats() {
  const { data: stats, isLoading } = useStats();
  const hasData = stats && stats.total > 0;
  const hasAnimated = useRef(false);
  const shouldAnimate = !hasAnimated.current;
  if (!isLoading) hasAnimated.current = true;

  return (
    <>
      <Header title="Analytics" subtitle="Your spending insights" />
      <PageContainer className="pt-6">
        {isLoading ? (
          <div className="space-y-4">
            <Skeleton className="h-8 w-36" />
            <Skeleton className="h-[200px] w-full rounded-xl" />
            <Skeleton className="h-[200px] w-full rounded-xl" />
          </div>
        ) : !hasData ? (
          <EmptyState
            message="No data yet"
            subtitle="Add some expenses to see your analytics here."
          />
        ) : (
          <motion.div variants={stagger} initial={shouldAnimate ? 'hidden' : false} animate="show" className="space-y-5">
            <motion.div variants={fadeUp} className="glass-card p-5">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Total Spending</p>
              <p className="mt-2 text-3xl font-bold tracking-tight text-gradient">
                {formatCurrency(stats.total)}
              </p>
            </motion.div>

            {stats.byCategory?.length > 0 && (
              <motion.section variants={fadeUp} className="glass-card p-5">
                <h3 className="text-sm font-semibold text-foreground/90 mb-4">By Category</h3>
                <CategoryPieChart data={stats.byCategory} />
                <div className="mt-5 space-y-2.5">
                  {stats.byCategory.map((c, i) => (
                    <div key={i} className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2.5">
                        <span className="h-2.5 w-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: c.color }} />
                        <span className="text-foreground/90">{c.category}</span>
                        <span className="text-xs text-muted-foreground">({c.count})</span>
                      </div>
                      <span className="font-medium tabular-nums">{formatCurrency(Number(c.total))}</span>
                    </div>
                  ))}
                </div>
              </motion.section>
            )}

            {stats.dailyTrend?.length > 0 && (
              <motion.section variants={fadeUp} className="glass-card p-5">
                <h3 className="text-sm font-semibold text-foreground/90 mb-4">Daily Spending</h3>
                <DailyBarChart data={stats.dailyTrend} />
              </motion.section>
            )}

            {stats.monthlyTotals?.length > 0 && (
              <motion.section variants={fadeUp} className="glass-card p-5">
                <h3 className="text-sm font-semibold text-foreground/90 mb-4">Monthly Trend</h3>
                <MonthlyLineChart data={stats.monthlyTotals} />
              </motion.section>
            )}
          </motion.div>
        )}
      </PageContainer>
    </>
  );
}
