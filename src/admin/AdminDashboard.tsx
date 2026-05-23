import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { AlertCircle, ArrowRight, CheckCircle2, Clock3, Package, Plus, RefreshCcw, Sparkles } from 'lucide-react';
import { Product } from '../store/useStore';
import { getAdminToken } from './adminAuth';

export const AdminDashboard = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadProducts = async () => {
    setIsLoading(true);

    try {
      const token = getAdminToken();
      const response = await fetch('/api/admin/products', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.details || data.error || 'Could not load dashboard.');
      }

      setProducts(data);
    } catch (error) {
      console.error(error);
      alert((error as Error).message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadProducts();
  }, []);

  const stats = useMemo(() => {
    const total = products.length;
    const active = products.filter((product) => product.status !== 'draft').length;
    const draft = products.filter((product) => product.status === 'draft').length;
    const missingImages = products.filter((product) => !product.imageUrl).length;

    return { total, active, draft, missingImages };
  }, [products]);

  const recentProducts = products.slice(0, 5);

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-500 text-sm mt-1">Overview of your storefront catalog and admin actions.</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={loadProducts}
            disabled={isLoading}
            className="border border-gray-200 rounded-lg px-3 py-2 bg-white hover:bg-gray-50 disabled:opacity-50 text-sm font-medium flex items-center gap-2"
          >
            <RefreshCcw className="w-4 h-4" /> Refresh
          </button>
          <Link to="/admin/products/new" className="bg-gray-900 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-800 transition-colors flex items-center gap-2">
            <Plus className="w-4 h-4" /> Add Product
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-500">Total Products</span>
            <Package className="w-5 h-5 text-gray-400" />
          </div>
          <p className="text-3xl font-bold text-gray-900 mt-4">{isLoading ? '—' : stats.total}</p>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-500">Active</span>
            <CheckCircle2 className="w-5 h-5 text-green-500" />
          </div>
          <p className="text-3xl font-bold text-gray-900 mt-4">{isLoading ? '—' : stats.active}</p>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-500">Draft</span>
            <Clock3 className="w-5 h-5 text-gray-400" />
          </div>
          <p className="text-3xl font-bold text-gray-900 mt-4">{isLoading ? '—' : stats.draft}</p>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-500">Needs Review</span>
            <AlertCircle className="w-5 h-5 text-amber-500" />
          </div>
          <p className="text-3xl font-bold text-gray-900 mt-4">{isLoading ? '—' : stats.missingImages}</p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-6">
        <div className="col-span-2 bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="p-5 border-b border-gray-200 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Recent Products</h2>
              <p className="text-sm text-gray-500 mt-1">Latest catalog items from your admin database.</p>
            </div>
            <Link to="/admin/products" className="text-sm font-medium text-gray-900 hover:underline flex items-center gap-1">
              View all <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="divide-y divide-gray-100">
            {isLoading && (
              <div className="p-6 text-sm text-gray-500">Loading products...</div>
            )}

            {!isLoading && recentProducts.length === 0 && (
              <div className="p-6 text-sm text-gray-500">No products yet. Add your first product to start building the storefront.</div>
            )}

            {!isLoading && recentProducts.map((product) => (
              <Link key={product.id} to={`/admin/products/${product.id}/edit`} className="p-4 flex items-center gap-4 hover:bg-gray-50 transition-colors">
                <div className="w-12 h-12 bg-gray-100 rounded-lg overflow-hidden border border-gray-200 flex-shrink-0">
                  {product.imageUrl ? (
                    <img src={product.imageUrl} className="w-full h-full object-cover" alt="" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-300">
                      <Package className="w-5 h-5" />
                    </div>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="text-sm font-medium text-gray-900 truncate">{product.name}</h3>
                  <p className="text-xs text-gray-500 truncate">{product.description}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-gray-900">${product.price.toFixed(2)}</p>
                  <span className={`inline-flex mt-1 items-center px-2 py-0.5 rounded-full text-[11px] font-medium ${product.status === 'draft' ? 'bg-gray-100 text-gray-700' : 'bg-green-100 text-green-800'}`}>
                    {product.status || 'active'}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-gray-900 rounded-xl p-6 text-white shadow-sm">
            <div className="flex items-center gap-2 mb-4">
              <Sparkles className="w-5 h-5" />
              <h2 className="text-lg font-semibold">Quick Actions</h2>
            </div>
            <div className="space-y-3">
              <Link to="/admin/products/new" className="block rounded-lg bg-white/10 px-4 py-3 text-sm font-medium hover:bg-white/15 transition-colors">
                Add a new product
              </Link>
              <Link to="/admin/products" className="block rounded-lg bg-white/10 px-4 py-3 text-sm font-medium hover:bg-white/15 transition-colors">
                Manage catalog
              </Link>
              <Link to="/admin/templates" className="block rounded-lg bg-white/10 px-4 py-3 text-sm font-medium hover:bg-white/15 transition-colors">
                Manage personalization
              </Link>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-gray-900">Next Setup</h2>
            <ul className="mt-4 space-y-3 text-sm text-gray-600">
              <li className="flex gap-2"><span className="text-gray-900">•</span> Connect stock and SKU fields to the product form.</li>
              <li className="flex gap-2"><span className="text-gray-900">•</span> Build product detail pages for the storefront.</li>
              <li className="flex gap-2"><span className="text-gray-900">•</span> Add cart and checkout when the catalog is ready.</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};
