import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ProductCard } from '../components/ProductCard';
import { ImageUploader } from './ImageUploader';
import { useStore } from '../store/useStore';

const ADMIN_EMAIL = 'admin@boutique.com';
const ADMIN_PASSWORD = 'admin';

type UploadedImage = {
  url: string;
  id: string;
  publicId?: string;
};

const CLOUD_STYLES = [
  {
    label: 'Blue',
    image: '/product-card-cloud-blue.png',
  },
  {
    label: 'Peach',
    image: '/product-card-cloud-peach.png',
  },
  {
    label: 'Mint',
    image: '/product-card-cloud-mint.png',
  },
];

const getAdminToken = async () => {
  const existingToken = localStorage.getItem('little-wonders-admin-token');

  if (existingToken) {
    return existingToken;
  }

  const response = await fetch('/api/admin/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: ADMIN_EMAIL,
      password: ADMIN_PASSWORD,
    }),
  });

  if (!response.ok) {
    throw new Error('Admin login failed.');
  }

  const data = await response.json();
  localStorage.setItem('little-wonders-admin-token', data.token);
  return data.token;
};

export const ProductForm = () => {
  const navigate = useNavigate();
  const { addProduct } = useStore();

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [bgImage, setBgImage] = useState('/product-card-cloud-blue.png');
  const [personalizationRequired, setPersonalizationRequired] = useState(true);
  const [images, setImages] = useState<UploadedImage[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const productPreview = images[0]
    ? {
        id: 'new-product-preview',
        name: name.trim() || 'New personalized gift',
        description: description.trim() || 'Your uploaded product will appear inside the selected cloud card.',
        price: Number(price) || 0,
        imageUrl: images[0].url,
        bgImage,
        personalizationRequired,
      }
    : null;

  const handleSave = async () => {
    if (!name.trim() || !description.trim() || !price || images.length === 0) {
      alert('Please fill product name, description, price and upload one image.');
      return;
    }

    setIsSaving(true);

    try {
      const token = await getAdminToken();

      const response = await fetch('/api/admin/products', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: name.trim(),
          description: description.trim(),
          price: Number(price),
          imageUrl: images[0].url,
          publicId: images[0].publicId,
          bgImage,
          status: 'active',
          personalizationRequired,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.details || data.error || 'Product save failed.');
      }

      addProduct(data);

      alert('Product saved to database successfully.');

      setName('');
      setDescription('');
      setPrice('');
      setBgImage('/product-card-cloud-blue.png');
      setPersonalizationRequired(true);
      setImages([]);
    } catch (error) {
      console.error(error);
      alert((error as Error).message);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto pb-20">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Add New Product</h1>
          <p className="text-gray-500 text-sm mt-1">Create a new product for the storefront.</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => navigate('/admin/products')}
            className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
          >
            Discard
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="bg-gray-900 disabled:bg-gray-400 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-800 transition-colors"
          >
            {isSaving ? 'Saving...' : 'Save Product'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-8">
        <div className="col-span-2 space-y-8">

          {/* Main Info */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 space-y-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Basic Information</h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Product Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
                  placeholder="e.g. Bespoke Heirloom Teddy"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  rows={4}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
                  placeholder="Emotional product description..."
                />
              </div>
            </div>
          </div>

          {/* Media */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Media</h2>
            <ImageUploader images={images} onImagesChange={setImages} />

            {productPreview && (
              <div className="mt-6 border-t border-gray-100 pt-6">
                <p className="mb-3 text-sm font-medium text-gray-700">Storefront card preview</p>
                <div className="overflow-hidden rounded-xl border border-[#d4b497]/20 bg-boutique-bg bg-pattern bg-[length:280px_280px] px-3 py-5">
                  <ProductCard product={productPreview} preview />
                </div>
              </div>
            )}
          </div>

          {/* Pricing */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Pricing</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Price (USD)</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg pl-8 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
                    placeholder="0.00"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Compare at price</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
                  <input type="number" className="w-full border border-gray-300 rounded-lg pl-8 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900" placeholder="0.00" />
                </div>
              </div>
            </div>
          </div>

        </div>

        {/* Sidebar */}
        <div className="space-y-8">

          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 space-y-4">
            <h2 className="text-lg font-medium text-gray-900">Organization</h2>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900">
                <option>Active</option>
                <option>Draft</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
              <select className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900">
                <option>Baby Blankets</option>
                <option>Nursery Decor</option>
                <option>Gift Sets</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Cloud Style</label>
              <div className="grid grid-cols-3 gap-2">
                {CLOUD_STYLES.map((style) => {
                  const selected = style.image === bgImage;

                  return (
                    <button
                      key={style.image}
                      type="button"
                      onClick={() => setBgImage(style.image)}
                      aria-pressed={selected}
                      className={`rounded-lg border p-2 text-left transition-colors ${
                        selected
                          ? 'border-gray-900 bg-gray-50 ring-2 ring-gray-900/10'
                          : 'border-gray-200 bg-white hover:border-gray-400'
                      }`}
                    >
                      <img src={style.image} className="aspect-[1.6/1] w-full object-fill opacity-95" alt="" />
                      <span className="mt-1 block text-center text-[11px] font-medium text-gray-700">
                        {style.label}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 flex items-center justify-between">
             <div className="space-y-0.5">
               <h2 className="font-medium text-gray-900 text-sm">Personalization</h2>
               <p className="text-xs text-gray-500">Enable custom fields for this product.</p>
             </div>
             <label className="relative inline-flex items-center cursor-pointer">
               <input
                 type="checkbox"
                 className="sr-only peer"
                 checked={personalizationRequired}
                 onChange={(e) => setPersonalizationRequired(e.target.checked)}
               />
               <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-gray-900"></div>
             </label>
          </div>

        </div>
      </div>
    </div>
  );
};
