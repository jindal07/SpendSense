import { XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Area, AreaChart } from 'recharts';
import { formatCurrency } from '@/utils/format';

const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-border/50 bg-card px-3 py-2 text-xs shadow-lg">
      <p className="font-medium">{label}</p>
      <p className="text-accent mt-0.5">{formatCurrency(payload[0].value)}</p>
    </div>
  );
};

export default function MonthlyLineChart({ data = [] }) {
  if (!data.length) return null;

  const chartData = data.map((d) => {
    const [, month] = d.month.split('-');
    return {
      month: MONTH_NAMES[parseInt(month, 10) - 1],
      total: Number(d.total),
    };
  });

  return (
    <ResponsiveContainer width="100%" height={200}>
      <AreaChart data={chartData} margin={{ top: 4, right: 4, left: -20, bottom: 4 }}>
        <defs>
          <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="hsl(162 60% 45%)" stopOpacity={0.25} />
            <stop offset="100%" stopColor="hsl(162 60% 45%)" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="hsl(225 12% 12%)" vertical={false} />
        <XAxis
          dataKey="month"
          tick={{ fill: 'hsl(215 12% 50%)', fontSize: 11 }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          tick={{ fill: 'hsl(215 12% 50%)', fontSize: 10 }}
          axisLine={false}
          tickLine={false}
          tickFormatter={(v) => `₹${v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v}`}
        />
        <Tooltip content={<CustomTooltip />} />
        <Area
          type="monotone"
          dataKey="total"
          stroke="hsl(162 60% 45%)"
          strokeWidth={2}
          fill="url(#areaGradient)"
          dot={{ r: 3.5, fill: 'hsl(162 60% 45%)', strokeWidth: 0 }}
          activeDot={{ r: 5, fill: 'hsl(162 60% 55%)', strokeWidth: 0 }}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
