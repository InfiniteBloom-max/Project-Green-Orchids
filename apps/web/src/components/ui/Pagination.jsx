'use client';

import { cn } from '@/lib/utils';

export function Pagination({ page = 1, totalPages = 1, onChange, className }) {
  if (totalPages <= 1) return null;

  const pages = [];
  for (let i = 1; i <= totalPages; i++) {
    if (i === 1 || i === totalPages || (i >= page - 1 && i <= page + 1)) {
      pages.push(i);
    } else if (pages[pages.length - 1] !== '...') {
      pages.push('...');
    }
  }

  return (
    <div className={cn('flex items-center justify-between px-4 py-3', className)}>
      <button
        onClick={() => onChange(page - 1)}
        disabled={page <= 1}
        className="px-3 py-1 text-sm border rounded disabled:opacity-50 hover:bg-gray-50"
      >
        Prev
      </button>
      <div className="flex items-center space-x-1">
        {pages.map((p, i) =>
          p === '...' ? (
            <span key={`dots-${i}`} className="px-2 text-gray-400">...</span>
          ) : (
            <button
              key={p}
              onClick={() => onChange(p)}
              className={cn(
                'px-3 py-1 text-sm rounded',
                p === page ? 'bg-green-700 text-white' : 'hover:bg-gray-100'
              )}
            >
              {p}
            </button>
          )
        )}
      </div>
      <button
        onClick={() => onChange(page + 1)}
        disabled={page >= totalPages}
        className="px-3 py-1 text-sm border rounded disabled:opacity-50 hover:bg-gray-50"
      >
        Next
      </button>
    </div>
  );
}
