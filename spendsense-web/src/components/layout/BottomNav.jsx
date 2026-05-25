import { useNavigate, useLocation } from 'react-router-dom';
import { Home, BarChart3, Plus, Camera, Mic, MessageCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import { useAiKey } from '@/hooks/useAiKey';

export default function BottomNav({ onAdd, onScan, onVoice, onChat }) {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const { hasKey } = useAiKey();

  const tabs = [
    { icon: Home, label: 'Home', path: '/' },
    { icon: BarChart3, label: 'Stats', path: '/stats' },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 pb-safe">
      <div className="mx-auto max-w-xl px-3 pb-2">
        <div className="flex items-center justify-between rounded-2xl border border-border/40 bg-card/80 backdrop-blur-xl px-2 py-2 shadow-lg shadow-black/20">
          <NavTab
            icon={tabs[0].icon}
            label={tabs[0].label}
            active={pathname === tabs[0].path}
            onClick={() => navigate(tabs[0].path)}
          />

          <div className="flex items-center gap-0.5">
            <AiAction icon={Camera} label="Scan" onClick={onScan} disabled={!hasKey} />
            <AiAction icon={Mic} label="Voice" onClick={onVoice} disabled={!hasKey} />

            <button
              onClick={onAdd}
              className="relative mx-1 flex h-12 w-12 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-md shadow-primary/25 transition-all duration-200 hover:shadow-lg hover:shadow-primary/30 active:scale-95"
              aria-label="Add expense"
            >
              <Plus className="h-5 w-5" strokeWidth={2.5} />
            </button>

            <AiAction icon={MessageCircle} label="Coach" onClick={onChat} disabled={!hasKey} />
          </div>

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
        'relative flex flex-col items-center gap-1 rounded-xl px-4 py-2 text-[10px] font-medium transition-colors min-h-[44px] min-w-[52px]',
        active ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
      )}
      aria-label={label}
    >
      <Icon className="h-5 w-5" />
      <span>{label}</span>
      {active && (
        <motion.div
          layoutId="nav-indicator"
          className="absolute -bottom-0.5 h-[3px] w-5 rounded-full bg-primary"
          transition={{ type: 'spring', stiffness: 400, damping: 30 }}
        />
      )}
    </button>
  );
}

function AiAction({ icon: Icon, label, onClick, disabled }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={cn(
        'flex flex-col items-center justify-center rounded-xl px-1.5 py-1.5 min-h-[44px] min-w-[38px] text-[9px] font-medium transition-all',
        disabled
          ? 'opacity-25 cursor-not-allowed'
          : 'text-muted-foreground hover:text-primary hover:bg-secondary/50 active:scale-95'
      )}
      aria-label={label}
    >
      <Icon className="h-4 w-4" />
      <span className="mt-0.5">{label}</span>
    </button>
  );
}
