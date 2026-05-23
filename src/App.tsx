import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Storefront from './Storefront';
import ProductDetailPage from './ProductDetailPage';
import CheckoutPage from './CheckoutPage';
import { AdminLayout } from './admin/AdminLayout';
import { AdminDashboard } from './admin/AdminDashboard';
import { AdminProducts } from './admin/AdminProducts';
import { ProductForm } from './admin/ProductForm';
import { AdminOrders } from './admin/AdminOrders';
import { PersonalizationTemplateManager } from './admin/PersonalizationTemplateManager';

export default function App() {
  return <BrowserRouter><Routes><Route path="/" element={<Storefront />} /><Route path="/products/:slug" element={<ProductDetailPage />} /><Route path="/checkout" element={<CheckoutPage />} /><Route path="/admin" element={<AdminLayout />}><Route index element={<AdminDashboard />} /><Route path="products" element={<AdminProducts />} /><Route path="products/new" element={<ProductForm />} /><Route path="products/:id/edit" element={<ProductForm />} /><Route path="orders" element={<AdminOrders />} /><Route path="templates" element={<PersonalizationTemplateManager />} /><Route path="*" element={<Navigate to="/admin" replace />} /></Route><Route path="*" element={<Navigate to="/" replace />} /></Routes></BrowserRouter>;
}
