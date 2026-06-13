'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import { Table } from '@/components/ui/Table';
import { StatusBadge, StatusStepper } from '@/components/domain/StatusBadge';
import { Spinner, EmptyState, ErrorState } from '@/components/ui/Spinner';
import { formatLKR, formatDate } from '@/lib/utils';

const STATUSES = ['PENDING', 'CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED'];

export default function OrdersListPage() {
  const router = useRouter();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('');

  useEffect(() => {
    (async () => {
      try {
        const params = filter ? `?status=${filter}` : '';
        const res = await api.get(`/orders${params}`);
        setOrders(res.data.orders || res.data.data || res.data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    })();
  }, [filter]);

  const columns = [
    { key: 'orderNo', label: 'Order #', sortable: true, render: (v, r) => v || r.id },
    { key: 'createdAt', label: 'Date', sortable: true, render: (v) => formatDate(v) },
    { key: 'total', label: 'Total', render: (v) => formatLKR(v) },
    { key: 'items', label: 'Items', render: (v) => v?.length || '-' },
    { key: 'status', label: 'Status', render: (v) => <StatusBadge status={v} /> },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Orders</h1>

      <div className="flex gap-2 flex-wrap">
        <button onClick={() => setFilter('')} className={`px-3 py-1 text-sm rounded-full ${!filter ? 'bg-green-700 text-white' : 'bg-gray-100'}`}>All</button>
        {STATUSES.map((s) => (
          <button key={s} onClick={() => setFilter(s)} className={`px-3 py-1 text-sm rounded-full ${filter === s ? 'bg-green-700 text-white' : 'bg-gray-100'}`}>{s.replace(/_/g, ' ')}</button>
        ))}
      </div>

      {error && <ErrorState message={error} />}
      {loading ? <Spinner className="py-20" /> : orders.length === 0 ? <EmptyState title="No orders found" /> : (
        <Table columns={columns} rows={orders} onRowClick={(r) => router.push(`/buyer/orders/${r.id}`)} />
      )}
    </div>
  );
}
