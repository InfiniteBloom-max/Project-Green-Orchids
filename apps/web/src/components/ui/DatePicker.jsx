'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils';

export function DatePicker({ value, onChange, label, error, className, min, max }) {
  return (
    <div className={cn('w-full', className)}>
      {label && <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>}
      <input
        type="date"
        value={value || ''}
        onChange={(e) => onChange(e.target.value)}
        min={min}
        max={max}
        className={cn(
          'w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500',
          error ? 'border-red-500' : 'border-gray-300'
        )}
      />
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  );
}
