import { motion } from 'framer-motion';
import { Receipt } from 'lucide-react';

export default function EmptyState({ message = 'No expenses yet', subtitle = 'Tap the + button to add your first expense.' }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="flex flex-col items-center justify-center py-16 text-center"
    >
      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-secondary">
        <Receipt className="h-8 w-8 text-muted-foreground" />
      </div>
      <h3 className="text-lg font-semibold">{message}</h3>
      <p className="mt-1 max-w-xs text-sm text-muted-foreground">{subtitle}</p>
    </motion.div>
  );
}
