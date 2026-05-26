import { useMemo, useEffect, useState, useCallback } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Sparkles, Loader2 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { useCategories } from '@/hooks/useCategories';
import { useCreateTransaction } from '@/hooks/useTransactions';
import { useAiKey } from '@/hooks/useAiKey';
import { suggestCategory } from '@/api/ai';
import { toast } from 'sonner';
import { friendlyError } from '@/utils/friendlyError';
import { cn } from '@/lib/utils';

const schema = z.object({
  amount: z.coerce.number().positive('Amount must be greater than 0'),
  category: z.string().min(1, 'Category is required'),
  customCategory: z.string().optional(),
  date: z.string().min(1, 'Date is required'),
  note: z.string().optional(),
});

export default function AddExpenseModal({ open, onOpenChange, prefill }) {
  const { data: categories = [] } = useCategories();
  const createTx = useCreateTransaction();
  const { hasKey } = useAiKey();
  const [suggesting, setSuggesting] = useState(false);
  const [aiSuggestedCat, setAiSuggestedCat] = useState(false);

  const {
    register,
    handleSubmit,
    control,
    watch,
    reset,
    setValue,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      amount: '',
      category: '',
      customCategory: '',
      date: new Date().toISOString().split('T')[0],
      note: '',
    },
  });

  const selectedCategory = watch('category');
  const noteValue = watch('note');

  useEffect(() => {
    if (open && prefill) {
      reset({
        amount: prefill.amount ?? '',
        category: prefill.category ?? '',
        customCategory: '',
        date: prefill.date ?? new Date().toISOString().split('T')[0],
        note: prefill.note ?? '',
      });
      setAiSuggestedCat(!!prefill.category);
    } else if (open && !prefill) {
      reset({
        amount: '',
        category: '',
        customCategory: '',
        date: new Date().toISOString().split('T')[0],
        note: '',
      });
      setAiSuggestedCat(false);
    }
  }, [open, prefill, reset]);

  const categoryItems = useMemo(
    () =>
      categories.map((c) => (
        <SelectItem key={c.id} value={c.name}>
          <span className="flex items-center gap-2">
            <span
              className="h-2 w-2 rounded-full flex-shrink-0"
              style={{ backgroundColor: c.color }}
            />
            {c.name}
          </span>
        </SelectItem>
      )),
    [categories]
  );

  const runSuggest = useCallback(
    async (note) => {
      if (!hasKey || !note?.trim() || note.trim().length < 3) return;
      setSuggesting(true);
      try {
        const r = await suggestCategory({ note: note.trim() });
        if (r.confidence > 0.5 && r.category) {
          setValue('category', r.category);
          setAiSuggestedCat(true);
          toast.success(`AI suggested: ${r.category}`, { duration: 2000 });
        }
      } catch (e) {
        if (e.status !== 412) toast.error(friendlyError(e));
      } finally {
        setSuggesting(false);
      }
    },
    [hasKey, setValue]
  );

  useEffect(() => {
    if (!open || !hasKey || selectedCategory) return undefined;
    const t = setTimeout(() => {
      if (noteValue?.trim().length >= 4) runSuggest(noteValue);
    }, 700);
    return () => clearTimeout(t);
  }, [noteValue, open, hasKey, selectedCategory, runSuggest]);

  const onSubmit = async (data) => {
    const category =
      data.category === 'Other' && data.customCategory?.trim()
        ? data.customCategory.trim()
        : data.category;

    await createTx.mutateAsync({
      amount: data.amount,
      category,
      date: new Date(data.date).toISOString(),
      note: data.note || null,
      source: prefill?.source || (aiSuggestedCat ? 'ai_suggest' : 'manual'),
    });

    reset();
    setAiSuggestedCat(false);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md mx-3 sm:mx-auto">
        <DialogHeader>
          <DialogTitle>Add Expense</DialogTitle>
          <DialogDescription>Track a new expense entry.</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="expense-amount">Amount (₹)</Label>
            <Input
              id="expense-amount"
              type="number"
              step="0.01"
              placeholder="0.00"
              {...register('amount', { valueAsNumber: true })}
            />
            {errors.amount && (
              <p className="text-xs text-destructive">{errors.amount.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between gap-2">
              <Label htmlFor="expense-category" className="flex items-center gap-1.5">
                Category
                {aiSuggestedCat && (
                  <span className="inline-flex items-center gap-1 rounded-md bg-primary/10 px-1.5 py-0.5 text-[10px] font-medium text-primary">
                    <Sparkles className="h-2.5 w-2.5" />
                    AI
                  </span>
                )}
              </Label>
              {hasKey && (
                <button
                  type="button"
                  onClick={() => runSuggest(noteValue)}
                  disabled={suggesting || !noteValue?.trim()}
                  className={cn(
                    'flex h-8 w-8 items-center justify-center rounded-lg transition-all',
                    'text-primary hover:bg-primary/10 disabled:opacity-30'
                  )}
                  aria-label="Suggest category from note"
                  title="Suggest category"
                >
                  {suggesting ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Sparkles className="h-3.5 w-3.5" />
                  )}
                </button>
              )}
            </div>
            <Controller
              name="category"
              control={control}
              render={({ field }) => (
                <Select
                  onValueChange={(v) => {
                    field.onChange(v);
                    setAiSuggestedCat(false);
                  }}
                  value={field.value}
                >
                  <SelectTrigger id="expense-category">
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>{categoryItems}</SelectContent>
                </Select>
              )}
            />
            {errors.category && (
              <p className="text-xs text-destructive">{errors.category.message}</p>
            )}
          </div>

          {selectedCategory === 'Other' && (
            <div className="space-y-2 animate-slide-up">
              <Label htmlFor="expense-custom-cat">Custom Category</Label>
              <Input
                id="expense-custom-cat"
                placeholder="e.g. Gym, Subscription..."
                {...register('customCategory')}
              />
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="expense-date">Date</Label>
            <Input id="expense-date" type="date" {...register('date')} />
            {errors.date && (
              <p className="text-xs text-destructive">{errors.date.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="expense-note">Note (optional)</Label>
            <Input id="expense-note" placeholder="e.g. Uber to airport" {...register('note')} />
          </div>

          <Button type="submit" className="w-full" disabled={createTx.isPending}>
            {createTx.isPending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Adding…
              </>
            ) : (
              'Add Expense'
            )}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
