import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, BadgeDollarSign, Box, Check, Cloud, Gift, PackageCheck, Save, Sparkles, Wand2 } from 'lucide-react';
import { ProductCard } from '../components/ProductCard';
import { ImageUploader } from './ImageUploader';
import { useStore } from '../store/useStore';
import { getAdminToken } from './adminAuth';

type UploadedImage = { url: string; id: string; publicId?: string; };
type PromotionBadge = 'none' | 'featured' | 'newArrival' | 'bestseller';
type CloudStyle = { label: string; image: string };

const CLOUD_STYLES: CloudStyle[] = [
  { label: 'Blue', image: '/product-card-cloud-blue.png' },
  { label: 'Peach', image: '/product-card-cloud-peach.png' },
  { label: 'Mint', image: '/product-card-cloud-mint.png' },
];

const Panel = ({ title, icon: Icon, children, note }: { title: string; icon: React.ComponentType<{ className?: string }>; children: React.ReactNode; note?: string }) => (
  <section className="relative overflow-hidden rounded-[1.8rem] border border-boutique-brown/10 bg-white/84 p-6 shadow-[0_18px_45px_rgba(58,37,26,0.07)] backdrop-blur-sm">
    <img src="/cloud-watercolor-blue-light.png" className="pointer-events-none absolute -right-12 -top-12 w-44 opacity-20 mix-blend-multiply" alt="" />
    <div className="relative z-10 mb-5 flex items-start gap-3">
      <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#fff4df] text-boutique-brown shadow-sm"><Icon className="h-5 w-5" /></div>
      <div>
        <h2 className="text-lg font-bold text-boutique-brown">{title}</h2>
        {note && <p className="mt-1 text-xs leading-relaxed text-boutique-brown-light">{note}</p>}
      </div>
    </div>
    <div className="relative z-10">{children}</div>
  </section>
);

const FieldLabel = ({ children }: { children: React.ReactNode }) => <label className="mb-2 block text-xs font-bold uppercase tracking-[0.13em] text-boutique-brown/55">{children}</label>;
const inputClass = 'w-full rounded-2xl border border-boutique-brown/10 bg-[#fffaf3] px-4 py-3 text-sm text-boutique-brown outline-none placeholder:text-boutique-brown/35 focus:ring-2 focus:ring-boutique-wood/25';

const TogglePill = ({ active, label, onClick }: { active: boolean; label: string; onClick: () => void }) => (
  <button type="button" onClick={onClick} className={`flex w-full items-center justify-between rounded-2xl border px-4 py-3 text-sm font-bold transition-all ${active ? 'border-boutique-brown bg-boutique-brown text-white shadow-sm' : 'border-boutique-brown/10 bg-white text-boutique-brown hover:bg-[#fff4df]'}`}>
    <span>{label}</span>
    <span className={`flex h-5 w-5 items-center justify-center rounded-full border ${active ? 'border-white/30 bg-white text-boutique-brown' : 'border-boutique-brown/15 bg-boutique-bg text-transparent'}`}><Check className="h-3.5 w-3.5" /></span>
  </button>
);

