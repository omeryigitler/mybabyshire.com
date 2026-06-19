import React, { useEffect, useState } from 'react';
import { Plus, Tag, Ticket, Trash2 } from 'lucide-react';
import { getAdminToken, handleAdminAuthError } from './adminAuth';
import { Badge, Button, EmptyState, PageHeader, Panel, Table, TD, TH } from './ui';

type Coupon = {
  id: string;
  code: string;
  type: 'percent' | 'fixed';
  value: number;
  active: boolean;
  minSubtotal: number;
  maxRedemptions: number | null;
  timesRedeemed: number;
  expiresAt: string | null;
};

const emptyForm = { code: '', type: 'percent', value: '', minSubtotal: '', maxRedemptions: '', expiresAt: '', active: true };

const inputClass = 'w-full rounded-2xl border border-boutique-brown/12 bg-white px-4 py-2.5 text-sm text-boutique-brown outline-none focus:ring-2 focus:ring-boutique-wood/25';
const labelClass = 'mb-1.5 block text-[11px] font-bold uppercase tracking-[0.12em] text-boutique-brown/55';

export const AdminCoupons = () => {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState<typeof emptyForm>(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const loadCoupons = async () => {
    setLoading(true);
    try {
      const token = getAdminToken();
      const response = await fetch('/api/admin/coupons', { headers: { Authorization: `Bearer ${token}` } });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to load coupons.');
      setCoupons(data);
    } catch (loadError) {
      if (handleAdminAuthError(loadError)) return;
      setError((loadError as Error).message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadCoupons(); }, []);

  const resetForm = () => { setForm(emptyForm); setEditingId(null); setError(''); };

  const startEdit = (coupon: Coupon) => {
    setEditingId(coupon.id);
    setError('');
    setForm({
      code: coupon.code,
      type: coupon.type,
      value: String(coupon.value),
      minSubtotal: coupon.minSubtotal ? String(coupon.minSubtotal) : '',
      maxRedemptions: coupon.maxRedemptions != null ? String(coupon.maxRedemptions) : '',
      expiresAt: coupon.expiresAt ? coupon.expiresAt.slice(0, 10) : '',
      active: coupon.active,
    });
  };

  const saveCoupon = async (event: React.FormEvent) => {
    event.preventDefault();
    setSaving(true);
    setError('');
    try {
      const token = getAdminToken();
      const payload = {
        code: form.code.trim(),
        type: form.type,
        value: Number(form.value),
        minSubtotal: form.minSubtotal ? Number(form.minSubtotal) : 0,
        maxRedemptions: form.maxRedemptions ? Number(form.maxRedemptions) : null,
        expiresAt: form.expiresAt || null,
        active: form.active,
      };
      const response = await fetch(editingId ? `/api/admin/coupons/${editingId}` : '/api/admin/coupons', {
        method: editingId ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(payload),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to save coupon.');
      resetForm();
      loadCoupons();
    } catch (saveError) {
      if (handleAdminAuthError(saveError)) return;
      setError((saveError as Error).message);
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = async (coupon: Coupon) => {
    try {
      const token = getAdminToken();
      const response = await fetch(`/api/admin/coupons/${coupon.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          code: coupon.code,
          type: coupon.type,
          value: coupon.value,
          minSubtotal: coupon.minSubtotal,
          maxRedemptions: coupon.maxRedemptions,
          expiresAt: coupon.expiresAt,
          active: !coupon.active,
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to update coupon.');
      setCoupons((current) => current.map((item) => (item.id === coupon.id ? data : item)));
    } catch (toggleError) {
      if (handleAdminAuthError(toggleError)) return;
      setError((toggleError as Error).message);
    }
  };

  const deleteCoupon = async (id: string) => {
    if (!window.confirm('Delete this coupon?')) return;
    try {
      const token = getAdminToken();
      const response = await fetch(`/api/admin/coupons/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
      if (!response.ok) { const data = await response.json(); throw new Error(data.error || 'Failed to delete coupon.'); }
      setCoupons((current) => current.filter((item) => item.id !== id));
      if (editingId === id) resetForm();
    } catch (deleteError) {
      if (handleAdminAuthError(deleteError)) return;
      setError((deleteError as Error).message);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Promotions"
        icon={Ticket}
        title="Coupons"
        description="Create discount codes customers can apply at checkout. Discounts work with both Stripe and PayPal."
      />

      {error && <div className="rounded-2xl border border-rose-200 bg-rose-50 px-5 py-3 text-sm font-medium text-rose-700">{error}</div>}

      <div className="grid gap-6 xl:grid-cols-[360px_1fr]">
        <Panel title={editingId ? 'Edit coupon' : 'New coupon'}>
          <form onSubmit={saveCoupon} className="space-y-4">
            <div>
              <label className={labelClass}>Code</label>
              <input value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })} placeholder="WELCOME10" className={inputClass} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelClass}>Type</label>
                <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} className={inputClass}>
                  <option value="percent">Percent %</option>
                  <option value="fixed">Fixed $</option>
                </select>
              </div>
              <div>
                <label className={labelClass}>{form.type === 'percent' ? 'Percent' : 'Amount $'}</label>
                <input type="number" min="0" step="0.01" value={form.value} onChange={(e) => setForm({ ...form, value: e.target.value })} placeholder={form.type === 'percent' ? '10' : '5.00'} className={inputClass} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelClass}>Min subtotal $</label>
                <input type="number" min="0" step="0.01" value={form.minSubtotal} onChange={(e) => setForm({ ...form, minSubtotal: e.target.value })} placeholder="0" className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>Max uses</label>
                <input type="number" min="1" value={form.maxRedemptions} onChange={(e) => setForm({ ...form, maxRedemptions: e.target.value })} placeholder="Unlimited" className={inputClass} />
              </div>
            </div>
            <div>
              <label className={labelClass}>Expires (optional)</label>
              <input type="date" value={form.expiresAt} onChange={(e) => setForm({ ...form, expiresAt: e.target.value })} className={inputClass} />
            </div>
            <label className="flex items-center gap-2 text-sm font-medium text-boutique-brown">
              <input type="checkbox" checked={form.active} onChange={(e) => setForm({ ...form, active: e.target.checked })} className="h-4 w-4 rounded" /> Active
            </label>
            <div className="flex gap-2 pt-1">
              <Button type="submit" variant="primary" icon={Plus} disabled={saving}>{saving ? 'Saving...' : editingId ? 'Update coupon' : 'Create coupon'}</Button>
              {editingId && <Button type="button" variant="ghost" onClick={resetForm}>Cancel</Button>}
            </div>
          </form>
        </Panel>

        <Panel title="All coupons" bodyClassName="">
          {loading ? (
            <div className="p-6 text-sm text-boutique-brown-light">Loading coupons...</div>
          ) : coupons.length === 0 ? (
            <EmptyState icon={Tag} title="No coupons yet" description="Create your first discount code on the left." />
          ) : (
            <Table>
              <thead>
                <tr>
                  <TH>Code</TH>
                  <TH>Discount</TH>
                  <TH>Used</TH>
                  <TH>Status</TH>
                  <TH className="text-right">Actions</TH>
                </tr>
              </thead>
              <tbody>
                {coupons.map((coupon) => (
                  <tr key={coupon.id} className="transition-colors hover:bg-[#fffaf3]/60">
                    <TD>
                      <span className="font-bold text-boutique-brown">{coupon.code}</span>
                      {coupon.minSubtotal > 0 && <div className="text-[11px] text-boutique-brown-light">Min ${coupon.minSubtotal.toFixed(2)}</div>}
                      {coupon.expiresAt && <div className="text-[11px] text-boutique-brown-light">Exp {new Date(coupon.expiresAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</div>}
                    </TD>
                    <TD className="font-medium">{coupon.type === 'percent' ? `${coupon.value}%` : `$${coupon.value.toFixed(2)}`}</TD>
                    <TD>{coupon.timesRedeemed}{coupon.maxRedemptions != null ? ` / ${coupon.maxRedemptions}` : ''}</TD>
                    <TD>
                      <button type="button" onClick={() => toggleActive(coupon)}>
                        <Badge tone={coupon.active ? 'green' : 'gray'}>{coupon.active ? 'Active' : 'Inactive'}</Badge>
                      </button>
                    </TD>
                    <TD className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button type="button" variant="secondary" onClick={() => startEdit(coupon)}>Edit</Button>
                        <Button type="button" variant="danger" icon={Trash2} onClick={() => deleteCoupon(coupon.id)}>Delete</Button>
                      </div>
                    </TD>
                  </tr>
                ))}
              </tbody>
            </Table>
          )}
        </Panel>
      </div>
    </div>
  );
};
