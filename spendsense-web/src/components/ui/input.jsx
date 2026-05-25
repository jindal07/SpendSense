import * as React from 'react';
import { cn } from '@/lib/utils';

const Input = React.forwardRef(({ className, type, ...props }, ref) => (
  <input
    type={type}
    className={cn(
      'flex h-11 w-full rounded-xl border border-border/60 bg-secondary/40 px-3.5 py-2.5 text-sm ring-offset-background transition-all duration-200',
      'placeholder:text-muted-foreground/60',
      'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40 focus-visible:border-primary/40 focus-visible:bg-secondary/60',
      'disabled:cursor-not-allowed disabled:opacity-40',
      'hover:border-border/80 hover:bg-secondary/50',
      className
    )}
    ref={ref}
    {...props}
  />
));
Input.displayName = 'Input';

export { Input };
