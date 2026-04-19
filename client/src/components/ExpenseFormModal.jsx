import { useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

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
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select';
import { useCategories } from '@/hooks/useCategories';
import { useCreateTransaction } from '@/hooks/useTransactions';
import { toInputDate } from '@/lib/format';
import { cn } from '@/lib/utils';

const schema = z
  .object({
    amount: z
      .string()
      .min(1, 'Amount is required')
      .refine((v) => !Number.isNaN(Number(v)) && Number(v) > 0, {
        message: 'Must be greater than 0',
      }),
    category: z.string().min(1, 'Select a category'),
    customCategory: z
      .string()
      .max(40, 'Max 40 characters')
      .optional(),
    date: z.string().min(1, 'Date is required'),
    note: z.string().max(140, 'Max 140 characters').optional(),
  })
  .superRefine((data, ctx) => {
    if (
      data.category === 'Other' &&
      (!data.customCategory || data.customCategory.trim().length === 0)
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['customCategory'],
        message: 'Please name this expense',
      });
    }
  });

export function ExpenseFormModal({ open, onOpenChange }) {
  const { data: categories = [], isLoading: loadingCategories } = useCategories();
  const createMutation = useCreateTransaction();

  const {
    register,
    handleSubmit,
    reset,
    control,
    watch,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      amount: '',
      category: '',
      customCategory: '',
      date: toInputDate(new Date()),
      note: '',
    },
  });

  const selectedCategory = watch('category');
  const isOther = selectedCategory === 'Other';

  useEffect(() => {
    if (open) {
      reset({
        amount: '',
        category: categories[0]?.name ?? '',
        customCategory: '',
        date: toInputDate(new Date()),
        note: '',
      });
    }
  }, [open, categories, reset]);

  const onSubmit = async (data) => {
    const finalCategory =
      data.category === 'Other' && data.customCategory?.trim()
        ? data.customCategory.trim()
        : data.category;

    const payload = {
      amount: Number(data.amount),
      category: finalCategory,
      date: new Date(data.date).toISOString(),
      note: data.note?.trim() ? data.note.trim() : null,
    };
    onOpenChange(false);
    createMutation.mutate(payload);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Expense</DialogTitle>
          <DialogDescription>
            Log an expense in a few seconds.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Field
            label="Amount"
            error={errors.amount?.message}
            htmlFor="amount"
          >
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-lg">
                ₹
              </span>
              <Input
                id="amount"
                type="number"
                step="0.01"
                min="0"
                inputMode="decimal"
                autoFocus
                placeholder="0.00"
                className="pl-8 text-lg h-12"
                {...register('amount')}
              />
            </div>
          </Field>

          <Field
            label="Category"
            error={errors.category?.message}
            htmlFor="category"
          >
            <Controller
              control={control}
              name="category"
              render={({ field }) => (
                <Select
                  value={field.value}
                  onValueChange={field.onChange}
                  disabled={loadingCategories}
                >
                  <SelectTrigger id="category">
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((c) => (
                      <SelectItem key={c.id} value={c.name}>
                        <span className="inline-flex items-center gap-2">
                          <span
                            className="h-2.5 w-2.5 rounded-full"
                            style={{ backgroundColor: c.color }}
                          />
                          {c.name}
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
          </Field>

          {isOther && (
            <Field
              label="Custom name"
              error={errors.customCategory?.message}
              htmlFor="customCategory"
            >
              <Input
                id="customCategory"
                type="text"
                maxLength={40}
                placeholder="e.g. Birthday gift, Haircut, Parking"
                autoComplete="off"
                {...register('customCategory')}
              />
            </Field>
          )}

          <Field label="Date" error={errors.date?.message} htmlFor="date">
            <Input
              id="date"
              type="date"
              max={toInputDate(new Date())}
              {...register('date')}
            />
          </Field>

          <Field
            label="Note (optional)"
            error={errors.note?.message}
            htmlFor="note"
          >
            <Textarea
              id="note"
              placeholder="What was it for?"
              maxLength={140}
              {...register('note')}
            />
          </Field>

          <div className="flex gap-2 pt-2">
            <Button
              type="button"
              variant="secondary"
              className="flex-1"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="flex-1"
              disabled={isSubmitting || loadingCategories}
            >
              Add Expense
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function Field({ label, error, htmlFor, children }) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={htmlFor}>{label}</Label>
      {children}
      {error && (
        <p className={cn('text-xs text-danger')} role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
