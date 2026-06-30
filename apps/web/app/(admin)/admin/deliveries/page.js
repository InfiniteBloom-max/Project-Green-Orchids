'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import api from '@/lib/api';
import { Spinner, EmptyState, ErrorState } from '@/components/ui/Spinner';
import { StatusBadge } from '@/components/domain/StatusBadge';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { Pagination } from '@/components/ui/Pagination';
import { GlassPanel, DashboardHero } from '@/components/domain/DashboardUI';
import { formatDate } from '@/lib/utils';
import toast from 'react-hot-toast';

const STATUS_OPTIONS = [
  { value: '', label: 'All statuses' },
  { value: 'PENDING', label: 'Pending' },
  { value: 'READY', label: 'Ready' },
  { value: 'IN_TRANSIT', label: 'In Transit' },
  { value: 'DELIVERED', label: 'Delivered' },
  { value: 'FAILED', label: 'Failed' },
];

export default function AdminDeliveriesPage() {
  const [deliveries, setDeliveries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [confirm, setConfirm] = useState({ open: false, delivery: null });

  const fetchDeliveries = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({ page: String(page), limit: '20' });
      if (status) params.set('status', status);
      const res = await api.get(`/admin/deliveries?${params}`).catch(() => api.get(`/deliveries?${params}`));
      const payload = res.data;
      setDeliveries(payload.deliveries || payload.data || (Array.isArray(payload) ? payload : []));
      setTotalPages(payload.totalPages || 1);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [page, status]);

  useEffect(() => { fetchDeliveries(); }, [fetchDeliveries]);

  const handleMarkDelivered = async () => {
    const d = confirm.delivery;
    try {
      await api.patch(`/admin/deliveries/${d.id}/status`, { status: 'DELIVERED' }).catch(() =>
        api.post(`/deliveries/${d.id}/deliver`)
      );
      setDeliveries((list) => list.map((x) => x.id === d.id ? { ...x, status: 'DELIVERED' } : x));
      toast.success('Delivery marked as delivered');
    } catch { toast.error('Failed to update delivery'); }
  };

  return (
    <div className="space-y-6">
      <DashboardHero
        eyebrow="Logistics"
        title="Deliveries"
        description="Track and manage all outbound deliveries for trade orders."
        tone="emerald"
      />

      <GlassPanel>
        <div className="flex flex-wrap items-center gap-3">
          <select
            value={status}
            onChange={(e) => { setStatus(e.target.value); setPage(1); }}
            className="rounded-xl border border-white/10 bg-white/[0.05] px-4 py-2.5 text-sm text-white outline-none transition focus:border-emerald-400/50"
          >
            {STATUS_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </div>
      </GlassPanel>

      {error && <ErrorState message={error} onRetry={fetchDeliveries} />}
      {loading ? <Spinner className="py-20" /> : deliveries.length === 0 ? <EmptyState title="No deliveries found" /> : (
        <GlassPanel>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/10">
                  {['Delivery #', 'Order #', 'Buyer', 'Status', 'Scheduled date', 'Actions'].map((h) => (
                    <th key={h} className="pb-3 pr-4 text-left text-xs font-semibold uppercase tracking-[0.12em] text-white/35">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.05]">
                {deliveries.map((d) => (
                  <tr key={d.id} className="group transition hover:bg-white/[0.03]">
                    <td className="py-3 pr-4 font-mono text-xs font-semibold text-white">#{d.deliveryNumber || d.reference || d.id?.slice(0, 8)}</td>
                    <td className="py-3 pr-4">
                      {d.orderId || d.order?.id ? (
                        <Link href={`/admin/orders/${d.orderId || d.order?.id}`} className="font-mono text-xs text-sky-300 hover:text-sky-200">
                          #{d.orderNumber || d.order?.orderNumber || (d.orderId || d.order?.id)?.slice(0, 8)}
                        </Link>
                      ) : '—'}
                    </td>
                    <td className="py-3 pr-4 text-white/70">{d.buyerName || d.buyer?.businessName || d.order?.buyerName || '—'}</td>
                    <td className="py-3 pr-4"><StatusBadge status={d.status} /></td>
                    <td className="py-3 pr-4 text-white/35">{d.scheduledDate ? formatDate(d.scheduledDate, 'yyyy-MM-dd') : '—'}</td>
                    <td className="py-3">
                      {d.status !== 'DELIVERED' && (
                        <button
                          onClick={() => setConfirm({ open: true, delivery: d })}
                          className="rounded-lg border border-emerald-400/20 bg-emerald-400/10 px-3 py-1 text-xs font-semibold text-emerald-200 opacity-0 transition group-hover:opacity-100 hover:bg-emerald-400/20"
                        >
                          Mark Delivered
                        </button>
                      )}
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

      <ConfirmDialog
        open={confirm.open}
        onClose={() => setConfirm({ open: false, delivery: null })}
        onConfirm={handleMarkDelivered}
        title="Confirm delivery"
        message={`Mark delivery #${confirm.delivery?.deliveryNumber || confirm.delivery?.id?.slice(0, 8)} as delivered? This will update the associated order status.`}
        confirmLabel="Mark as Delivered"
        variant="info"
      />
    </div>
  );
}
