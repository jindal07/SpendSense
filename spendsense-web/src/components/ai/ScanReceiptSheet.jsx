import { useState, useRef } from 'react';
import { Camera, Loader2, Sparkles, AlertCircle } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { scanReceipt } from '@/api/ai';
import { useCreateTransaction } from '@/hooks/useTransactions';
import { useCategories } from '@/hooks/useCategories';
import { useAiKey } from '@/hooks/useAiKey';
import AiUnavailable from './AiUnavailable';
import { prepareReceiptFile } from '@/utils/imagePrep';
import { toast } from 'sonner';
import { friendlyError } from '@/utils/friendlyError';

export default function ScanReceiptSheet({ open, onOpenChange }) {
  const { hasKey } = useAiKey();
  const createTx = useCreateTransaction();
  const { data: categories = [] } = useCategories();
  const fileRef = useRef(null);
  const [step, setStep] = useState('pick');
  const [scanning, setScanning] = useState(false);
  const [preview, setPreview] = useState(null);
  const [form, setForm] = useState(null);
  const [isPdf, setIsPdf] = useState(false);
  const [scanError, setScanError] = useState(null);

  const resetState = () => {
    if (preview) URL.revokeObjectURL(preview);
    setStep('pick');
    setPreview(null);
    setForm(null);
    setIsPdf(false);
    setScanError(null);
  };

  const handleClose = (v) => {
    if (!v) resetState();
    onOpenChange(v);
  };

  const handleFile = async (file) => {
    if (!file) return;
    setScanning(true);
    setStep('scan');
    setScanError(null);
    try {
      const prepared = await prepareReceiptFile(file);
      setIsPdf(file.type === 'application/pdf');
      setPreview(URL.createObjectURL(prepared));
      const result = await scanReceipt(prepared);
      if (result.possibleDuplicate) {
        toast.warning('Similar expense exists in the last 7 days');
      }
      setForm({
        amount: result.total ?? '',
        category: result.suggestedCategory ?? '',
        date: result.date?.slice(0, 10) ?? new Date().toISOString().slice(0, 10),
        note: result.merchant ? `${result.merchant}` : '',
        merchant: result.merchant,
      });
      setStep('confirm');
    } catch (e) {
      const msg = friendlyError(e);
      setScanError(msg);
      toast.error(msg);
      setStep('pick');
    } finally {
      setScanning(false);
    }
  };

  const handleSubmit = async () => {
    if (!form?.amount || !form?.category) return;
    await createTx.mutateAsync({
      amount: Number(form.amount),
      category: form.category,
      date: new Date(form.date).toISOString(),
      note: form.note || null,
      source: 'ai_scan',
    });
    handleClose(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Camera className="h-5 w-5" />
            Scan Receipt
          </DialogTitle>
          <DialogDescription>Upload or capture a bill to auto-fill an expense.</DialogDescription>
        </DialogHeader>

        {!hasKey ? (
          <AiUnavailable />
        ) : step === 'pick' ? (
          <div className="space-y-4 py-2">
            {scanError && (
              <div className="flex items-start gap-2 rounded-xl bg-destructive/10 border border-destructive/20 px-3 py-2.5 text-sm text-destructive">
                <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                <span>{scanError}</span>
              </div>
            )}
            <input
              ref={fileRef}
              type="file"
              accept="image/*,application/pdf"
              capture="environment"
              className="hidden"
              onChange={(e) => handleFile(e.target.files?.[0])}
            />
            <Button
              className="w-full"
              size="lg"
              onClick={() => fileRef.current?.click()}
            >
              <Camera className="h-5 w-5" />
              Take photo or upload
            </Button>
          </div>
        ) : step === 'scan' ? (
          <div className="flex flex-col items-center py-12 gap-3">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">Reading receipt…</p>
          </div>
        ) : (
          <div className="space-y-4">
            {preview && (
              isPdf ? (
                <div className="flex items-center justify-center rounded-xl bg-secondary/30 py-8 text-sm text-muted-foreground">
                  PDF uploaded successfully
                </div>
              ) : (
                <img
                  src={preview}
                  alt="Receipt"
                  className="max-h-36 w-full rounded-xl object-contain bg-secondary/30"
                />
              )
            )}
            <div className="grid gap-3.5">
              <div className="space-y-2">
                <Label>Amount (₹)</Label>
                <Input
                  type="number"
                  value={form.amount}
                  onChange={(e) => setForm({ ...form, amount: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Category</Label>
                <Select
                  value={form.category}
                  onValueChange={(v) => setForm({ ...form, category: v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((c) => (
                      <SelectItem key={c.id} value={c.name}>
                        <span className="flex items-center gap-2">
                          <span className="h-2 w-2 rounded-full flex-shrink-0" style={{ backgroundColor: c.color }} />
                          {c.name}
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Date</Label>
                <Input
                  type="date"
                  value={form.date}
                  onChange={(e) => setForm({ ...form, date: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Note</Label>
                <Input
                  value={form.note}
                  onChange={(e) => setForm({ ...form, note: e.target.value })}
                />
              </div>
            </div>
            <Button className="w-full" onClick={handleSubmit} disabled={createTx.isPending}>
              {createTx.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  <Sparkles className="h-4 w-4" />
                  Add expense
                </>
              )}
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
