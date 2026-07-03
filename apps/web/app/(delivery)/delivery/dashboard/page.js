'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import api from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { Spinner } from '@/components/ui/Spinner';
import { StatusBadge } from '@/components/domain/StatusBadge';
import { formatDate } from '@/lib/utils';
import { ActionTile, DashboardHero, GlassPanel, MetricCard } from '@/components/domain/DashboardUI';

export default function DeliveryDashboardPage() {
  const { user } = useAuth();
  const [deliveries, setDeliveries] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.id) return;
    (async () => {
      const res = await api.get(`/deliveries?assignedTo=${user.id}`).catch(() => ({ data: [] }));
      setDeliveries(Array.isArray(res.data) ? res.data : []);
      setLoading(false);
    })();
  }, [user?.id]);

  if (loading) return <Spinner className="py-24" size="lg" />;

  const active = deliveries.filter((d) => !['DELIVERED', 'FAILED', 'CANCELLED'].includes(d.status));
  const inTransit = deliveries.filter((d) => d.status === 'IN_TRANSIT').length;
  const dispatched = deliveries.filter((d) => d.status === 'DISPATCHED').length;
  const delivered = deliveries.filter((d) => d.status === 'DELIVERED').length;

  return (
    <div className="space-y-7">
      <DashboardHero
        eyebrow="Delivery hub"
        title="My deliveries"
        description="Track and advance every delivery assigned to you, from dispatch through proof-of-delivery."
        tone="amber"
        actions={<Link href="/delivery/deliveries" className="rounded-xl bg-orange-500 px-4 py-2 text-sm font-semibold text-white hover:bg-orange-400">View all deliveries</Link>}
        stats={[
          { label: 'Assigned to me', value: deliveries.length },
          { label: 'Dispatched', value: dispatched },
          { label: 'In transit', value: inTransit },
          { label: 'Delivered', value: delivered },
        ]}
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Active deliveries" value={active.length} detail="Not yet delivered" icon="🚚" tone="amber" href="/delivery/deliveries" />
        <MetricCard label="Dispatched"         value={dispatched}    detail="Awaiting transit"  icon="📦" tone="sky"    href="/delivery/deliveries" />
        <MetricCard label="In transit"         value={inTransit}     detail="On the road"        icon="🛣️" tone="amber"  href="/delivery/deliveries" />
        <MetricCard label="Delivered"          value={delivered}     detail="POD uploaded"       icon="✅" tone="emerald" href="/delivery/deliveries" />
      </div>

      <GlassPanel title="Active deliveries" subtitle="Deliveries assigned to you that still need action.">
        {active.length === 0 ? (
          <p className="py-6 text-center text-sm text-slate-400">No active deliveries — you're all caught up ✓</p>
        ) : (
          <div className="divide-y divide-slate-100">
            {active.slice(0, 8).map((d) => (
              <div key={d.id} className="flex items-center justify-between gap-4 py-3">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[13px] font-semibold text-slate-800">
                    {d.reference_number || `Order #${d.order_id}`}
                  </p>
                  <p className="text-[12px] text-slate-400">
                    {d.dispatch_date ? `Dispatched ${formatDate(d.dispatch_date, 'yyyy-MM-dd')}` : 'Not yet dispatched'}
                  </p>
                </div>
                <StatusBadge status={d.status} />
              </div>
            ))}
          </div>
        )}
      </GlassPanel>

      <GlassPanel title="Quick actions" subtitle="Delivery workspace shortcuts.">
        <div className="grid gap-2 sm:grid-cols-2">
          <ActionTile href="/delivery/deliveries" title="My deliveries" description="Dispatch, mark in-transit, and upload proof of delivery." icon="🚚" tone="amber" />
          <ActionTile href="/delivery/deliveries?status=DELIVERED" title="Delivered" description="Review completed deliveries and buyer confirmations." icon="✅" tone="emerald" />
        </div>
      </GlassPanel>
    </div>
  );
}
