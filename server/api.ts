import { Router, Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';
import { v2 as cloudinary } from 'cloudinary';
import {
  createAdminToken,
  isConfiguredAdminLogin,
} from '../lib/auth';

const router = Router();
const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-development';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// ---------------------------------------------------------
// Helpers
// ---------------------------------------------------------
const slugify = (value: string) =>
  value
    .toLowerCase()
    .trim()
    .replace(/['"]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

const uniqueSlug = async (name: string) => {
  const baseSlug = slugify(name) || `product-${Date.now()}`;
  let slug = baseSlug;
  let counter = 1;

  while (await prisma.products.findUnique({ where: { slug } })) {
    slug = `${baseSlug}-${counter}`;
    counter += 1;
  }

  return slug;
};

const mapProductForStorefront = (product: any) => {
  const primaryImage =
    product.images?.find((image: any) => image.is_primary) ||
    product.images?.[0];

  return {
    id: product.id,
    name: product.name,
    slug: product.slug,
    description: product.description || '',
    price: Number(product.price),
    imageUrl: primaryImage?.image_url || '',
    bgImage: product.card_bg_image || product.sku || '/product-card-cloud-blue.png',
    badge: product.bestseller ? 'Bestseller' : product.new_arrival ? 'New' : undefined,
    personalizationRequired: product.personalization_required,
    status: product.status,
  };
};

// ---------------------------------------------------------
// Authentication Middleware
// ---------------------------------------------------------
interface AdminRequest extends Request {
  user?: any;
}

const requireAdmin = (req: AdminRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;

  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized: Missing token' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Unauthorized: Invalid token' });
  }
};

// ---------------------------------------------------------
// Admin Authentication
// ---------------------------------------------------------
router.post('/admin/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    if (isConfiguredAdminLogin(email, password)) {
      const token = createAdminToken(email);

      return res.json({
        token,
        user: { email, role: 'admin' },
      });
    }

    const user = await prisma.users.findUnique({ where: { email } });

    if (!user || user.password_hash !== password) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { id: user.id, role: user.role },
      JWT_SECRET,
      { expiresIn: '1d' }
    );

    res.json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    res.status(500).json({
      error: 'Login failed',
      details: (error as Error).message,
    });
  }
});

router.get('/admin/me', requireAdmin, (req: AdminRequest, res) => {
  res.json({ user: req.user });
});

// ---------------------------------------------------------
// Cloudinary Upload
// ---------------------------------------------------------
router.post('/admin/upload-image', requireAdmin, async (req, res) => {
  try {
    const { file, folder = 'little-wonders/products' } = req.body;

    if (!file || typeof file !== 'string') {
      return res.status(400).json({ error: 'Missing image file.' });
    }

    if (
      !process.env.CLOUDINARY_CLOUD_NAME ||
      !process.env.CLOUDINARY_API_KEY ||
      !process.env.CLOUDINARY_API_SECRET
    ) {
      return res.status(500).json({
        error: 'Cloudinary environment variables are missing.',
      });
    }

    const result = await cloudinary.uploader.upload(file, {
      folder,
      resource_type: 'image',
      transformation: [
        { width: 900, height: 900, crop: 'limit' },
        { quality: 'auto', fetch_format: 'auto' },
      ],
    });

    res.json({
      imageUrl: result.secure_url,
      publicId: result.public_id,
      width: result.width,
      height: result.height,
    });
  } catch (error) {
    res.status(500).json({
      error: 'Cloudinary upload failed',
      details: (error as Error).message,
    });
  }
});

// ---------------------------------------------------------
// Product CRUD
// ---------------------------------------------------------
router.get('/products', async (req, res) => {
  try {
    const products = await prisma.products.findMany({
      where: { status: 'active' },
      include: {
        images: true,
        category: true,
        personalization_fields: true,
      },
      orderBy: { created_at: 'asc' },
    });

    res.json(products.map(mapProductForStorefront));
  } catch (error) {
    res.status(500).json({
      error: 'Failed to fetch products',
      details: (error as Error).message,
    });
  }
});

router.get('/products/:slug', async (req, res) => {
  try {
    const product = await prisma.products.findUnique({
      where: { slug: req.params.slug },
      include: {
        images: true,
        category: true,
        personalization_fields: true,
      },
    });

    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    res.json(mapProductForStorefront(product));
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch product' });
  }
});

router.get('/admin/products', requireAdmin, async (req, res) => {
  try {
    const products = await prisma.products.findMany({
      include: {
        images: true,
        category: true,
      },
      orderBy: { created_at: 'desc' },
    });

    res.json(products.map(mapProductForStorefront));
  } catch (error) {
    res.status(500).json({
      error: 'Failed to fetch admin products',
      details: (error as Error).message,
    });
  }
});

