import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Storefront from './Storefront';
import { AdminLayout } from './admin/AdminLayout';
import { AdminProducts } from './admin/AdminProducts';
import { ProductForm } from './admin/ProductForm';
import { PersonalizationTemplateManager } from './admin/PersonalizationTemplateManager';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Storefront />} />
        
        {/* Admin Routes */}
        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<div className="text-gray-500 font-medium h-full flex items-center justify-center">Dashboard coming soon...</div>} />
          <Route path="products" element={<AdminProducts />} />
          <Route path="products/new" element={<ProductForm />} />
          <Route path="templates" element={<PersonalizationTemplateManager />} />
          <Route path="*" element={<Navigate to="/admin" replace />} />
        </Route>
        
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
