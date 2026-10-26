import React, { useEffect, useMemo, useState } from 'react';
import { Download, ExternalLink, Loader2, RefreshCw } from 'lucide-react';
import { Link } from 'react-router-dom';
import { getAdminToken } from './adminAuth';

type EtsyListing = { listingId: string; title: string; description: string; price: number; currency: string; quantity: number; images: string[]; url: string };
type Imported = { listing_id: string; published: boolean };
const money = (value: number, currency: string) => new Intl.NumberFormat('en-US', { style: 'currency', currency: currency || 'USD' }).format(value);

async function request(action: string, method: 'GET' | 'POST' = 'GET', data?: object) {
  const response = await fetch('/api/admin/etsy?action=' + action, {
    method,
    headers: { Authorization: 'Bearer ' + getAdminToken(), 'Content-Type': 'application/json' },
    ...(data ? { body: JSON.stringify(data) } : {}),
    cache: 'no-store',
  });
  const result = await response.json();
  if (!response.ok) throw new Error(result.error || 'Etsy isteği başarısız.');
  return result;
}

export const AdminEtsy = () => {
  const [listings, setListings] = useState<EtsyListing[]>([]);
  const [imported, setImported] = useState<Imported[]>([]);
  const [selected, setSelected] = useState<string[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [importing, setImporting] = useState(false);
  const [message, setMessage] = useState('');
  const [complete, setComplete] = useState(false);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [count, setCount] = useState(0);
  const loadImported = async () => {
    const result = await request('catalog-managed');
    setImported(Array.isArray(result.items) ? result.items : []);
  };
  useEffect(() => { void loadImported().catch((error) => setMessage(error.message)); }, []);

  const loadListings = async () => {
    setLoading(true); setMessage(''); setComplete(false); setSelected([]);
    const collected: EtsyListing[] = [];
    try {
      let offset = 0;
      let total = 0;
      do {
        const data = await request('catalog-preview&offset=' + offset);
        total = Number(data.total || 0);
        const page: EtsyListing[] = Array.isArray(data.listings) ? data.listings : [];
        collected.push(...page);
        setListings([...collected]);
        setCount(total);
        setMessage(collected.length + ' ürün verisi alındı; ilan sayısı: ' + total);
        offset += 100;
        if (!page.length || offset > 12000) break;
      } while (offset < total);
      setComplete(collected.length === total);
      if (collected.length !== total) setMessage('Eksik ürün verisi var. Yeniden deneyin.');
      else setMessage(collected.length + ' aktif Etsy ürünü görüntüleniyor. Henüz hiçbir ürün yayımlanmadı.');
    } catch (error) {
      setMessage((error as Error).message);
    } finally { setLoading(false); }
  };

  const already = useMemo(() => new Set(imported.map(x => x.listing_id)), [imported]);
  const visible = useMemo(() => listings.filter(item => item.title.toLowerCase().includes(search.toLowerCase()) || item.listingId.includes(search)), [listings, search]);
  const available = visible.filter(item => !already.has(item.listingId) && item.images.length > 0);
  const importSelected = async () => {
    const selectedIds = selected.filter(id => available.some(item => item.listingId === id));
    if (!selectedIds.length) return;
    setImporting(true); setMessage('');
    let done = 0; let skipped = 0;
    try {
      for (let i = 0; i < selectedIds.length; i += 25) {
        const result = await request('catalog-import', 'POST', { ids: selectedIds.slice(i, i + 25) });
        done += Number(result.imported || 0);
        skipped += Number(result.skipped || 0);
        setMessage(done + ' ürün önizleme kuyruğuna alındı...');
      }
      await loadImported();
      setSelected([]);
      setMessage(done + ' ürün Site Önizleme kuyruğuna alındı. ' + skipped + ' ürün atlandı. Yayımlanmadılar.');
    } catch (error) {
      await loadImported().catch(() => undefined);
      setMessage('İşlem durdu: ' + (error as Error).message + '. Aktarılmış ürünler kuyrukta kalır.');
    } finally { setImporting(false); }
  };

  const toggle = (id: string, checked: boolean) => setSelected(previous => checked ? [...previous, id] : previous.filter(item => item !== id));
  const selectVisible = (checked: boolean) => setSelected(checked
    ? Array.from(new Set([...selected, ...available.map(x => x.listingId)]))
    : selected.filter(id => !available.some(x => x.listingId === id)));

  return <div className="space-y-5 pb-20">
    <header className="flex flex-wrap items-end justify-between gap-3">
      <div><p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#999]">ÜRÜN KAYNAĞI / ETSY</p><h1 className="mt-1 text-3xl font-semibold">Etsy'den ürün al</h1>
        <p className="mt-2 text-sm text-[#777]">Ürün, fotoğraf, açıklama ve Etsy fiyatlarını al. Tek tek veya toplu seçip önizleme kuyruğuna gönder; doğrudan yayımlama yapılmaz.</p></div>
      <Link to="/admin/site-preview" className="rounded-lg border border-[#222] px-4 py-2.5 text-sm font-semibold hover:bg-[#f5f5f5]">Site Önizleme / Yayın Kuyruğu ↗</Link>
    </header>
    <div className="rounded-xl border border-[#e2e2e2] bg-white p-4 sm:p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div><p className="font-semibold">babyshirekids · Etsy katalog</p><p className="mt-1 text-xs text-[#888]">Önizlemeye aktarılmış: {imported.length} · Etsy ilanları: {count || 'Henüz yüklenmedi'}</p></div>
        <button onClick={() => void loadListings()} disabled={loading || importing} className="inline-flex items-center gap-2 rounded-lg bg-[#202020] px-4 py-3 text-sm font-semibold text-white disabled:opacity-40">
          <RefreshCw className="h-4 w-4" /> {loading ? 'Alınıyor…' : 'Etsy ürünlerini getir'}
        </button>
      </div>
      {message && <p role="status" className="mt-3 rounded-lg bg-[#f5f5f5] px-3 py-2.5 text-sm text-[#555]">{message}</p>}
      {listings.length > 0 && <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t pt-4">
        <label className="flex cursor-pointer items-center gap-2 text-sm"><input type="checkbox" checked={available.length > 0 && available.every(x => selected.includes(x.listingId))} onChange={e => selectVisible(e.target.checked)} disabled={!complete || importing} /> Görünen uygun ürünlerin tümünü seç ({available.length})</label>
        <button type="button" disabled={!complete || importing || !selected.length} onClick={() => void importSelected()} className="inline-flex min-h-11 items-center gap-2 rounded-lg bg-[#202020] px-4 text-sm font-semibold text-white disabled:opacity-40">
          {importing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />} {selected.length} ürünü önizlemeye al
        </button>
      </div>}
    </div>
    <section className="rounded-xl border border-[#e2e2e2] bg-white p-4 sm:p-5"><h2 className="font-semibold">Etsy vitrini</h2><p className="mt-2 text-sm text-[#666]">Vitrinde yalnızca içe aktarılan ve yayımlanan Etsy ürünleri görünür. Site Önizleme bölümünde ürünleri yayından kaldırabilir, tekrar yayımlayabilir ve kategori atayabilirsiniz. Bu işlemler Etsy mağazasındaki ilanı silmez. Kendi ürünlerinizi Ürünler bölümünde gelecekteki site satışı için taslak olarak hazırlayabilirsiniz.</p></section>
    <section className="overflow-hidden rounded-xl border border-[#e2e2e2] bg-white">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b p-4"><h2 className="font-semibold">Etsy ürünleri ({visible.length})</h2><input type="search" value={search} onChange={e => { setSearch(e.target.value); setSelected([]); }} placeholder="Ürün adına göre ara" className="h-10 rounded-lg border px-3 text-sm" /></div>
      <div className="grid gap-3 p-4 sm:grid-cols-2 xl:grid-cols-3">
        {visible.map(item => <article key={item.listingId} className="overflow-hidden rounded-xl border border-[#e5e5e5]">
          <div className="flex gap-3 p-3">
            {item.images[0] ? <img src={item.images[0]} alt="" className="h-24 w-20 rounded-md object-cover" loading="lazy" /> : <div className="flex h-24 w-20 items-center justify-center rounded-md bg-[#f4f4f4] text-xs text-[#999]">Görsel yok</div>}
            <div className="min-w-0 flex-1"><p className="line-clamp-3 text-sm font-semibold">{item.title}</p>
              <p className="mt-2 text-sm font-semibold">{money(item.price, item.currency)}</p>
              <p className="mt-1 text-xs text-[#888]">#{item.listingId}</p>
              <button onClick={() => setExpanded(expanded === item.listingId ? null : item.listingId)} className="mt-1 text-xs underline">Ürün detayını {expanded === item.listingId ? 'kapat' : 'gör'}</button>
            </div>
          </div>
          {expanded === item.listingId && <div className="border-t bg-[#fafafa] px-3 py-3 text-xs text-[#666]"><p className="line-clamp-6 whitespace-pre-wrap">{item.description}</p><a href={item.url} target="_blank" rel="noopener noreferrer" className="mt-2 inline-flex items-center gap-1 underline">Etsy'de aç <ExternalLink className="h-3 w-3" /></a></div>}
          <div className="flex items-center justify-between border-t px-3 py-2.5">
            <label className="flex items-center gap-2 text-xs font-semibold"><input type="checkbox" disabled={already.has(item.listingId) || !complete || importing || !item.images.length} checked={selected.includes(item.listingId)} onChange={e => toggle(item.listingId, e.target.checked)} /> {already.has(item.listingId) ? 'Önizlemede' : item.images.length ? 'Önizlemeye seç' : 'Görsel yok'}</label>
            {already.has(item.listingId) && <span className="text-xs text-[#777]">Aktarıldı</span>}
          </div>
        </article>)}
      </div>
      {!visible.length && <p className="p-8 text-center text-sm text-[#888]">Etsy ürünlerini getirerek başlayın.</p>}
    </section>
  </div>;
};
