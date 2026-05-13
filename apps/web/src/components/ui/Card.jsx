import { cn } from '@/lib/utils';

export function Card({ children, className, padding = true, hover = false }) {
  // `padding` may be passed as a string (legacy "p-4") or boolean.
  const pad = padding === true ? 'p-6' : typeof padding === 'string' ? padding : '';
  return (
    <div
      className={cn(
        'relative rounded-3xl border border-white/70 bg-white/85 shadow-card ring-1 ring-slate-900/5 backdrop-blur-xl',
        hover && 'lift hover:shadow-card-lg',
        pad,
        className
      )}
    >
      {children}
    </div>
  );
}

export function CardHeader({ title, subtitle, children, className }) {
  return (
    <div className={cn('mb-5 flex items-start justify-between gap-4', className)}>
      <div>
        {title && <h3 className="text-lg font-bold tracking-tight text-slate-900">{title}</h3>}
        {subtitle && <p className="mt-0.5 text-sm text-slate-500">{subtitle}</p>}
      </div>
      {children}
    </div>
  );
}
