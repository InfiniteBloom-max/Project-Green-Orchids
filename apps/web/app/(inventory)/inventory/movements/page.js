'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/api';
import { Button } from '@/components/ui/Button';
import { Table } from '@/components/ui/Table';
import { Pagination } from '@/components/ui/Pagination';
import { Spinner, EmptyState } from '@/components/ui/Spinner';
import { formatDate } from '@/lib/utils';
import toast from 'react-hot-toast';

export default function MovementsPage() {
  const [movements, setMovements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [filter, setFilter] = useState({ type: '' });

  useEffect(() => {
    (async () => {
      const params = new URLSearchParams({ page: String(page), limit: '20' });
      if (filter.type) params.set('type', filter.type);
      const res = await api.get(`/inventory/movements?${params}`).catch(() => ({ data: [] }));
      setMovements(res.data.movements || res.data.data || res.data);
      setLoading(false);
    })();
  }, [page, filter]);

  const handleExport = async () => {
    try {
      const res = await api.get('/inventory/movements/export/csv', { responseType: 'blob' });
      const url = URL.createObjectURL(new Blob([res.data]));
      const a = document.createElement('a'); a.href = url; a.download = 'stock-movements.csv'; a.click();
    } catch { toast.error('Export failed'); }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Stock Movements</h1>
        <Button variant="outline" size="sm" onClick={handleExport}>Export CSV</Button>
      </div>

      <div className="flex gap-2">
        <select value={filter.type} onChange={(e) => setFilter((f) => ({ ...f, type: e.target.value }))} className="px-3 py-2 border rounded text-sm">
          <option value="">All Types</option>
          <option value="IN">Stock In</option>
          <option value="OUT">Stock Out</option>
          <option value="RETURN">Return</option>
          <option value="ADJUSTMENT">Adjustment</option>
        </select>
      </div>

      {loading ? <Spinner className="py-20" /> : movements.length === 0 ? <EmptyState title="No movements" /> : (
        <>
          <Table
            columns={[
              { key: 'productName', label: 'Product' },
              { key: 'type', label: 'Type' },
              { key: 'quantity', label: 'Qty', render: (v) => <span className={v > 0 ? 'text-green-600' : 'text-red-600'}>{v > 0 ? `+${v}` : v}</span> },
              { key: 'reference', label: 'Reference' },
              { key: 'note', label: 'Note' },
              { key: 'createdAt', label: 'Date', render: (v) => formatDate(v) },
            ]}
            rows={movements}
          />
          <Pagination page={page} totalPages={10} onChange={setPage} />
        </>
      )}
    </div>
  );
}
