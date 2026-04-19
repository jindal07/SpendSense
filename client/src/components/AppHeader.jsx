import { Clock } from 'lucide-react';
import { NavLink } from 'react-router-dom';
import { BrandWordmark } from '@/components/Logo';
import { cn } from '@/lib/utils';

export function AppHeader() {
  return (
    <header className="sticky top-0 z-30 glass border-b border-border/60 safe-top">
      <div className="mx-auto max-w-xl px-4 h-14 flex items-center justify-between gap-3">
        <NavLink to="/" className="min-w-0 flex items-center" aria-label="Home">
          <BrandWordmark />
        </NavLink>

        <NavLink
          to="/history"
          className={({ isActive }) =>
            cn(
              'shrink-0 inline-flex items-center gap-1.5 h-9 px-3 rounded-full text-xs font-semibold',
              'border transition-colors',
              isActive
                ? 'bg-brand-gradient text-white border-transparent shadow-glow-indigo'
                : 'bg-white/[0.04] text-foreground border-border/60 hover:bg-white/[0.08]'
            )
          }
          aria-label="History"
        >
          <Clock className="h-4 w-4" />
          <span>History</span>
        </NavLink>
      </div>
    </header>
  );
}
