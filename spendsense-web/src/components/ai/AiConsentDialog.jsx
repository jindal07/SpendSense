import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { recordAiConsent } from '@/api/ai';
import { Shield } from 'lucide-react';
import { toast } from 'sonner';
import { friendlyError } from '@/utils/friendlyError';

export default function AiConsentDialog({ open, onOpenChange, onAccepted }) {
  const handleAccept = async () => {
    try {
      await recordAiConsent();
      onAccepted?.();
      onOpenChange(false);
    } catch (e) {
      toast.error(friendlyError(e));
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <div className="flex items-start gap-3.5">
            <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl bg-primary/10">
              <Shield className="h-5 w-5 text-primary" />
            </div>
            <div className="text-left">
              <DialogTitle>AI Privacy Notice</DialogTitle>
              <DialogDescription className="space-y-2.5 pt-2 leading-relaxed">
                <p>
                  When you use AI features, expense notes, voice transcripts, receipt images,
                  and recent spending summaries are sent to Google Gemini using your own API key.
                </p>
                <p>SpendSense encrypts your key and does not store raw transcripts or images.</p>
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>
        <div className="flex flex-col-reverse gap-2.5 sm:flex-row sm:justify-end mt-1">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleAccept}>I understand, continue</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
