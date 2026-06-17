'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import api from '@/lib/api';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { StatusBadge } from '@/components/domain/StatusBadge';
import { Spinner, ErrorState } from '@/components/ui/Spinner';
import { formatLKR, formatDate } from '@/lib/utils';
import toast from 'react-hot-toast';

export default function InvoiceDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const [invoice, setInvoice] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await api.get(`/invoices/${id}`);
        setInvoice(res.data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  const handlePay = async () => {
    try {
      // Initiate PayHere payment
      const res = await api.post(`/invoices/${id}/pay`);
      if (res.data.paymentUrl) {
        window.location.href = res.data.paymentUrl;
      }
      toast.success('Redirecting to payment gateway...');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Payment initiation failed');
    }
  };

  const handleDownloadPDF = async () => {
    try {
      const res = await api.get(`/invoices/${id}/pdf`, { responseType: 'blob' });
      const url = URL.createObjectURL(new Blob([res.data]));
      const a = document.createElement('a');
      a.href = url;
      a.download = `invoice-${id}.pdf`;
      a.click();
    } catch {
      toast.error('Download failed');
    }
  };

  if (loading) return <Spinner className="py-20" />;
  if (error) return <ErrorState message={error} />;
  if (!invoice) return <ErrorState message="Invoice not found" />;

  return (
    <div className="space-y-6">
      <button onClick={() => router.back()} className="text-sm text-green-700 hover:underline">&larr; Back</button>

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Invoice #{invoice.invoiceNo || invoice.id}</h1>
          <p className="text-sm text-gray-500">{formatDate(invoice.createdAt)} &middot; Due: {formatDate(invoice.dueDate)}</p>
        </div>
        <StatusBadge status={invoice.status} />
      </div>

      <Card>
        <h3 className="text-sm font-medium mb-3">Items</h3>
        <table className="w-full text-sm">
          <thead><tr className="border-b"><th className="text-left py-2">Description</th><th className="text-right py-2">Qty</th><th className="text-right py-2">Price</th><th className="text-right py-2">Total</th></tr></thead>
          <tbody>
            {invoice.items?.map((item, i) => (
              <tr key={i} className="border-b last:border-b-0">
                <td className="py-2">{item.description || item.productName}</td>
                <td className="text-right py-2">{item.quantity}</td>
                <td className="text-right py-2">{formatLKR(item.unitPrice)}</td>
                <td className="text-right py-2">{formatLKR(item.unitPrice * item.quantity)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>

      <div className="grid grid-cols-2 gap-4">
        <Card>
          <div className="space-y-2">
            <div className="flex justify-between text-sm"><span>Subtotal</span><span>{formatLKR(invoice.subtotal)}</span></div>
            <div className="flex justify-between text-sm"><span>Tax</span><span>{formatLKR(invoice.tax || 0)}</span></div>
            <div className="flex justify-between font-bold text-lg border-t pt-2"><span>Total</span><span>{formatLKR(invoice.total)}</span></div>
            {invoice.totalPaid > 0 && <div className="flex justify-between text-sm text-green-700"><span>Paid</span><span>{formatLKR(invoice.totalPaid)}</span></div>}
            <div className="flex justify-between text-sm font-medium"><span>Balance</span><span>{formatLKR(invoice.balance)}</span></div>
          </div>
        </Card>

        {invoice.payments?.length > 0 && (
          <Card>
            <h3 className="text-sm font-medium mb-2">Payment History</h3>
            <div className="space-y-2">
              {invoice.payments.map((p, i) => (
                <div key={i} className="text-sm flex justify-between border-b pb-1">
                  <span>{formatDate(p.date || p.createdAt)}</span>
                  <span>{formatLKR(p.amount)}</span>
                </div>
              ))}
            </div>
          </Card>
        )}
      </div>

      <div className="flex gap-3 justify-end">
        <Button variant="outline" onClick={handleDownloadPDF}>Download PDF</Button>
        {invoice.status === 'UNPAID' && <Button onClick={handlePay}>Pay Now</Button>}
      </div>
    </div>
  );
}
