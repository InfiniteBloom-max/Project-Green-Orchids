'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import api from '@/lib/api';
import { KpiCard } from '@/components/domain/StatusBadge';
import { Spinner } from '@/components/ui/Spinner';
import { formatLKR } from '@/lib/utils';

export default function InventoryDashboardPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const res = await api.get('/inventory/dashboard').catch(() => ({ data: {} }));
      setData(res.data);
      setLoading(false);
    })();
  }, []);

  if (loading) return <Spinner className="py-24" size="lg" />;
  const d = data || {};

  const alerts = [
    { value: d.lowStockAlerts || 0, label: 'Low Stock', icon: '📉', tone: 'from-amber-400 to-orange-500', href: '/inventory/alerts?type=LOW_STOCK' },
    { value: d.fastMovingAlerts || 0, label: 'Fast Moving', icon: '🚀', tone: 'from-sky-400 to-cyan-500', href: '/inventory/alerts?type=FAST_MOVING' },
    { value: d.deadStockAlerts || 0, label: 'Dead Stock', icon: '🪦', tone: 'from-slate-500 to-slate-700', href: '/inventory/alerts?type=DEAD_STOCK' },
  ];

  return (
    <div className="space-y-7">
      <div className="relative overflow-hidden rounded-3xl bg-brand-dark p-7 text-white shadow-pop md:p-9">
        <div className="blob -top-12 right-8 h-52 w-52 animate-blob bg-green-500/40" />
        <div className="blob bottom-0 left-1/3 h-44 w-44 animate-blob bg-amber-400/30" style={{ animationDelay: '3s' }} />
        <div className="relative">
          <p className="eyebrow text-green-300">Stock house</p>
          <h1 className="mt-2 font-display text-3xl font-extrabold tracking-tight md:text-4xl">Inventory Dashboard</h1>
          <p className="mt-2 max-w-xl text-white/70">Catalogue health, stock value and movement alerts.</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <KpiCard title="Total Products" value={d.totalProducts || 0} icon="🌿" tone="green" />
        <KpiCard title="Stock Value" value={formatLKR(d.totalStockValue || 0)} icon="💎" tone="sky" />
        <KpiCard title="Low Stock Items" value={d.lowStockCount || 0} icon="📉" tone="amber" />
        <KpiCard title="Out of Stock" value={d.outOfStockCount || 0} icon="🚫" tone="pink" />
      </div>

      <div>
        <h2 className="mb-3 text-xs font-extrabold uppercase tracking-[0.16em] text-slate-500">Alert inbox</h2>
        <div className="grid gap-4 md:grid-cols-3">
          {alerts.map((a) => (
            <Link key={a.label} href={a.href}>
              <div className="group relative overflow-hidden rounded-3xl border border-white/70 bg-white/85 p-6 shadow-card ring-1 ring-slate-900/5 backdrop-blur-xl lift hover:shadow-card-lg">
                <div className={`mb-4 grid h-12 w-12 place-items-center rounded-2xl bg-gradient-to-br ${a.tone} text-xl text-white shadow-glow`}>{a.icon}</div>
                <div className="font-display text-4xl font-extrabold text-slate-900">{a.value}</div>
                <p className="mt-1 text-sm font-bold uppercase tracking-wide text-slate-500">{a.label}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
