import { create } from 'zustand';

export type Product = {
  id: string;
  name: string;
  slug?: string;
  description: string;
  price: number;
  imageUrl: string;
  bgImage?: string;
  badge?: string;
  personalizationRequired?: boolean;
  status?: string;
};

export type CartItem = {
  id: string;
  product: Product;
  quantity: number;
  personalizationData: Record<string, any>;
};

const DEFAULT_PRODUCTS: Product[] = [
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
  }
];

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

  isPersonalizationModalOpen: boolean;
  selectedProduct: Product | null;
  openPersonalizationModal: (product: Product) => void;
  closePersonalizationModal: () => void;
};

export const useStore = create<StoreState>((set, get) => ({
  products: DEFAULT_PRODUCTS,
  productsLoading: false,

  loadProducts: async () => {
    set({ productsLoading: true });

    try {
      const response = await fetch('/api/products');

      if (!response.ok) {
        throw new Error('Products API failed');
      }

      const products = await response.json();
      set({ products: products.length ? products : DEFAULT_PRODUCTS });
    } catch (error) {
      console.error('Failed to load products:', error);
      set({ products: DEFAULT_PRODUCTS });
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
      id: Math.random().toString(36).substr(2, 9),
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
}));
