import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-2xl text-sm font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 active:scale-[0.98]',
  {
    variants: {
      variant: {
        default:
          'bg-brand-gradient text-white hover:opacity-95 shadow-glow-indigo',
        solid:
          'bg-primary text-primary-foreground hover:bg-primary/90 shadow-card',
        secondary:
          'bg-white/[0.04] text-foreground hover:bg-white/[0.08] border border-white/10',
        ghost: 'hover:bg-white/5 text-foreground',
        outline:
          'border border-white/15 bg-transparent hover:bg-white/5 text-foreground',
        danger:
          'bg-danger text-danger-foreground hover:bg-danger/90 shadow-card',
        accent:
          'bg-accent text-accent-foreground hover:bg-accent/90 shadow-card',
      },
      size: {
        default: 'h-10 px-4 py-2',
        sm: 'h-8 px-3 text-xs',
        lg: 'h-12 px-6 text-base',
        icon: 'h-10 w-10 p-0',
        fab: 'h-14 w-14 rounded-full p-0 shadow-card',
      },
    },
    defaultVariants: { variant: 'default', size: 'default' },
  }
);

const Button = React.forwardRef(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button';
    return (
      <Comp
        ref={ref}
        className={cn(buttonVariants({ variant, size, className }))}
        {...props}
      />
    );
  }
);
Button.displayName = 'Button';

export { Button, buttonVariants };
