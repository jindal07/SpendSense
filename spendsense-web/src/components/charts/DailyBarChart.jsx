import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { formatCurrency, formatDateShort } from '@/utils/format';

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="glass-card px-3 py-2 text-xs">
      <p className="font-medium">{formatDateShort(label)}</p>
      <p className="text-indigo-400">{formatCurrency(payload[0].value)}</p>
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
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={chartData} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="hsl(217 33% 17%)" vertical={false} />
        <XAxis
          dataKey="label"
          tick={{ fill: 'hsl(215 20% 65%)', fontSize: 10 }}
          axisLine={false}
          tickLine={false}
          interval="preserveStartEnd"
        />
        <YAxis
          tick={{ fill: 'hsl(215 20% 65%)', fontSize: 10 }}
          axisLine={false}
          tickLine={false}
          tickFormatter={(v) => `₹${v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v}`}
        />
        <Tooltip content={<CustomTooltip />} cursor={{ fill: 'hsla(239 84% 67% / 0.08)' }} />
        <Bar dataKey="total" fill="url(#barGradient)" radius={[4, 4, 0, 0]} maxBarSize={32}>
        </Bar>
        <defs>
          <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#818cf8" />
            <stop offset="100%" stopColor="#6366f1" />
          </linearGradient>
        </defs>
      </BarChart>
    </ResponsiveContainer>
  );
}
