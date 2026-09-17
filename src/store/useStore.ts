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

export type ProductVariant = {
  id: string;
  productId: string;
  sku: string;
  color?: string;
  size?: string;
  price?: number | null;
  stockQuantity: number;
  active: boolean;
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
  hoverImageUrl?: string;
  imageFocusX?: number;
  imageFocusY?: number;
  imageZoom?: number;
  imageCropX?: number;
  imageCropY?: number;
  imageCropWidth?: number;
  imageCropHeight?: number;
  hoverImageFocusX?: number;
  hoverImageFocusY?: number;
  hoverImageZoom?: number;
  hoverImageCropX?: number;
  hoverImageCropY?: number;
  hoverImageCropWidth?: number;
  hoverImageCropHeight?: number;
  bgImage?: string;
  badge?: string;
  personalizationRequired?: boolean;
  status?: string;
  sku?: string;
  categoryId?: string | null;
  categoryName?: string | null;
  stockQuantity?: number;
  variants?: ProductVariant[];
  featured?: boolean;
  newArrival?: boolean;
  bestseller?: boolean;
  genderTag?: string;
  ageRange?: string;
  material?: string;
  careInstructions?: string;
  preparationTime?: string;
  personalizationFields?: PersonalizationField[];
  ratingAverage?: number;
  ratingCount?: number;
};

export type CartItem = {
  id: string;
  product: Product;
  variant?: ProductVariant | null;
  quantity: number;
  personalizationData: Record<string, any>;
};

const FALLBACK_PRODUCTS: Product[] = import.meta.env.DEV
  ? [
      {
        id: 'demo-baby-tee',
        name: 'Premium Cotton Baby Tee',
        slug: 'premium-cotton-baby-tee',
        description: 'Soft cotton baby tee used as a local development fallback when the products API is unavailable.',
        price: 16,
        imageUrl: '/product-onesie-set-cutout-v1.png',
        badge: 'New',
        personalizationRequired: false,
        status: 'active',
        sku: 'MBS-DEMO-BABY-TEE',
        stockQuantity: 20,
        newArrival: true,
        categoryName: 'Baby',
        ageRange: '0-24M',
        material: 'Cotton',
      },
      {
        id: 'demo-toddler-tee',
        name: 'Everyday Toddler Tee',
        slug: 'everyday-toddler-tee',
        description: 'Simple toddler blank used only for local development fallback data.',
        price: 18,
        imageUrl: '/product-onesie-set-cutout-v1.png',
        personalizationRequired: false,
        status: 'active',
        sku: 'MBS-DEMO-TODDLER-TEE',
        stockQuantity: 20,
        bestseller: true,
        categoryName: 'Toddler',
        ageRange: '2T-5T',
        material: 'Cotton',
      },
      {
        id: 'demo-adult-crew',
        name: 'Unisex Fleece Crewneck',
        slug: 'unisex-fleece-crewneck',
        description: 'Neutral adult crewneck blank used only when the development products API is unavailable.',
        price: 28,
        imageUrl: '/product-onesie-set-cutout-v1.png',
        personalizationRequired: false,
        status: 'active',
        sku: 'MBS-DEMO-CREW',
        stockQuantity: 20,
        featured: true,
        categoryName: 'Adult',
        ageRange: 'XS-3XL',
        material: 'Cotton blend fleece',
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
  selectedVariant: ProductVariant | null;
  openPersonalizationModal: (product: Product, variant?: ProductVariant | null) => void;
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
          if (!response.ok) throw new Error('Products API failed');
          const products = await response.json();
          set({ products: products.length ? products : FALLBACK_PRODUCTS });
        } catch (error) {
          console.error('Failed to load products:', error);
          set({ products: FALLBACK_PRODUCTS });
        } finally {
          set({ productsLoading: false });
        }
      },

      addProduct: (product) => set((state) => ({ products: [...state.products, product] })),

      cartItems: [],
      isCartOpen: false,
      openCart: () => set({ isCartOpen: true }),
      closeCart: () => set({ isCartOpen: false }),

      addToCart: (item) => {
        const newItem = { ...item, id: crypto.randomUUID?.() || Math.random().toString(36).slice(2, 11) };
        set((state) => ({ cartItems: [...state.cartItems, newItem], isCartOpen: true }));
      },

      removeFromCart: (id) => set((state) => ({ cartItems: state.cartItems.filter((i) => i.id !== id) })),

      updateCartItemQuantity: (id, quantity) =>
        set((state) => ({
          cartItems: state.cartItems.map((item) => {
            if (item.id !== id) return item;
            const trackedStock = item.variant ? item.variant.stockQuantity : Number(item.product.stockQuantity || 0);
            const maxQuantity = trackedStock > 0 ? Math.min(25, trackedStock) : item.variant ? 1 : 25;
            return { ...item, quantity: Math.min(maxQuantity, Math.max(1, quantity)) };
          }),
        })),

      clearCart: () => set({ cartItems: [], isCartOpen: false }),
      isPersonalizationModalOpen: false,
      selectedProduct: null,
      selectedVariant: null,
      openPersonalizationModal: (product, variant = null) => set({ isPersonalizationModalOpen: true, selectedProduct: product, selectedVariant: variant }),
      closePersonalizationModal: () => set({ isPersonalizationModalOpen: false, selectedProduct: null, selectedVariant: null }),
    }),
    {
      name: 'mybabyshire-cart-v1',
      partialize: (state) => ({ cartItems: state.cartItems }),
    },
  ),
);
