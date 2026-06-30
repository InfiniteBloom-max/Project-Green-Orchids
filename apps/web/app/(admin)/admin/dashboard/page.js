'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import api from '@/lib/api';
import { Spinner } from '@/components/ui/Spinner';
import { StatusBadge } from '@/components/domain/StatusBadge';
import { formatLKR, formatDate } from '@/lib/utils';
import { ActionTile, DashboardHero, GlassPanel, MetricCard, PrimaryAction } from '@/components/domain/DashboardUI';

const quickLinks = [
  { href: '/admin/buyers', title: 'Review buyers', description: 'Approve trade accounts and manage credit tiers.', icon: '👥', tone: 'emerald' },
  { href: '/admin/products', title: 'Manage catalogue', description: 'Update orchids, prices, stock and product images.', icon: '🌿', tone: 'sky' },
  { href: '/admin/rfqs', title: 'RFQ desk', description: 'Quote submitted requests and convert accepted deals.', icon: '📋', tone: 'violet' },
  { href: '/admin/reports', title: 'Reports', description: 'Track sales, fulfilment and operational performance.', icon: '📊', tone: 'amber' },
  { href: '/admin/cms', title: 'CMS', description: 'Edit homepage content, branding and media.', icon: '✏️', tone: 'rose' },
  { href: '/admin/users', title: 'Users', description: 'Manage staff accounts and access roles.', icon: '🔑', tone: 'sky' },
];

