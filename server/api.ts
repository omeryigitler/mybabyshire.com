import { Router, Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { PrismaClient } from "@prisma/client";
import { v2 as cloudinary } from "cloudinary";
import { createAdminToken, isConfiguredAdminLogin } from "../lib/auth.js";
import {
  SHIPMENT_STATUS_OPTIONS,
  buildManualTimeline,
  getCarrierCustomerNote,
  getCarrierDisplayName,
  getCarrierTrackingUrl,
  getShipmentStatusLabel,
  getTrackingProviderType,
  mapOrderStatusToShipmentStatus,
  normalizeCarrierKey,
} from "../src/utils/carriers.js";

const router = Router();
const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || "fallback-secret-development";

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
    .replace(/['"]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

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
    description: product.description || "",
    price: Number(product.price),
    imageUrl: primaryImage?.image_url || "",
    bgImage:
      product.card_bg_image || product.sku || "/product-card-cloud-blue.png",
    badge: product.bestseller
      ? "Bestseller"
      : product.new_arrival
        ? "New"
        : undefined,
    personalizationRequired: product.personalization_required,
    status: product.status,
  };
};

const parseJson = (value?: string | null) => {
  if (!value) return null;
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
};

const getPaymentProvider = (
  snapshot: any,
  paymentReference?: string | null,
) => {
  if (snapshot?.provider === "paypal") return "PayPal";
  if (snapshot?.provider === "stripe") return "Stripe";
  if (
    paymentReference?.startsWith("cs_") ||
    paymentReference?.startsWith("pi_")
  )
    return "Stripe";
  if (paymentReference) return "PayPal";
  return "Not selected";
};

const mapOrderForAdmin = (order: any) => {
  const snapshot = parseJson(order.personalization_data_json);
  const carrier =
    snapshot?.carrier || snapshot?.shippingMethod?.carrier || null;
  const trackingReference =
    order.tracking_reference || snapshot?.trackingNumber || null;
  const shipmentStatus =
    snapshot?.shipmentStatus ||
    mapOrderStatusToShipmentStatus(order.order_status, order.payment_status);
  const trackingUrl =
    snapshot?.trackingUrl || getCarrierTrackingUrl(carrier, trackingReference);

  return {
    id: order.id,
    orderNumber: order.order_number,
    customerName: order.customer_name,
    customerEmail: order.customer_email,
    totalAmount: Number(order.total_amount),
    currency: order.currency,
    paymentStatus: order.payment_status,
    paymentProvider: getPaymentProvider(snapshot, order.payment_reference),
    orderStatus: order.order_status,
    paymentReference: order.payment_reference,
    trackingReference,
    trackingNumber: trackingReference,
    carrier: carrier ? getCarrierDisplayName(carrier) : null,
    carrierKey: carrier ? normalizeCarrierKey(carrier) : "",
    shipmentStatus,
    shipmentStatusLabel: getShipmentStatusLabel(shipmentStatus),
    estimatedDelivery:
      snapshot?.estimatedDelivery ||
      snapshot?.shippingMethod?.estimatedDelivery ||
      null,
    trackingUrl,
    shippingMethod: snapshot?.shippingMethod?.label || null,
    shippingService: snapshot?.shippingMethod?.service || null,
    customer: snapshot?.customer || null,
    subtotal: snapshot?.subtotal || null,
    shipping: snapshot?.shipping || null,
    createdAt: order.created_at,
    items: order.items.map((item: any) => ({
      id: item.id,
      productId: item.product_id,
      productName: item.product_name_snapshot,
      quantity: item.quantity,
      price: Number(item.price_snapshot),
      personalizationData: parseJson(item.personalization_data_json) || {},
    })),
  };
};

const allowedOrderStatuses = [
  "processing",
  "shipped",
  "delivered",
  "cancelled",
];
const allowedPaymentStatuses = ["pending", "paid", "refunded"];
const allowedShipmentStatuses = SHIPMENT_STATUS_OPTIONS.map(
  (option) => option.value,
);

// ---------------------------------------------------------
// Authentication Middleware
// ---------------------------------------------------------
interface AdminRequest extends Request {
  user?: any;
}

const requireAdmin = (req: AdminRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;

  if (!authHeader?.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Unauthorized: Missing token" });
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ error: "Unauthorized: Invalid token" });
  }
};

