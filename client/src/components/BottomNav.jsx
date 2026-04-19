import { NavLink } from 'react-router-dom';
import { Home, BarChart3, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';

const leftItem = { to: '/', label: 'Home', icon: Home, end: true };
const rightItem = { to: '/stats', label: 'Stats', icon: BarChart3 };

export function BottomNav({ onAddClick }) {
  return (
    <nav
      className={cn(
        'fixed inset-x-0 bottom-0 z-40 border-t border-border/60 glass safe-bottom'
      )}
      aria-label="Primary"
    >
      <div className="relative mx-auto max-w-xl px-4">
        <div className="grid grid-cols-3 items-center h-16">
          <NavItem item={leftItem} />

          <div className="flex items-center justify-center">
            <button
              type="button"
              onClick={onAddClick}
              aria-label="Add expense"
              className={cn(
                'group relative -mt-8 flex h-14 w-14 items-center justify-center rounded-full',
                'bg-brand-gradient text-white transition-transform',
                'shadow-glow-indigo hover:scale-105 active:scale-95',
                'ring-4 ring-background'
              )}
            >
              <span
                aria-hidden
                className="absolute inset-0 rounded-full bg-brand-gradient opacity-0 blur-xl transition-opacity group-hover:opacity-70"
              />
              <Plus className="relative h-6 w-6" />
            </button>
          </div>

          <NavItem item={rightItem} />
        </div>
      </div>
    </nav>
  );
}

function NavItem({ item }) {
  const Icon = item.icon;
  return (
    <NavLink
      to={item.to}
      end={item.end}
      className={({ isActive }) =>
        cn(
          'relative flex flex-col items-center justify-center gap-1 text-[11px] font-medium transition-colors h-full',
          isActive
            ? 'text-lavender-blush-100'
            : 'text-muted-foreground hover:text-foreground'
        )
      }
    >
      {({ isActive }) => (
        <>
          {isActive && (
            <span
              aria-hidden
              className="absolute top-0 left-1/2 -translate-x-1/2 h-[3px] w-8 rounded-b-full bg-brand-gradient"
            />
          )}
          <Icon
            className={cn(
              'h-5 w-5 transition-transform',
              isActive && 'scale-110'
            )}
          />
          <span>{item.label}</span>
        </>
      )}
    </NavLink>
  );
}
