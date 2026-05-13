'use client';

import { useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';

export function Modal({ open, onClose, title, children, size = 'md', className }) {
  const ref = useRef(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [open, onClose]);

  if (!open) return null;

  const sizes = { sm: 'max-w-md', md: 'max-w-lg', lg: 'max-w-2xl', xl: 'max-w-4xl' };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm animate-fade-up" onClick={onClose} />
      <div ref={ref} className={cn('relative w-full overflow-hidden rounded-3xl bg-white shadow-pop ring-1 ring-slate-900/5 animate-fade-up', sizes[size], className)}>
        {title && (
          <div className="flex items-center justify-between border-b border-slate-100 bg-gradient-to-r from-green-50/60 to-orchid-50/40 px-6 py-4">
            <h3 className="text-lg font-bold tracking-tight text-slate-900">{title}</h3>
            <button onClick={onClose} className="grid h-8 w-8 place-items-center rounded-full text-slate-400 transition hover:bg-slate-100 hover:text-slate-700">
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          </div>
        )}
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
}
