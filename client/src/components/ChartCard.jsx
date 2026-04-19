import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';

export function ChartCard({ title, subtitle, action, children, className }) {
  return (
    <Card className={cn('overflow-hidden', className)}>
      <CardHeader className="flex-row items-start justify-between gap-2">
        <div>
          <CardTitle>{title}</CardTitle>
          {subtitle && (
            <p className="text-xs text-muted-foreground/80 mt-0.5">{subtitle}</p>
          )}
        </div>
        {action}
      </CardHeader>
      <CardContent className="pt-0">{children}</CardContent>
    </Card>
  );
}
