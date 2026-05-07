import { useNavigate, useLocation } from 'react-router-dom';
import { Home, BarChart3, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

export default function BottomNav({ onAdd }) {
  const navigate = useNavigate();
  const { pathname } = useLocation();

  const tabs = [
    { icon: Home, label: 'Home', path: '/' },
    { icon: BarChart3, label: 'Stats', path: '/stats' },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40">
      <div className="mx-auto max-w-lg">
        <div className="glass-card mx-3 mb-3 flex items-center justify-around rounded-2xl px-2 py-2 pb-safe">
          {/* Home tab */}
          <NavTab
            icon={tabs[0].icon}
            label={tabs[0].label}
            active={pathname === tabs[0].path}
            onClick={() => navigate(tabs[0].path)}
          />

          {/* FAB — Add Expense */}
          <button
            id="add-expense-fab"
            onClick={onAdd}
            className="relative -mt-8 flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-indigo-600 text-white shadow-lg shadow-indigo-500/30 transition-transform hover:scale-105 active:scale-95"
            aria-label="Add expense"
          >
            <Plus className="h-7 w-7" />
          </button>

          {/* Stats tab */}
          <NavTab
            icon={tabs[1].icon}
            label={tabs[1].label}
            active={pathname === tabs[1].path}
            onClick={() => navigate(tabs[1].path)}
          />
        </div>
      </div>
    </nav>
  );
}

function NavTab({ icon: Icon, label, active, onClick }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'relative flex flex-col items-center gap-0.5 rounded-xl px-5 py-2 text-xs font-medium transition-colors',
        active ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
      )}
      aria-label={label}
    >
      <Icon className="h-5 w-5" />
      <span>{label}</span>
      {active && (
        <motion.div
          layoutId="nav-indicator"
          className="absolute -bottom-1 h-0.5 w-6 rounded-full bg-primary"
          transition={{ type: 'spring', stiffness: 400, damping: 30 }}
        />
      )}
    </button>
  );
}
