import { useNavigate, useLocation } from 'react-router-dom';
import { Home, BarChart3, Plus, Camera, Mic, MessageCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import { useAiKey } from '@/hooks/useAiKey';

export default function BottomNav({ onAdd, onScan, onVoice, onChat }) {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const { hasKey } = useAiKey();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 pb-safe">
      <div className="mx-auto max-w-xl px-3 pb-2">
        <div className="relative rounded-2xl border border-border/40 bg-card/80 backdrop-blur-xl shadow-lg shadow-black/20 pt-1">
          {/* Elevated center FAB */}
          <div className="absolute left-1/2 -translate-x-1/2 -top-6 z-10">
            <button
              onClick={onAdd}
              className="flex h-[52px] w-[52px] items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-lg shadow-primary/30 ring-4 ring-card/80 transition-all duration-200 hover:shadow-xl hover:shadow-primary/40 active:scale-95"
              aria-label="Add expense"
            >
              <Plus className="h-6 w-6" strokeWidth={2.5} />
            </button>
          </div>

          <div className="grid grid-cols-5 items-end pb-2">
            <NavTab
              icon={Home}
              label="Home"
              active={pathname === '/'}
              onClick={() => navigate('/')}
            />
            <NavTab
              icon={Camera}
              label="Scan"
              onClick={onScan}
              disabled={!hasKey}
            />

            {/* Center column: Voice shortcut beneath FAB */}
            <div className="flex flex-col items-center gap-0.5 pt-4">
              <button
                onClick={onVoice}
                disabled={!hasKey}
                className={cn(
                  'flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-medium transition-all',
                  !hasKey
                    ? 'opacity-30 cursor-not-allowed'
                    : 'text-muted-foreground hover:text-primary hover:bg-primary/10 active:scale-95'
                )}
                aria-label="Voice entry"
              >
                <Mic className="h-3 w-3" />
                <span>Voice</span>
              </button>
            </div>

            <NavTab
              icon={MessageCircle}
              label="Coach"
              onClick={onChat}
              disabled={!hasKey}
            />
            <NavTab
              icon={BarChart3}
              label="Stats"
              active={pathname === '/stats'}
              onClick={() => navigate('/stats')}
            />
          </div>
        </div>
      </div>
    </nav>
  );
}

function NavTab({ icon: Icon, label, active = false, onClick, disabled = false }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={cn(
        'relative flex flex-col items-center gap-1 py-2 text-[10px] font-medium transition-colors min-h-[44px]',
        disabled
          ? 'opacity-30 cursor-not-allowed'
          : active
            ? 'text-primary'
            : 'text-muted-foreground hover:text-foreground active:scale-95'
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
