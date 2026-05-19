import { AlertTriangle, Loader2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

/**
 * Modern confirmation dialog — replaces `window.confirm`.
 *
 * Props:
 *  - open / onOpenChange  : controlled state from the parent.
 *  - title / description  : copy shown to the user.
 *  - confirmLabel         : label for the destructive action (default "Confirm").
 *  - cancelLabel          : label for the cancel action  (default "Cancel").
 *  - variant              : "destructive" (default) | "default" — colours the
 *                            confirm button and the leading icon.
 *  - loading              : disables actions and shows a spinner on confirm.
 *  - onConfirm            : called when the user confirms.
 */
export default function ConfirmDialog({
  open,
  onOpenChange,
  title = 'Are you sure?',
  description,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  variant = 'destructive',
  loading = false,
  onConfirm,
}) {
  const isDestructive = variant === 'destructive';

  const handleConfirm = async () => {
    if (loading) return;
    await onConfirm?.();
  };

  return (
    <Dialog open={open} onOpenChange={loading ? undefined : onOpenChange}>
      <DialogContent
        className="max-w-sm mx-3 sm:mx-auto"
        onPointerDownOutside={(e) => loading && e.preventDefault()}
        onEscapeKeyDown={(e) => loading && e.preventDefault()}
      >
        <DialogHeader>
          <div className="flex items-start gap-3">
            <div
              className={cn(
                'flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full',
                isDestructive
                  ? 'bg-destructive/15 text-destructive'
                  : 'bg-primary/15 text-primary'
              )}
            >
              <AlertTriangle className="h-5 w-5" />
            </div>
            <div className="flex-1 text-left">
              <DialogTitle className="text-base">{title}</DialogTitle>
              {description && (
                <DialogDescription className="mt-1 text-sm">
                  {description}
                </DialogDescription>
              )}
            </div>
          </div>
        </DialogHeader>

        <div className="mt-2 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={loading}
            className="sm:min-w-[90px]"
          >
            {cancelLabel}
          </Button>
          <Button
            type="button"
            variant={isDestructive ? 'destructive' : 'default'}
            onClick={handleConfirm}
            disabled={loading}
            className="sm:min-w-[110px]"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Please wait
              </>
            ) : (
              confirmLabel
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
