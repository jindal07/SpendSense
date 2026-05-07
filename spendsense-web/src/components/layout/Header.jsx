import { useNavigate } from 'react-router-dom';
import { History } from 'lucide-react';

export default function Header({ title, subtitle }) {
  const navigate = useNavigate();

  return (
    <header className="flex items-center justify-between px-4 pt-6 pb-2">
      <div>
        <h1 className="text-xl font-bold tracking-tight">{title}</h1>
        {subtitle && (
          <p className="mt-0.5 text-sm text-muted-foreground">{subtitle}</p>
        )}
      </div>
      <button
        id="header-history-btn"
        onClick={() => navigate('/history')}
        className="flex items-center gap-1.5 rounded-lg bg-secondary px-3 py-2 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
        aria-label="View history"
      >
        <History className="h-4 w-4" />
        History
      </button>
    </header>
  );
}
