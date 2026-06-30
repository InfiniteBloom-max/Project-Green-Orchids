'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import api from '@/lib/api';
import { Button, Input, Select } from '@/components/ui/Button';
import { Spinner, EmptyState, ErrorState } from '@/components/ui/Spinner';
import { StatusBadge } from '@/components/domain/StatusBadge';
import { Pagination } from '@/components/ui/Pagination';
import { GlassPanel, DashboardHero } from '@/components/domain/DashboardUI';
import { formatLKR, formatDate } from '@/lib/utils';
import { cn } from '@/lib/utils';

const STATUS_OPTIONS = [
  { value: '', label: 'All statuses' },
  { value: 'PENDING', label: 'Pending' },
  { value: 'CONFIRMED', label: 'Confirmed' },
  { value: 'PROCESSING', label: 'Processing' },
  { value: 'SHIPPED', label: 'Shipped' },
  { value: 'DELIVERED', label: 'Delivered' },
  { value: 'CANCELLED', label: 'Cancelled' },
];

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [debounceTimer, setDebounceTimer] = useState(null);

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({ page: String(page), limit: '20' });
      if (status) params.set('status', status);
      if (search) params.set('search', search);
      const res = await api.get(`/admin/orders?${params}`).catch(() => api.get(`/orders?adminView=true&${params}`));
      const payload = res.data;
      setOrders(payload.orders || payload.data || (Array.isArray(payload) ? payload : []));
      setTotalPages(payload.pagination?.pages || payload.totalPages || 1);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [page, status, search]);

  useEffect(() => { fetchOrders(); }, [fetchOrders]);

  const handleSearch = (val) => {
    if (debounceTimer) clearTimeout(debounceTimer);
    setDebounceTimer(setTimeout(() => { setSearch(val); setPage(1); }, 350));
  };

  return (
    <div className="space-y-6">
      <DashboardHero
        eyebrow="Order management"
        title="All orders"
        description="Track, filter and manage every trade order on the platform."
        tone="sky"
      />

      <GlassPanel>
        <div className="flex flex-wrap items-center gap-3">
          <Input
            placeholder="Search orders…"
            onChange={(e) => handleSearch(e.target.value)}
            className="max-w-xs"
          />
          <select
            value={status}
            onChange={(e) => { setStatus(e.target.value); setPage(1); }}
            className="rounded-xl border border-white/10 bg-white/[0.05] px-4 py-2.5 text-sm text-white outline-none transition focus:border-emerald-400/50"
          >
            {STATUS_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </div>
      </GlassPanel>

      {error && <ErrorState message={error} onRetry={fetchOrders} />}
      {loading ? <Spinner className="py-20" /> : orders.length === 0 ? <EmptyState title="No orders found" /> : (
        <GlassPanel>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/10">
                  {['Order #', 'Buyer', 'Total (LKR)', 'Status', 'Date', ''].map((h) => (
                    <th key={h} className="pb-3 pr-4 text-left text-xs font-semibold uppercase tracking-[0.12em] text-white/35">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.05]">
                {orders.map((o) => (
                  <tr key={o.id} className="group transition hover:bg-white/[0.03]">
                    <td className="py-3 pr-4 font-mono text-xs font-semibold text-white">#{o.order_no || o.orderNumber || o.id}</td>
                    <td className="py-3 pr-4 text-white/70">{o.buyer_name || o.buyerName || o.buyer?.businessName || '—'}</td>
                    <td className="py-3 pr-4 font-semibold text-emerald-200">{formatLKR(o.total || o.totalAmount || 0)}</td>
                    <td className="py-3 pr-4"><StatusBadge status={o.status} /></td>
                    <td className="py-3 pr-4 text-white/35">{formatDate(o.created_at || o.createdAt, 'yyyy-MM-dd')}</td>
                    <td className="py-3">
                      <Link
                        href={`/admin/orders/${o.id}`}
                        className="rounded-lg border border-white/10 bg-white/[0.05] px-3 py-1 text-xs font-semibold text-white/55 opacity-0 transition group-hover:opacity-100 hover:bg-white/[0.1] hover:text-white"
                      >
                        View
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="mt-4">
            <Pagination page={page} totalPages={totalPages} onChange={setPage} />
          </div>
        </GlassPanel>
      )}
    </div>
  );
}
