'use client';

import { cn } from '@/lib/utils';

export function Tabs({ tabs = [], active, onChange, className }) {
  return (
    <div className={cn('inline-flex flex-wrap items-center gap-1 rounded-2xl border border-white/70 bg-white/70 p-1.5 shadow-sm backdrop-blur', className)}>
      {tabs.map((tab) => {
        const isActive = active === tab.key;
        return (
          <button
            key={tab.key}
            onClick={() => onChange(tab.key)}
            className={cn(
              'whitespace-nowrap rounded-xl px-4 py-2 text-sm font-bold transition-all',
              isActive ? 'bg-gradient-to-r from-green-600 to-green-500 text-white shadow-glow' : 'text-slate-500 hover:bg-slate-900/5 hover:text-slate-800'
            )}
          >
            {tab.label}
            {tab.count != null && (
              <span className={cn('ml-2 rounded-full px-1.5 py-0.5 text-[11px] font-bold', isActive ? 'bg-white/25 text-white' : 'bg-slate-100 text-slate-500')}>{tab.count}</span>
            )}
          </button>
        );
      })}
    </div>
  );
}