// ---------------------------------------------------------
// Admin Authentication
// ---------------------------------------------------------
router.post("/admin/login", async (req, res) => {
  const { email, password } = req.body;

  try {
    if (isConfiguredAdminLogin(email, password)) {
      const token = createAdminToken(email);

      return res.json({
        token,
        user: { email, role: "admin" },
      });
    }

    const user = await prisma.users.findUnique({ where: { email } });

    if (!user || user.password_hash !== password) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const token = jwt.sign({ id: user.id, role: user.role }, JWT_SECRET, {
      expiresIn: "1d",
    });

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
      error: "Login failed",
      details: (error as Error).message,
    });
  }
});

router.get("/admin/me", requireAdmin, (req: AdminRequest, res) => {
  res.json({ user: req.user });
});

// ---------------------------------------------------------
// Cloudinary Upload
// ---------------------------------------------------------
router.post("/admin/upload-image", requireAdmin, async (req, res) => {
  try {
    const { file, folder = "little-wonders/products" } = req.body;

    if (!file || typeof file !== "string") {
      return res.status(400).json({ error: "Missing image file." });
    }

    if (
      !process.env.CLOUDINARY_CLOUD_NAME ||
      !process.env.CLOUDINARY_API_KEY ||
      !process.env.CLOUDINARY_API_SECRET
    ) {
      return res.status(500).json({
        error: "Cloudinary environment variables are missing.",
      });
    }

    const result = await cloudinary.uploader.upload(file, {
      folder,
      resource_type: "image",
      transformation: [
        { width: 900, height: 900, crop: "limit" },
        { quality: "auto", fetch_format: "auto" },
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
      error: "Cloudinary upload failed",
      details: (error as Error).message,
    });
  }
});

// ---------------------------------------------------------
// remove.bg + Cloudinary Upload
// ---------------------------------------------------------
router.post("/admin/remove-bg-upload", requireAdmin, async (req, res) => {
  try {
    const { file, folder = "little-wonders/products" } = req.body;

    if (!file || typeof file !== "string") {
      return res.status(400).json({ error: "Missing image file." });
    }

    if (!process.env.REMOVE_BG_API_KEY) {
      return res.status(500).json({
        error: "REMOVE_BG_API_KEY environment variable is missing.",
      });
    }

    if (
      !process.env.CLOUDINARY_CLOUD_NAME ||
      !process.env.CLOUDINARY_API_KEY ||
      !process.env.CLOUDINARY_API_SECRET
    ) {
      return res.status(500).json({
        error: "Cloudinary environment variables are missing.",
      });
    }

    const base64Data = file.includes(",") ? file.split(",")[1] : file;

    const imageBuffer = Buffer.from(base64Data, "base64");

    const imageBlob = new Blob([imageBuffer], {
      type: "image/png",
    });

    const formData = new FormData();
    formData.append("size", "auto");
    formData.append("format", "png");
    formData.append("image_file", imageBlob, "image.png");

    const removeBgResponse = await fetch(
      "https://api.remove.bg/v1.0/removebg",
      {
        method: "POST",
        headers: {
          "X-Api-Key": process.env.REMOVE_BG_API_KEY,
        },
        body: formData,
      },
    );

    if (!removeBgResponse.ok) {
      const errorText = await removeBgResponse.text();

      return res.status(removeBgResponse.status).json({
        error: "remove.bg failed",
        details: errorText,
      });
    }

    const transparentArrayBuffer = await removeBgResponse.arrayBuffer();
    const transparentBuffer = Buffer.from(transparentArrayBuffer);
    const transparentBase64 = transparentBuffer.toString("base64");

    const result = await cloudinary.uploader.upload(
      `data:image/png;base64,${transparentBase64}`,
      {
        folder,
        resource_type: "image",
        transformation: [
          { width: 900, height: 900, crop: "limit" },
          { quality: "auto", fetch_format: "auto" },
        ],
      },
    );

    res.json({
      imageUrl: result.secure_url,
      publicId: result.public_id,
      width: result.width,
      height: result.height,
    });
  } catch (error) {
    res.status(500).json({
      error: "Background removal upload failed",
      details: (error as Error).message,
    });
  }
});

// ---------------------------------------------------------
// Product CRUD
// ---------------------------------------------------------
router.get("/products", async (req, res) => {
  try {
    const products = await prisma.products.findMany({
      where: { status: "active" },
      include: {
        images: true,
        category: true,
        personalization_fields: true,
      },
      orderBy: { created_at: "asc" },
    });

    res.json(products.map(mapProductForStorefront));
  } catch (error) {
    res.status(500).json({
      error: "Failed to fetch products",
      details: (error as Error).message,
    });
  }
});

router.get("/products/:slug", async (req, res) => {
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
      return res.status(404).json({ error: "Product not found" });
    }

    res.json(mapProductForStorefront(product));
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch product" });
  }
});