const Switch = ({ checked, onClick }: { checked: boolean; onClick: () => void }) => (
  <button type="button" onClick={onClick} className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors ${checked ? 'bg-boutique-brown' : 'bg-boutique-brown/20'}`}>
    <span className={`inline-block h-6 w-6 transform rounded-full bg-white shadow-sm transition-transform ${checked ? 'translate-x-5' : 'translate-x-0.5'}`} />
  </button>
);

export const ProductForm = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditing = Boolean(id);
  const { addProduct } = useStore();

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [salePrice, setSalePrice] = useState('');
  const [sku, setSku] = useState('');
  const [stockQuantity, setStockQuantity] = useState('0');
  const [status, setStatus] = useState<'active' | 'draft'>('active');
  const [promotionBadge, setPromotionBadge] = useState<PromotionBadge>('none');
  const [ageRange, setAgeRange] = useState('');
  const [material, setMaterial] = useState('');
  const [careInstructions, setCareInstructions] = useState('');
  const [preparationTime, setPreparationTime] = useState('');
  const [bgImage, setBgImage] = useState('/product-card-cloud-blue.png');
  const [createCloudVariants, setCreateCloudVariants] = useState(false);
  const [personalizationRequired, setPersonalizationRequired] = useState(true);
  const [images, setImages] = useState<UploadedImage[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!id) return;
    const loadProduct = async () => {
      setIsLoading(true);
      try {
        const token = getAdminToken();
        const response = await fetch(`/api/admin/products/${id}`, { headers: { Authorization: `Bearer ${token}` } });
        const data = await response.json();
        if (!response.ok) throw new Error(data.details || data.error || 'Could not load product.');
        setName(data.name || ''); setDescription(data.description || ''); setPrice(String(data.price || '')); setSalePrice(data.salePrice ? String(data.salePrice) : ''); setSku(data.sku || ''); setStockQuantity(String(data.stockQuantity ?? 0));
        setStatus(data.status === 'draft' ? 'draft' : 'active'); setPromotionBadge(data.bestseller ? 'bestseller' : data.newArrival ? 'newArrival' : data.featured ? 'featured' : 'none');
        setAgeRange(data.ageRange || ''); setMaterial(data.material || ''); setCareInstructions(data.careInstructions || ''); setPreparationTime(data.preparationTime || ''); setBgImage(data.bgImage || '/product-card-cloud-blue.png'); setCreateCloudVariants(false); setPersonalizationRequired(Boolean(data.personalizationRequired)); setImages(data.imageUrl ? [{ url: data.imageUrl, publicId: data.publicId, id: data.id }] : []);
      } catch (error) { console.error(error); alert((error as Error).message); } finally { setIsLoading(false); }
    };
    loadProduct();
  }, [id]);

  const productPreview = images[0] ? { id: id || 'new-product-preview', name: name.trim() || 'New personalized gift', description: description.trim() || 'Your uploaded product will appear inside the selected cloud card.', price: Number(price) || 0, imageUrl: images[0].url, bgImage, badge: promotionBadge === 'bestseller' ? 'Bestseller' : promotionBadge === 'newArrival' ? 'New' : undefined, personalizationRequired } : null;

  const handleSave = async () => {
    if (!name.trim() || !description.trim() || !price || images.length === 0) { alert('Please fill product name, description, price and upload one image.'); return; }
    setIsSaving(true);
    try {
      const token = getAdminToken();
      const response = await fetch(isEditing ? `/api/admin/products/${id}` : '/api/admin/products', { method: isEditing ? 'PUT' : 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify({ name: name.trim(), description: description.trim(), price: Number(price), salePrice: salePrice ? Number(salePrice) : null, imageUrl: images[0].url, publicId: images[0].publicId, bgImage, cloudVariants: !isEditing && createCloudVariants ? CLOUD_STYLES : undefined, sku: sku.trim(), stockQuantity: Number(stockQuantity) || 0, status, featured: promotionBadge === 'featured', newArrival: promotionBadge === 'newArrival', bestseller: promotionBadge === 'bestseller', ageRange: ageRange.trim(), material: material.trim(), careInstructions: careInstructions.trim(), preparationTime: preparationTime.trim(), personalizationRequired }) });
      const data = await response.json(); if (!response.ok) throw new Error(data.details || data.error || 'Product save failed.'); const savedProducts = Array.isArray(data.products) ? data.products : [data.primaryProduct || data]; if (!isEditing) savedProducts.forEach(addProduct); alert(isEditing ? 'Product updated successfully.' : createCloudVariants ? `${savedProducts.length} cloud color products saved successfully.` : 'Product saved to database successfully.'); navigate('/admin/products');
    } catch (error) { console.error(error); alert((error as Error).message); } finally { setIsSaving(false); }
  };

  if (isLoading) return <div className="rounded-[1.8rem] border border-boutique-brown/10 bg-white/80 p-8 text-boutique-brown-light shadow-sm">Loading product...</div>;

  return (
    <div className="space-y-8 pb-20">
      <div className="relative overflow-hidden rounded-[2rem] border border-boutique-brown/10 bg-white/78 p-7 shadow-[0_20px_55px_rgba(58,37,26,0.08)] backdrop-blur-sm">
        <img src="/cloud-watercolor-pink.png" className="pointer-events-none absolute -right-12 -top-14 w-64 opacity-30 mix-blend-multiply" alt="" />
        <img src="/toy-wooden-star-solid.png" className="pointer-events-none absolute right-10 bottom-6 w-10 rotate-12 opacity-35 mix-blend-multiply" alt="" />
        <div className="relative z-10 flex items-center justify-between gap-6">
          <div>
            <button onClick={() => navigate('/admin/products')} className="mb-4 inline-flex items-center gap-2 rounded-full border border-boutique-brown/10 bg-[#fffaf3] px-4 py-2 text-xs font-bold uppercase tracking-[0.14em] text-boutique-brown-light hover:bg-white"><ArrowLeft className="h-4 w-4" /> Products</button>
            <h1 className="font-serif text-5xl leading-none text-boutique-brown">{isEditing ? 'Edit Product' : 'Add New Product'}</h1>
            <p className="mt-3 max-w-2xl text-sm leading-relaxed text-boutique-brown-light">{isEditing ? 'Update product details, media, pricing and personalization settings.' : 'Create a new Little Wonders gift for the storefront.'}</p>
          </div>
          <div className="flex gap-3">
            <button onClick={() => navigate('/admin/products')} className="rounded-full border border-boutique-brown/10 bg-white px-5 py-3 text-sm font-bold text-boutique-brown shadow-sm hover:bg-[#fff4df]">Discard</button>
            <button onClick={handleSave} disabled={isSaving} className="inline-flex items-center gap-2 rounded-full bg-boutique-brown px-5 py-3 text-sm font-bold text-white shadow-sm hover:bg-boutique-wood disabled:opacity-50"><Save className="h-4 w-4" /> {isSaving ? 'Saving...' : isEditing ? 'Update Product' : 'Save Product'}</button>
          </div>
        </div>
      </div>

      <div className="grid gap-8 lg:grid-cols-[1fr_360px]">
        <div className="space-y-8">
          <Panel title="Basic Information" icon={Gift} note="Name and describe the product exactly as customers will see it.">
            <div className="space-y-5"><div><FieldLabel>Product name</FieldLabel><input type="text" value={name} onChange={(e) => setName(e.target.value)} className={inputClass} placeholder="Personalized Cotton Baby Blanket" /></div><div><FieldLabel>Description</FieldLabel><textarea rows={4} value={description} onChange={(e) => setDescription(e.target.value)} className={inputClass} placeholder="Write a warm, gift-ready product description." /></div></div>
          </Panel>

          <Panel title="Media" icon={Cloud} note="Upload product imagery and preview how the storefront card will look.">
            <ImageUploader images={images} onImagesChange={setImages} maxImages={1} />
            {productPreview && <div className="mt-6 border-t border-boutique-brown/10 pt-6"><p className="mb-3 text-sm font-bold text-boutique-brown">Storefront card preview</p><div className="overflow-hidden rounded-[1.3rem] border border-[#d4b497]/20 bg-boutique-bg bg-pattern bg-[length:280px_280px] px-3 py-5"><ProductCard product={productPreview} preview /></div></div>}
          </Panel>

          <Panel title="Pricing & Inventory" icon={BadgeDollarSign} note="Control price, compare-at price, stock and SKU.">
            <div className="grid gap-4 md:grid-cols-2"><div><FieldLabel>Price USD</FieldLabel><input type="number" min="0" step="0.01" value={price} onChange={(e) => setPrice(e.target.value)} className={inputClass} placeholder="75.00" /></div><div><FieldLabel>Compare at price</FieldLabel><input type="number" min="0" step="0.01" value={salePrice} onChange={(e) => setSalePrice(e.target.value)} className={inputClass} placeholder="Optional" /></div><div><FieldLabel>SKU</FieldLabel><input type="text" value={sku} onChange={(e) => setSku(e.target.value)} className={inputClass} placeholder="LW-BLANKET-001" /></div><div><FieldLabel>Stock quantity</FieldLabel><input type="number" min="0" value={stockQuantity} onChange={(e) => setStockQuantity(e.target.value)} className={inputClass} placeholder="0" /></div></div>
          </Panel>

          <Panel title="Product Details" icon={PackageCheck} note="Helpful product information for customers and operations.">
            <div className="grid gap-4 md:grid-cols-2"><div><FieldLabel>Age range</FieldLabel><input type="text" value={ageRange} onChange={(e) => setAgeRange(e.target.value)} className={inputClass} placeholder="0-24 months" /></div><div><FieldLabel>Material</FieldLabel><input type="text" value={material} onChange={(e) => setMaterial(e.target.value)} className={inputClass} placeholder="Cotton, plush, wood..." /></div><div className="md:col-span-2"><FieldLabel>Preparation time</FieldLabel><input type="text" value={preparationTime} onChange={(e) => setPreparationTime(e.target.value)} className={inputClass} placeholder="Ships in 3-5 business days" /></div><div className="md:col-span-2"><FieldLabel>Care instructions</FieldLabel><textarea rows={3} value={careInstructions} onChange={(e) => setCareInstructions(e.target.value)} className={inputClass} placeholder="Machine wash cold, gentle cycle..." /></div></div>
          </Panel>
        </div>

        <aside className="space-y-8">
          <Panel title="Organization" icon={Sparkles} note="Set visibility, promotion badge and cloud style.">
            <div className="space-y-5"><div><FieldLabel>Status</FieldLabel><div className="grid grid-cols-2 gap-2"><TogglePill active={status === 'active'} label="Active" onClick={() => setStatus('active')} /><TogglePill active={status === 'draft'} label="Draft" onClick={() => setStatus('draft')} /></div></div><div><FieldLabel>Promotion badge</FieldLabel><div className="space-y-2 rounded-[1.3rem] bg-[#fffaf3] p-3"><TogglePill active={promotionBadge === 'none'} label="None" onClick={() => setPromotionBadge('none')} /><TogglePill active={promotionBadge === 'featured'} label="Featured" onClick={() => setPromotionBadge('featured')} /><TogglePill active={promotionBadge === 'newArrival'} label="New arrival" onClick={() => setPromotionBadge('newArrival')} /><TogglePill active={promotionBadge === 'bestseller'} label="Bestseller" onClick={() => setPromotionBadge('bestseller')} /></div></div>{!isEditing && <div className="flex items-center justify-between rounded-[1.3rem] bg-[#fffaf3] p-4"><div><h3 className="text-sm font-bold text-boutique-brown">Create color set</h3><p className="mt-1 text-xs leading-relaxed text-boutique-brown-light">Save this image as Blue, Peach and Mint cloud products.</p></div><Switch checked={createCloudVariants} onClick={() => setCreateCloudVariants(!createCloudVariants)} /></div>}<div><FieldLabel>{createCloudVariants && !isEditing ? 'Cloud colors' : 'Cloud style'}</FieldLabel><div className="grid grid-cols-3 gap-2">{CLOUD_STYLES.map((style) => <button key={style.image} type="button" onClick={() => { setBgImage(style.image); if (isEditing) setCreateCloudVariants(false); }} className={`rounded-2xl border p-2 transition-all ${style.image === bgImage || (createCloudVariants && !isEditing) ? 'border-boutique-brown bg-[#fff4df] shadow-sm' : 'border-boutique-brown/10 bg-white hover:bg-[#fff4df]'}`}><img src={style.image} className="aspect-[1.6/1] w-full object-fill" alt="" /><span className="mt-1 block text-center text-[11px] font-bold text-boutique-brown-light">{style.label}</span></button>)}</div>{createCloudVariants && !isEditing && <p className="mt-2 text-xs leading-relaxed text-boutique-brown-light">The storefront will receive three separate products using the same uploaded image.</p>}</div></div>
          </Panel>

          <Panel title="Personalization" icon={Wand2} note="Control whether this product can receive custom details.">
            <div className="flex items-center justify-between rounded-[1.3rem] bg-[#fffaf3] p-4"><div><h3 className="text-sm font-bold text-boutique-brown">Personalized gift</h3><p className="mt-1 text-xs leading-relaxed text-boutique-brown-light">Enable custom fields for this product.</p></div><Switch checked={personalizationRequired} onClick={() => setPersonalizationRequired(!personalizationRequired)} /></div>
          </Panel>

          <div className="relative overflow-hidden rounded-[1.8rem] border border-boutique-brown/10 bg-white/84 p-5 shadow-[0_18px_45px_rgba(58,37,26,0.07)] backdrop-blur-sm">
            <img src="/cloud-watercolor-pink.png" className="pointer-events-none absolute -right-10 -top-10 w-40 opacity-25 mix-blend-multiply" alt="" />
            <p className="relative z-10 text-xs font-bold uppercase tracking-[0.16em] text-boutique-brown/55">Quick check</p>
            <div className="relative z-10 mt-4 space-y-3 text-sm text-boutique-brown-light"><div className="flex justify-between"><span>Name</span><span className="font-bold text-boutique-brown">{name ? 'Ready' : 'Missing'}</span></div><div className="flex justify-between"><span>Price</span><span className="font-bold text-boutique-brown">{price ? `$${Number(price || 0).toFixed(2)}` : 'Missing'}</span></div><div className="flex justify-between"><span>Image</span><span className="font-bold text-boutique-brown">{images.length ? 'Uploaded' : 'Missing'}</span></div><div className="flex justify-between"><span>Cloud products</span><span className="font-bold text-boutique-brown">{createCloudVariants && !isEditing ? '3 colors' : '1 color'}</span></div><div className="flex justify-between"><span>Status</span><span className="font-bold text-boutique-brown">{status}</span></div></div>
          </div>
        </aside>
      </div>
    </div>
  );
};
