import { motion } from 'framer-motion';
import { Receipt } from 'lucide-react';

export default function EmptyState({
  message = 'No expenses yet',
  subtitle = 'Tap the + button to add your first expense.',
}) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.97 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      className="flex flex-col items-center justify-center py-20 text-center"
    >
      <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-secondary/60">
        <Receipt className="h-7 w-7 text-muted-foreground/60" />
      </div>
      <h3 className="text-base font-semibold">{message}</h3>
      <p className="mt-1.5 max-w-[260px] text-sm text-muted-foreground leading-relaxed">
        {subtitle}
      </p>
    </motion.div>
  );
}
