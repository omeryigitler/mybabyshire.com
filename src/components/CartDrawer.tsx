import { ETSY_ONLY_MODE } from '../config/commerce';
import React from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { Minus, Plus, ShoppingBag, X } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useStore } from '../store/useStore';

export const CartDrawer = () => {
  const { cartItems, isCartOpen, closeCart, removeFromCart, updateCartItemQuantity } = useStore();
  const unitPrice = (item: (typeof cartItems)[number]) => item.variant?.price ?? item.product.price;
  const total = cartItems.reduce((sum, item) => sum + unitPrice(item) * item.quantity, 0);

  if (ETSY_ONLY_MODE) return null;

  return (
    <AnimatePresence>
      {isCartOpen && (
        <>
          <motion.button
            type="button"
            aria-label="Close cart"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closeCart}
            className="fixed inset-0 z-50 bg-black/25 backdrop-blur-[2px]"
          />

          <motion.aside
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 240 }}
            className="fixed inset-y-0 right-0 z-50 flex w-full max-w-md flex-col border-l border-[#e7e7e7] bg-white shadow-2xl"
            aria-label="Shopping cart"
          >
            <div className="flex min-h-20 items-center justify-between border-b border-[#e9e9e9] px-5 sm:px-6">
              <div className="flex items-center gap-2.5">
                <ShoppingBag className="h-5 w-5" />
                <h2 className="text-lg font-semibold text-[#202020]">Your cart</h2>
                <span className="rounded-full bg-[#f2f2f2] px-2 py-0.5 text-xs font-semibold text-[#666]">{cartItems.length}</span>
              </div>
              <button type="button" onClick={closeCart} className="commerce-focus inline-flex h-10 w-10 items-center justify-center rounded-full hover:bg-[#f5f5f5]" aria-label="Close cart">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-5 py-5 sm:px-6">
              {cartItems.length === 0 ? (
                <div className="flex min-h-[55vh] flex-col items-center justify-center text-center">
                  <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-[#f6f6f6]">
                    <ShoppingBag className="h-7 w-7 text-[#777]" />
                  </div>
                  <p className="text-lg font-semibold text-[#202020]">Your cart is empty</p>
                  <p className="mt-2 max-w-[260px] text-sm leading-relaxed text-[#777]">Browse the collection and add your favorites when you are ready.</p>
                  <button type="button" onClick={closeCart} className="commerce-focus mt-6 rounded-[9px] bg-[#202020] px-5 py-3 text-sm font-semibold text-white hover:bg-[#383838]">Continue shopping</button>
                </div>
              ) : (
                <div className="divide-y divide-[#eeeeee]">
                  {cartItems.map((item) => {
                    const variantLabel = item.variant ? [item.variant.color, item.variant.size].filter(Boolean).join(' / ') : '';
                    const maxQuantity = item.variant
                      ? Math.min(25, Math.max(0, item.variant.stockQuantity))
                      : item.product.stockQuantity && item.product.stockQuantity > 0
                        ? Math.min(25, item.product.stockQuantity)
                        : 25;
                    return (
                      <div key={item.id} className="grid grid-cols-[88px_1fr] gap-4 py-5 first:pt-0">
                        <div className="aspect-square overflow-hidden rounded-[9px] border border-[#e8e8e8] bg-[#f7f7f7]">
                          <img src={item.product.imageUrl} alt={item.product.name} loading="lazy" decoding="async" className="h-full w-full object-contain p-2.5" />
                        </div>

                        <div className="min-w-0">
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <h3 className="line-clamp-2 text-sm font-semibold leading-snug text-[#202020]">{item.product.name}</h3>
                              {variantLabel && <p className="mt-1 text-xs font-medium text-[#777]">{variantLabel} · {item.variant?.sku}</p>}
                              <p className="mt-1 text-sm font-medium text-[#555]">${unitPrice(item).toFixed(2)}</p>
                            </div>
                            <button type="button" onClick={() => removeFromCart(item.id)} className="commerce-focus -mr-1 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[#777] hover:bg-[#f5f5f5] hover:text-[#202020]" aria-label={`Remove ${item.product.name}`}>
                              <X className="h-4 w-4" />
                            </button>
                          </div>

                          {Object.keys(item.personalizationData).length > 0 && (
                            <div className="mt-3 space-y-1 rounded-[8px] bg-[#fafafa] p-2.5 text-[11px] leading-relaxed text-[#666]">
                              {Object.entries(item.personalizationData).map(([key, value]) => (
                                <div key={key} className="flex gap-1">
                                  <span className="capitalize text-[#888]">{key.replace(/([A-Z])/g, ' $1').trim()}:</span>
                                  <span className="font-semibold text-[#444]">{String(value)}</span>
                                </div>
                              ))}
                            </div>
                          )}

                          <div className="mt-4 inline-flex items-center rounded-[8px] border border-[#dedede] bg-white">
                            <button type="button" onClick={() => updateCartItemQuantity(item.id, item.quantity - 1)} className="commerce-focus inline-flex h-9 w-9 items-center justify-center rounded-l-[8px] hover:bg-[#f5f5f5]" aria-label="Decrease quantity"><Minus className="h-3.5 w-3.5" /></button>
                            <span className="min-w-8 text-center text-xs font-semibold">{item.quantity}</span>
                            <button type="button" disabled={maxQuantity <= item.quantity} onClick={() => updateCartItemQuantity(item.id, item.quantity + 1)} className="commerce-focus inline-flex h-9 w-9 items-center justify-center rounded-r-[8px] hover:bg-[#f5f5f5] disabled:cursor-not-allowed disabled:opacity-35" aria-label="Increase quantity"><Plus className="h-3.5 w-3.5" /></button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {cartItems.length > 0 && (
              <div className="border-t border-[#e9e9e9] bg-white px-5 py-5 sm:px-6">
                <div className="mb-4 flex items-center justify-between text-base font-semibold text-[#202020]">
                  <span>Subtotal</span>
                  <span>${total.toFixed(2)}</span>
                </div>
                <p className="mb-4 text-xs leading-relaxed text-[#777]">Shipping and taxes are calculated at checkout.</p>
                <Link to="/checkout" onClick={closeCart} className="commerce-focus flex w-full items-center justify-center rounded-[9px] bg-[#202020] px-5 py-3.5 text-sm font-semibold text-white transition-colors hover:bg-[#383838]">
                  Checkout
                </Link>
              </div>
            )}
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
};