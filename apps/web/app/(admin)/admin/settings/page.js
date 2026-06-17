'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/api';
import { Button, Input, Textarea } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Spinner } from '@/components/ui/Spinner';
import toast from 'react-hot-toast';

export default function SettingsPage() {
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      const res = await api.get('/admin/settings').catch(() => ({ data: {} }));
      setSettings(res.data);
      setLoading(false);
    })();
  }, []);

  const update = (key, value) => setSettings((s) => ({ ...s, [key]: value }));

  const handleSave = async () => {
    setSaving(true);
    try {
      await api.put('/admin/settings', settings);
      toast.success('Settings saved');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed');
    } finally { setSaving(false); }
  };

  if (loading) return <Spinner className="py-20" />;
  if (!settings) return null;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Settings</h1>

      <Card>
        <h3 className="text-sm font-medium mb-4">Business Profile</h3>
        <div className="space-y-4 max-w-lg">
          <Input label="Business Name" value={settings.businessName || ''} onChange={(e) => update('businessName', e.target.value)} />
          <Input label="Business Address" value={settings.businessAddress || ''} onChange={(e) => update('businessAddress', e.target.value)} />
          <Input label="Contact Email" type="email" value={settings.contactEmail || ''} onChange={(e) => update('contactEmail', e.target.value)} />
          <Input label="Phone" value={settings.phone || ''} onChange={(e) => update('phone', e.target.value)} />
        </div>
      </Card>

      <Card>
        <h3 className="text-sm font-medium mb-4">RMA Settings</h3>
        <div className="space-y-4 max-w-lg">
          <Input label="RMA Window (days after delivery)" type="number" value={settings.rmaWindow || '7'} onChange={(e) => update('rmaWindow', e.target.value)} />
        </div>
      </Card>

      <Card>
        <h3 className="text-sm font-medium mb-4">Session & Security</h3>
        <div className="space-y-4 max-w-lg">
          <Input label="Max Concurrent Sessions" type="number" value={settings.sessionCap || '5'} onChange={(e) => update('sessionCap', e.target.value)} />
          <Input label="Lockout Threshold (failed attempts)" type="number" value={settings.lockoutThreshold || '5'} onChange={(e) => update('lockoutThreshold', e.target.value)} />
          <Input label="Lockout Duration (minutes)" type="number" value={settings.lockoutDuration || '30'} onChange={(e) => update('lockoutDuration', e.target.value)} />
        </div>
      </Card>

      <Card>
        <h3 className="text-sm font-medium mb-4">Inventory Defaults</h3>
        <div className="space-y-4 max-w-lg">
          <Input label="Low Stock Threshold" type="number" value={settings.lowStockThreshold || '5'} onChange={(e) => update('lowStockThreshold', e.target.value)} />
        </div>
      </Card>

      <Card>
        <h3 className="text-sm font-medium mb-4">Notifications</h3>
        <div className="space-y-3 max-w-lg">
          {['orderConfirmation', 'lowStockAlert', 'overdueReminder', 'rmaUpdate', 'approvalRequest'].map((key) => (
            <label key={key} className="flex items-center gap-3 text-sm">
              <input type="checkbox" checked={settings[`notify_${key}`] !== false} onChange={(e) => update(`notify_${key}`, e.target.checked)} className="rounded" />
              {key.replace(/([A-Z])/g, ' $1').replace(/^./, (c) => c.toUpperCase())}
            </label>
          ))}
        </div>
      </Card>

      <Button onClick={handleSave} loading={saving} size="lg">Save Settings</Button>
    </div>
  );
}
