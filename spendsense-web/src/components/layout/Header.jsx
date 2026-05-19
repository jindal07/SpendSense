import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { History, LogOut, User } from 'lucide-react';
import { useAuth } from '@/auth/AuthContext';
import { cn } from '@/lib/utils';

export default function Header({ title, subtitle }) {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      await logout();
      navigate('/login', { replace: true });
    } finally {
      setLoggingOut(false);
      setMenuOpen(false);
    }
  };

  return (
    <header className="relative flex items-center justify-between px-4 pt-6 pb-2">
      <div>
        <h1 className="text-xl font-bold tracking-tight">{title}</h1>
        {subtitle && (
          <p className="mt-0.5 text-sm text-muted-foreground">{subtitle}</p>
        )}
      </div>

      <div className="flex items-center gap-2">
        <button
          id="header-history-btn"
          onClick={() => navigate('/history')}
          className="flex items-center gap-1.5 rounded-lg bg-secondary px-3 py-2 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
          aria-label="View history"
        >
          <History className="h-4 w-4" />
          History
        </button>

        <div className="relative">
          <button
            type="button"
            onClick={() => setMenuOpen((o) => !o)}
            className="flex h-9 w-9 items-center justify-center rounded-lg bg-secondary text-muted-foreground transition-colors hover:text-foreground"
            aria-label="Account menu"
            aria-expanded={menuOpen}
          >
            <User className="h-4 w-4" />
          </button>

          {menuOpen && (
            <>
              <button
                type="button"
                className="fixed inset-0 z-40 cursor-default"
                aria-label="Close menu"
                onClick={() => setMenuOpen(false)}
              />
              <div
                className={cn(
                  'absolute right-0 top-full z-50 mt-2 w-56 overflow-hidden rounded-lg border border-border',
                  'bg-popover text-popover-foreground shadow-2xl ring-1 ring-black/40'
                )}
              >
                <div className="border-b border-border px-3 py-2.5">
                  <p className="truncate text-xs font-medium text-foreground">
                    {user?.name || 'Account'}
                  </p>
                  <p className="truncate text-[11px] text-muted-foreground">
                    {user?.email}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleLogout}
                  disabled={loggingOut}
                  className="flex w-full items-center gap-2 px-3 py-2.5 text-sm text-red-400 transition-colors hover:bg-destructive/10 disabled:opacity-50"
                >
                  <LogOut className="h-4 w-4" />
                  {loggingOut ? 'Signing out…' : 'Sign out'}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
