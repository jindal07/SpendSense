import { AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export function ErrorState({ error, onRetry, className }) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center text-center py-8 px-6 rounded-2xl border border-danger/30 bg-danger/5',
        className
      )}
    >
      <div className="h-12 w-12 rounded-2xl bg-danger/10 text-danger flex items-center justify-center mb-3">
        <AlertTriangle className="h-6 w-6" />
      </div>
      <h3 className="font-semibold">Something went wrong</h3>
      <p className="text-sm text-muted-foreground mt-1 max-w-xs">
        {error?.message ?? 'Please try again.'}
      </p>
      {onRetry && (
        <Button variant="secondary" className="mt-4" onClick={onRetry}>
          Retry
        </Button>
      )}
    </div>
  );
}
