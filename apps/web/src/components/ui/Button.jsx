import { cn } from '@/lib/utils';

export function Button({ children, variant = 'primary', size = 'md', loading, disabled, className, ...props }) {
  const base =
    'relative inline-flex items-center justify-center gap-2 font-bold rounded-2xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.97] select-none';
  const variants = {
    primary:
      'text-white bg-gradient-to-r from-green-600 via-green-500 to-orchid-500 bg-[length:200%_auto] hover:bg-[position:right_center] shadow-glow focus:ring-green-400',
    pink:
      'text-white bg-gradient-to-r from-orchid-600 to-orchid-400 hover:from-orchid-700 hover:to-orchid-500 shadow-glow-pink focus:ring-orchid-400',
    secondary: 'bg-slate-900 text-white hover:bg-slate-800 focus:ring-slate-500 shadow-card',
    danger: 'text-white bg-gradient-to-r from-rose-600 to-orchid-600 hover:from-rose-700 hover:to-orchid-700 focus:ring-rose-400 shadow-card',
    ghost: 'text-slate-600 hover:bg-slate-900/5 hover:text-slate-900 focus:ring-slate-300',
    outline: 'border-2 border-green-200 bg-white/80 text-green-800 hover:border-green-400 hover:bg-green-50 focus:ring-green-400',
    link: 'text-green-700 underline-offset-4 hover:underline hover:text-orchid-600',
  };
  const sizes = {
    sm: 'px-3.5 py-1.5 text-xs',
    md: 'px-5 py-2.5 text-sm',
    lg: 'px-7 py-3.5 text-base',
  };
  return (
    <button className={cn(base, variants[variant], sizes[size], className)} disabled={disabled || loading} {...props}>
      {loading && (
        <svg className="animate-spin -ml-1 h-4 w-4" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
      )}
      {children}
    </button>
  );
}

const fieldBase =
  'w-full px-4 py-2.5 rounded-xl text-sm bg-white/90 border-2 shadow-sm transition-all placeholder:text-slate-400 focus:outline-none focus:ring-4 focus:ring-green-500/15 focus:border-green-400';

export function Input({ label, error, className, ...props }) {
  return (
    <div className={cn('w-full', className)}>
      {label && <label className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-slate-600">{label}</label>}
      <input className={cn(fieldBase, error ? 'border-rose-400' : 'border-slate-200')} {...props} />
      {error && <p className="mt-1 text-xs font-semibold text-rose-600">{error}</p>}
    </div>
  );
}

export function Select({ label, error, options = [], className, children, ...props }) {
  return (
    <div className={cn('w-full', className)}>
      {label && <label className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-slate-600">{label}</label>}
      <select className={cn(fieldBase, error ? 'border-rose-400' : 'border-slate-200')} {...props}>
        {children || (
          <>
            <option value="">Select...</option>
            {options.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </>
        )}
      </select>
      {error && <p className="mt-1 text-xs font-semibold text-rose-600">{error}</p>}
    </div>
  );
}

export function Textarea({ label, error, className, ...props }) {
  return (
    <div className={cn('w-full', className)}>
      {label && <label className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-slate-600">{label}</label>}
      <textarea className={cn(fieldBase, error ? 'border-rose-400' : 'border-slate-200')} rows={4} {...props} />
      {error && <p className="mt-1 text-xs font-semibold text-rose-600">{error}</p>}
    </div>
  );
}
