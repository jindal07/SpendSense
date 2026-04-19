import * as React from 'react';
import { cn } from '@/lib/utils';

const Input = React.forwardRef(({ className, type = 'text', ...props }, ref) => (
  <input
    type={type}
    ref={ref}
    className={cn(
      'flex h-11 w-full rounded-xl border border-border bg-[hsl(var(--input))] px-3 py-2 text-sm',
      'text-foreground placeholder:text-muted-foreground',
      'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-0',
      'disabled:cursor-not-allowed disabled:opacity-50 transition',
      className
    )}
    {...props}
  />
));
Input.displayName = 'Input';

export { Input };
