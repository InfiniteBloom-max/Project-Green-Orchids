'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import api from '@/lib/api';
import { Button, Input, Textarea, Select } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Tabs } from '@/components/ui/Tabs';
import { FileUpload } from '@/components/ui/FileUpload';
import { Spinner, ErrorState } from '@/components/ui/Spinner';
import toast from 'react-hot-toast';

export default function ProductFormPage({ isEdit = false }) {
  const router = useRouter();
  const { id } = isEdit ? useParams() : { id: null };
  const [tab, setTab] = useState('basics');
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [suppliers, setSuppliers] = useState([]);
  const [categories, setCategories] = useState([]);

  const [form, setForm] = useState({
    name: '', sku: '', type: '', category: '', supplierId: '', description: '', moq: '1',
    imageUrl: '', images: [],
    basePrice: '', discountPrice: '', bulkTiers: [],
    stock: '0', minStock: '5', status: 'ACTIVE',
  });

  useEffect(() => {
    api.get('/admin/suppliers').then((r) => setSuppliers(r.data.suppliers || r.data.data || r.data)).catch(() => {});
    api.get('/products/types-and-categories').then((r) => setCategories(r.data.categories || [])).catch(() => {});

    if (isEdit && id) {
      api.get(`/admin/products/${id}`).then((r) => {
        const p = r.data;
        setForm({
          name: p.name || '', sku: p.sku || '', type: p.type || '', category: p.category || '', supplierId: p.supplierId || '', description: p.description || '', moq: String(p.moq || 1),
          imageUrl: p.imageUrl || '', images: p.images || [],
          basePrice: String(p.basePrice || p.price || ''), discountPrice: String(p.discountPrice || ''), bulkTiers: p.bulkTiers || [],
          stock: String(p.stock || 0), minStock: String(p.minStock || 5), status: p.status || 'ACTIVE',
        });
        setLoading(false);
      }).catch(() => { router.push('/admin/products'); });
    }
  }, [isEdit, id, router]);

  const update = (field, value) => setForm((f) => ({ ...f, [field]: value }));

  const handleSave = async () => {
    setSaving(true);
    try {
      const payload = {
        ...form,
        moq: parseInt(form.moq), basePrice: parseFloat(form.basePrice), discountPrice: parseFloat(form.discountPrice),
        stock: parseInt(form.stock), minStock: parseInt(form.minStock),
      };
      if (isEdit) {
        await api.put(`/admin/products/${id}`, payload);
        toast.success('Product updated');
      } else {
        await api.post('/admin/products', payload);
        toast.success('Product created');
      }
      router.push('/admin/products');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <Spinner className="py-20" />;

  const tabs = [
    { key: 'basics', label: 'Basics' },
    { key: 'media', label: 'Media' },
    { key: 'pricing', label: 'Pricing' },
    { key: 'inventory', label: 'Inventory' },
    { key: 'visibility', label: 'Visibility' },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">{isEdit ? 'Edit Product' : 'New Product'}</h1>

      <Tabs tabs={tabs} active={tab} onChange={setTab} />

      <Card>
        {tab === 'basics' && (
          <div className="space-y-4 grid grid-cols-2 gap-4">
            <Input label="Name" value={form.name} onChange={(e) => update('name', e.target.value)} required />
            <Input label="SKU" value={form.sku} onChange={(e) => update('sku', e.target.value)} required />
            <Input label="Type" value={form.type} onChange={(e) => update('type', e.target.value)} />
            <Select label="Category" value={form.category} onChange={(e) => update('category', e.target.value)} options={categories.map((c) => ({ value: c, label: c }))} />
            <Select label="Supplier" value={form.supplierId} onChange={(e) => update('supplierId', e.target.value)} options={suppliers.map((s) => ({ value: s.id, label: s.name }))} />
            <Input label="MOQ" type="number" value={form.moq} onChange={(e) => update('moq', e.target.value)} />
            <div className="col-span-2"><Textarea label="Description" value={form.description} onChange={(e) => update('description', e.target.value)} /></div>
          </div>
        )}

        {tab === 'media' && (
          <div className="space-y-4">
            <Input label="Main Image URL" value={form.imageUrl} onChange={(e) => update('imageUrl', e.target.value)} />
            <FileUpload label="Upload Product Images" onUpload={(file) => update('images', [...form.images, URL.createObjectURL(file)])} />
            {form.images.length > 0 && (
              <div className="flex gap-2">
                {form.images.map((img, i) => <img key={i} src={img} className="w-16 h-16 object-cover rounded" />)}
              </div>
            )}
          </div>
        )}

        {tab === 'pricing' && (
          <div className="space-y-4 grid grid-cols-2 gap-4">
            <Input label="Base Price (LKR)" type="number" step="0.01" value={form.basePrice} onChange={(e) => update('basePrice', e.target.value)} />
            <Input label="Discount Price (LKR)" type="number" step="0.01" value={form.discountPrice} onChange={(e) => update('discountPrice', e.target.value)} />
            <div className="col-span-2">
              <h4 className="text-sm font-medium mb-2">Bulk Tiers</h4>
              {(form.bulkTiers || []).map((tier, idx) => (
                <div key={idx} className="flex gap-2 mb-2">
                  <Input placeholder="Min Qty" type="number" value={tier.minQty} onChange={(e) => { const bt = [...form.bulkTiers]; bt[idx].minQty = parseInt(e.target.value); update('bulkTiers', bt); }} />
                  <Input placeholder="Price" type="number" step="0.01" value={tier.price} onChange={(e) => { const bt = [...form.bulkTiers]; bt[idx].price = parseFloat(e.target.value); update('bulkTiers', bt); }} />
                  <Button variant="ghost" size="sm" onClick={() => update('bulkTiers', form.bulkTiers.filter((_, i) => i !== idx))}>Remove</Button>
                </div>
              ))}
              <Button variant="outline" size="sm" onClick={() => update('bulkTiers', [...(form.bulkTiers || []), { minQty: 10, price: 0 }])}>+ Add Tier</Button>
            </div>
          </div>
        )}

        {tab === 'inventory' && (
          <div className="space-y-4 grid grid-cols-2 gap-4">
            <Input label="Current Stock" type="number" value={form.stock} onChange={(e) => update('stock', e.target.value)} />
            <Input label="Min Stock Alert" type="number" value={form.minStock} onChange={(e) => update('minStock', e.target.value)} />
          </div>
        )}

        {tab === 'visibility' && (
          <div className="space-y-4">
            <Select label="Status" value={form.status} onChange={(e) => update('status', e.target.value)} options={[{ value: 'ACTIVE', label: 'Active' }, { value: 'HIDDEN', label: 'Hidden' }, { value: 'DISCONTINUED', label: 'Discontinued' }]} />
          </div>
        )}

        <div className="flex justify-end gap-3 mt-6 pt-4 border-t">
          <Button variant="outline" onClick={() => router.push('/admin/products')}>Cancel</Button>
          <Button onClick={handleSave} loading={saving}>{isEdit ? 'Update' : 'Create'}</Button>
        </div>
      </Card>
    </div>
  );
}
