import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { formatCurrency, formatDateShort } from '@/utils/format';

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-border/50 bg-card px-3 py-2 text-xs shadow-lg">
      <p className="font-medium">{formatDateShort(label)}</p>
      <p className="text-primary mt-0.5">{formatCurrency(payload[0].value)}</p>
    </div>
  );
};

export default function DailyBarChart({ data = [] }) {
  if (!data.length) return null;

  const chartData = data.map((d) => ({
    day: d.day,
    total: Number(d.total),
    label: formatDateShort(d.day),
  }));

  return (
    <ResponsiveContainer width="100%" height={200}>
      <BarChart data={chartData} margin={{ top: 4, right: 4, left: -20, bottom: 4 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="hsl(225 12% 12%)" vertical={false} />
        <XAxis
          dataKey="label"
          tick={{ fill: 'hsl(215 12% 50%)', fontSize: 10 }}
          axisLine={false}
          tickLine={false}
          interval="preserveStartEnd"
        />
        <YAxis
          tick={{ fill: 'hsl(215 12% 50%)', fontSize: 10 }}
          axisLine={false}
          tickLine={false}
          tickFormatter={(v) => `₹${v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v}`}
        />
        <Tooltip content={<CustomTooltip />} cursor={{ fill: 'hsl(230 70% 62% / 0.06)' }} />
        <Bar dataKey="total" fill="url(#barGradient)" radius={[6, 6, 0, 0]} maxBarSize={28} />
        <defs>
          <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="hsl(230 70% 68%)" />
            <stop offset="100%" stopColor="hsl(230 70% 55%)" />
          </linearGradient>
        </defs>
      </BarChart>
    </ResponsiveContainer>
  );
}