router.get("/admin/products", requireAdmin, async (req, res) => {
  try {
    const products = await prisma.products.findMany({
      include: {
        images: true,
        category: true,
      },
      orderBy: { created_at: "desc" },
    });

    res.json(products.map(mapProductForStorefront));
  } catch (error) {
    res.status(500).json({
      error: "Failed to fetch admin products",
      details: (error as Error).message,
    });
  }
});

router.post("/admin/products", requireAdmin, async (req, res) => {
  try {
    const {
      name,
      description,
      price,
      imageUrl,
      publicId,
      bgImage,
      status = "active",
      personalizationRequired = true,
      stockQuantity = 0,
      categoryId,
    } = req.body;

    if (!name || !price || !imageUrl) {
      return res.status(400).json({
        error: "name, price and imageUrl are required.",
      });
    }

    const slug = await uniqueSlug(name);

    const product = await prisma.products.create({
      data: {
        name,
        slug,
        description,
        price,
        sku: bgImage || "/product-card-cloud-blue.png",
        card_bg_image: bgImage || "/product-card-cloud-blue.png",
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
      error: "Failed to create product",
      details: (error as Error).message,
    });
  }
});

router.put("/admin/products/:id", requireAdmin, async (req, res) => {
  try {
    const product = await prisma.products.update({
      where: { id: req.params.id },
      data: req.body,
    });

    res.json(product);
  } catch (error) {
    res.status(400).json({ error: "Failed to update product" });
  }
});

router.delete("/admin/products/:id", requireAdmin, async (req, res) => {
  try {
    await prisma.products.delete({
      where: { id: req.params.id },
    });

    res.json({ success: true });
  } catch (error) {
    res.status(400).json({ error: "Failed to delete product" });
  }
});

// ---------------------------------------------------------
// Order Admin
// ---------------------------------------------------------
router.get("/admin/orders", requireAdmin, async (req, res) => {
  try {
    const orders = await prisma.orders.findMany({
      include: { items: true },
      orderBy: { created_at: "desc" },
    });

    res.json(orders.map(mapOrderForAdmin));
  } catch (error) {
    res.status(500).json({
      error: "Failed to fetch orders",
      details: (error as Error).message,
    });
  }
});

router.put("/admin/orders/:id", requireAdmin, async (req, res) => {
  try {
    const {
      orderStatus,
      paymentStatus,
      trackingReference,
      carrier,
      shipmentStatus,
      estimatedDelivery,
      trackingUrl,
    } = req.body;

    if (orderStatus && !allowedOrderStatuses.includes(orderStatus)) {
      return res.status(400).json({ error: "Invalid order status." });
    }

    if (paymentStatus && !allowedPaymentStatuses.includes(paymentStatus)) {
      return res.status(400).json({ error: "Invalid payment status." });
    }

    if (shipmentStatus && !allowedShipmentStatuses.includes(shipmentStatus)) {
      return res.status(400).json({ error: "Invalid shipment status." });
    }

    const previousOrder = await prisma.orders.findUnique({
      where: { id: req.params.id },
    });

    if (!previousOrder) {
      return res.status(404).json({ error: "Order not found." });
    }

    const previousSnapshot =
      parseJson(previousOrder.personalization_data_json) || {};
    const nextOrderStatus = orderStatus || previousOrder.order_status;
    const nextPaymentStatus = paymentStatus || previousOrder.payment_status;
    const nextTrackingReference =
      String(trackingReference || "").trim() || null;
    const nextCarrier = String(
      carrier ||
        previousSnapshot.carrier ||
        previousSnapshot.shippingMethod?.carrier ||
        "USPS",
    ).trim();
    const nextShipmentStatus =
      shipmentStatus ||
      previousSnapshot.shipmentStatus ||
      mapOrderStatusToShipmentStatus(nextOrderStatus, nextPaymentStatus);
    const nextEstimatedDelivery =
      String(estimatedDelivery || "").trim() ||
      previousSnapshot.estimatedDelivery ||
      previousSnapshot.shippingMethod?.estimatedDelivery ||
      null;
    const nextTrackingUrl =
      String(trackingUrl || "").trim() ||
      getCarrierTrackingUrl(nextCarrier, nextTrackingReference) ||
      null;
    const timelineSeed = Array.isArray(previousSnapshot.trackingEvents)
      ? previousSnapshot.trackingEvents
      : buildManualTimeline({
          orderNumber: previousOrder.order_number,
          paymentStatus: nextPaymentStatus,
          orderStatus: nextOrderStatus,
          createdAt: previousOrder.created_at,
          trackingNumber: nextTrackingReference,
          carrier: nextCarrier,
        });
    const shipmentChanged =
      previousSnapshot.shipmentStatus !== nextShipmentStatus ||
      previousSnapshot.carrier !== nextCarrier ||
      previousOrder.tracking_reference !== nextTrackingReference;
    const trackingEvents = shipmentChanged
      ? [
          {
            status: nextShipmentStatus,
            description: `${getCarrierDisplayName(nextCarrier)} shipment details were updated by Little Wonders.`,
            timestamp: new Date().toISOString(),
          },
          ...timelineSeed,
        ]
      : timelineSeed;
    const nextSnapshot = {
      ...previousSnapshot,
      carrier: nextCarrier,
      carrierKey: normalizeCarrierKey(nextCarrier),
      trackingNumber: nextTrackingReference,
      shipmentStatus: nextShipmentStatus,
      shipmentStatusLabel: getShipmentStatusLabel(nextShipmentStatus),
      estimatedDelivery: nextEstimatedDelivery,
      trackingUrl: nextTrackingUrl,
      trackingEvents,
      lastShipmentUpdate: new Date().toISOString(),
    };

    const updatedOrder = await prisma.orders.update({
      where: { id: req.params.id },
      data: {
        order_status: nextOrderStatus,
        payment_status: nextPaymentStatus,
        tracking_reference: nextTrackingReference,
        personalization_data_json: JSON.stringify(nextSnapshot),
      },
      include: { items: true },
    });

    res.json({
      ...mapOrderForAdmin(updatedOrder),
      trackingNumber: updatedOrder.tracking_reference,
      carrier: getCarrierDisplayName(nextCarrier),
      carrierKey: normalizeCarrierKey(nextCarrier),
      shipmentStatus: nextShipmentStatus,
      shipmentStatusLabel: getShipmentStatusLabel(nextShipmentStatus),
      estimatedDelivery: nextEstimatedDelivery,
      trackingUrl: nextTrackingUrl,
    });
  } catch (error) {
    res.status(400).json({
      error: "Failed to update order",
      details: (error as Error).message,
    });
  }
});

// ---------------------------------------------------------
// Category CRUD
// ---------------------------------------------------------
router.get("/categories", async (req, res) => {
  try {
    const categories = await prisma.categories.findMany();
    res.json(categories);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch categories" });
  }
});

router.post("/admin/categories", requireAdmin, async (req, res) => {
  try {
    const category = await prisma.categories.create({
      data: req.body,
    });

    res.status(201).json(category);
  } catch (error) {
    res.status(400).json({ error: "Failed to create category" });
  }
});

// ---------------------------------------------------------
// Personalization CRUD
// ---------------------------------------------------------
router.get("/admin/templates", requireAdmin, async (req, res) => {
  try {
    const templates = await prisma.personalization_templates.findMany({
      include: { fields: true },
    });

    res.json(templates);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch templates" });
  }
});

router.post("/admin/templates", requireAdmin, async (req, res) => {
  try {
    const template = await prisma.personalization_templates.create({
      data: req.body,
    });

    res.status(201).json(template);
  } catch (error) {
    res.status(400).json({ error: "Failed to create template" });
  }
});

router.post("/admin/fields", requireAdmin, async (req, res) => {
  try {
    const field = await prisma.personalization_fields.create({
      data: req.body,
    });

    res.status(201).json(field);
  } catch (error) {
    res.status(400).json({
      error: "Failed to create personalization field",
    });
  }
});

// ---------------------------------------------------------
// Cart API
// ---------------------------------------------------------
router.post("/cart/sync", async (req, res) => {
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
      error: "Cart sync failed",
      details: (error as Error).message,
    });
  }
});

