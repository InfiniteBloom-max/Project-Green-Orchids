import { cn } from '@/lib/utils';

export function Stepper({ steps = [], current = 0, className }) {
  return (
    <div className={cn('flex items-center', className)}>
      {steps.map((step, i) => (
        <div key={i} className="flex items-center flex-1 last:flex-none">
          <div className="flex items-center">
            <div
              className={cn(
                'w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium',
                i < current
                  ? 'bg-green-700 text-white'
                  : i === current
                  ? 'border-2 border-green-700 text-green-700'
                  : 'border-2 border-gray-300 text-gray-400'
              )}
            >
              {i < current ? '✓' : i + 1}
            </div>
            <span className={cn('ml-2 text-sm', i <= current ? 'text-gray-900 font-medium' : 'text-gray-400')}>
              {step}
            </span>
          </div>
          {i < steps.length - 1 && (
            <div className={cn('flex-1 mx-4 h-0.5', i < current ? 'bg-green-700' : 'bg-gray-200')} />
          )}
        </div>
      ))}
    </div>
  );
}
