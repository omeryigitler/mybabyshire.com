import React, { useEffect, useMemo, useState } from 'react';
import { Check, Download, ExternalLink, Loader2, RefreshCw, Unlink } from 'lucide-react';
import { getAdminToken } from './adminAuth';
import { makeEtsyCatalogCsv } from '../utils/etsyCsv';

type Listing = { listingId: string; title: string; url: string; state: 'active'; offset: number };
type LocalProduct = { id: string; name: string; sku?: string; status?: string };
type LinkRecord = { productId: string; listingId: string; url: string; title: string };
type ShopStatus = { configured: boolean; connected: boolean; shopName?: string; shopId?: number; linkedProducts?: number };
type Match = { productId: string; listingId: string; offset: number; title: string };

const normalize = (value: string) => value.normalize('NFKD').toLowerCase().replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, ' ').trim().replace(/\s+/g, ' ');

async function adminRequest(path: string, options?: RequestInit): Promise<any> {
  const response = await fetch(path, {
    ...options,
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getAdminToken()}`, ...options?.headers },
    cache: 'no-store',
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || 'Etsy API request failed.');
  return data;
}

export const AdminEtsy = () => {
  const [status, setStatus] = useState<ShopStatus | null>(null);
  const [products, setProducts] = useState<LocalProduct[]>([]);
  const [listings, setListings] = useState<Listing[]>([]);
  const [links, setLinks] = useState<LinkRecord[]>([]);
  const [total, setTotal] = useState(0);
  const [loadedAll, setLoadedAll] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [selected, setSelected] = useState<Listing | null>(null);
  const [search, setSearch] = useState('');
  const [localSearch, setLocalSearch] = useState('');
  const [page, setPage] = useState(0);

  const refresh = async () => {
    const [nextStatus, nextProducts, nextLinks] = await Promise.all([
      adminRequest('/api/admin/etsy?action=status'),
      adminRequest('/api/admin/products'),
      adminRequest('/api/admin/etsy?action=links'),
    ]);
    setStatus(nextStatus);
    setProducts(Array.isArray(nextProducts) ? nextProducts : []);
    setLinks(Array.isArray(nextLinks.links) ? nextLinks.links : []);
  };

  useEffect(() => {
    let active = true;
    void Promise.all([
      adminRequest('/api/admin/etsy?action=status'),
      adminRequest('/api/admin/products'),
      adminRequest('/api/admin/etsy?action=links'),
    ]).then(([shop, ownProducts, existing]) => {
      if (!active) return;
      setStatus(shop);
      setProducts(Array.isArray(ownProducts) ? ownProducts : []);
      setLinks(Array.isArray(existing.links) ? existing.links : []);
    }).catch((error) => { if (active) setMessage((error as Error).message); });
    return () => { active = false; };
  }, []);

  const loadCatalog = async () => {
    setBusy(true);
    setMessage('');
    setLoadedAll(false);
    setListings([]);
    setPage(0);
    try {
      const all: Listing[] = [];
      let offset = 0;
      let expectedTotal = 0;
      while (offset <= 12000) {
        const data = await adminRequest(`/api/admin/etsy?action=listings&offset=${offset}`);
        expectedTotal = data.total;
        const batch = (data.listings || []).map((entry: Omit<Listing, 'offset'>) => ({ ...entry, offset }));
        all.push(...batch);
        setMessage(`Fetched ${all.length} of ${expectedTotal} Etsy listings…`);
        if (batch.length === 0 || all.length >= expectedTotal) break;
        offset += 100;
      }
      setListings(all);
      setTotal(expectedTotal);
      setLoadedAll(all.length === expectedTotal);
      setMessage(all.length === expectedTotal
        ? `Fetched all ${all.length} active Etsy listings. No links were changed.`
        : `Fetched ${all.length} / ${expectedTotal}. Exact-name matching is disabled until the complete catalog is loaded.`);
    } catch (error) {
      setMessage((error as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const matches = useMemo<Match[]>(() => {
    if (!loadedAll) return [];
    const names = new Map<string, Listing[]>();
    const locals = new Map<string, LocalProduct[]>();
    listings.forEach((listing) => {
      const key = normalize(listing.title);
      if (key) names.set(key, [...(names.get(key) || []), listing]);
    });
    products.forEach((product) => {
      const key = normalize(product.name);
      if (key && product.status !== 'archived') locals.set(key, [...(locals.get(key) || []), product]);
    });
    const linkedProducts = new Set(links.map((link) => link.productId));
    const linkedListings = new Set(links.map((link) => link.listingId));
    const suggestions: Match[] = [];
    names.forEach((etsyListings, title) => {
      const localProducts = locals.get(title) || [];
      if (etsyListings.length !== 1 || localProducts.length !== 1) return; // Never guess between duplicate titles.
      const item = etsyListings[0];
      const product = localProducts[0];
      if (linkedProducts.has(product.id) || linkedListings.has(item.listingId)) return;
      suggestions.push({ productId: product.id, listingId: item.listingId, offset: item.offset, title: item.title });
    });
    return suggestions;
  }, [listings, products, links, loadedAll]);

  const applyMatches = async () => {
    if (!matches.length) return;
    if (!window.confirm(`Link ${matches.length} uniquely matched product titles to Etsy? This only adds missing links; it never replaces existing links.`)) return;
    setBusy(true);
    setMessage('');
    try {
      const batches = new Map<number, Match[]>();
      matches.forEach((match) => batches.set(match.offset, [...(batches.get(match.offset) || []), match]));
      let created = 0;
      let skipped = 0;
      for (const [offset, group] of batches) {
        const result = await adminRequest('/api/admin/etsy?action=bulk-link', {
          method: 'POST',
          body: JSON.stringify({ offset, confirmed: true, pairs: group.map(({ productId, listingId }) => ({ productId, listingId })) }),
        });
        created += result.created;
        skipped += result.skipped;
        setMessage(`Linked ${created} products; skipped ${skipped}. Processing remaining pages…`);
      }
      await refresh();
      setMessage(`Completed: ${created} linked, ${skipped} skipped. Review the unmatched products manually.`);
    } catch (error) {
      await refresh().catch(() => undefined);
      setMessage(`Linking interrupted: ${(error as Error).message}. Completed links are preserved.`);
    } finally {
      setBusy(false);
    }
  };

  const linkToProduct = async (productId: string) => {
    if (!selected) return;
    setBusy(true);
    try {
      await adminRequest('/api/admin/etsy?action=link', { method: 'POST', body: JSON.stringify({ listingId: selected.listingId, productId }) });
      await refresh();
      setSelected(null);
      setLocalSearch('');
      setMessage('Etsy listing linked to the selected site product.');
    } catch (error) {
      setMessage((error as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const unlink = async (productId: string) => {
    if (!window.confirm('Remove this Etsy product link?')) return;
    setBusy(true);
    try {
      await adminRequest('/api/admin/etsy?action=link', { method: 'DELETE', body: JSON.stringify({ productId }) });
      await refresh();
      setMessage('Link removed.');
    } catch (error) {
      setMessage((error as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const linkedByListing = useMemo(() => new Map(links.map((link) => [link.listingId, link])), [links]);
  const exportAllListings = () => {
    if (!loadedAll || !listings.length) return;
    const mappedProducts = new Map(products.map((product) => [product.id, product.name]));
    const csv = makeEtsyCatalogCsv(listings.map((listing) => {
      const link = linkedByListing.get(listing.listingId);
      return {
        listingId: listing.listingId,
        title: listing.title,
        url: listing.url,
        productName: link ? mappedProducts.get(link.productId) || '' : '',
      };
    }));
    const blobUrl = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
    const anchor = document.createElement('a');
    anchor.href = blobUrl;
    anchor.download = 'babyshirekids-etsy-listings.csv';
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    window.setTimeout(() => URL.revokeObjectURL(blobUrl), 1000);
  };
  const filtered = useMemo(() => listings.filter((listing) => normalize(listing.title).includes(normalize(search)) || listing.listingId.includes(search.trim())), [listings, search]);
  const visible = filtered.slice(page * 30, (page + 1) * 30);
  const selectableProducts = products.filter((product) => product.status !== 'archived' && (normalize(product.name).includes(normalize(localSearch)) || (product.sku || '').toLowerCase().includes(localSearch.toLowerCase()))).slice(0, 25);

  return <div className="space-y-6">
    <header>
      <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#999]">Catalog integrations</p>
      <h1 className="mt-1 text-3xl font-semibold">Etsy Catalog</h1>
      <p className="mt-2 max-w-3xl text-sm text-[#777]">Connect existing mybabyshire.com products to active babyshirekids listings. No payment, shipping or inventory data is modified on Etsy.</p>
    </header>

    <section className="rounded-xl border border-[#e4e4e4] bg-white p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div><h2 className="font-semibold">{status?.connected ? 'Etsy connected' : status?.configured === false ? 'Etsy credentials missing' : 'Checking Etsy connection'}</h2>
          <p className="mt-1 text-xs text-[#777]">Shop: babyshirekids {status?.shopId ? `· ID ${status.shopId}` : ''} · Stored links: {links.length}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={exportAllListings} disabled={busy || !loadedAll || listings.length === 0} className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-[#dedede] bg-white px-4 text-sm font-semibold text-[#333] disabled:opacity-40">
            <Download className="h-4 w-4" /> Export all URLs (CSV)
          </button>
          <button type="button" onClick={() => void loadCatalog()} disabled={busy || !status?.connected} className="inline-flex min-h-10 items-center gap-2 rounded-lg bg-[#202020] px-4 text-sm font-semibold text-white disabled:opacity-40">
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />} Load all Etsy listings
          </button>
        </div>
      </div>
      {message && <p role="status" className="mt-3 rounded-lg bg-[#f7f7f7] px-3 py-2.5 text-sm text-[#555]">{message}</p>}
      {loadedAll && <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-[#eee] pt-4">
        <p className="text-sm"><strong>{total}</strong> active Etsy listings · <strong>{matches.length}</strong> unique exact-title matches awaiting approval</p>
        <button type="button" disabled={busy || matches.length === 0} onClick={() => void applyMatches()} className="rounded-lg border border-[#202020] bg-white px-4 py-2.5 text-sm font-semibold disabled:opacity-40">Review & apply {matches.length} exact matches</button>
      </div>}
      <p className="mt-3 text-xs text-[#999]">Only exact unique titles can be bulk-linked. Duplicate titles and unmatched items remain unlinked for review. Existing links are never overwritten.</p>
    </section>

    {selected && <section className="rounded-xl border border-[#d0d0d0] bg-white p-5">
      <div className="flex justify-between gap-4"><div><h2 className="font-semibold">Match Etsy listing to a site product</h2><p className="mt-1 text-xs text-[#666]">{selected.title} · #{selected.listingId}</p></div><button type="button" onClick={() => setSelected(null)} className="text-xs underline">Close</button></div>
      <input value={localSearch} onChange={(event) => setLocalSearch(event.target.value)} placeholder="Search site product name or SKU" className="mt-4 h-11 w-full rounded-lg border border-[#ddd] px-3 text-sm" />
      <div className="mt-3 max-h-72 space-y-1 overflow-y-auto">
        {selectableProducts.map((product) => <button key={product.id} type="button" disabled={busy || links.some((link) => link.productId === product.id)} onClick={() => void linkToProduct(product.id)} className="flex w-full items-center justify-between rounded-lg border border-[#eee] px-3 py-2.5 text-left text-sm hover:bg-[#f6f6f6] disabled:opacity-35"><span>{product.name} <span className="text-[#999]">{product.sku}</span></span><Check className="h-4 w-4" /></button>)}
      </div>
    </section>}

    <section className="overflow-hidden rounded-xl border border-[#e4e4e4] bg-white">
      <div className="flex flex-wrap justify-between gap-3 border-b border-[#eee] p-4">
        <h2 className="font-semibold">Active Etsy listings ({filtered.length})</h2>
        <input value={search} onChange={(event) => { setSearch(event.target.value); setPage(0); }} placeholder="Search loaded listings" className="h-10 rounded-lg border border-[#ddd] px-3 text-sm" />
      </div>
      <div className="divide-y divide-[#eee]">
        {visible.map((listing) => {
          const link = linkedByListing.get(listing.listingId);
          const product = link ? products.find((item) => item.id === link.productId) : null;
          return <div key={listing.listingId} className="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
            <div className="min-w-0 flex-1"><p className="text-sm font-medium">{listing.title}</p><p className="mt-1 text-xs text-[#888]">Listing #{listing.listingId} · {product ? `Linked to ${product.name}` : link ? 'Linked' : 'Unlinked'}</p></div>
            <div className="flex items-center gap-3">
              <a href={listing.url} target="_blank" rel="noopener noreferrer" title="Open listing on Etsy" className="text-[#666]"><ExternalLink className="h-4 w-4" /></a>
              {link ? <button type="button" disabled={busy} onClick={() => void unlink(link.productId)} title="Unlink" className="rounded-lg border p-2 text-[#666] disabled:opacity-40"><Unlink className="h-4 w-4" /></button>
                : <button type="button" disabled={busy} onClick={() => setSelected(listing)} className="rounded-lg border border-[#202020] px-3 py-2 text-xs font-semibold disabled:opacity-40">Match manually</button>}
            </div>
          </div>;
        })}
        {!listings.length && <p className="p-5 text-sm text-[#888]">Load the Etsy catalog to browse and link products.</p>}
      </div>
      {filtered.length > 30 && <div className="flex items-center justify-between border-t border-[#eee] p-4 text-sm"><button disabled={page === 0} onClick={() => setPage((value) => value - 1)} className="disabled:opacity-30">Previous</button><span>Page {page + 1} / {Math.ceil(filtered.length / 30)}</span><button disabled={(page + 1) * 30 >= filtered.length} onClick={() => setPage((value) => value + 1)} className="disabled:opacity-30">Next</button></div>}
    </section>
  </div>;
};