// ---------------------------------------------------------
// Payment Placeholder
// ---------------------------------------------------------
router.post("/checkout/create-payment", async (req, res) => {
  try {
    res.json({
      success: true,
      clientSecret: "pi_placeholder_secret_12345",
      orderId: "ORDER-" + Math.random().toString(36).substring(7).toUpperCase(),
      message: "Payment intent created (Placeholder)",
    });
  } catch (error) {
    res.status(500).json({ error: "Payment setup failed" });
  }
});

// ---------------------------------------------------------
// Public Tracking
// ---------------------------------------------------------
router.get("/track", async (req, res) => {
  const query = String(
    req.query.query || req.query.order || req.query.tracking || "",
  )
    .trim()
    .slice(0, 80);

  if (!query) {
    return res
      .status(400)
      .json({ error: "Missing order or tracking reference." });
  }

  try {
    const order =
      (await prisma.orders.findFirst({
        where: { order_number: { equals: query, mode: "insensitive" } },
        include: { items: true },
      })) ||
      (await prisma.orders.findFirst({
        where: { tracking_reference: { equals: query, mode: "insensitive" } },
        include: { items: true },
      }));

    if (!order) {
      return res.status(404).json({ error: "Order not found." });
    }

    const snapshot = parseJson(order.personalization_data_json) || {};
    const shippingMethod = snapshot.shippingMethod || null;
    const carrier = snapshot.carrier || shippingMethod?.carrier || "USPS";
    const trackingNumber =
      order.tracking_reference || snapshot.trackingNumber || null;
    const shipmentStatus =
      snapshot.shipmentStatus ||
      mapOrderStatusToShipmentStatus(order.order_status, order.payment_status);
    const trackingUrl =
      snapshot.trackingUrl || getCarrierTrackingUrl(carrier, trackingNumber);
    const trackingEvents = Array.isArray(snapshot.trackingEvents)
      ? snapshot.trackingEvents
      : buildManualTimeline({
          orderNumber: order.order_number,
          paymentStatus: order.payment_status,
          orderStatus: order.order_status,
          createdAt: order.created_at,
          trackingNumber,
          carrier,
        });

    res.json({
      id: order.id,
      orderNumber: order.order_number,
      orderStatus: order.order_status,
      paymentStatus: order.payment_status,
      shipmentStatus,
      shipmentStatusLabel: getShipmentStatusLabel(shipmentStatus),
      shippingMethod: shippingMethod?.label || null,
      shippingService: shippingMethod?.service || null,
      estimatedDelivery:
        snapshot.estimatedDelivery || shippingMethod?.estimatedDelivery || null,
      carrier: getCarrierDisplayName(carrier),
      carrierKey: normalizeCarrierKey(carrier),
      trackingNumber,
      trackingReference: trackingNumber,
      trackingUrl,
      trackingProviderType: getTrackingProviderType(carrier),
      customerNote: getCarrierCustomerNote(carrier),
      lastUpdated: trackingEvents?.[0]?.timestamp || order.created_at,
      totalAmount: Number(order.total_amount),
      currency: order.currency,
      createdAt: order.created_at,
      shippingCity: snapshot.customer?.city || null,
      shippingState: snapshot.customer?.state || null,
      items: order.items.map((item: any) => ({
        productName: item.product_name_snapshot,
        quantity: Number(item.quantity) || 1,
        price: Number(item.price_snapshot) || 0,
        personalizationData: parseJson(item.personalization_data_json) || {},
      })),
      trackingEvents,
      liveTracking: {
        providerConnected: false,
        providerType: getTrackingProviderType(carrier),
        provider: getCarrierDisplayName(carrier),
        status: shipmentStatus,
        message: trackingUrl
          ? "Official carrier tracking is available through the tracking link."
          : "Live carrier API is not connected yet. Updates are managed by Little Wonders.",
        events: [],
      },
    });
  } catch (error) {
    res
      .status(500)
      .json({
        error: "Tracking lookup failed",
        details: (error as Error).message,
      });
  }
});

router.get("/orders/:orderNumber/tracking", async (req, res) => {
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
        message: "Real order query successful",
      });
    } else {
      res.json({
        orderNumber,
        status: "processing",
        estimatedDelivery: "3-5 business days",
        steps: [
          {
            id: 1,
            label: "Order Placed",
            completed: true,
            date: new Date().toISOString(),
          },
          {
            id: 2,
            label: "Personalization",
            completed: true,
            date: new Date().toISOString(),
          },
          {
            id: 3,
            label: "Packaging",
            completed: false,
          },
          {
            id: 4,
            label: "Shipped",
            completed: false,
          },
        ],
      });
    }
  } catch (error) {
    res.status(500).json({ error: "Tracking query failed" });
  }
});

export default router;
