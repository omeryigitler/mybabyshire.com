import React, { useEffect, useMemo, useState } from 'react';
import { ExternalLink, Eye, RefreshCw, UploadCloud } from 'lucide-react';
import { Link } from 'react-router-dom';
import { getAdminToken } from './adminAuth';
import { CatalogSelect } from './CatalogSelect';
import { CatalogActionDialog, type CatalogDialogState } from './CatalogActionDialog';

type Item = {
  source: 'etsy' | 'site'; id: string; title: string; description: string;
  imageUrl: string; price: number; currency: string; published: boolean;
  categoryId: string | null; categoryName: string | null; detailUrl?: string | null;
  previewUrl?: string | null; checkoutEtsyUrl?: string | null; available?: boolean; syncedAt?: string;
};
type Category = { id: string; name: string };
const money = (value: number, currency: string) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: currency || 'USD' }).format(value);
const keyFor = (product: Item) => product.source + ':' + product.id;

class CatalogRequestError extends Error {
  issues: string[];
  constructor(message: string, issues?: string[]) {
    super(message);
    this.issues = Array.isArray(issues) ? issues : [];
  }
}

export const AdminSitePreview = () => {
  const [items, setItems] = useState<Item[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selected, setSelected] = useState<string[]>([]);
  const [source, setSource] = useState<'all' | 'etsy' | 'site'>('all');
  const [view, setView] = useState<'draft' | 'active'>('draft');
  const [search, setSearch] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [preview, setPreview] = useState<Item | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [dialog, setDialog] = useState<CatalogDialogState | null>(null);
  const [pendingOperation, setPendingOperation] = useState<'publish' | 'unpublish' | 'category' | null>(null);

  const api = async (action: string, method = 'GET', body?: object) => {
    const response = await fetch('/api/admin/etsy?action=' + action, {
      method,
      headers: { Authorization: 'Bearer ' + getAdminToken(), 'Content-Type': 'application/json' },
      ...(body ? { body: JSON.stringify(body) } : {}),
      cache: 'no-store',
    });
    const data = await response.json();
    if (!response.ok) throw new CatalogRequestError(data.error || 'İşlem başarısız.', data.issues);
    return data;
  };

  const reload = async () => {
    const data = await api('site-preview');
    setItems(Array.isArray(data.items) ? data.items : []);
    setCategories(Array.isArray(data.categories) ? data.categories : []);
  };
  useEffect(() => { void reload().catch(error => setMessage(error.message)); }, []);

  const visible = useMemo(() => items.filter(item => {
    if ((source !== 'all' && item.source !== source) || item.published !== (view === 'active')) return false;
    return !search || item.title.toLowerCase().includes(search.toLowerCase()) || item.id.includes(search);
  }), [items, source, view, search]);
  const selectable = visible.map(keyFor);
  const staged = items.filter(item => !item.published).length;
  const published = items.filter(item => item.published).length;
  const chosen = items.filter(item => selected.includes(keyFor(item)) && item.published === (view === 'active'));

  const prepareAction = (operation: 'publish' | 'unpublish' | 'category') => {
    if (!chosen.length) {
      setDialog({ kind: 'error', title: 'Ürün seçilmedi', message: 'İşleme devam etmek için en az bir ürün seçin.' });
      return;
    }
    if (operation === 'category' && !categoryId) {
      setDialog({ kind: 'error', title: 'Kategori seçilmedi', message: 'Ürünleri kategorize etmek için bir kategori seçin.' });
      return;
    }
    const missingCategory = chosen.filter(item => !item.categoryId && !categoryId);
    if (operation === 'publish' && missingCategory.length) {
      setDialog({
        kind: 'error', title: 'Önce kategori belirleyin',
        message: 'Seçilen bazı ürünlerin kategorisi bulunmuyor. Yukarıdan bir kategori seçip doğrudan “Seçilenleri yayına al” butonuna basabilirsiniz; kategori ve yayın birlikte kaydedilir.',
        details: missingCategory.slice(0, 8).map(item => item.title),
      });
      return;
    }
    const newCategory = categoryId ? categories.find(item => item.id === categoryId)?.name : null;
    const warnings = operation === 'publish' && chosen.some(item => item.source === 'site' && !item.checkoutEtsyUrl)
      ? ['Etsy ilanına bağlı olmayan site ürünleri mevcut site ödeme akışını kullanmaya devam eder.']
      : [];
    const details = [
      ...(newCategory ? ['Kategori: ' + newCategory + (operation === 'publish' ? ' (yayınla birlikte atanacak)' : '')] : []),
      ...warnings,
    ];
    setPendingOperation(operation);
    setDialog({
      kind: 'confirm',
      title: operation === 'publish' ? 'Ürünleri yayına al' : operation === 'unpublish' ? 'Ürünleri yayından kaldır' : 'Kategori değişikliğini onayla',
      message: operation === 'publish'
        ? chosen.length + ' ürün mağazada görünür olacak. Devam etmek istiyor musunuz?'
        : operation === 'unpublish'
          ? chosen.length + ' ürün önizleme kuyruğuna geri alınacak.'
          : chosen.length + ' ürünün kategorisi güncellenecek.',
      details, confirmLabel: operation === 'publish' ? 'Yayına al' : operation === 'unpublish' ? 'Yayından kaldır' : 'Kategoriyi kaydet',
    });
  };

  const submit = async (operation: 'publish' | 'unpublish' | 'category') => {
    if (!chosen.length) return;
    setBusy(true); setMessage('');
    let done = 0;
    try {
      for (const groupSource of ['etsy', 'site'] as const) {
        const group = chosen.filter(item => item.source === groupSource);
        for (let offset = 0; offset < group.length; offset += 25) {
          const batch = group.slice(offset, offset + 25);
          await api('site-preview', 'POST', {
            source: groupSource, ids: batch.map(item => item.id), operation,
            ...(categoryId && (operation === 'category' || operation === 'publish') ? { categoryId } : {}),
          });
          done += batch.length;
        }
      }
      setSelected([]);
      await reload();
      const result = done + ' ürün ' + (operation === 'publish' ? 'yayına alındı.' : operation === 'unpublish' ? 'önizleme kuyruğuna geri alındı.' : 'için kategori güncellendi.');
      setMessage(result);
      setDialog({ kind: 'success', title: 'İşlem tamamlandı', message: result });
    } catch (error) {
      await reload().catch(() => undefined);
      const reason = error as CatalogRequestError;
      // Keep the selected products selected for easy correction/retry.
      setDialog({
        kind: 'error', title: 'Yayın işlemi tamamlanamadı',
        message: (done ? done + ' üründe işlem tamamlandı. ' : 'Hiçbir ürün yayımlanmadı. ') + reason.message,
        details: reason.issues,
      });
    } finally { setBusy(false); setPendingOperation(null); }
  };

  const refreshEtsy = async () => {
    const ids = items.filter(item => item.source === 'etsy').map(item => item.id);
    if (!ids.length) return setMessage('Henüz içe aktarılmış Etsy ürünü yok.');
    setBusy(true); setMessage('');
    let refreshed = 0;
    try {
      for (let offset = 0; offset < ids.length; offset += 100) {
        const data = await api('catalog-sync', 'POST', { ids: ids.slice(offset, offset + 100) });
        refreshed += Number(data.refreshed || 0);
      }
      await reload();
      setMessage(refreshed + ' Etsy ürününün fiyat, görsel ve satış durumu güncellendi.');
    } catch (error) {
      await reload().catch(() => undefined);
      setMessage('Etsy güncellemesi kısmen tamamlandı: ' + (error as Error).message);
    } finally { setBusy(false); }
  };

  const setSelectedVisible = (checked: boolean) => setSelected(current =>
    checked ? Array.from(new Set([...current, ...selectable])) : current.filter(k => !selectable.includes(k)));

  const saveTitle = async () => {
    if (!preview || preview.source !== 'etsy') return;
    setBusy(true);
    try {
      await api('catalog-manage', 'POST', { ids: [preview.id], customTitle: editTitle.trim() || null });
      await reload();
      setPreview(null);
      setMessage('Başlık kaydedildi.');
    } catch (error) { setMessage((error as Error).message); } finally { setBusy(false); }
  };

  const openPreview = (item: Item) => { setPreview(item); setEditTitle(item.title); };
  return <div className="space-y-5 pb-20">
    <header className="flex flex-wrap items-end justify-between gap-4">
      <div><p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#999]">KATALOG / YAYIN KONTROLÜ</p>
        <h1 className="mt-1 text-3xl font-semibold">Site Önizleme & Yayın Kuyruğu</h1>
        <p className="mt-2 text-sm text-[#777]">Sitede eklenen taslaklar ve Etsy'den alınan ürünler tek yerde. Kategorize et, incele, tek tek veya toplu yayına al.</p>
      </div>
      <div className="flex flex-wrap gap-2">
        <Link to="/admin/products?create=1" className="rounded-lg border border-[#dedede] px-3 py-2.5 text-sm font-semibold">+ Siteden ürün ekle</Link>
        <Link to="/admin/etsy" className="rounded-lg border border-[#dedede] px-3 py-2.5 text-sm font-semibold">+ Etsy'den ürün getir</Link>
        <button disabled={busy} onClick={() => void refreshEtsy()} className="inline-flex items-center gap-1.5 rounded-lg border border-[#dedede] px-3 py-2.5 text-sm font-semibold disabled:opacity-40"><RefreshCw className="h-4 w-4" /> Etsy verilerini yenile</button>
        <button onClick={() => void reload().catch(error => setMessage(error.message))} className="rounded-lg border px-3 py-2.5"><RefreshCw className="h-4 w-4" /></button>
      </div>
    </header>

    <div className="grid grid-cols-2 gap-3">
      <button type="button" onClick={() => { setView('draft'); setSelected([]); }} className={'rounded-xl border p-4 text-left ' + (view === 'draft' ? 'border-[#222] bg-[#f8f8f8]' : 'border-[#ddd] bg-white')}>
        <span className="block text-xs font-semibold text-[#777]">ÖNİZLEME / YAYIN BEKLEYEN</span><strong className="mt-1 block text-2xl">{staged}</strong>
      </button>
      <button type="button" onClick={() => { setView('active'); setSelected([]); }} className={'rounded-xl border p-4 text-left ' + (view === 'active' ? 'border-[#222] bg-[#f8f8f8]' : 'border-[#ddd] bg-white')}>
        <span className="block text-xs font-semibold text-[#777]">YAYINDA</span><strong className="mt-1 block text-2xl">{published}</strong>
      </button>
    </div>

    <section className="rounded-xl border border-[#e2e2e2] bg-white p-4">
      <div className="flex flex-wrap gap-3">
        <select value={source} onChange={e => { setSource(e.target.value as typeof source); setSelected([]); }} className="h-11 rounded-lg border px-3 text-sm">
          <option value="all">Tüm kaynaklar</option><option value="etsy">Etsy'den</option><option value="site">Siteden</option>
        </select>
        <input type="search" value={search} onChange={e => setSearch(e.target.value)} placeholder="Ürün adına göre ara" className="h-11 min-w-[190px] flex-1 rounded-lg border px-3 text-sm" />
        <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={selectable.length > 0 && selectable.every(k => selected.includes(k))} onChange={e => setSelectedVisible(e.target.checked)} /> Tümünü seç ({visible.length})</label>
      </div>
      <div className="mt-4 flex flex-wrap items-center gap-2 border-t pt-4">
        <span className="mr-1 text-sm font-semibold">{chosen.length} seçili</span>
        <select value={categoryId} onChange={e => setCategoryId(e.target.value)} className="h-10 rounded-lg border px-2 text-sm">
          <option value="">Kategori seç…</option>{categories.map(category => <option value={category.id} key={category.id}>{category.name}</option>)}
        </select>
        <button disabled={busy || !chosen.length || !categoryId} onClick={() => void submit('category')} className="rounded-lg border border-[#dedede] px-3 py-2.5 text-sm font-semibold disabled:opacity-40">Kategori ata</button>
        <button disabled={busy || !chosen.length} onClick={() => void submit(view === 'draft' ? 'publish' : 'unpublish')} className="inline-flex items-center gap-2 rounded-lg bg-[#222] px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-40"><UploadCloud className="h-4 w-4" />{view === 'draft' ? 'Seçilenleri yayına al' : 'Önizlemeye geri al'}</button>
      </div>
      {message && <p role="status" className="mt-3 rounded-lg bg-[#f5f5f5] p-3 text-sm text-[#555]">{message}</p>}
    </section>

    <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
      {visible.map(item => <article key={keyFor(item)} className="overflow-hidden rounded-xl border border-[#e2e2e2] bg-white">
        <div className="flex gap-3 p-3">
          {item.imageUrl ? <img src={item.imageUrl} alt="" loading="lazy" className="h-28 w-24 shrink-0 rounded-lg object-cover" /> : <div className="flex h-28 w-24 shrink-0 items-center justify-center rounded-lg bg-[#f5f5f5] text-xs text-[#999]">Görsel yok</div>}
          <div className="min-w-0 flex-1">
            <div className="mb-2 flex flex-wrap gap-1"><span className="rounded bg-[#f2f2f2] px-2 py-0.5 text-[10px] font-semibold">{item.source === 'etsy' ? 'ETSY' : 'SİTE'}</span><span className="rounded bg-[#f2f2f2] px-2 py-0.5 text-[10px]">{item.categoryName || 'Kategorisiz'}</span></div>
            <h2 className="line-clamp-3 text-sm font-semibold">{item.title}</h2>
            <p className="mt-2 text-sm font-semibold">{money(item.price, item.currency)}</p>
            {item.source === 'etsy' && item.available === false && <p className="mt-1 text-xs text-red-600">Etsy'de kullanılabilir değil</p>}
            {item.source === 'site' && !item.checkoutEtsyUrl && <p className="mt-1 text-[11px] text-[#a46b15]">Etsy linki yok · Site ödemesi geçerli</p>}
          </div>
        </div>
        <div className="flex items-center justify-between border-t px-3 py-3">
          <label className="flex cursor-pointer items-center gap-2 text-xs font-medium"><input type="checkbox" checked={selected.includes(keyFor(item))} onChange={e => setSelected(current => e.target.checked ? [...current, keyFor(item)] : current.filter(k => k !== keyFor(item)))} /> Yayın için seç</label>
          <button onClick={() => openPreview(item)} className="inline-flex items-center gap-1 text-xs font-semibold underline"><Eye className="h-3.5 w-3.5" /> Önizle</button>
        </div>
      </article>)}
      {!visible.length && <div className="col-span-full rounded-xl border border-dashed p-12 text-center text-sm text-[#888]">Burada ürün yok. Etsy'den ürün alabilir veya sitede taslak oluşturabilirsin.</div>}
    </section>

    {preview && <div role="dialog" aria-modal="true" aria-label="Ürün önizleme" className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4" onClick={() => setPreview(null)}>
      <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-xl bg-white p-5 shadow-xl" onClick={e => e.stopPropagation()}>
        <div className="flex justify-between"><h2 className="text-lg font-semibold">Ürün önizleme · {preview.source === 'etsy' ? 'Etsy' : 'Sitemiz'}</h2><button onClick={() => setPreview(null)} className="text-sm underline">Kapat</button></div>
        {preview.imageUrl && <img src={preview.imageUrl} alt="" className="mt-4 max-h-64 w-full rounded-xl bg-[#f8f8f8] object-contain" />}
        <p className="mt-4 text-lg font-semibold">{preview.title}</p><p className="mt-2 text-base">{money(preview.price, preview.currency)}</p>
        <p className="mt-3 whitespace-pre-wrap text-sm text-[#666]">{preview.description}</p>
        {preview.source === 'etsy' ? <div className="mt-4">
          <label className="mb-1 block text-xs font-semibold">Sitede gösterilecek başlık</label>
          <input value={editTitle} onChange={e => setEditTitle(e.target.value)} maxLength={160} className="w-full rounded-lg border px-3 py-2" />
          <button disabled={busy} onClick={() => void saveTitle()} className="mt-2 rounded-lg border px-3 py-2 text-sm font-semibold disabled:opacity-50">Başlığı kaydet</button>
          {preview.previewUrl && <a href={preview.previewUrl} target="_blank" rel="noopener noreferrer" className="ml-3 inline-flex gap-1 text-sm underline">Etsy ilanını aç <ExternalLink className="h-4 w-4" /></a>}
        </div> : <Link to={'/admin/products?edit=' + encodeURIComponent(preview.id)} className="mt-4 inline-block text-sm font-semibold underline">Ürün düzenleyicisini aç ↗</Link>}
      </div>
    </div>}
  </div>;
};
