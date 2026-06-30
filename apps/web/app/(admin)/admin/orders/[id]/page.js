'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import api from '@/lib/api';
import { Spinner, EmptyState } from '@/components/ui/Spinner';
import { StatusBadge } from '@/components/domain/StatusBadge';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { GlassPanel, MetricCard, DashboardHero } from '@/components/domain/DashboardUI';
import { formatLKR, formatDate } from '@/lib/utils';
import toast from 'react-hot-toast';

export default function AdminOrderDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [confirm, setConfirm] = useState({ open: false, action: null, title: '', message: '', variant: 'info', label: '' });

  useEffect(() => {
    (async () => {
      try {
        const res = await api.get(`/admin/orders/${id}`).catch(() => api.get(`/orders/${id}`));
        setOrder(res.data.data || res.data.order || res.data);
      } catch { toast.error('Failed to load order'); }
      setLoading(false);
    })();
  }, [id]);

  const statusAction = (newStatus, title, message, variant, label) => {
    setConfirm({
      open: true,
      title,
      message,
      variant,
      label,
      action: async () => {
        try {
          await api.patch(`/admin/orders/${id}/status`, { status: newStatus }).catch(() =>
            api.post(`/admin/orders/${id}/${newStatus.toLowerCase()}`)
          );
          setOrder((o) => ({ ...o, status: newStatus }));
          toast.success(`Order marked as ${newStatus.toLowerCase()}`);
        } catch { toast.error('Failed to update order'); }
      },
    });
  };

  if (loading) return <Spinner className="py-24" size="lg" />;
  if (!order) return <EmptyState title="Order not found" />;

  const items = order.items || order.lineItems || order.orderItems || [];
  const payment = order.payment || order.payments?.[0] || {};

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/admin/orders" className="rounded-xl border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs font-semibold text-white/50 transition hover:text-white">
          ← Orders
        </Link>
        <div className="flex-1">
          <DashboardHero
            eyebrow="Order detail"
            title={`Order #${order.order_no || order.orderNumber || order.id}`}
            tone="sky"
            stats={[
              { label: 'Status', value: order.status },
              { label: 'Date', value: formatDate(order.created_at || order.createdAt, 'yyyy-MM-dd') },
              { label: 'Total', value: formatLKR(order.total || order.totalAmount || 0) },
              { label: 'Payment', value: order.payment_status || order.paymentStatus || payment.status || '—' },
            ]}
          />
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-3">
        <GlassPanel className="lg:col-span-2" title="Line items">
          {items.length === 0 ? <EmptyState title="No items" /> : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/10">
                    {['Product', 'SKU', 'Qty', 'Unit price', 'Line total'].map((h) => (
                      <th key={h} className="pb-3 pr-4 text-left text-xs font-semibold uppercase tracking-[0.12em] text-white/35">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.05]">
                  {items.map((item, idx) => (
                    <tr key={item.id || idx}>
                      <td className="py-3 pr-4 font-medium text-white">{item.productName || item.product?.name || '—'}</td>
                      <td className="py-3 pr-4 font-mono text-xs text-white/40">{item.sku || item.product?.sku || '—'}</td>
                      <td className="py-3 pr-4 text-white/70">{item.quantity || item.qty}</td>
                      <td className="py-3 pr-4 text-white/70">{formatLKR(item.unitPrice || item.price || 0)}</td>
                      <td className="py-3 pr-4 font-semibold text-emerald-200">{formatLKR((item.unitPrice || item.price || 0) * (item.quantity || item.qty || 0))}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="border-t border-white/10">
                    <td colSpan={4} className="py-3 pr-4 text-right font-semibold text-white/55">Total</td>
                    <td className="py-3 text-lg font-bold text-emerald-200">{formatLKR(order.total || order.totalAmount || 0)}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
        </GlassPanel>

        <div className="space-y-5">
          <GlassPanel title="Buyer">
            <div className="space-y-2 text-sm">
              <p className="font-semibold text-white">{order.buyer_name || order.buyerName || order.buyer?.businessName || '—'}</p>
              <p className="text-white/40">{order.buyer_email || order.buyerEmail || order.buyer?.email || '—'}</p>
              {order.buyer?.id && (
                <Link href={`/admin/buyers/${order.buyer.id}`} className="text-xs font-semibold text-emerald-300 hover:text-emerald-200">View buyer profile →</Link>
              )}
            </div>
          </GlassPanel>

          {(order.shipping_address || order.shippingAddress || order.deliveryAddress) && (
            <GlassPanel title="Shipping address">
              <p className="whitespace-pre-line text-sm text-white/60">{order.shipping_address || order.shippingAddress || order.deliveryAddress}</p>
            </GlassPanel>
          )}

          <GlassPanel title="Payment">
            <div className="space-y-2 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-white/40">Status</span>
                <StatusBadge status={order.paymentStatus || payment.status || 'UNPAID'} />
              </div>
              {payment.amount && (
                <div className="flex items-center justify-between">
                  <span className="text-white/40">Amount paid</span>
                  <span className="font-semibold text-emerald-200">{formatLKR(payment.amount)}</span>
                </div>
              )}
              {payment.method && (
                <div className="flex items-center justify-between">
                  <span className="text-white/40">Method</span>
                  <span className="text-white/70">{payment.method}</span>
                </div>
              )}
            </div>
          </GlassPanel>

          <GlassPanel title="Admin actions">
            <div className="flex flex-col gap-2">
              {!['PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED'].includes(order.status) && (
                <button
                  onClick={() => statusAction('PROCESSING', 'Mark as processing', 'Move this order to processing status?', 'info', 'Mark Processing')}
                  className="rounded-xl border border-sky-400/25 bg-sky-400/10 py-2 text-sm font-semibold text-sky-200 transition hover:bg-sky-400/20"
                >
                  Mark as Processing
                </button>
              )}
              {order.status === 'PROCESSING' && (
                <button
                  onClick={() => statusAction('SHIPPED', 'Mark as shipped', 'Confirm this order has been dispatched?', 'info', 'Mark Shipped')}
                  className="rounded-xl border border-violet-400/25 bg-violet-400/10 py-2 text-sm font-semibold text-violet-200 transition hover:bg-violet-400/20"
                >
                  Mark as Shipped
                </button>
              )}
              {!['DELIVERED', 'CANCELLED'].includes(order.status) && (
                <button
                  onClick={() => statusAction('CANCELLED', 'Cancel order', 'This will cancel the order and may trigger stock reversal. This action is irreversible.', 'danger', 'Cancel Order')}
                  className="rounded-xl border border-rose-400/25 bg-rose-400/10 py-2 text-sm font-semibold text-rose-200 transition hover:bg-rose-400/20"
                >
                  Cancel Order
                </button>
              )}
            </div>
          </GlassPanel>
        </div>
      </div>

      <ConfirmDialog
        open={confirm.open}
        onClose={() => setConfirm((c) => ({ ...c, open: false }))}
        onConfirm={() => confirm.action?.()}
        title={confirm.title}
        message={confirm.message}
        confirmLabel={confirm.label}
        variant={confirm.variant}
      />
    </div>
  );
}
