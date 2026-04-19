import { useMemo } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { Wallet, TrendingUp, PlusCircle, Calendar } from 'lucide-react';

import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { TransactionItem } from '@/components/TransactionItem';
import { EmptyState } from '@/components/EmptyState';
import { ErrorState } from '@/components/ErrorState';
import { ChartCard } from '@/components/ChartCard';
import { ChartErrorBoundary } from '@/components/ChartErrorBoundary';
import { useStats } from '@/hooks/useStats';
import { useRecentTransactions } from '@/hooks/useTransactions';
import { formatCurrency } from '@/lib/format';

const EMPTY_ARRAY = Object.freeze([]);

export default function Dashboard({ onAdd }) {
  const stats = useStats();
  const recent = useRecentTransactions(5);

  const now = new Date();
  const monthName = now.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });

  return (
    <div className="space-y-5 animate-fade-in">
      <header className="flex items-end justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[11px] text-muted-foreground uppercase tracking-[0.14em]">
            Welcome back
          </p>
          <h1 className="text-2xl sm:text-3xl font-bold mt-0.5 tracking-tight">
            Overview
          </h1>
        </div>
        <span className="inline-flex items-center gap-1.5 text-[11px] sm:text-xs text-muted-foreground shrink-0">
          <Calendar className="h-3.5 w-3.5" />
          {monthName}
        </span>
      </header>

      <TotalHero
        isLoading={stats.isLoading}
        error={stats.error}
        onRetry={stats.refetch}
        total={stats.data?.total}
        topCategory={stats.data?.byCategory?.[0]}
      />

      <CategoryBreakdownCard stats={stats} />

      <section>
        <div className="flex items-center justify-between mb-2 px-1">
          <h2 className="text-sm font-semibold">Recent</h2>
        </div>
        <RecentList recent={recent} onAdd={onAdd} />
      </section>
    </div>
  );
}

function TotalHero({ isLoading, error, total, onRetry, topCategory }) {
  return (
    <Card className="relative p-0 border-white/10 shadow-glow-indigo">
      <div aria-hidden className="absolute inset-0 bg-brand-gradient" />
      <div
        aria-hidden
        className="absolute inset-0"
        style={{
          backgroundImage:
            'radial-gradient(400px 200px at 80% 0%, rgba(255,255,255,0.22), transparent 70%), radial-gradient(300px 160px at 0% 100%, rgba(0,0,0,0.22), transparent 70%), linear-gradient(180deg, rgba(0,0,0,0) 30%, rgba(0,0,0,0.18) 100%)',
        }}
      />
      <CardContent className="relative p-5 sm:p-6">
        {error ? (
          <ErrorState error={error} onRetry={onRetry} className="py-4" />
        ) : (
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-white/95 flex items-center gap-1.5 drop-shadow-sm">
                <Wallet className="h-3.5 w-3.5" />
                Monthly spend
              </p>
              {isLoading ? (
                <Skeleton className="h-9 w-40 mt-2 bg-white/20" />
              ) : (
                <p className="text-[1.75rem] sm:text-[2.25rem] leading-tight font-extrabold mt-1 tabular-nums text-white break-words drop-shadow">
                  {formatCurrency(total ?? 0)}
                </p>
              )}
              <p className="text-xs font-medium text-white/90 mt-1 flex items-center gap-1 drop-shadow-sm">
                <TrendingUp className="h-3.5 w-3.5" />
                {topCategory
                  ? `Top: ${topCategory.category}`
                  : 'This month so far'}
              </p>
            </div>
            <div className="h-12 w-12 sm:h-14 sm:w-14 rounded-2xl bg-white/15 backdrop-blur-sm text-white flex items-center justify-center ring-1 ring-white/20 shrink-0">
              <Wallet className="h-6 w-6 sm:h-7 sm:w-7" />
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function CategoryBreakdownCard({ stats }) {
  const data = useMemo(
    () => stats.data?.byCategory ?? EMPTY_ARRAY,
    [stats.data?.byCategory]
  );
  const topFive = useMemo(() => data.slice(0, 5), [data]);
  const isEmpty = !stats.isLoading && data.length === 0;

  return (
    <ChartCard title="By category" subtitle="This month">
      {stats.isLoading ? (
        <Skeleton className="h-48 w-full" />
      ) : isEmpty ? (
        <div className="h-48 flex items-center justify-center text-sm text-muted-foreground">
          No data yet
        </div>
      ) : (
        <div className="flex flex-col xs:flex-row xs:items-center gap-4">
          <div className="h-40 sm:h-44 w-full xs:w-[160px] sm:w-[180px] shrink-0">
            <ChartErrorBoundary>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={data}
                    dataKey="total"
                    nameKey="category"
                    innerRadius="55%"
                    outerRadius="95%"
                    paddingAngle={3}
                    strokeWidth={0}
                    isAnimationActive={false}
                  >
                    {data.map((entry) => (
                      <Cell key={entry.category} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={tooltipStyle}
                    itemStyle={tooltipItemStyle}
                    labelStyle={tooltipLabelStyle}
                    wrapperStyle={{ outline: 'none', zIndex: 50 }}
                    formatter={(v) => formatCurrency(v)}
                  />
                </PieChart>
              </ResponsiveContainer>
            </ChartErrorBoundary>
          </div>
          <ul className="flex-1 space-y-2 text-sm min-w-0">
            {topFive.map((entry) => (
              <li
                key={entry.category}
                className="flex items-center gap-2 justify-between"
              >
                <span className="flex items-center gap-2 min-w-0">
                  <span
                    className="h-2.5 w-2.5 rounded-full shrink-0 ring-2 ring-white/5"
                    style={{ backgroundColor: entry.color }}
                  />
                  <span className="truncate">{entry.category}</span>
                </span>
                <span className="tabular-nums text-muted-foreground shrink-0">
                  {formatCurrency(entry.total)}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </ChartCard>
  );
}

function RecentList({ recent, onAdd }) {
  if (recent.isLoading) {
    return (
      <Card>
        <CardContent className="p-2 space-y-1">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3 py-3 px-2">
              <Skeleton className="h-11 w-11 rounded-2xl" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-3.5 w-1/2" />
                <Skeleton className="h-3 w-1/3" />
              </div>
              <Skeleton className="h-4 w-14" />
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }
  if (recent.error) {
    return <ErrorState error={recent.error} onRetry={recent.refetch} />;
  }
  const items = recent.data ?? [];
  if (items.length === 0) {
    return (
      <EmptyState
        icon={PlusCircle}
        title="No expenses yet"
        description="Tap the + button to log your first expense in seconds."
        actionLabel="Add expense"
        onAction={onAdd}
      />
    );
  }
  return (
    <Card>
      <CardContent className="p-1.5">
        <div className="divide-y divide-white/5">
          {items.map((t) => (
            <TransactionItem key={t.id} transaction={t} />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

const tooltipStyle = {
  backgroundColor: 'hsl(248 70% 13%)',
  border: '1px solid hsl(248 55% 38%)',
  borderRadius: 12,
  fontSize: 12,
  color: '#ffffff',
  boxShadow: '0 10px 30px rgba(0,0,0,0.35)',
};

const tooltipItemStyle = { color: '#ffffff' };
const tooltipLabelStyle = {
  color: '#e4dcf0',
  fontWeight: 600,
  marginBottom: 2,
};
