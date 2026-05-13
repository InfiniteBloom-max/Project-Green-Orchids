import { cn } from '@/lib/utils';

export function Spinner({ size = 'md', className }) {
  const sizes = { sm: 'h-4 w-4 border-2', md: 'h-9 w-9 border-[3px]', lg: 'h-14 w-14 border-4' };
  return (
    <div className={cn('flex items-center justify-center', className)}>
      <div className="relative">
        <div className={cn('animate-spin rounded-full border-green-500 border-t-orchid-500', sizes[size])} />
        <div className={cn('absolute inset-0 animate-ping rounded-full border border-green-300 opacity-30', sizes[size])} />
      </div>
    </div>
  );
}

export function EmptyState({ title = 'Nothing here yet', description, action, icon }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-3xl border-2 border-dashed border-slate-200 bg-white/50 py-14 text-center">
      <div className="mb-4 grid h-16 w-16 place-items-center rounded-3xl bg-gradient-to-br from-green-100 to-orchid-100 text-3xl">
        {icon || '🌱'}
      </div>
      <h3 className="text-base font-bold text-slate-900">{title}</h3>
      {description && <p className="mt-1 max-w-sm text-sm text-slate-500">{description}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

export function ErrorState({ title = 'Something went wrong', message, onRetry }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-3xl border-2 border-dashed border-rose-200 bg-rose-50/40 py-14 text-center">
      <div className="mb-4 grid h-16 w-16 place-items-center rounded-3xl bg-gradient-to-br from-rose-100 to-orchid-100 text-3xl">⚠️</div>
      <h3 className="text-base font-bold text-slate-900">{title}</h3>
      {message && <p className="mt-1 max-w-sm text-sm text-slate-500">{message}</p>}
      {onRetry && (
        <button onClick={onRetry} className="mt-5 rounded-2xl bg-gradient-to-r from-green-600 to-green-500 px-5 py-2.5 text-sm font-bold text-white shadow-glow transition hover:shadow-card-lg">
          Try again
        </button>
      )}
    </div>
  );
}

export function Skeleton({ className }) {
  return <div className={cn('shimmer rounded-xl bg-slate-100', className)} />;
}
