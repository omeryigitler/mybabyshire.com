import React, { Suspense, lazy } from 'react';
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

const AdminLayout = lazy(() => import('./admin/AdminLayout').then((module) => ({ default: module.AdminLayout })));
const AdminDashboard = lazy(() => import('./admin/AdminDashboard').then((module) => ({ default: module.AdminDashboard })));
const AdminProducts = lazy(() => import('./admin/AdminProducts').then((module) => ({ default: module.AdminProducts })));
const ProductForm = lazy(() => import('./admin/ProductForm').then((module) => ({ default: module.ProductForm })));
const AdminOrders = lazy(() => import('./admin/AdminOrders').then((module) => ({ default: module.AdminOrders })));
const AdminCategories = lazy(() => import('./admin/AdminCategories').then((module) => ({ default: module.AdminCategories })));
const AdminCustomers = lazy(() => import('./admin/AdminCustomers').then((module) => ({ default: module.AdminCustomers })));
const AdminImageLibrary = lazy(() => import('./admin/AdminImageLibrary').then((module) => ({ default: module.AdminImageLibrary })));
const AdminSettings = lazy(() => import('./admin/AdminSettings').then((module) => ({ default: module.AdminSettings })));
const PersonalizationTemplateManager = lazy(() => import('./admin/PersonalizationTemplateManager').then((module) => ({ default: module.PersonalizationTemplateManager })));

const RouteFallback = () => (
  <div className="flex min-h-screen items-center justify-center bg-boutique-bg font-sans text-sm font-bold text-boutique-brown">
    Loading MY BABY SHIRE...
  </div>
);

export default function App() {
  return (
    <BrowserRouter>
      <Suspense fallback={<RouteFallback />}>
        <Routes>
          <Route path="/" element={<Storefront />} />
          <Route path="/products/:slug" element={<ProductDetailPage />} />
          <Route path="/checkout" element={<CheckoutPage />} />
          <Route path="/track-order" element={<TrackOrderPage />} />
          <Route path="/payment-success" element={<PaymentSuccessPage />} />
          <Route path="/payment-cancel" element={<PaymentCancelPage />} />
          <Route path="/paypal-success" element={<PayPalSuccessPage />} />
          <Route path="/login" element={<AccountLoginPage />} />
          <Route path="/account/login" element={<Navigate to="/login" replace />} />
          <Route path="/account" element={<AccountPage />} />
          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<AdminDashboard />} />
            <Route path="products" element={<AdminProducts />} />
            <Route path="products/new" element={<ProductForm />} />
            <Route path="products/:id/edit" element={<ProductForm />} />
            <Route path="categories" element={<AdminCategories />} />
            <Route path="templates" element={<PersonalizationTemplateManager />} />
            <Route path="orders" element={<AdminOrders />} />
            <Route path="customers" element={<AdminCustomers />} />
            <Route path="images" element={<AdminImageLibrary />} />
            <Route path="settings" element={<AdminSettings />} />
            <Route path="*" element={<Navigate to="/admin" replace />} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}
