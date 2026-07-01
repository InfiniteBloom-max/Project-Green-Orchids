'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import api from '@/lib/api';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Table } from '@/components/ui/Table';
import { StatusBadge } from '@/components/domain/StatusBadge';
import { Spinner, EmptyState, ErrorState } from '@/components/ui/Spinner';
import { PageHeader } from '@/components/domain/DashboardUI';
import { formatDate, formatLKR } from '@/lib/utils';

export default function RFQListPage() {
  const [rfqs, setRfqs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await api.get('/rfqs');
        setRfqs(res.data.rfqs || res.data.data || res.data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const columns = [
    { key: 'rfqNo', label: 'RFQ #', render: (v, r) => v || r.id },
    { key: 'createdAt', label: 'Date', render: (v) => formatDate(v) },
    { key: 'lineCount', label: 'Items', render: (v, r) => v || r.items?.length || r.lines?.length || 1 },
    { key: 'totalRequested', label: 'Requested', render: (v) => v ? formatLKR(v) : '-' },
    { key: 'status', label: 'Status', render: (v) => <StatusBadge status={v} /> },
    { key: 'expiresAt', label: 'Expiry', render: (v) => v ? formatDate(v) : '-' },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        tone="violet"
        title="Request for Quotes"
        description="View your submitted RFQs and respond to quotes."
        actions={<Link href="/buyer/rfq/new"><Button>New RFQ</Button></Link>}
      />

      {error && <ErrorState message={error} onRetry={() => window.location.reload()} />}

      {loading ? (
        <Spinner className="py-20" />
      ) : rfqs.length === 0 ? (
        <EmptyState title="No RFQs yet" description="Create your first RFQ to get quotes on bulk orders" action={<Link href="/buyer/rfq/new"><Button>Create RFQ</Button></Link>} />
      ) : (
        <Card padding={false}>
          <Table
            columns={columns}
            rows={rfqs}
            onRowClick={(row) => window.location.href = `/buyer/rfq/${row.id}`}
          />
        </Card>
      )}
    </div>
  );
}
