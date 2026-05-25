import { cn } from '@/lib/utils';

export default function PageContainer({ className, children }) {
  return (
    <div className={cn('mx-auto w-full max-w-xl px-4 sm:px-6 pb-6', className)}>
      {children}
    </div>
  );
}
