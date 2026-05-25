import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { History, LogOut, Settings, User } from 'lucide-react';
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
    <header className="sticky top-0 z-30 border-b border-border/40 bg-background/80 backdrop-blur-xl">
      <div className="mx-auto flex max-w-xl items-center justify-between px-4 sm:px-6 py-4">
        <div>
          <h1 className="text-lg font-semibold tracking-tight">{title}</h1>
          {subtitle && (
            <p className="text-xs text-muted-foreground mt-0.5">{subtitle}</p>
          )}
        </div>

        <div className="flex items-center gap-1.5">
          <button
            onClick={() => navigate('/history')}
            className="flex h-9 items-center gap-1.5 rounded-xl bg-secondary/50 px-3 text-xs font-medium text-muted-foreground transition-all hover:bg-secondary hover:text-foreground"
            aria-label="View history"
          >
            <History className="h-3.5 w-3.5" />
            History
          </button>

          <div className="relative">
            <button
              type="button"
              onClick={() => setMenuOpen((o) => !o)}
              className="flex h-9 w-9 items-center justify-center rounded-xl bg-secondary/50 text-muted-foreground transition-all hover:bg-secondary hover:text-foreground"
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
                <div className="absolute right-0 top-full z-50 mt-1.5 w-56 overflow-hidden rounded-xl border border-border/50 bg-card shadow-2xl shadow-black/30 animate-scale-in">
                  <div className="border-b border-border/40 px-3.5 py-3">
                    <p className="truncate text-sm font-medium">
                      {user?.name || 'Account'}
                    </p>
                    <p className="truncate text-xs text-muted-foreground mt-0.5">
                      {user?.email}
                    </p>
                  </div>
                  <div className="p-1.5">
                    <button
                      type="button"
                      onClick={() => {
                        setMenuOpen(false);
                        navigate('/settings');
                      }}
                      className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm transition-colors hover:bg-secondary/60"
                    >
                      <Settings className="h-4 w-4 text-muted-foreground" />
                      Settings
                    </button>
                    <button
                      type="button"
                      onClick={handleLogout}
                      disabled={loggingOut}
                      className={cn(
                        'flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm transition-colors hover:bg-destructive/10',
                        'text-destructive disabled:opacity-40'
                      )}
                    >
                      <LogOut className="h-4 w-4" />
                      {loggingOut ? 'Signing out…' : 'Sign out'}
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
