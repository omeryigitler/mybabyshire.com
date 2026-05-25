import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Minus, Plus, ShoppingBag } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useStore } from '../store/useStore';
import { CardDesignFrame } from './CardDesignFrame';

export const CartDrawer = () => {
  const { cartItems, isCartOpen, closeCart, removeFromCart, updateCartItemQuantity } = useStore();

  const total = cartItems.reduce((sum, item) => sum + (item.product.price * item.quantity), 0);

  return (
    <AnimatePresence>
      {isCartOpen && (
        <>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={closeCart} className="fixed inset-0 bg-[#3a251a]/20 backdrop-blur-sm z-50" />
          <motion.div initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} transition={{ type: 'spring', damping: 25, stiffness: 200 }} className="fixed inset-y-0 right-0 w-full max-w-md bg-[#fcfaf6] shadow-2xl z-50 flex flex-col border-l border-[#d4b497]/30">
            <div className="flex items-center justify-between p-6 border-b border-[#d4b497]/20">
              <h2 className="font-serif text-2xl text-[#3a251a] flex items-center gap-2"><ShoppingBag className="w-5 h-5" /> Your Gift Bag</h2>
              <button onClick={closeCart} className="p-2 -mr-2 text-[#5a4234] hover:bg-[#f7ede3] rounded-full transition-colors"><X className="w-5 h-5" /></button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-6">
              {cartItems.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center text-center opacity-70">
                  <img src="/toy-wooden-train.png" alt="" className="w-24 mb-4 mix-blend-multiply opacity-50 grayscale" />
                  <p className="font-serif text-lg text-[#3a251a]">Your gift bag is empty</p>
                  <p className="text-[#5a4234] text-sm mt-2">Discover personalized magic for the little ones.</p>
                  <button onClick={closeCart} className="mt-6 px-6 py-2.5 bg-[#f7ede3] text-[#3a251a] rounded-full text-sm font-semibold hover:bg-[#d4b497]/30 transition-colors">Continue Shopping</button>
                </div>
              ) : (
                cartItems.map((item) => (
                  <div key={item.id} className="flex gap-4 p-4 bg-white rounded-2xl shadow-[var(--shadow-soft-subtle)] border border-[#d4b497]/10 relative group">
                    <button onClick={() => removeFromCart(item.id)} className="absolute top-2 right-2 p-1.5 text-[#5a4234]/50 hover:text-red-400 hover:bg-red-50 rounded-full transition-colors opacity-0 group-hover:opacity-100"><X className="w-4 h-4" /></button>
                    <div className="w-24 h-24 bg-[#fcfaf6] rounded-xl flex items-center justify-center p-2 relative overflow-hidden flex-shrink-0">
                      {item.product.bgImage && <CardDesignFrame value={item.product.bgImage} className="absolute inset-0 h-full w-full opacity-75" legacyClassName="absolute inset-0 h-full w-full object-cover opacity-75" />}
                      <img src={item.product.imageUrl} className="w-full h-full object-contain relative z-10" alt={item.product.name} />
                    </div>
                    <div className="flex-1 flex flex-col justify-between">
                      <div>
                        <h3 className="font-serif font-medium text-[#3a251a] leading-tight pr-6">{item.product.name}</h3>
                        <p className="text-[#5a4234] text-sm mt-1 font-medium">${item.product.price.toFixed(2)}</p>
                        {Object.keys(item.personalizationData).length > 0 && (
                          <div className="mt-2 text-[11px] bg-[#fcfaf6] p-2 rounded-lg border border-[#d4b497]/20 text-[#5a4234]">
                            {Object.entries(item.personalizationData).map(([key, value]) => <div key={key} className="flex items-start gap-1"><span className="opacity-70 capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}:</span><span className="font-semibold">{value as string}</span></div>)}
                          </div>
                        )}
                      </div>
                      <div className="flex items-center justify-between mt-3">
                        <div className="flex items-center gap-3 bg-[#f7ede3] rounded-full px-2 py-1">
                          <button onClick={() => updateCartItemQuantity(item.id, item.quantity - 1)} className="p-1 hover:bg-white rounded-full transition-colors text-[#5a4234]"><Minus className="w-3 h-3" /></button>
                          <span className="text-[#3a251a] text-xs font-semibold w-3 text-center">{item.quantity}</span>
                          <button onClick={() => updateCartItemQuantity(item.id, item.quantity + 1)} className="p-1 hover:bg-white rounded-full transition-colors text-[#5a4234]"><Plus className="w-3 h-3" /></button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {cartItems.length > 0 && (
              <div className="p-6 bg-white border-t border-[#d4b497]/20">
                <div className="flex flex-col gap-3 mb-6">
                  <div className="flex justify-between text-[#5a4234] text-sm"><span>Subtotal</span><span>${total.toFixed(2)}</span></div>
                  <div className="border-t border-[#d4b497]/20 pt-3 flex justify-between text-[#3a251a] font-serif font-medium text-lg"><span>Total</span><span>${total.toFixed(2)}</span></div>
                </div>
                <Link to="/checkout" onClick={closeCart} className="w-full relative flex items-center justify-center cursor-pointer h-14 hover:-translate-y-0.5 transition-transform group rounded-full overflow-hidden">
                  <div className="absolute inset-0 bg-[#3a251a] group-hover:bg-[#4a3328] transition-colors"></div>
                  <span className="relative z-10 font-bold text-white tracking-wide">Checkout Securely</span>
                </Link>
                <div className="mt-4 flex items-center justify-center gap-2 text-[#5a4234] text-xs opacity-80"><img src="/toy-wooden-star-solid.png" className="w-4 h-4 mix-blend-multiply" alt=""/> Gift-ready packaging included</div>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
