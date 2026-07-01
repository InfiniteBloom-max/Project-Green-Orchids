'use client';

import { useEffect, useState, useCallback } from 'react';
import api from '@/lib/api';
import { Button, Input } from '@/components/ui/Button';
import { Table } from '@/components/ui/Table';
import { Spinner, EmptyState } from '@/components/ui/Spinner';
import { StockBand } from '@/components/domain/StatusBadge';
import { formatLKR } from '@/lib/utils';
import { PageHeader } from '@/components/domain/DashboardUI';

export default function InventoryProductsPage() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [debounceTimer, setDebounceTimer] = useState(null);

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const params = search ? `?search=${search}` : '';
      const res = await api.get(`/inventory/products${params}`);
      setProducts(res.data.products || res.data.data || res.data);
    } catch {} finally { setLoading(false); }
  }, [search]);

  useEffect(() => { fetchProducts(); }, [fetchProducts]);

  const handleSearch = (val) => {
    if (debounceTimer) clearTimeout(debounceTimer);
    setDebounceTimer(setTimeout(() => setSearch(val), 350));
  };

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Inventory"
        title="Products"
        description="Browse and search inventory products, stock levels, and pricing."
        tone="amber"
      />
      <Input placeholder="Search products..." onChange={(e) => handleSearch(e.target.value)} className="max-w-xs" />
      {loading ? <Spinner className="py-20" /> : products.length === 0 ? <EmptyState title="No products" /> : (
        <Table
          columns={[
            { key: 'sku', label: 'SKU' },
            { key: 'name', label: 'Name' },
            { key: 'category', label: 'Category' },
            { key: 'price', label: 'Price', render: (v) => formatLKR(v) },
            { key: 'stock', label: 'Stock', render: (v, r) => <div><StockBand stock={v} /><div className="text-xs text-gray-400">Reserved: {r.reserved || 0}</div></div> },
            { key: 'minStock', label: 'Min Stock' },
          ]}
          rows={products}
        />
      )}
    </div>
  );
}
