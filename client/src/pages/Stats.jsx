import { useMemo, useState } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  Legend,
} from 'recharts';

import { ChartCard } from '@/components/ChartCard';
import { Skeleton } from '@/components/ui/skeleton';
import { ErrorState } from '@/components/ErrorState';
import { EmptyState } from '@/components/EmptyState';
import { useStats } from '@/hooks/useStats';
import { formatCurrency, formatCompactCurrency, monthLabel } from '@/lib/format';
import { cn } from '@/lib/utils';

const RANGES = [
  { id: 'month', label: 'This month' },
  { id: '30d', label: 'Last 30d' },
  { id: 'year', label: 'This year' },
];

function computeRange(id) {
  const now = new Date();
  if (id === '30d') {
    const from = new Date();
    from.setDate(now.getDate() - 29);
    from.setHours(0, 0, 0, 0);
    return { from, to: now };
  }
  if (id === 'year') {
    return {
      from: new Date(now.getFullYear(), 0, 1),
      to: new Date(now.getFullYear(), 11, 31, 23, 59, 59, 999),
    };
  }
  return {
    from: new Date(now.getFullYear(), now.getMonth(), 1),
    to: new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999),
  };
}

export default function Stats() {
  const [rangeId, setRangeId] = useState('month');
  const range = useMemo(() => computeRange(rangeId), [rangeId]);
  const stats = useStats(range);

  const isEmpty =
    !stats.isLoading &&
    !stats.error &&
    (stats.data?.total ?? 0) === 0 &&
    (stats.data?.byCategory?.length ?? 0) === 0;

  return (
    <div className="space-y-5 animate-fade-in">
      <header className="flex items-end justify-between gap-3">
        <div>
          <p className="text-[11px] text-muted-foreground uppercase tracking-[0.14em]">
            Insights
          </p>
          <h1 className="text-2xl sm:text-3xl font-bold mt-0.5 tracking-tight">Stats</h1>
        </div>
      </header>

      <div className="flex gap-1 p-1 bg-white/[0.04] backdrop-blur-sm rounded-2xl border border-white/5">
        {RANGES.map((r) => (
          <button
            key={r.id}
            onClick={() => setRangeId(r.id)}
            className={cn(
              'flex-1 text-xs font-semibold rounded-xl py-2 transition-all',
              rangeId === r.id
                ? 'bg-brand-gradient text-white shadow-glow-indigo'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            {r.label}
          </button>
        ))}
      </div>

      {stats.error && (
        <ErrorState error={stats.error} onRetry={stats.refetch} />
      )}

      {isEmpty ? (
        <EmptyState
          title="No data yet"
          description="Start tracking expenses to see charts and insights."
        />
      ) : (
        <>
          <PieBreakdown stats={stats} />
          <MonthlyBars stats={stats} />
          <DailyTrendLine stats={stats} />
        </>
      )}
    </div>
  );
}

function PieBreakdown({ stats }) {
  const data = stats.data?.byCategory ?? [];
  return (
    <ChartCard title="Category distribution" subtitle="Share of total spend">
      {stats.isLoading ? (
        <Skeleton className="h-56 w-full" />
      ) : data.length === 0 ? (
        <EmptyMini label="No categories" />
      ) : (
        <div className="h-56">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                dataKey="total"
                nameKey="category"
                innerRadius={50}
                outerRadius={85}
                paddingAngle={2}
                strokeWidth={0}
              >
                {data.map((entry) => (
                  <Cell key={entry.category} fill={entry.color} />
                ))}
              </Pie>
              <Legend
                iconType="circle"
                iconSize={8}
                wrapperStyle={{ fontSize: 12, paddingTop: 4 }}
              />
              <Tooltip
                contentStyle={tooltipStyle}
                itemStyle={tooltipItemStyle}
                labelStyle={tooltipLabelStyle}
                wrapperStyle={tooltipWrapperStyle}
                formatter={(v) => formatCurrency(v)}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      )}
    </ChartCard>
  );
}

function MonthlyBars({ stats }) {
  const data = (stats.data?.monthlyTotals ?? []).map((row) => ({
    label: monthLabel(row.month),
    total: row.total,
  }));
  return (
    <ChartCard title="Monthly totals" subtitle="Last 6 months">
      {stats.isLoading ? (
        <Skeleton className="h-56 w-full" />
      ) : data.length === 0 ? (
        <EmptyMini label="Not enough data" />
      ) : (
        <div className="h-56">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 8, right: 4, left: -12, bottom: 0 }}>
              <defs>
                <linearGradient id="barFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#d12e49" />
                  <stop offset="60%" stopColor="#a857a7" />
                  <stop offset="100%" stopColor="#4c35fd" />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)" vertical={false} />
              <XAxis dataKey="label" tick={{ fill: '#e4dcf0', fontSize: 12 }} axisLine={false} tickLine={false} />
              <YAxis
                tick={{ fill: '#e4dcf0', fontSize: 12 }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(v) => formatCompactCurrency(v)}
              />
              <Tooltip
                cursor={{ fill: 'rgba(76,53,253,0.10)' }}
                contentStyle={tooltipStyle}
                itemStyle={tooltipItemStyle}
                labelStyle={tooltipLabelStyle}
                wrapperStyle={tooltipWrapperStyle}
                formatter={(v) => formatCurrency(v)}
              />
              <Bar dataKey="total" fill="url(#barFill)" radius={[10, 10, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </ChartCard>
  );
}

function DailyTrendLine({ stats }) {
  const raw = stats.data?.dailyTrend ?? [];
  const data = raw.map((row) => ({
    label: new Date(row.date).toLocaleDateString(undefined, {
      day: 'numeric',
      month: 'short',
    }),
    total: row.total,
  }));
  return (
    <ChartCard title="Daily trend" subtitle="Spend over time">
      {stats.isLoading ? (
        <Skeleton className="h-56 w-full" />
      ) : data.length === 0 ? (
        <EmptyMini label="No activity" />
      ) : (
        <div className="h-56">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
              <defs>
                <linearGradient id="lineStroke" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="#d12e49" />
                  <stop offset="55%" stopColor="#a857a7" />
                  <stop offset="100%" stopColor="#4c35fd" />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)" vertical={false} />
              <XAxis dataKey="label" tick={{ fill: '#e4dcf0', fontSize: 12 }} axisLine={false} tickLine={false} minTickGap={16} />
              <YAxis
                tick={{ fill: '#e4dcf0', fontSize: 12 }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(v) => formatCompactCurrency(v)}
              />
              <Tooltip
                contentStyle={tooltipStyle}
                itemStyle={tooltipItemStyle}
                labelStyle={tooltipLabelStyle}
                wrapperStyle={tooltipWrapperStyle}
                formatter={(v) => formatCurrency(v)}
              />
              <Line
                type="monotone"
                dataKey="total"
                stroke="url(#lineStroke)"
                strokeWidth={3}
                dot={{ r: 3, fill: '#a857a7', strokeWidth: 0 }}
                activeDot={{ r: 6, fill: '#d12e49' }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </ChartCard>
  );
}

function EmptyMini({ label }) {
  return (
    <div className="h-44 flex items-center justify-center text-sm text-muted-foreground">
      {label}
    </div>
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
const tooltipWrapperStyle = { outline: 'none', zIndex: 50 };
