import React, { useEffect, useState } from 'react';
import { Plus, RefreshCcw, Tag, Trash2 } from 'lucide-react';
import { getAdminToken, handleAdminAuthError } from './adminAuth';
import { requestAdminConfirm } from './adminDialogs';

type Coupon = { id: string; code: string; type: 'percent' | 'fixed'; value: number; active: boolean; minSubtotal: number; maxRedemptions: number | null; timesRedeemed: number; expiresAt: string | null };
const emptyForm = { code: '', type: 'percent', value: '', minSubtotal: '', maxRedemptions: '', expiresAt: '', active: true };
const inputClass = 'commerce-focus h-11 w-full rounded-[9px] border border-[#dedede] bg-white px-3.5 text-sm outline-none placeholder:text-[#aaa] focus:border-[#202020]';
const labelClass = 'mb-1.5 block text-[10px] font-bold uppercase tracking-[0.12em] text-[#999]';

export const AdminCoupons = () => {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState<typeof emptyForm>(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const loadCoupons = async () => {
    setLoading(true); setError('');
    try {
      const response = await fetch('/api/admin/coupons', { headers: { Authorization: `Bearer ${getAdminToken()}` } });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to load discounts.');
      setCoupons(Array.isArray(data) ? data : []);
    } catch (loadError) {
      if (handleAdminAuthError(loadError)) return;
      setError((loadError as Error).message);
    } finally { setLoading(false); }
  };

  useEffect(() => { void loadCoupons(); }, []);
  const resetForm = () => { setForm(emptyForm); setEditingId(null); setError(''); };
  const startEdit = (coupon: Coupon) => { setEditingId(coupon.id); setError(''); setForm({ code: coupon.code, type: coupon.type, value: String(coupon.value), minSubtotal: coupon.minSubtotal ? String(coupon.minSubtotal) : '', maxRedemptions: coupon.maxRedemptions != null ? String(coupon.maxRedemptions) : '', expiresAt: coupon.expiresAt ? coupon.expiresAt.slice(0, 10) : '', active: coupon.active }); };

  const saveCoupon = async (event: React.FormEvent) => {
    event.preventDefault(); setSaving(true); setError('');
    try {
      const payload = { code: form.code.trim(), type: form.type, value: Number(form.value), minSubtotal: form.minSubtotal ? Number(form.minSubtotal) : 0, maxRedemptions: form.maxRedemptions ? Number(form.maxRedemptions) : null, expiresAt: form.expiresAt || null, active: form.active };
      const response = await fetch(editingId ? `/api/admin/coupons/${editingId}` : '/api/admin/coupons', { method: editingId ? 'PUT' : 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getAdminToken()}` }, body: JSON.stringify(payload) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to save discount.');
      resetForm(); await loadCoupons();
    } catch (saveError) {
      if (handleAdminAuthError(saveError)) return;
      setError((saveError as Error).message);
    } finally { setSaving(false); }
  };

  const toggleActive = async (coupon: Coupon) => {
    try {
      const response = await fetch(`/api/admin/coupons/${coupon.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getAdminToken()}` }, body: JSON.stringify({ code: coupon.code, type: coupon.type, value: coupon.value, minSubtotal: coupon.minSubtotal, maxRedemptions: coupon.maxRedemptions, expiresAt: coupon.expiresAt, active: !coupon.active }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to update discount.');
      setCoupons((current) => current.map((item) => item.id === coupon.id ? data : item));
    } catch (toggleError) {
      if (handleAdminAuthError(toggleError)) return;
      setError((toggleError as Error).message);
    }
  };

  const deleteCoupon = async (id: string) => {
    const confirmed = await requestAdminConfirm({ title: 'Delete this discount?', message: 'Customers will no longer be able to use this code. This cannot be undone.' });
    if (!confirmed) return;
    try {
      const response = await fetch(`/api/admin/coupons/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${getAdminToken()}` } });
      if (!response.ok) { const data = await response.json(); throw new Error(data.error || 'Failed to delete discount.'); }
      setCoupons((current) => current.filter((item) => item.id !== id));
      if (editingId === id) resetForm();
    } catch (deleteError) {
      if (handleAdminAuthError(deleteError)) return;
      setError((deleteError as Error).message);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between"><div><p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#999]">Sales</p><h1 className="mt-1 text-3xl font-semibold tracking-[-0.025em]">Discounts</h1><p className="mt-2 max-w-2xl text-sm leading-6 text-[#707070]">Create and manage checkout discount codes.</p></div><button type="button" onClick={() => void loadCoupons()} disabled={loading} className="commerce-focus inline-flex min-h-11 items-center gap-2 rounded-[9px] border border-[#dedede] bg-white px-4 text-sm font-semibold hover:bg-[#f7f7f7] disabled:opacity-50"><RefreshCcw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} /> Refresh</button></div>
      {error && <div className="rounded-[9px] border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">{error}</div>}

      <div className="grid gap-5 xl:grid-cols-[360px_1fr]">
        <section className="h-fit rounded-[12px] border border-[#e3e3e3] bg-white p-5"><div className="flex items-center gap-3"><div className="flex h-9 w-9 items-center justify-center rounded-[8px] bg-[#f3f3f3]"><Plus className="h-4 w-4" /></div><div><h2 className="font-semibold">{editingId ? 'Edit discount' : 'New discount'}</h2><p className="mt-1 text-xs text-[#888]">Code, amount and usage rules.</p></div></div><form onSubmit={saveCoupon} className="mt-5 space-y-4"><div><label className={labelClass}>Code</label><input value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })} placeholder="WELCOME10" className={inputClass} /></div><div className="grid grid-cols-2 gap-3"><div><label className={labelClass}>Type</label><select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} className={inputClass}><option value="percent">Percent %</option><option value="fixed">Fixed $</option></select></div><div><label className={labelClass}>{form.type === 'percent' ? 'Percent' : 'Amount'}</label><input type="number" min="0" step="0.01" value={form.value} onChange={(e) => setForm({ ...form, value: e.target.value })} className={inputClass} /></div></div><div className="grid grid-cols-2 gap-3"><div><label className={labelClass}>Min subtotal</label><input type="number" min="0" step="0.01" value={form.minSubtotal} onChange={(e) => setForm({ ...form, minSubtotal: e.target.value })} placeholder="0" className={inputClass} /></div><div><label className={labelClass}>Max uses</label><input type="number" min="1" value={form.maxRedemptions} onChange={(e) => setForm({ ...form, maxRedemptions: e.target.value })} placeholder="Unlimited" className={inputClass} /></div></div><div><label className={labelClass}>Expires</label><input type="date" value={form.expiresAt} onChange={(e) => setForm({ ...form, expiresAt: e.target.value })} className={inputClass} /></div><div className="flex items-center justify-between rounded-[9px] border border-[#e5e5e5] bg-[#fafafa] px-4 py-3"><div><p className="text-sm font-semibold">Active</p><p className="mt-1 text-[11px] text-[#888]">{form.active ? 'Code can be accepted' : 'Code is disabled'}</p></div><button type="button" role="switch" aria-checked={form.active} onClick={() => setForm({ ...form, active: !form.active })} className={`relative inline-flex h-6 w-11 items-center rounded-full ${form.active ? 'bg-[#202020]' : 'bg-[#cfcfcf]'}`}><span className={`h-5 w-5 rounded-full bg-white shadow transition-transform ${form.active ? 'translate-x-[22px]' : 'translate-x-0.5'}`} /></button></div><div className="flex gap-2"><button type="submit" disabled={saving} className="commerce-focus flex-1 rounded-[9px] bg-[#202020] px-4 py-3 text-sm font-semibold text-white hover:bg-[#383838] disabled:opacity-50">{saving ? 'Saving…' : editingId ? 'Update discount' : 'Create discount'}</button>{editingId && <button type="button" onClick={resetForm} className="commerce-focus rounded-[9px] border border-[#dedede] px-4 py-3 text-sm font-semibold hover:bg-[#f7f7f7]">Cancel</button>}</div></form></section>

        <section className="overflow-hidden rounded-[12px] border border-[#e3e3e3] bg-white"><div className="border-b border-[#ececec] p-5"><h2 className="font-semibold">All discounts</h2><p className="mt-1 text-xs text-[#888]">{coupons.length} saved code{coupons.length === 1 ? '' : 's'}</p></div><div className="overflow-x-auto"><table className="w-full min-w-[700px] border-collapse text-left"><thead><tr className="border-b border-[#ececec] bg-[#fafafa] text-[10px] font-bold uppercase tracking-[0.12em] text-[#888]"><th className="px-5 py-3">Code</th><th className="px-5 py-3">Discount</th><th className="px-5 py-3">Usage</th><th className="px-5 py-3">Status</th><th className="px-5 py-3 text-right">Actions</th></tr></thead><tbody className="divide-y divide-[#eeeeee] text-sm">{loading && <tr><td colSpan={5} className="px-5 py-10 text-center text-[#777]">Loading discounts...</td></tr>}{!loading && coupons.length === 0 && <tr><td colSpan={5} className="px-5 py-10 text-center text-[#777]">No discounts yet.</td></tr>}{!loading && coupons.map((coupon) => <tr key={coupon.id} className="hover:bg-[#fafafa]"><td className="px-5 py-4"><p className="font-semibold">{coupon.code}</p>{coupon.minSubtotal > 0 && <p className="mt-1 text-xs text-[#888]">Min ${coupon.minSubtotal.toFixed(2)}</p>}{coupon.expiresAt && <p className="mt-1 text-xs text-[#888]">Expires {new Date(coupon.expiresAt).toLocaleDateString()}</p>}</td><td className="px-5 py-4 font-medium">{coupon.type === 'percent' ? `${coupon.value}%` : `$${coupon.value.toFixed(2)}`}</td><td className="px-5 py-4 text-[#666]">{coupon.timesRedeemed}{coupon.maxRedemptions != null ? ` / ${coupon.maxRedemptions}` : ''}</td><td className="px-5 py-4"><button type="button" onClick={() => void toggleActive(coupon)} className={`rounded-full px-2.5 py-1 text-[10px] font-semibold ${coupon.active ? 'bg-[#eaf5ee] text-[#316942]' : 'bg-[#f1f1f1] text-[#666]'}`}>{coupon.active ? 'Active' : 'Inactive'}</button></td><td className="px-5 py-4"><div className="flex justify-end gap-2"><button type="button" onClick={() => startEdit(coupon)} className="commerce-focus rounded-[8px] border border-[#dedede] px-3 py-2 text-xs font-semibold hover:bg-[#f7f7f7]">Edit</button><button type="button" onClick={() => void deleteCoupon(coupon.id)} className="commerce-focus inline-flex items-center gap-1.5 rounded-[8px] border border-red-200 px-3 py-2 text-xs font-semibold text-red-600 hover:bg-red-50"><Trash2 className="h-3.5 w-3.5" /> Delete</button></div></td></tr>)}</tbody></table></div></section>
      </div>
    </div>
  );
};
