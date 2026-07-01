'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/api';
import { PageHeader } from '@/components/domain/DashboardUI';
import { Table } from '@/components/ui/Table';
import { Spinner, EmptyState } from '@/components/ui/Spinner';
import { formatLKR, formatDate } from '@/lib/utils';

export default function PaymentsPage() {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const res = await api.get('/finance/payments').catch(() => ({ data: [] }));
      setPayments(res.data.payments || res.data.data || res.data);
      setLoading(false);
    })();
  }, []);

  return (
    <div className="space-y-6">
      <PageHeader
        tone="sky"
        title="Payment History"
        description="Browse recorded payments across all invoices."
      />
      {loading ? <Spinner className="py-20" /> : payments.length === 0 ? <EmptyState title="No payments" /> : (
        <Table
          columns={[
            { key: 'invoiceNo', label: 'Invoice' },
            { key: 'buyerName', label: 'Buyer' },
            { key: 'amount', label: 'Amount', render: (v) => formatLKR(v) },
            { key: 'method', label: 'Method' },
            { key: 'reference', label: 'Reference' },
            { key: 'date', label: 'Date', render: (v) => formatDate(v) },
          ]}
          rows={payments}
        />
      )}
    </div>
  );
}