export default function AdminDashboardPage() {
  const [data, setData] = useState({ inventory: {}, buyers: [], orders: [], rfqs: [], revenue: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const [inventoryRes, buyersRes, ordersRes, rfqsRes, revenueRes] = await Promise.all([
        api.get('/inventory/dashboard').catch(() => ({ data: {} })),
        api.get('/buyers?limit=100').catch(() => ({ data: [] })),
        api.get('/admin/orders?limit=5&sort=createdAt:desc').catch(() => api.get('/orders?limit=5&sort=createdAt:desc').catch(() => ({ data: [] }))),
        api.get('/rfqs?limit=5').catch(() => ({ data: [] })),
        api.get('/reports/summary').catch(() => api.get('/reports/revenue').catch(() => ({ data: {} }))),
      ]);

      const buyersPayload = buyersRes.data;
      const ordersPayload = ordersRes.data;
      const rfqsPayload = rfqsRes.data;
      const revenuePayload = revenueRes.data;

      setData({
        inventory: inventoryRes.data || {},
        buyers: buyersPayload.buyers || buyersPayload.data || buyersPayload || [],
        orders: ordersPayload.orders || ordersPayload.data || (Array.isArray(ordersPayload) ? ordersPayload : []),
        rfqs: rfqsPayload.rfqs || rfqsPayload.data || (Array.isArray(rfqsPayload) ? rfqsPayload : []),
        revenue: revenuePayload.revenueThisMonth || revenuePayload.totalRevenue || revenuePayload.revenue || 0,
      });
      setLoading(false);
    })();
  }, []);

  if (loading) return <Spinner className="py-24" size="lg" />;

  const inventory = data.inventory || {};
  const buyers = Array.isArray(data.buyers) ? data.buyers : [];
  const orders = Array.isArray(data.orders) ? data.orders : [];
  const rfqs = Array.isArray(data.rfqs) ? data.rfqs : [];
  const pendingBuyers = buyers.filter((buyer) => ['PENDING_APPROVAL', 'AWAITING_APPROVAL'].includes(buyer.status)).length;
  const activeBuyers = buyers.filter((buyer) => buyer.status === 'ACTIVE' || buyer.status === 'APPROVED').length;

  return (
    <div className="space-y-6">
      <DashboardHero
        eyebrow="Admin command center"
        title="Operations dashboard"
        description="A high-signal control room for buyers, stock health, catalogue governance and daily trade operations."
        tone="emerald"
        actions={(
          <>
            <PrimaryAction href="/admin/buyers">Review buyers</PrimaryAction>
            <PrimaryAction href="/admin/products" variant="ghost">Manage catalogue</PrimaryAction>
          </>
        )}
        stats={[
          { label: 'Buyer records', value: buyers.length },
          { label: 'Pending approvals', value: pendingBuyers },
          { label: 'Low stock', value: inventory.lowStockAlerts || inventory.lowStockCount || 0 },
          { label: 'Out of stock', value: inventory.outOfStockCount || 0 },
        ]}
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Total products" value={inventory.totalProducts || 0} detail="Active catalogue items" icon="🌿" tone="emerald" />
        <MetricCard label="Revenue this month" value={formatLKR(data.revenue)} detail="Current month sales" icon="💰" tone="sky" />
        <MetricCard label="Pending buyers" value={pendingBuyers} detail="Awaiting account approval" icon="👥" tone="amber" />
        <MetricCard label="Active buyers" value={activeBuyers || buyers.length} detail="Approved trade accounts" icon="✅" tone="violet" />
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <GlassPanel
          title="Recent orders"
          subtitle="Last 5 orders placed on the platform."
          action={<Link href="/admin/orders" className="text-xs font-semibold text-emerald-300 hover:text-emerald-200">View all →</Link>}
        >
          {orders.length === 0 ? (
            <p className="py-6 text-center text-sm text-white/30">No orders yet</p>
          ) : (
            <div className="space-y-2">
              {orders.map((o) => (
                <Link
                  key={o.id}
                  href={`/admin/orders/${o.id}`}
                  className="flex items-center justify-between gap-4 rounded-2xl border border-white/10 bg-black/20 px-4 py-3 transition hover:bg-white/[0.06]"
                >
                  <div className="min-w-0">
                    <p className="truncate font-semibold text-white">#{o.order_no || o.orderNumber || o.id}</p>
                    <p className="truncate text-xs text-white/35">{o.buyer_name || o.buyerName || o.buyer?.businessName || '—'} · {formatDate(o.created_at || o.createdAt, 'yyyy-MM-dd')}</p>
                  </div>
                  <div className="flex shrink-0 items-center gap-3">
                    <span className="font-semibold text-emerald-200">{formatLKR(o.total || o.totalAmount || 0)}</span>
                    <StatusBadge status={o.status} />
                  </div>
                </Link>
              ))}
            </div>
          )}
        </GlassPanel>

        <GlassPanel
          title="Recent RFQs"
          subtitle="Latest quote requests from buyers."
          action={<Link href="/admin/rfqs" className="text-xs font-semibold text-violet-300 hover:text-violet-200">View all →</Link>}
        >
          {rfqs.length === 0 ? (
            <p className="py-6 text-center text-sm text-white/30">No RFQs yet</p>
          ) : (
            <div className="space-y-2">
              {rfqs.map((r) => (
                <Link
                  key={r.id}
                  href={`/admin/rfqs/${r.id}`}
                  className="flex items-center justify-between gap-4 rounded-2xl border border-white/10 bg-black/20 px-4 py-3 transition hover:bg-white/[0.06]"
                >
                  <div className="min-w-0">
                    <p className="truncate font-semibold text-white">{r.rfq_no || r.reference || r.rfqNumber || `RFQ-${r.id}`}</p>
                    <p className="truncate text-xs text-white/35">{r.buyer_name || r.buyerName || r.buyer?.businessName || '—'} · {formatDate(r.created_at || r.createdAt, 'yyyy-MM-dd')}</p>
                  </div>
                  <StatusBadge status={r.status} />
                </Link>
              ))}
            </div>
          )}
        </GlassPanel>
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <GlassPanel title="Attention needed" subtitle="Operational queues that need admin action.">
          <div className="space-y-3">
            {[
              ['Buyer approvals', pendingBuyers, '/admin/buyers', 'amber'],
              ['Low stock alerts', inventory.lowStockAlerts || inventory.lowStockCount || 0, '/inventory/alerts', 'orange'],
              ['Out of stock products', inventory.outOfStockCount || 0, '/admin/products?availability=OUT', 'rose'],
            ].map(([label, value, href, tone]) => (
              <a key={label} href={href} className="flex items-center justify-between rounded-2xl border border-white/10 bg-black/20 px-4 py-3 transition hover:bg-white/[0.06]">
                <span className="font-semibold text-white/75">{label}</span>
                <span className={`rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-sm font-semibold ${tone === 'rose' ? 'text-rose-200' : tone === 'orange' ? 'text-orange-200' : 'text-amber-200'}`}>{value}</span>
              </a>
            ))}
          </div>
        </GlassPanel>

        <GlassPanel title="Quick actions" subtitle="Jump into the core admin workspaces.">
          <div className="grid gap-3 sm:grid-cols-2">
            {quickLinks.map((item) => (
              <ActionTile key={item.href} {...item} />
            ))}
          </div>
        </GlassPanel>
      </div>
    </div>
  );
}
