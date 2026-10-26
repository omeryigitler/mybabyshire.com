import { ETSY_ONLY_MODE, ETSY_SHOP_URL } from './config/commerce';
import React, { Suspense, lazy, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation, useParams } from 'react-router-dom';
import { initAnalytics, trackPageView } from './utils/analytics';
import { CookieConsent } from './components/CookieConsent';
import { SiteCredits } from './components/SiteCredits';
import Storefront from './Storefront';
import { GlobalCustomFormControls } from './components/GlobalCustomFormControls';

const CollectionPage = lazy(() => import('./CollectionPage'));
const ProductDetailPage = lazy(() => import('./ProductDetailPage'));
const CheckoutPage = lazy(() => import('./CheckoutPage'));
const TrackOrderPage = lazy(() => import('./TrackOrderPage'));
const PaymentSuccessPage = lazy(() => import('./PaymentSuccessPage'));
const PaymentCancelPage = lazy(() => import('./PaymentCancelPage'));
const PayPalSuccessPage = lazy(() => import('./PayPalSuccessPage'));
const AccountLoginPage = lazy(() => import('./account/AccountLoginPage'));
const AccountPage = lazy(() => import('./account/AccountPage'));
const ShippingPolicyPage = lazy(() => import('./legal/LegalPages').then((module) => ({ default: module.ShippingPolicyPage })));
const RefundPolicyPage = lazy(() => import('./legal/LegalPages').then((module) => ({ default: module.RefundPolicyPage })));
const PrivacyPolicyPage = lazy(() => import('./legal/LegalPages').then((module) => ({ default: module.PrivacyPolicyPage })));
const TermsPage = lazy(() => import('./legal/LegalPages').then((module) => ({ default: module.TermsPage })));
const CookiesPolicyPage = lazy(() => import('./legal/LegalPages').then((module) => ({ default: module.CookiesPolicyPage })));

const AdminLayout = lazy(() => import('./admin/AdminLayout').then((module) => ({ default: module.AdminLayout })));
const AdminDashboard = lazy(() => import('./admin/AdminDashboard').then((module) => ({ default: module.AdminDashboard })));
const AdminProducts = lazy(() => import('./admin/AdminProducts').then((module) => ({ default: module.AdminProducts })));
const AdminInventory = lazy(() => import('./admin/AdminInventory').then((module) => ({ default: module.AdminInventory })));
const AdminOrders = lazy(() => import('./admin/AdminOrders').then((module) => ({ default: module.AdminOrders })));
const AdminReviews = lazy(() => import('./admin/AdminReviews').then((module) => ({ default: module.AdminReviews })));
const AdminCoupons = lazy(() => import('./admin/AdminCoupons').then((module) => ({ default: module.AdminCoupons })));
const AdminCategories = lazy(() => import('./admin/AdminCategories').then((module) => ({ default: module.AdminCategories })));
const AdminCustomers = lazy(() => import('./admin/AdminCustomers').then((module) => ({ default: module.AdminCustomers })));
const AdminImageLibrary = lazy(() => import('./admin/AdminImageLibrary').then((module) => ({ default: module.AdminImageLibrary })));
const AdminSettings = lazy(() => import('./admin/AdminSettings').then((module) => ({ default: module.AdminSettings })));
const AdminEtsy = lazy(() => import('./admin/AdminEtsyImport').then((module) => ({ default: module.AdminEtsy })));
const AdminSitePreview = lazy(() => import('./admin/AdminSitePreview').then((module) => ({ default: module.AdminSitePreview })));
const PersonalizationTemplateManager = lazy(() => import('./admin/PersonalizationTemplateManager').then((module) => ({ default: module.PersonalizationTemplateManager })));

const RouteFallback = () => (
  <div className="flex min-h-screen items-center justify-center bg-white font-sans text-sm font-semibold text-[#202020]">
    Loading MY BABY SHIRE...
  </div>
);

function RouteAnalytics() {
  const location = useLocation();
  useEffect(() => { initAnalytics(); }, []);
  useEffect(() => { trackPageView(location.pathname + location.search); }, [location.pathname, location.search]);
  return null;
}

function AdminProductEditRedirect() {
  const { id } = useParams();
  return <Navigate to={`/admin/products?edit=${encodeURIComponent(id || '')}`} replace />;
}

export default function App() {
  return (
    <BrowserRouter>
      <GlobalCustomFormControls />
      <RouteAnalytics />
      <CookieConsent />
      <Suspense fallback={<RouteFallback />}>
        <Routes>
          <Route path="/" element={<Storefront />} />
          <Route path="/collections/:collection" element={<CollectionPage />} />
          <Route path="/products/:slug" element={<ProductDetailPage />} />
          <Route path="/checkout" element={ETSY_ONLY_MODE ? <Navigate to="/collections/all" replace /> : <CheckoutPage />} />
          <Route path="/track-order" element={<TrackOrderPage />} />
          <Route path="/payment-success" element={<PaymentSuccessPage />} />
          <Route path="/payment-cancel" element={<PaymentCancelPage />} />
          <Route path="/paypal-success" element={<PayPalSuccessPage />} />
          <Route path="/login" element={<AccountLoginPage />} />
          <Route path="/account/login" element={<Navigate to="/login" replace />} />
          <Route path="/account" element={<AccountPage />} />
          <Route path="/policies/shipping" element={<ShippingPolicyPage />} />
          <Route path="/policies/returns" element={<RefundPolicyPage />} />
          <Route path="/policies/privacy" element={<PrivacyPolicyPage />} />
          <Route path="/policies/terms" element={<TermsPage />} />
          <Route path="/policies/cookies" element={<CookiesPolicyPage />} />
          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<AdminDashboard />} />
            <Route path="products" element={<AdminProducts />} />
            <Route path="products/new" element={<Navigate to="/admin/products?create=1" replace />} />
            <Route path="products/:id/edit" element={<AdminProductEditRedirect />} />
            <Route path="inventory" element={<AdminInventory />} />
            <Route path="categories" element={<AdminCategories />} />
            <Route path="templates" element={<PersonalizationTemplateManager />} />
            <Route path="orders" element={<AdminOrders />} />
            <Route path="reviews" element={<AdminReviews />} />
            <Route path="coupons" element={<AdminCoupons />} />
            <Route path="customers" element={<AdminCustomers />} />
            <Route path="images" element={<AdminImageLibrary />} />
            <Route path="settings" element={<AdminSettings />} />
            <Route path="etsy" element={<AdminEtsy />} />
            <Route path="site-preview" element={<AdminSitePreview />} />
            <Route path="*" element={<Navigate to="/admin" replace />} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      <SiteCredits />
      </Suspense>
    </BrowserRouter>
  );
}
