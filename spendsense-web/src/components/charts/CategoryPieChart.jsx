import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { formatCurrency } from '@/utils/format';

const CustomTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null;
  const d = payload[0];
  return (
    <div className="rounded-lg border border-border/50 bg-card px-3 py-2 text-xs shadow-lg">
      <p className="font-medium">{d.name}</p>
      <p className="text-muted-foreground mt-0.5">{formatCurrency(d.value)}</p>
    </div>
  );
};

export default function CategoryPieChart({ data = [], compact = false }) {
  if (!data.length) return null;

  const chartData = data.map((d) => ({
    name: d.category,
    value: Number(d.total),
    color: d.color,
  }));

  const size = compact ? 160 : 200;

  return (
    <div className="flex flex-col items-center">
      <ResponsiveContainer width="100%" height={size}>
        <PieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="50%"
            innerRadius={compact ? 38 : 55}
            outerRadius={compact ? 62 : 80}
            paddingAngle={4}
            dataKey="value"
            stroke="none"
            animationBegin={0}
            animationDuration={600}
            animationEasing="ease-out"
          >
            {chartData.map((entry, i) => (
              <Cell key={i} fill={entry.color} opacity={0.9} />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
        </PieChart>
      </ResponsiveContainer>

      <div className="mt-3 flex flex-wrap justify-center gap-x-5 gap-y-1.5">
        {chartData.map((d, i) => (
          <div key={i} className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <span className="h-2 w-2 rounded-full flex-shrink-0" style={{ backgroundColor: d.color }} />
            {d.name}
          </div>
        ))}
      </div>
    </div>
  );
}
