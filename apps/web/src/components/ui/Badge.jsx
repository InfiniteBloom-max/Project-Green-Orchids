import { cn } from '@/lib/utils';

export function Badge({ children, variant = 'default', className }) {
  const variants = {
    default: 'bg-slate-100 text-slate-700 ring-slate-200',
    success: 'bg-green-100 text-green-800 ring-green-200',
    warning: 'bg-amber-100 text-amber-800 ring-amber-200',
    danger: 'bg-rose-100 text-rose-700 ring-rose-200',
    info: 'bg-sky-100 text-sky-800 ring-sky-200',
    purple: 'bg-plum-400/15 text-plum-600 ring-plum-400/30',
    pink: 'bg-orchid-100 text-orchid-700 ring-orchid-200',
  };
  return (
    <span className={cn('pill ring-1 ring-inset', variants[variant], className)}>
      {children}
    </span>
  );
}
