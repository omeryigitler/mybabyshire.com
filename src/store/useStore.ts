import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type PersonalizationField = {
  id: string;
  label: string;
  fieldKey: string;
  type: string;
  required: boolean;
  placeholder?: string;
  helpText?: string;
  maxLength?: number | null;
  options?: string[];
  defaultValue?: string;
  sortOrder?: number;
};

export type Product = {
  id: string;
  name: string;
  slug?: string;
  description: string;
  price: number;
  salePrice?: number | null;
  imageUrl: string;
  bgImage?: string;
  badge?: string;
  personalizationRequired?: boolean;
  status?: string;
  sku?: string;
  categoryId?: string;
  stockQuantity?: number;
  featured?: boolean;
  newArrival?: boolean;
  bestseller?: boolean;
  genderTag?: string;
  ageRange?: string;
  material?: string;
  careInstructions?: string;
  preparationTime?: string;
  personalizationFields?: PersonalizationField[];
};

export type CartItem = {
  id: string;
  product: Product;
  quantity: number;
  personalizationData: Record<string, any>;
};

const FALLBACK_PRODUCTS: Product[] = import.meta.env.DEV
  ? [
      {
        id: 'p1',
        name: 'Cashmere Dream Blanket',
        description: 'A delicate cashmere blend blanket crafted for cozy naps and sweet dreams.',
        price: 85.00,
        imageUrl: '/product-blanket-cutout-v1.png',
        bgImage: '/product-card-cloud-blue.png',
        badge: 'Bestseller',
        personalizationRequired: true,
      },
      {
        id: 'p2',
        name: 'Bespoke Heirloom Teddy',
        description: 'Hand-stitched keepsake bear becomes a lifelong companion.',
        price: 65.00,
        imageUrl: '/product-teddy-cutout-v1.png',
        bgImage: '/product-card-cloud-peach.png',
        badge: 'Popular',
        personalizationRequired: true,
      },
      {
        id: 'p3',
        name: 'Organic Cotton Onesie Set',
        description: 'Three beautifully soft, breathable onesies in earthy tones.',
        price: 45.00,
        imageUrl: '/product-onesie-set-cutout-v1.png',
        bgImage: '/product-card-cloud-mint.png',
        personalizationRequired: false,
      },
    ]
  : [];

type StoreState = {
  products: Product[];
  productsLoading: boolean;
  loadProducts: () => Promise<void>;
  addProduct: (product: Product) => void;

  cartItems: CartItem[];
  isCartOpen: boolean;
  openCart: () => void;
  closeCart: () => void;
  addToCart: (item: Omit<CartItem, 'id'>) => void;
  removeFromCart: (id: string) => void;
  updateCartItemQuantity: (id: string, quantity: number) => void;
  clearCart: () => void;

  isPersonalizationModalOpen: boolean;
  selectedProduct: Product | null;
  openPersonalizationModal: (product: Product) => void;
  closePersonalizationModal: () => void;
};

export const useStore = create<StoreState>()(
  persist(
    (set) => ({
      products: FALLBACK_PRODUCTS,
      productsLoading: false,

      loadProducts: async () => {
        set({ productsLoading: true });

        try {
          const response = await fetch('/api/products');

          if (!response.ok) {
            throw new Error('Products API failed');
          }

          const products = await response.json();
          set({ products: products.length ? products : FALLBACK_PRODUCTS });
        } catch (error) {
          console.error('Failed to load products:', error);
          set({ products: FALLBACK_PRODUCTS });
        } finally {
          set({ productsLoading: false });
        }
      },

      addProduct: (product) => {
        set((state) => ({
          products: [...state.products, product],
        }));
      },

      cartItems: [],
      isCartOpen: false,

      openCart: () => set({ isCartOpen: true }),

      closeCart: () => set({ isCartOpen: false }),

      addToCart: (item) => {
        const newItem = {
          ...item,
          id: crypto.randomUUID?.() || Math.random().toString(36).slice(2, 11),
        };

        set((state) => ({
          cartItems: [...state.cartItems, newItem],
          isCartOpen: true,
        }));
      },

      removeFromCart: (id) =>
        set((state) => ({
          cartItems: state.cartItems.filter((i) => i.id !== id),
        })),

      updateCartItemQuantity: (id, quantity) =>
        set((state) => ({
          cartItems: state.cartItems.map((i) =>
            i.id === id
              ? {
                  ...i,
                  quantity: Math.max(1, quantity),
                }
              : i
          ),
        })),

      clearCart: () => set({ cartItems: [], isCartOpen: false }),

      isPersonalizationModalOpen: false,
      selectedProduct: null,

      openPersonalizationModal: (product) =>
        set({
          isPersonalizationModalOpen: true,
          selectedProduct: product,
        }),

      closePersonalizationModal: () =>
        set({
          isPersonalizationModalOpen: false,
          selectedProduct: null,
        }),
    }),
    {
      name: 'mybabyshire-cart-v1',
      partialize: (state) => ({ cartItems: state.cartItems }),
    },
  ),
);
