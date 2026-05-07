import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { useCategories } from '@/hooks/useCategories';
import { useCreateTransaction } from '@/hooks/useTransactions';
import { Loader2 } from 'lucide-react';

const schema = z.object({
  amount: z.coerce.number().positive('Amount must be greater than 0'),
  category: z.string().min(1, 'Category is required'),
  customCategory: z.string().optional(),
  date: z.string().min(1, 'Date is required'),
  note: z.string().optional(),
});

export default function AddExpenseModal({ open, onOpenChange }) {
  const { data: categories = [] } = useCategories();
  const createTx = useCreateTransaction();

  const {
    register,
    handleSubmit,
    control,
    watch,
    reset,
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
    });

    reset();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md mx-3 sm:mx-auto">
        <DialogHeader>
          <DialogTitle>Add Expense</DialogTitle>
          <DialogDescription>Track a new expense entry.</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 mt-2">
          {/* Amount */}
          <div className="space-y-1.5">
            <Label htmlFor="expense-amount">Amount (₹)</Label>
            <Input
              id="expense-amount"
              type="number"
              step="0.01"
              placeholder="0.00"
              {...register('amount', { valueAsNumber: true })}
            />
            {errors.amount && (
              <p className="text-xs text-red-400">{errors.amount.message}</p>
            )}
          </div>

          {/* Category */}
          <div className="space-y-1.5">
            <Label htmlFor="expense-category">Category</Label>
            <Controller
              name="category"
              control={control}
              render={({ field }) => (
                <Select onValueChange={field.onChange} value={field.value}>
                  <SelectTrigger id="expense-category">
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((c) => (
                      <SelectItem key={c.id} value={c.name}>
                        <span className="flex items-center gap-2">
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
            {errors.category && (
              <p className="text-xs text-red-400">{errors.category.message}</p>
            )}
          </div>

          {/* Custom category when "Other" is selected */}
          {selectedCategory === 'Other' && (
            <div className="space-y-1.5 animate-slide-up">
              <Label htmlFor="expense-custom-cat">Custom Category</Label>
              <Input
                id="expense-custom-cat"
                placeholder="e.g. Gym, Subscription..."
                {...register('customCategory')}
              />
            </div>
          )}

          {/* Date */}
          <div className="space-y-1.5">
            <Label htmlFor="expense-date">Date</Label>
            <Input id="expense-date" type="date" {...register('date')} />
            {errors.date && (
              <p className="text-xs text-red-400">{errors.date.message}</p>
            )}
          </div>

          {/* Note */}
          <div className="space-y-1.5">
            <Label htmlFor="expense-note">Note (optional)</Label>
            <Input id="expense-note" placeholder="Add a note..." {...register('note')} />
          </div>

          <Button
            id="expense-submit-btn"
            type="submit"
            className="w-full"
            disabled={createTx.isPending}
          >
            {createTx.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Adding...
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
