import { cn } from '@/lib/utils';

export default function PageContainer({ className, children }) {
  return (
    <div className={cn('mx-auto max-w-lg px-4 pb-4', className)}>
      {children}
    </div>
  );
}
