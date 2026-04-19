import { Inbox } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export function EmptyState({
  icon: Icon = Inbox,
  title = 'Nothing here yet',
  description,
  actionLabel,
  onAction,
  className,
}) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center text-center py-10 px-6 rounded-2xl border border-dashed border-white/10 bg-white/[0.02]',
        className
      )}
    >
      <div className="h-14 w-14 rounded-2xl bg-brand-gradient-soft ring-1 ring-white/10 text-lavender-blush-100 flex items-center justify-center mb-3">
        <Icon className="h-7 w-7" />
      </div>
      <h3 className="font-semibold">{title}</h3>
      {description && (
        <p className="text-sm text-muted-foreground mt-1 max-w-xs">
          {description}
        </p>
      )}
      {actionLabel && onAction && (
        <Button className="mt-4" onClick={onAction}>
          {actionLabel}
        </Button>
      )}
    </div>
  );
}