router.post('/admin/products', requireAdmin, async (req, res) => {
  try {
    const {
      name,
      description,
      price,
      imageUrl,
      publicId,
      bgImage,
      status = 'active',
      personalizationRequired = true,
      stockQuantity = 0,
      categoryId,
    } = req.body;

    if (!name || !price || !imageUrl) {
      return res.status(400).json({
        error: 'name, price and imageUrl are required.',
      });
    }

    const slug = await uniqueSlug(name);

    const product = await prisma.products.create({
      data: {
        name,
        slug,
        description,
        price,
        sku: bgImage || '/product-card-cloud-blue.png',
        card_bg_image: bgImage || '/product-card-cloud-blue.png',
        category_id: categoryId || null,
        stock_quantity: Number(stockQuantity) || 0,
        status,
        personalization_required: Boolean(personalizationRequired),
        images: {
          create: [
            {
              image_url: imageUrl,
              public_id: publicId || null,
              alt_text: name,
              is_primary: true,
              sort_order: 0,
            },
          ],
        },
      },
      include: {
        images: true,
        category: true,
      },
    });

    res.status(201).json(mapProductForStorefront(product));
  } catch (error) {
    res.status(400).json({
      error: 'Failed to create product',
      details: (error as Error).message,
    });
  }
});

router.put('/admin/products/:id', requireAdmin, async (req, res) => {
  try {
    const product = await prisma.products.update({
      where: { id: req.params.id },
      data: req.body,
    });

    res.json(product);
  } catch (error) {
    res.status(400).json({ error: 'Failed to update product' });
  }
});

router.delete('/admin/products/:id', requireAdmin, async (req, res) => {
  try {
    await prisma.products.delete({
      where: { id: req.params.id },
    });

    res.json({ success: true });
  } catch (error) {
    res.status(400).json({ error: 'Failed to delete product' });
  }
});

// ---------------------------------------------------------
// Category CRUD
// ---------------------------------------------------------
router.get('/categories', async (req, res) => {
  try {
    const categories = await prisma.categories.findMany();
    res.json(categories);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch categories' });
  }
});

router.post('/admin/categories', requireAdmin, async (req, res) => {
  try {
    const category = await prisma.categories.create({
      data: req.body,
    });

    res.status(201).json(category);
  } catch (error) {
    res.status(400).json({ error: 'Failed to create category' });
  }
});

// ---------------------------------------------------------
// Personalization CRUD
// ---------------------------------------------------------
router.get('/admin/templates', requireAdmin, async (req, res) => {
  try {
    const templates = await prisma.personalization_templates.findMany({
      include: { fields: true },
    });

    res.json(templates);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch templates' });
  }
});

router.post('/admin/templates', requireAdmin, async (req, res) => {
  try {
    const template = await prisma.personalization_templates.create({
      data: req.body,
    });

    res.status(201).json(template);
  } catch (error) {
    res.status(400).json({ error: 'Failed to create template' });
  }
});

router.post('/admin/fields', requireAdmin, async (req, res) => {
  try {
    const field = await prisma.personalization_fields.create({
      data: req.body,
    });

    res.status(201).json(field);
  } catch (error) {
    res.status(400).json({
      error: 'Failed to create personalization field',
    });
  }
});

// ---------------------------------------------------------
// Cart API
// ---------------------------------------------------------
router.post('/cart/sync', async (req, res) => {
  try {
    const { sessionId } = req.body;

    let cart = await prisma.carts.findUnique({
      where: { session_id: sessionId },
    });

    if (!cart) {
      cart = await prisma.carts.create({
        data: { session_id: sessionId },
      });
    }

    res.json({
      success: true,
      cartId: cart.id,
    });
  } catch (error) {
    res.status(500).json({
      error: 'Cart sync failed',
      details: (error as Error).message,
    });
  }
});

// ---------------------------------------------------------
// Payment Placeholder
// ---------------------------------------------------------
router.post('/checkout/create-payment', async (req, res) => {
  try {
    res.json({
      success: true,
      clientSecret: 'pi_placeholder_secret_12345',
      orderId:
        'ORDER-' + Math.random().toString(36).substring(7).toUpperCase(),
      message: 'Payment intent created (Placeholder)',
    });
  } catch (error) {
    res.status(500).json({ error: 'Payment setup failed' });
  }
});

// ---------------------------------------------------------
// Tracking Placeholder
// ---------------------------------------------------------
router.get('/orders/:orderNumber/tracking', async (req, res) => {
  try {
    const { orderNumber } = req.params;

    const order = await prisma.orders.findUnique({
      where: { order_number: orderNumber },
    });

    if (order) {
      res.json({
        orderNumber,
        status: order.order_status,
        trackingReference: order.tracking_reference,
        message: 'Real order query successful',
      });
    } else {
      res.json({
        orderNumber,
        status: 'processing',
        estimatedDelivery: '3-5 business days',
        steps: [
          {
            id: 1,
            label: 'Order Placed',
            completed: true,
            date: new Date().toISOString(),
          },
          {
            id: 2,
            label: 'Personalization',
            completed: true,
            date: new Date().toISOString(),
          },
          {
            id: 3,
            label: 'Packaging',
            completed: false,
          },
          {
            id: 4,
            label: 'Shipped',
            completed: false,
          },
        ],
      });
    }
  } catch (error) {
    res.status(500).json({ error: 'Tracking query failed' });
  }
});

export default router;
