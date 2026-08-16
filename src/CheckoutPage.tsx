import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Check, CreditCard, Lock, ShieldCheck, ShoppingBag, Tag, Truck, WalletCards } from 'lucide-react';
import { useStore } from './store/useStore';
import { BrandLogo } from './components/BrandLogo';
import { calculateTax } from './utils/tax';
import { SHIPPING_METHODS } from './utils/shipping';
import { rememberPendingPurchase } from './utils/analytics';
import { getStoredMemberToken, memberFetch } from './account/memberAuth';

type PaymentMethod = 'stripe' | 'paypal';

type AccountCheckoutProfile = {
  member: {
    name: string;
    email: string;
    addresses?: Array<{
      fullName: string;
      addressLine1: string;
      addressLine2?: string | null;
      city: string;
      state?: string | null;
      postalCode: string;
      country: string;
      isDefault: boolean;
    }>;
  };
};

const inputClass = 'h-12 w-full rounded-[9px] border border-[#dcdcdc] bg-white px-3.5 text-sm text-[#202020] outline-none transition focus:border-[#202020] focus:ring-1 focus:ring-[#202020]';

export default function CheckoutPage() {
  const { cartItems } = useStore();
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<PaymentMethod>('stripe');
  const [selectedShippingId, setSelectedShippingId] = useState('us-standard');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [customerName, setCustomerName] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [zip, setZip] = useState('');
  const [orderNote, setOrderNote] = useState('');
  const [couponInput, setCouponInput] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<{ code: string; discount: number } | null>(null);
  const [couponError, setCouponError] = useState('');
  const [couponLoading, setCouponLoading] = useState(false);
  const [formError, setFormError] = useState('');

  useEffect(() => {
    if (!getStoredMemberToken()) return;

    memberFetch<AccountCheckoutProfile>('/api/account/me')
      .then(({ member }) => {
        setCustomerName((current) => current || member.name || '');
        setEmail((current) => current || member.email || '');
        const savedAddress = member.addresses?.find((item) => item.isDefault) || member.addresses?.[0];
        if (!savedAddress || savedAddress.country !== 'US') return;
        setCustomerName((current) => current || savedAddress.fullName || '');
        setAddress((current) => current || [savedAddress.addressLine1, savedAddress.addressLine2].filter(Boolean).join(', '));
        setCity((current) => current || savedAddress.city || '');
        setState((current) => current || savedAddress.state || '');
        setZip((current) => current || savedAddress.postalCode || '');
      })
      .catch(() => {
        // Checkout remains available to guests if an account session expires.
      });
  }, []);

  const selectedShippingMethod = SHIPPING_METHODS.find((method) => method.id === selectedShippingId) || SHIPPING_METHODS[0];
  const unitPrice = (item: (typeof cartItems)[number]) => item.variant?.price ?? item.product.price;
  const subtotal = useMemo(() => cartItems.reduce((sum, item) => sum + unitPrice(item) * item.quantity, 0), [cartItems]);
  const shipping = subtotal > 0 ? selectedShippingMethod.amount : 0;
  const discount = appliedCoupon ? Math.min(appliedCoupon.discount, subtotal) : 0;
  const taxableBase = Math.max(0, subtotal - discount);
  const taxBreakdown = useMemo(() => calculateTax(taxableBase, state), [taxableBase, state]);
  const tax = taxBreakdown.amount;
  const total = taxableBase + shipping + tax;

  const applyCoupon = async () => {
    const code = couponInput.trim();
    if (!code) return;
    setCouponError('');
    setCouponLoading(true);
    try {
      const response = await fetch('/api/coupons/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, subtotal }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Invalid coupon code.');
      setAppliedCoupon({ code: data.code, discount: data.discount });
    } catch (error) {
      setAppliedCoupon(null);
      setCouponError((error as Error).message);
    } finally {
      setCouponLoading(false);
    }
  };

  const removeCoupon = () => {
    setAppliedCoupon(null);
    setCouponInput('');
    setCouponError('');
  };

  const validateCheckout = () => {
    setFormError('');
    if (cartItems.length === 0) {
      setFormError('Your cart is empty.');
      return false;
    }

    const missingVariant = cartItems.find((item) => item.product.variants?.length && !item.variant);
    if (missingVariant) {
      setFormError(`${missingVariant.product.name} needs a color and size selection. Return to the product and choose a variant.`);
      return false;
    }

    if (!customerName.trim() || !email.trim() || !address.trim() || !city.trim() || !state.trim() || !zip.trim()) {
      setFormError('Fill in all required contact and shipping fields.');
      return false;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setFormError('Enter a valid email address.');
      return false;
    }

    if (!/^\d{5}(-\d{4})?$/.test(zip.trim())) {
      setFormError('Enter a valid US ZIP code.');
      return false;
    }

    return true;
  };

  const checkoutPayload = {
    customer: {
      name: customerName.trim(),
      email: email.trim(),
      address: address.trim(),
      city: city.trim(),
      state: state.trim().toUpperCase(),
      zip: zip.trim(),
    },
    items: cartItems.map((item) => ({
      productId: item.product.id,
      variantId: item.variant?.id || null,
      quantity: item.quantity,
      personalizationData: item.personalizationData,
    })),
    shippingMethodId: selectedShippingMethod.id,
    giftMessage: orderNote.trim(),
    couponCode: appliedCoupon?.code || '',
    currency: 'USD',
  };

  const readJsonResponse = async (response: Response) => {
    const contentType = response.headers.get('content-type') || '';
    if (!contentType.includes('application/json')) {
      const text = await response.text();
      throw new Error(text.includes('<!doctype') || text.includes('<html') ? 'Payment service returned an invalid response. Please try again.' : text);
    }
    return response.json();
  };

  const handleStripeCheckout = async () => {
    const response = await fetch('/api/checkout/create-payment', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(checkoutPayload),
    });
    const data = await readJsonResponse(response);
    if (!response.ok) throw new Error(data.details || data.error || 'Checkout could not be created.');
    if (!data.checkoutUrl) throw new Error('Checkout URL was not returned.');
    rememberPendingPurchase(data.orderId, data.total ?? total);
    window.location.href = data.checkoutUrl;
  };

  const handlePayPalCheckout = async () => {
    const response = await fetch('/api/paypal-create-order', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(checkoutPayload),
    });
    const data = await readJsonResponse(response);
    if (!response.ok) throw new Error(data.details || data.error || 'PayPal checkout could not be created.');
    if (!data.approvalUrl) throw new Error('PayPal approval URL was not returned.');
    rememberPendingPurchase(data.orderId, data.total ?? total);
    window.location.href = data.approvalUrl;
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!validateCheckout()) return;
    setIsSubmitting(true);
    setFormError('');

    try {
      if (selectedPaymentMethod === 'paypal') await handlePayPalCheckout();
      else await handleStripeCheckout();
    } catch (error) {
      console.error(error);
      setFormError((error as Error).message || 'Checkout could not be started.');
      setIsSubmitting(false);
    }
  };

  const buttonLabel = isSubmitting
    ? selectedPaymentMethod === 'paypal' ? 'Opening PayPal…' : 'Opening secure payment…'
    : selectedPaymentMethod === 'paypal' ? 'Continue with PayPal' : 'Continue to secure payment';

  return (
    <div className="min-h-screen bg-[#f7f7f7] font-sans text-[#202020]">
      <header className="sticky top-0 z-30 border-b border-[#e7e7e7] bg-white/95 backdrop-blur-lg">
        <div className="mx-auto grid min-h-[72px] max-w-[1320px] grid-cols-[1fr_auto_1fr] items-center px-4 sm:px-6 lg:px-8">
          <Link to="/" className="commerce-focus inline-flex w-fit items-center gap-2 text-sm font-semibold text-[#666] hover:text-[#202020]"><ArrowLeft className="h-4 w-4" /> <span className="hidden sm:inline">Back to shop</span></Link>
          <Link to="/" aria-label="MY BABY SHIRE home"><BrandLogo variant="nav" className="!h-[40px] sm:!h-[46px] !drop-shadow-none" /></Link>
          <div className="justify-self-end"><span className="hidden items-center gap-2 text-xs font-semibold text-[#666] sm:inline-flex"><Lock className="h-4 w-4" /> Secure checkout</span></div>
        </div>
      </header>

      <main className="mx-auto grid max-w-[1220px] gap-8 px-4 py-7 sm:px-6 md:grid-cols-[minmax(0,1.15fr)_minmax(340px,.85fr)] lg:px-8 lg:py-10">
        <form onSubmit={handleSubmit} className="space-y-5">
          <section className="rounded-[12px] border border-[#e3e3e3] bg-white p-5 sm:p-6">
            <h1 className="text-2xl font-semibold tracking-[-0.02em] sm:text-3xl">Checkout</h1>
            <p className="mt-1.5 text-sm text-[#707070]">Shipping and payment details are verified before your order is created.</p>
          </section>

          <section className="rounded-[12px] border border-[#e3e3e3] bg-white p-5 sm:p-6">
            <h2 className="text-sm font-semibold">Contact</h2>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <input value={customerName} onChange={(event) => setCustomerName(event.target.value)} className={inputClass} placeholder="Full name" autoComplete="name" />
              <input value={email} onChange={(event) => setEmail(event.target.value)} type="email" className={inputClass} placeholder="Email address" autoComplete="email" />
            </div>
          </section>

          <section className="rounded-[12px] border border-[#e3e3e3] bg-white p-5 sm:p-6">
            <h2 className="text-sm font-semibold">Shipping address</h2>
            <div className="mt-4 grid gap-3">
              <input value={address} onChange={(event) => setAddress(event.target.value)} className={inputClass} placeholder="Street address" autoComplete="street-address" />
              <div className="grid gap-3 sm:grid-cols-3">
                <input value={city} onChange={(event) => setCity(event.target.value)} className={inputClass} placeholder="City" autoComplete="address-level2" />
                <input value={state} onChange={(event) => setState(event.target.value)} className={inputClass} placeholder="State" autoComplete="address-level1" />
                <input value={zip} onChange={(event) => setZip(event.target.value)} className={inputClass} placeholder="ZIP code" autoComplete="postal-code" />
              </div>
            </div>
          </section>

          <section className="rounded-[12px] border border-[#e3e3e3] bg-white p-5 sm:p-6">
            <div className="flex items-center gap-2"><Truck className="h-4 w-4" /><h2 className="text-sm font-semibold">Shipping method</h2></div>
            <div className="mt-4 grid gap-2 sm:grid-cols-2">
              {SHIPPING_METHODS.map((method) => {
                const active = selectedShippingId === method.id;
                return (
                  <button key={method.id} type="button" onClick={() => setSelectedShippingId(method.id)} className={`commerce-focus rounded-[10px] border p-4 text-left ${active ? 'border-[#202020] ring-1 ring-[#202020]' : 'border-[#dedede] hover:border-[#aaa]'}`}>
                    <div className="flex items-start justify-between gap-3"><div><p className="text-sm font-semibold">{method.label}</p><p className="mt-1 text-xs text-[#777]">{method.carrier} · {method.service}</p></div><span className="text-sm font-semibold">${method.amount.toFixed(2)}</span></div>
                    <p className="mt-2 text-xs leading-5 text-[#777]">{method.estimatedDelivery}</p>
                  </button>
                );
              })}
            </div>
          </section>

          <section className="rounded-[12px] border border-[#e3e3e3] bg-white p-5 sm:p-6">
            <h2 className="text-sm font-semibold">Order note <span className="font-normal text-[#888]">(optional)</span></h2>
            <textarea value={orderNote} onChange={(event) => setOrderNote(event.target.value.slice(0, 500))} rows={3} className="mt-4 w-full rounded-[9px] border border-[#dcdcdc] bg-white px-3.5 py-3 text-sm outline-none focus:border-[#202020] focus:ring-1 focus:ring-[#202020]" placeholder="Anything we should know about this order?" />
            <p className="mt-1.5 text-right text-[11px] text-[#999]">{orderNote.length}/500</p>
          </section>

          <section className="rounded-[12px] border border-[#e3e3e3] bg-white p-5 sm:p-6">
            <h2 className="text-sm font-semibold">Payment</h2>
            <div className="mt-4 grid gap-2">
              <button type="button" onClick={() => setSelectedPaymentMethod('stripe')} className={`commerce-focus flex items-center gap-3 rounded-[10px] border p-4 text-left ${selectedPaymentMethod === 'stripe' ? 'border-[#202020] ring-1 ring-[#202020]' : 'border-[#dedede] hover:border-[#aaa]'}`}>
                <span className="flex h-10 w-10 items-center justify-center rounded-[8px] bg-[#f4f4f4]"><CreditCard className="h-5 w-5" /></span>
                <span className="min-w-0 flex-1"><span className="block text-sm font-semibold">Card & digital wallets</span><span className="mt-0.5 block text-xs leading-5 text-[#777]">Secure Stripe Checkout. Supported wallets appear when available.</span></span>
                {selectedPaymentMethod === 'stripe' && <Check className="h-5 w-5" />}
              </button>
              <button type="button" onClick={() => setSelectedPaymentMethod('paypal')} className={`commerce-focus flex items-center gap-3 rounded-[10px] border p-4 text-left ${selectedPaymentMethod === 'paypal' ? 'border-[#202020] ring-1 ring-[#202020]' : 'border-[#dedede] hover:border-[#aaa]'}`}>
                <span className="flex h-10 w-10 items-center justify-center rounded-[8px] bg-[#f4f4f4]"><WalletCards className="h-5 w-5" /></span>
                <span className="min-w-0 flex-1"><span className="block text-sm font-semibold">PayPal</span><span className="mt-0.5 block text-xs leading-5 text-[#777]">Continue to PayPal to approve the payment securely.</span></span>
                {selectedPaymentMethod === 'paypal' && <Check className="h-5 w-5" />}
              </button>
            </div>
          </section>

          {formError && <div role="alert" className="rounded-[10px] border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">{formError}</div>}

          <button disabled={isSubmitting || cartItems.length === 0} className={`commerce-focus flex min-h-[52px] w-full items-center justify-center rounded-[9px] px-5 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-50 ${selectedPaymentMethod === 'paypal' ? 'bg-[#ffc439] text-[#003087]' : 'bg-[#202020] text-white hover:bg-[#383838]'}`}>{buttonLabel}</button>
          <div className="flex items-start gap-2 px-1 text-xs leading-5 text-[#777]"><ShieldCheck className="mt-0.5 h-4 w-4 shrink-0" /><p>Card details and PayPal credentials are handled by the selected payment provider. By continuing, you agree to our <Link to="/policies/terms" className="underline">Terms</Link>, <Link to="/policies/returns" className="underline">Returns</Link> and <Link to="/policies/privacy" className="underline">Privacy Policy</Link>.</p></div>
        </form>

        <aside className="h-fit rounded-[12px] border border-[#e3e3e3] bg-white p-5 sm:p-6 md:sticky md:top-[96px]">
          <div className="flex items-center gap-2"><ShoppingBag className="h-5 w-5" /><h2 className="text-lg font-semibold">Order summary</h2></div>

          {cartItems.length === 0 ? (
            <div className="mt-5 rounded-[9px] bg-[#f7f7f7] p-5 text-center text-sm text-[#777]">Your cart is empty.</div>
          ) : (
            <div className="mt-5 divide-y divide-[#eeeeee]">
              {cartItems.map((item) => {
                const variantLabel = item.variant ? [item.variant.color, item.variant.size].filter(Boolean).join(' / ') : '';
                const price = unitPrice(item);
                return (
                  <div key={item.id} className="flex gap-3 py-4 first:pt-0">
                    <div className="h-16 w-16 shrink-0 overflow-hidden rounded-[8px] border border-[#e6e6e6] bg-[#f7f7f7]"><img src={item.product.imageUrl} alt="" className="h-full w-full object-contain p-1.5" /></div>
                    <div className="min-w-0 flex-1"><p className="text-sm font-semibold leading-snug">{item.product.name}</p>{variantLabel && <p className="mt-1 text-xs text-[#777]">{variantLabel} · {item.variant?.sku}</p>}<p className="mt-1 text-xs text-[#777]">Qty {item.quantity}{Object.keys(item.personalizationData).length ? ' · Personalized' : ''}</p></div>
                    <p className="text-sm font-semibold">${(price * item.quantity).toFixed(2)}</p>
                  </div>
                );
              })}
            </div>
          )}

          {cartItems.length > 0 && (
            <>
              <div className="border-t border-[#eeeeee] pt-4">
                {appliedCoupon ? (
                  <div className="flex items-center justify-between rounded-[9px] border border-green-200 bg-green-50 px-3 py-2.5"><span className="inline-flex items-center gap-2 text-xs font-semibold text-green-800"><Tag className="h-3.5 w-3.5" /> {appliedCoupon.code}</span><button type="button" onClick={removeCoupon} className="text-xs font-semibold text-green-800 underline">Remove</button></div>
                ) : (
                  <div className="flex gap-2"><input value={couponInput} onChange={(event) => { setCouponInput(event.target.value); setCouponError(''); }} placeholder="Coupon code" className="h-11 min-w-0 flex-1 rounded-[9px] border border-[#dcdcdc] px-3 text-sm uppercase outline-none focus:border-[#202020]" /><button type="button" onClick={applyCoupon} disabled={couponLoading || !couponInput.trim()} className="rounded-[9px] bg-[#202020] px-4 text-xs font-semibold text-white disabled:opacity-50">{couponLoading ? '…' : 'Apply'}</button></div>
                )}
                {couponError && <p className="mt-2 text-xs font-medium text-red-600">{couponError}</p>}
              </div>

              <div className="mt-5 space-y-2.5 border-t border-[#eeeeee] pt-4 text-sm">
                <div className="flex justify-between text-[#666]"><span>Subtotal</span><span>${subtotal.toFixed(2)}</span></div>
                {discount > 0 && <div className="flex justify-between font-medium text-green-700"><span>Discount</span><span>-${discount.toFixed(2)}</span></div>}
                <div className="flex justify-between text-[#666]"><span>Shipping</span><span>${shipping.toFixed(2)}</span></div>
                {tax > 0 && <div className="flex justify-between text-[#666]"><span>{taxBreakdown.label}</span><span>${tax.toFixed(2)}</span></div>}
                <div className="flex justify-between border-t border-[#eeeeee] pt-3 text-lg font-semibold"><span>Total</span><span>${total.toFixed(2)}</span></div>
              </div>
            </>
          )}
        </aside>
      </main>
    </div>
  );
}
