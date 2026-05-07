import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { formatCurrency } from '@/utils/format';

const CustomTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null;
  const d = payload[0];
  return (
    <div className="glass-card px-3 py-2 text-xs">
      <p className="font-medium">{d.name}</p>
      <p className="text-muted-foreground">{formatCurrency(d.value)}</p>
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

  const size = compact ? 160 : 220;

  return (
    <div className="flex flex-col items-center">
      <ResponsiveContainer width="100%" height={size}>
        <PieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="50%"
            innerRadius={compact ? 35 : 55}
            outerRadius={compact ? 65 : 85}
            paddingAngle={3}
            dataKey="value"
            stroke="none"
            animationBegin={0}
            animationDuration={800}
          >
            {chartData.map((entry, i) => (
              <Cell key={i} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
        </PieChart>
      </ResponsiveContainer>

      {/* Legend */}
      <div className="mt-2 flex flex-wrap justify-center gap-x-4 gap-y-1">
        {chartData.map((d, i) => (
          <div key={i} className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <span className="h-2 w-2 rounded-full" style={{ backgroundColor: d.color }} />
            {d.name}
          </div>
        ))}
      </div>
    </div>
  );
}
