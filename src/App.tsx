import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Storefront from './Storefront';
import ProductDetailPage from './ProductDetailPage';
import CheckoutPage from './CheckoutPage';
import TrackOrderPage from './TrackOrderPage';
import PaymentSuccessPage from './PaymentSuccessPage';
import PaymentCancelPage from './PaymentCancelPage';
import PayPalSuccessPage from './PayPalSuccessPage';
import AccountLoginPage from './account/AccountLoginPage';
import AccountPage from './account/AccountPage';
import { AdminLayout } from './admin/AdminLayout';
import { AdminDashboard } from './admin/AdminDashboard';
import { AdminProducts } from './admin/AdminProducts';
import { ProductForm } from './admin/ProductForm';
import { AdminOrders } from './admin/AdminOrders';
import { AdminCategories } from './admin/AdminCategories';
import { AdminCustomers } from './admin/AdminCustomers';
import { AdminImageLibrary } from './admin/AdminImageLibrary';
import { AdminSettings } from './admin/AdminSettings';
import { PersonalizationTemplateManager } from './admin/PersonalizationTemplateManager';

export default function App() {
  return <BrowserRouter><Routes><Route path="/" element={<Storefront />} /><Route path="/products/:slug" element={<ProductDetailPage />} /><Route path="/checkout" element={<CheckoutPage />} /><Route path="/track-order" element={<TrackOrderPage />} /><Route path="/payment-success" element={<PaymentSuccessPage />} /><Route path="/payment-cancel" element={<PaymentCancelPage />} /><Route path="/paypal-success" element={<PayPalSuccessPage />} /><Route path="/account/login" element={<AccountLoginPage />} /><Route path="/account" element={<AccountPage />} /><Route path="/admin" element={<AdminLayout />}><Route index element={<AdminDashboard />} /><Route path="products" element={<AdminProducts />} /><Route path="products/new" element={<ProductForm />} /><Route path="products/:id/edit" element={<ProductForm />} /><Route path="categories" element={<AdminCategories />} /><Route path="templates" element={<PersonalizationTemplateManager />} /><Route path="orders" element={<AdminOrders />} /><Route path="customers" element={<AdminCustomers />} /><Route path="images" element={<AdminImageLibrary />} /><Route path="settings" element={<AdminSettings />} /><Route path="*" element={<Navigate to="/admin" replace />} /></Route><Route path="*" element={<Navigate to="/" replace />} /></Routes></BrowserRouter>;
}