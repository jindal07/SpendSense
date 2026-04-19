import { useState, useEffect } from 'react';
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
import { useCategories } from '@/hooks/useCategories';
import { cn } from '@/lib/utils';

export function FilterDrawer({ open, onOpenChange, value, onApply }) {
  const { data: categories = [] } = useCategories();
  const [local, setLocal] = useState(value);

  useEffect(() => {
    if (open) setLocal(value);
  }, [open, value]);

  const apply = () => {
    onApply(local);
    onOpenChange(false);
  };

  const clear = () => {
    const empty = { from: '', to: '', category: '' };
    setLocal(empty);
    onApply(empty);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Filter transactions</DialogTitle>
          <DialogDescription>
            Narrow down the list by date and category.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="from">From</Label>
              <Input
                id="from"
                type="date"
                value={local.from}
                onChange={(e) => setLocal({ ...local, from: e.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="to">To</Label>
              <Input
                id="to"
                type="date"
                value={local.to}
                onChange={(e) => setLocal({ ...local, to: e.target.value })}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Category</Label>
            <div className="flex flex-wrap gap-2">
              <Chip
                active={!local.category}
                onClick={() => setLocal({ ...local, category: '' })}
              >
                All
              </Chip>
              {categories.map((c) => (
                <Chip
                  key={c.id}
                  active={local.category === c.name}
                  onClick={() => setLocal({ ...local, category: c.name })}
                  color={c.color}
                >
                  {c.name}
                </Chip>
              ))}
            </div>
          </div>

          <div className="flex gap-2 pt-2">
            <Button variant="secondary" className="flex-1" onClick={clear}>
              Clear
            </Button>
            <Button className="flex-1" onClick={apply}>
              Apply
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function Chip({ active, onClick, color, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all',
        active
          ? 'bg-brand-gradient text-white border-white/20 shadow-glow-indigo'
          : 'bg-white/[0.04] text-muted-foreground border-white/10 hover:text-foreground hover:bg-white/[0.07]'
      )}
    >
      {color && (
        <span
          className="h-2 w-2 rounded-full"
          style={{ backgroundColor: color }}
        />
      )}
      {children}
    </button>
  );
}
