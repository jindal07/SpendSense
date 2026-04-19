import * as React from 'react';
import { cn } from '@/lib/utils';

export const Card = React.forwardRef(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      'relative rounded-2xl border border-white/5 bg-card text-card-foreground shadow-card',
      'bg-[linear-gradient(180deg,rgba(255,255,255,0.03),rgba(255,255,255,0)_40%)]',
      'overflow-hidden',
      className
    )}
    {...props}
  />
));
Card.displayName = 'Card';

export const CardHeader = ({ className, ...props }) => (
  <div className={cn('p-4 pb-2 sm:p-5 sm:pb-2 flex flex-col gap-1', className)} {...props} />
);
export const CardTitle = ({ className, ...props }) => (
  <h3
    className={cn(
      'text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground',
      className
    )}
    {...props}
  />
);
export const CardContent = ({ className, ...props }) => (
  <div className={cn('p-4 pt-2 sm:p-5 sm:pt-2', className)} {...props} />
);
