'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import { KpiCard } from '@/components/domain/StatusBadge';
import { Card } from '@/components/ui/Card';
import { Spinner } from '@/components/ui/Spinner';
import { formatLKR } from '@/lib/utils';

const BUCKET_TONES = {
  '0-30': { bar: 'from-green-400 to-green-500', text: 'text-green-700' },
  '31-60': { bar: 'from-amber-300 to-amber-400', text: 'text-amber-700' },
  '61-90': { bar: 'from-orange-400 to-orange-500', text: 'text-orange-700' },
  '90+': { bar: 'from-rose-500 to-orchid-500', text: 'text-rose-700' },
};

export default function FinanceDashboardPage() {
  const router = useRouter();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const res = await api.get('/finance/dashboard').catch(() => ({ data: {} }));
      setData(res.data);
      setLoading(false);
    })();
  }, []);

  if (loading) return <Spinner className="py-24" size="lg" />;
  const d = data || {};

  const agingBuckets = d.agingBuckets || { '0-30': 0, '31-60': 0, '61-90': 0, '90+': 0 };
  const maxAging = Math.max(...Object.values(agingBuckets), 1);

  return (
    <div className="space-y-7">
      <div className="relative overflow-hidden rounded-3xl bg-brand-dark p-7 text-white shadow-pop md:p-9">
        <div className="blob -top-12 right-8 h-52 w-52 animate-blob bg-sky-500/40" />
        <div className="blob bottom-0 left-1/3 h-44 w-44 animate-blob bg-green-500/40" style={{ animationDelay: '3s' }} />
        <div className="relative">
          <p className="eyebrow text-green-300">Receivables desk</p>
          <h1 className="mt-2 font-display text-3xl font-extrabold tracking-tight md:text-4xl">Finance Dashboard</h1>
          <p className="mt-2 max-w-xl text-white/70">Collections, overdue exposure and aging — at a glance.</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <KpiCard title="Total Receivables" value={formatLKR(d.totalReceivables || 0)} icon="📊" tone="green" />
        <KpiCard title="Overdue Total" value={formatLKR(d.overdueTotal || 0)} icon="⚠️" tone="pink" />
        <KpiCard title="Collected (Month)" value={formatLKR(d.collectedThisMonth || 0)} icon="✅" tone="sky" />
        <KpiCard title="Outstanding Invoices" value={d.outstandingCount || 0} icon="🧾" tone="amber" />
      </div>

      <Card>
        <div className="mb-5 flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-700">Aging analysis</h3>
          <span className="text-xs font-semibold text-slate-400">Click a band to drill in</span>
        </div>
        <div className="space-y-4">
          {Object.entries(agingBuckets).map(([label, amount]) => {
            const tone = BUCKET_TONES[label] || BUCKET_TONES['0-30'];
            return (
              <button key={label} className="w-full text-left transition hover:opacity-90" onClick={() => router.push(`/finance/aging?bucket=${label}`)}>
                <div className="mb-1.5 flex justify-between text-sm">
                  <span className="font-bold text-slate-600">{label} days</span>
                  <span className={`font-extrabold ${tone.text}`}>{formatLKR(amount)}</span>
                </div>
                <div className="h-4 w-full overflow-hidden rounded-full bg-slate-100">
                  <div className={`h-full rounded-full bg-gradient-to-r ${tone.bar} transition-all duration-700`} style={{ width: `${Math.max((amount / maxAging) * 100, 2)}%` }} />
                </div>
              </button>
            );
          })}
        </div>
      </Card>
    </div>
  );
}
