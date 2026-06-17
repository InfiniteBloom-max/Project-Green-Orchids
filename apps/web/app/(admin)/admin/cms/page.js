'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/api';
import { Button, Input, Textarea, Select } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Table } from '@/components/ui/Table';
import { Modal } from '@/components/ui/Modal';
import { Spinner, EmptyState } from '@/components/ui/Spinner';
import { formatDate } from '@/lib/utils';
import toast from 'react-hot-toast';

const BLOCK_TYPES = [
  { value: 'hero', label: 'Hero Section' },
  { value: 'announcement', label: 'Announcement Bar' },
  { value: 'text', label: 'Text Block' },
  { value: 'cta', label: 'CTA Section' },
];

export default function CMSPage() {
  const [blocks, setBlocks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showEditor, setShowEditor] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ key: '', type: 'text', title: '', content: '', ctaText: '', ctaUrl: '', imageUrl: '' });

  useEffect(() => {
    (async () => {
      const res = await api.get('/admin/cms/blocks').catch(() => ({ data: [] }));
      setBlocks(res.data.blocks || res.data.data || res.data);
      setLoading(false);
    })();
  }, []);

  const openEdit = (block) => {
    setEditing(block);
    setForm({ key: block.key || '', type: block.type || 'text', title: block.title || '', content: block.content || '', ctaText: block.ctaText || '', ctaUrl: block.ctaUrl || '', imageUrl: block.imageUrl || '' });
    setShowEditor(true);
  };

  const handleSave = async () => {
    try {
      if (editing) {
        await api.put(`/admin/cms/blocks/${editing.id}`, form);
        setBlocks((b) => b.map((x) => x.id === editing.id ? { ...x, ...form } : x));
      } else {
        const res = await api.post('/admin/cms/blocks', form);
        setBlocks((b) => [...b, res.data]);
      }
      toast.success('Saved');
      setShowEditor(false);
      setEditing(null);
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">CMS Management</h1>
        <Button onClick={() => { setEditing(null); setForm({ key: '', type: 'text', title: '', content: '', ctaText: '', ctaUrl: '', imageUrl: '' }); setShowEditor(true); }}>Add Block</Button>
      </div>

      {loading ? <Spinner className="py-20" /> : blocks.length === 0 ? <EmptyState title="No CMS blocks" /> : (
        <Table
          columns={[
            { key: 'key', label: 'Key' },
            { key: 'type', label: 'Type' },
            { key: 'title', label: 'Title' },
            { key: 'updatedAt', label: 'Updated', render: (v) => formatDate(v) },
            { key: 'actions', label: '', render: (_, r) => <Button size="sm" variant="outline" onClick={() => openEdit(r)}>Edit</Button> },
          ]}
          rows={blocks}
        />
      )}

      <Modal open={showEditor} onClose={() => setShowEditor(false)} title={editing ? 'Edit Block' : 'New Block'} size="lg">
        <div className="space-y-4">
          <Input label="Block Key" value={form.key} onChange={(e) => setForm((f) => ({ ...f, key: e.target.value }))} required />
          <Select label="Type" value={form.type} onChange={(e) => setForm((f) => ({ ...f, type: e.target.value }))} options={BLOCK_TYPES} />
          <Input label="Title" value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} />
          <Textarea label="Content" value={form.content} onChange={(e) => setForm((f) => ({ ...f, content: e.target.value }))} />
          <div className="grid grid-cols-2 gap-4">
            <Input label="CTA Text" value={form.ctaText} onChange={(e) => setForm((f) => ({ ...f, ctaText: e.target.value }))} />
            <Input label="CTA URL" value={form.ctaUrl} onChange={(e) => setForm((f) => ({ ...f, ctaUrl: e.target.value }))} />
          </div>
          <Input label="Image URL" value={form.imageUrl} onChange={(e) => setForm((f) => ({ ...f, imageUrl: e.target.value }))} />
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => setShowEditor(false)}>Cancel</Button>
            <Button onClick={handleSave}>Save</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
