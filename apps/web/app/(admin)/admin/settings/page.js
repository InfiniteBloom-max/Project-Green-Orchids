'use client';

import { useEffect, useState, useCallback } from 'react';
import api from '@/lib/api';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { StatusBadge } from '@/components/domain/StatusBadge';
import { Spinner, EmptyState } from '@/components/ui/Spinner';
import { PageHeader, MetricCard } from '@/components/domain/DashboardUI';
import { formatDate } from '@/lib/utils';
import toast from 'react-hot-toast';

export default function SettingsPage() {
  const [health, setHealth] = useState([]);
  const [outbox, setOutbox] = useState([]);
  const [loading, setLoading] = useState(true);
  const [retrying, setRetrying] = useState(null);

  const load = useCallback(async () => {
    try {
      const [h, o] = await Promise.all([
        api.get('/notifications/outbox/health'),
        api.get('/notifications/outbox?status=FAILED&limit=20'),
      ]);
      setHealth(h.data.data || []);
      setOutbox(o.data.data || []);
    } catch {
      toast.error('Failed to load notification health');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleRetry = async (id) => {
    setRetrying(id);
    try {
      await api.post(`/notifications/outbox/${id}/retry`);
      toast.success('Retried');
      load();
    } catch (err) {
      toast.error(err.response?.data?.error?.message || 'Retry failed');
    } finally {
      setRetrying(null);
    }
  };

  if (loading) return <Spinner className="py-24" size="lg" />;

  const byStatus = Object.fromEntries(health.map((h) => [h.status, Number(h.count)]));

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Platform"
        title="Settings"
        description="Monitor email/notification delivery health and retry failed sends."
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Total notifications" value={byStatus.TOTAL || 0} icon="📬" tone="sky" />
        <MetricCard label="Sent" value={byStatus.SENT || 0} icon="✅" tone="emerald" />
        <MetricCard label="Pending" value={byStatus.PENDING || 0} icon="⏳" tone="amber" />
        <MetricCard label="Failed" value={byStatus.FAILED || 0} icon="⚠️" tone="rose" />
      </div>

      <Card>
        <h3 className="text-sm font-medium mb-3">Failed notifications</h3>
        {outbox.length === 0 ? (
          <EmptyState title="No failed notifications" description="All outbound emails are sending successfully." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2 pr-4">Recipient</th>
                  <th className="text-left py-2 pr-4">Template</th>
                  <th className="text-left py-2 pr-4">Attempts</th>
                  <th className="text-left py-2 pr-4">Last Error</th>
                  <th className="text-left py-2 pr-4">Created</th>
                  <th className="py-2"></th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {outbox.map((n) => (
                  <tr key={n.id}>
                    <td className="py-2 pr-4">{n.recipient_email || '—'}</td>
                    <td className="py-2 pr-4 font-mono text-xs">{n.template}</td>
                    <td className="py-2 pr-4">{n.attempts}</td>
                    <td className="py-2 pr-4 max-w-xs truncate text-rose-600" title={n.last_error}>{n.last_error || '—'}</td>
                    <td className="py-2 pr-4 text-gray-400">{formatDate(n.created_at)}</td>
                    <td className="py-2">
                      <Button size="sm" variant="outline" loading={retrying === n.id} onClick={() => handleRetry(n.id)}>Retry</Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
