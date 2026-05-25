import { Router, Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { PrismaClient } from "@prisma/client";
import { v2 as cloudinary } from "cloudinary";
import Stripe from "stripe";
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
  validateTrackingNumber,
} from "../src/utils/carriers.js";

const router = Router();
const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || "fallback-secret-development";
const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
const stripe = stripeSecretKey
  ? new Stripe(stripeSecretKey, { apiVersion: "2024-12-18.acacia" })
  : null;

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const DEFAULT_CLOUD_VARIANTS = [
  { label: "Blue", image: "/product-card-cloud-blue.png" },
  { label: "Peach", image: "/product-card-cloud-peach.png" },
  { label: "Mint", image: "/product-card-cloud-mint.png" },
  { label: "Lavender", image: "/product-card-cloud-lavender.svg" },
  { label: "Butter", image: "/product-card-cloud-butter.svg" },
  { label: "Rose", image: "/product-card-cloud-rose.svg" },
];

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
    salePrice: product.sale_price ? Number(product.sale_price) : null,
    sku: product.sku || "",
    categoryId: product.category_id || "",
    stockQuantity: product.stock_quantity || 0,
    imageUrl: primaryImage?.image_url || "",
    publicId: primaryImage?.public_id || "",
    bgImage:
      product.card_bg_image || product.sku || "/product-card-cloud-blue.png",
    badge: product.bestseller
      ? "Bestseller"
      : product.new_arrival
        ? "New"
        : undefined,
    personalizationRequired: product.personalization_required,
    personalizationEnabled: product.personalization_required,
    status: product.status,
    featured: product.featured,
    newArrival: product.new_arrival,
    isNewArrival: product.new_arrival,
    bestseller: product.bestseller,
    isBestseller: product.bestseller,
    genderTag: product.gender_tag || "",
    ageRange: product.age_range || "",
    material: product.material || "",
    careInstructions: product.care_instructions || "",
    preparationTime: product.preparation_time || "",
  };
};

const normalizePrice = (value: unknown) => {
  const price = Number(value);
  return Number.isFinite(price) && price > 0 ? price : null;
};

const normalizeCloudVariants = (body: any) => {
  if (Array.isArray(body.cloudVariants) && body.cloudVariants.length > 1) {
    return body.cloudVariants
      .map((variant: any) => ({
        label: String(variant.label || "").trim(),
        image: String(variant.image || "").trim(),
      }))
      .filter((variant: any) => variant.label && variant.image)
      .slice(0, 6);
  }

  if (body.createCloudVariants) return DEFAULT_CLOUD_VARIANTS;

  return [
    {
      label: "",
      image: String(body.bgImage || "/product-card-cloud-blue.png"),
    },
  ];
};

const createOrderNumber = () => {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).slice(2, 7).toUpperCase();
  return `LW-${timestamp}-${random}`;
};

const toCents = (amount: number) => Math.round(Number(amount || 0) * 100);

const getBaseUrl = (req: Request) => {
  const configuredUrl = process.env.PUBLIC_SITE_URL?.replace(/\/$/, "");
  if (configuredUrl) return configuredUrl;

  const host = req.headers["x-forwarded-host"] || req.headers.host;
  const protocol = req.headers["x-forwarded-proto"] || "http";
  return `${protocol}://${host}`;
};

const getAbsoluteImageUrl = (
  imageUrl: string | undefined,
  baseUrl: string,
) => {
  if (!imageUrl) return undefined;
  if (imageUrl.startsWith("http://") || imageUrl.startsWith("https://"))
    return imageUrl;
  if (imageUrl.startsWith("/")) return `${baseUrl}${imageUrl}`;
  return undefined;
};

const getGoogleRedirectUri = (req: Request) => {
  const configuredRedirect = process.env.GOOGLE_REDIRECT_URI?.replace(/\/$/, "");
  if (configuredRedirect) return configuredRedirect;
  return `${getBaseUrl(req)}/api/admin-google-callback`;
};

const getAllowedGoogleAdminEmails = () => {
  const configuredEmails = process.env.GOOGLE_ADMIN_EMAILS || process.env.ADMIN_EMAIL || "";

  return configuredEmails
    .split(",")
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);
};

const isGoogleOAuthConfigured = () => {
  return Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET);
};

const redirectAdminAuthError = (res: Response, message: string) => {
  res.redirect(`/admin?auth_error=${encodeURIComponent(message)}`);
};

const createGoogleAuthSuccessHtml = (token: string) => {
  const tokenJson = JSON.stringify(token);

  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width,initial-scale=1" />
    <title>Little Wonders Admin</title>
  </head>
  <body>
    <script>
      localStorage.setItem('little-wonders-admin-token-v2', ${tokenJson});
      window.location.replace('/admin');
    </script>
  </body>
</html>`;
};

const getPayPalBaseUrl = () =>
  process.env.PAYPAL_ENV === "live"
    ? "https://api-m.paypal.com"
    : "https://api-m.sandbox.paypal.com";

const getPayPalAccessToken = async () => {
  const clientId = process.env.PAYPAL_CLIENT_ID;
  const clientSecret = process.env.PAYPAL_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new Error(
      "PayPal is not configured. Add PAYPAL_CLIENT_ID and PAYPAL_CLIENT_SECRET to Vercel.",
    );
  }

  const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString(
    "base64",
  );
  const response = await fetch(`${getPayPalBaseUrl()}/v1/oauth2/token`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${credentials}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials",
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(
      data.error_description ||
        data.error ||
        "PayPal access token could not be created.",
    );
  }

  return data.access_token as string;
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
// Admin Google OAuth
// ---------------------------------------------------------
router.get("/admin-google-start", (req, res) => {
  if (!isGoogleOAuthConfigured()) {
    return redirectAdminAuthError(
      res,
      "Google sign-in is not configured yet. Add GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET in Vercel.",
    );
  }

  const state = jwt.sign(
    { provider: "google-admin", createdAt: Date.now() },
    JWT_SECRET,
    { expiresIn: "10m" },
  );
  const params = new URLSearchParams({
    client_id: process.env.GOOGLE_CLIENT_ID || "",
    redirect_uri: getGoogleRedirectUri(req),
    response_type: "code",
    scope: "openid email profile",
    prompt: "select_account",
    state,
  });

  return res.redirect(`https://accounts.google.com/o/oauth2/v2/auth?${params}`);
});

router.get("/admin-google-callback", async (req, res) => {
  try {
    if (!isGoogleOAuthConfigured()) {
      return redirectAdminAuthError(res, "Google sign-in is not configured yet.");
    }

    if (req.query.error) {
      return redirectAdminAuthError(
        res,
        `Google sign-in was cancelled or failed: ${String(req.query.error)}`,
      );
    }

    const code = String(req.query.code || "");
    const state = String(req.query.state || "");

    if (!code || !state) {
      return redirectAdminAuthError(res, "Missing Google sign-in response.");
    }

    const decodedState = jwt.verify(state, JWT_SECRET) as { provider?: string };
    if (decodedState.provider !== "google-admin") {
      return redirectAdminAuthError(res, "Invalid Google sign-in state.");
    }

    const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id: process.env.GOOGLE_CLIENT_ID || "",
        client_secret: process.env.GOOGLE_CLIENT_SECRET || "",
        redirect_uri: getGoogleRedirectUri(req),
        grant_type: "authorization_code",
      }),
    });
    const tokenData = await tokenResponse.json();

    if (!tokenResponse.ok || !tokenData.id_token) {
      return redirectAdminAuthError(
        res,
        tokenData.error_description ||
          tokenData.error ||
          "Google token exchange failed.",
      );
    }

    const profileResponse = await fetch(
      `https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(tokenData.id_token)}`,
    );
    const profile = await profileResponse.json();

    if (!profileResponse.ok) {
      return redirectAdminAuthError(res, "Google profile verification failed.");
    }

    const email = String(profile.email || "").trim().toLowerCase();
    const emailVerified = profile.email_verified === true || profile.email_verified === "true";
    const allowedEmails = getAllowedGoogleAdminEmails();

    if (profile.aud !== process.env.GOOGLE_CLIENT_ID || !emailVerified || !email) {
      return redirectAdminAuthError(res, "Google account could not be verified.");
    }

    if (!allowedEmails.includes(email)) {
      return redirectAdminAuthError(
        res,
        "This Google account is not allowed to access the Little Wonders admin.",
      );
    }

    const adminToken = createAdminToken(email);
    res.setHeader("Content-Type", "text/html; charset=utf-8");
    return res.status(200).send(createGoogleAuthSuccessHtml(adminToken));
  } catch (error) {
    return redirectAdminAuthError(
      res,
      (error as Error).message || "Google sign-in failed.",
    );
  }
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
      salePrice,
      imageUrl,
      publicId,
      bgImage,
      sku,
      status = "active",
      personalizationRequired = true,
      stockQuantity = 0,
      categoryId,
      featured = false,
      newArrival = false,
      bestseller = false,
      genderTag,
      ageRange,
      material,
      careInstructions,
      preparationTime,
    } = req.body;

    const normalizedPrice = normalizePrice(price);
    const variants = normalizeCloudVariants(req.body);

    if (!name || !normalizedPrice || !imageUrl) {
      return res.status(400).json({
        error: "name, positive price and imageUrl are required.",
      });
    }

    if (variants.length === 0) {
      return res.status(400).json({ error: "Select at least one cloud color." });
    }

    const createdProducts = [];

    for (const variant of variants) {
      const productName =
        variants.length > 1 ? `${name} - ${variant.label}` : name;
      const variantSku =
        sku && variants.length > 1 ? `${sku}-${variant.label.toUpperCase()}` : sku;
      const slug = await uniqueSlug(productName);

      const product = await prisma.products.create({
        data: {
          name: productName,
          slug,
          description,
          price: normalizedPrice,
          sale_price: salePrice ? Number(salePrice) : null,
          sku: variantSku || null,
          card_bg_image: variant.image || bgImage || "/product-card-cloud-blue.png",
          category_id: categoryId || null,
          stock_quantity: Number(stockQuantity) || 0,
          status,
          featured: Boolean(featured),
          new_arrival: Boolean(newArrival),
          bestseller: Boolean(bestseller),
          gender_tag: genderTag || null,
          age_range: ageRange || null,
          material: material || null,
          care_instructions: careInstructions || null,
          preparation_time: preparationTime || null,
          personalization_required: Boolean(personalizationRequired),
          images: {
            create: [
              {
                image_url: imageUrl,
                public_id: publicId || null,
                alt_text: productName,
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

      createdProducts.push(product);
    }

    const mappedProducts = createdProducts.map(mapProductForStorefront);

    if (mappedProducts.length > 1) {
      return res.status(201).json({
        products: mappedProducts,
        primaryProduct: mappedProducts[0],
        createdCount: mappedProducts.length,
      });
    }

    res.status(201).json(mappedProducts[0]);
  } catch (error) {
    res.status(400).json({
      error: "Failed to create product",
      details: (error as Error).message,
    });
  }
});

router.put("/admin/products/:id", requireAdmin, async (req, res) => {
  try {
    const {
      name,
      description,
      price,
      salePrice,
      imageUrl,
      publicId,
      bgImage,
      sku,
      status = "active",
      personalizationRequired = true,
      stockQuantity = 0,
      categoryId,
      featured = false,
      newArrival = false,
      bestseller = false,
      genderTag,
      ageRange,
      material,
      careInstructions,
      preparationTime,
    } = req.body;
    const normalizedPrice = normalizePrice(price);

    if (!name || !normalizedPrice || !imageUrl) {
      return res.status(400).json({
        error: "name, positive price and imageUrl are required.",
      });
    }

    const product = await prisma.products.update({
      where: { id: req.params.id },
      data: {
        name,
        description,
        price: normalizedPrice,
        sale_price: salePrice ? Number(salePrice) : null,
        sku: sku || null,
        card_bg_image: bgImage || "/product-card-cloud-blue.png",
        category_id: categoryId || null,
        stock_quantity: Number(stockQuantity) || 0,
        status,
        featured: Boolean(featured),
        new_arrival: Boolean(newArrival),
        bestseller: Boolean(bestseller),
        gender_tag: genderTag || null,
        age_range: ageRange || null,
        material: material || null,
        care_instructions: careInstructions || null,
        preparation_time: preparationTime || null,
        personalization_required: Boolean(personalizationRequired),
        images: {
          deleteMany: {},
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
      include: { images: true, category: true },
    });

    res.json(mapProductForStorefront(product));
  } catch (error) {
    res.status(400).json({
      error: "Failed to update product",
      details: (error as Error).message,
    });
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
    const trackingValidation = validateTrackingNumber(
      nextCarrier,
      nextTrackingReference,
    );

    if (!trackingValidation.valid) {
      return res.status(400).json({ error: trackingValidation.message });
    }

    if (
      ["shipped", "in_transit", "out_for_delivery"].includes(
        nextShipmentStatus,
      ) &&
      !nextTrackingReference
    ) {
      return res.status(400).json({
        error: "Add a tracking reference before marking this shipment as moving.",
      });
    }

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
// Payment
// ---------------------------------------------------------
router.post("/checkout/create-payment", async (req, res) => {
  if (!stripe) {
    return res
      .status(500)
      .json({ error: "Stripe is not configured. Add STRIPE_SECRET_KEY." });
  }

  try {
    const {
      customer,
      items,
      subtotal,
      shipping,
      total,
      currency = "USD",
      shippingMethod,
    } = req.body;

    if (
      !customer?.name ||
      !customer?.email ||
      !customer?.address ||
      !customer?.city ||
      !customer?.state ||
      !customer?.zip
    ) {
      return res
        .status(400)
        .json({ error: "Missing customer shipping details." });
    }

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: "Your gift bag is empty." });
    }

    const selectedShippingMethod = shippingMethod || {
      id: "us-standard",
      label: "Standard Shipping",
      carrier: "USPS",
      service: "Ground Advantage",
      estimatedDelivery: "3-5 business days",
      amount: Number(shipping) || 0,
    };
    const orderNumber = createOrderNumber();
    const customerSnapshot = {
      customer,
      subtotal: Number(subtotal) || 0,
      shipping: Number(shipping) || 0,
      shippingMethod: selectedShippingMethod,
      total: Number(total) || 0,
      currency,
      provider: "stripe",
    };

    const order = await prisma.orders.create({
      data: {
        order_number: orderNumber,
        customer_name: customer.name,
        customer_email: customer.email,
        total_amount: Number(total) || 0,
        currency,
        payment_status: "pending",
        order_status: "processing",
        personalization_data_json: JSON.stringify(customerSnapshot),
        items: {
          create: items.map((item: any) => ({
            product_id: item.productId,
            product_name_snapshot: item.name,
            quantity: Number(item.quantity) || 1,
            price_snapshot: Number(item.price) || 0,
            personalization_data_json: JSON.stringify(
              item.personalizationData || {},
            ),
          })),
        },
      },
      include: { items: true },
    });

    const baseUrl = getBaseUrl(req);
    const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = items.map(
      (item: any) => {
        const productImage = getAbsoluteImageUrl(item.imageUrl, baseUrl);
        return {
          quantity: Number(item.quantity) || 1,
          price_data: {
            currency: String(currency).toLowerCase(),
            unit_amount: toCents(Number(item.price) || 0),
            product_data: {
              name: item.name,
              description: item.description || "Personalized Little Wonders gift",
              images: productImage ? [productImage] : undefined,
              metadata: { productId: item.productId || "" },
            },
          },
        };
      },
    );

    if (Number(shipping) > 0) {
      lineItems.push({
        quantity: 1,
        price_data: {
          currency: String(currency).toLowerCase(),
          unit_amount: toCents(Number(shipping) || 0),
          product_data: {
            name: selectedShippingMethod.label || "Gift-ready shipping",
            description: `${selectedShippingMethod.carrier || "Carrier"} · ${selectedShippingMethod.service || "Shipping service"} · ${selectedShippingMethod.estimatedDelivery || "Delivery estimate"}`,
          },
        },
      });
    }

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      locale: "en",
      customer_email: customer.email,
      line_items: lineItems,
      success_url: `${baseUrl}/payment-success?session_id={CHECKOUT_SESSION_ID}&order=${encodeURIComponent(order.order_number)}`,
      cancel_url: `${baseUrl}/payment-cancel?order=${encodeURIComponent(order.order_number)}`,
      payment_method_types: ["card"],
      custom_text: {
        submit: {
          message:
            "Your personalized gift order will be prepared after payment confirmation.",
        },
        shipping_address: {
          message:
            "Please enter the delivery address for your Little Wonders gift.",
        },
      },
      metadata: {
        orderId: order.id,
        orderNumber: order.order_number,
        shippingMethod: selectedShippingMethod.id || "us-standard",
      },
      payment_intent_data: {
        metadata: {
          orderId: order.id,
          orderNumber: order.order_number,
          shippingMethod: selectedShippingMethod.id || "us-standard",
        },
      },
    });

    await prisma.orders.update({
      where: { id: order.id },
      data: { payment_reference: session.id },
    });

    res.json({
      success: true,
      orderId: order.order_number,
      databaseId: order.id,
      checkoutUrl: session.url,
      sessionId: session.id,
      currency: order.currency,
      subtotal: Number(subtotal) || 0,
      shipping: Number(shipping) || 0,
      shippingMethod: selectedShippingMethod,
      total: Number(order.total_amount) || 0,
      message: "Stripe Checkout session created.",
    });
  } catch (error) {
    res.status(500).json({
      error: "Checkout setup failed",
      details: (error as Error).message,
    });
  }
});

const createPayPalOrderHandler = async (req: Request, res: Response) => {
  try {
    const {
      customer,
      items,
      subtotal,
      shipping,
      total,
      currency = "USD",
      shippingMethod,
    } = req.body;

    if (
      !customer?.name ||
      !customer?.email ||
      !customer?.address ||
      !customer?.city ||
      !customer?.state ||
      !customer?.zip
    ) {
      return res
        .status(400)
        .json({ error: "Missing customer shipping details." });
    }

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: "Your gift bag is empty." });
    }

    const selectedShippingMethod = shippingMethod || {
      id: "us-standard",
      label: "Standard Shipping",
      carrier: "USPS",
      service: "Ground Advantage",
      estimatedDelivery: "3-5 business days",
      amount: Number(shipping) || 0,
    };
    const orderNumber = createOrderNumber();
    const baseUrl = getBaseUrl(req);
    const customerSnapshot = {
      customer,
      subtotal: Number(subtotal) || 0,
      shipping: Number(shipping) || 0,
      shippingMethod: selectedShippingMethod,
      total: Number(total) || 0,
      currency,
      provider: "paypal",
    };

    const order = await prisma.orders.create({
      data: {
        order_number: orderNumber,
        customer_name: customer.name,
        customer_email: customer.email,
        total_amount: Number(total) || 0,
        currency,
        payment_status: "pending",
        order_status: "processing",
        personalization_data_json: JSON.stringify(customerSnapshot),
        items: {
          create: items.map((item: any) => ({
            product_id: item.productId,
            product_name_snapshot: item.name,
            quantity: Number(item.quantity) || 1,
            price_snapshot: Number(item.price) || 0,
            personalization_data_json: JSON.stringify(
              item.personalizationData || {},
            ),
          })),
        },
      },
      include: { items: true },
    });

    const accessToken = await getPayPalAccessToken();
    const response = await fetch(`${getPayPalBaseUrl()}/v2/checkout/orders`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        intent: "CAPTURE",
        purchase_units: [
          {
            reference_id: order.order_number,
            description: `Little Wonders order ${order.order_number}`,
            amount: {
              currency_code: String(currency).toUpperCase(),
              value: Number(total || 0).toFixed(2),
              breakdown: {
                item_total: {
                  currency_code: String(currency).toUpperCase(),
                  value: Number(subtotal || 0).toFixed(2),
                },
                shipping: {
                  currency_code: String(currency).toUpperCase(),
                  value: Number(shipping || 0).toFixed(2),
                },
              },
            },
            items: items.map((item: any) => ({
              name: String(item.name).slice(0, 127),
              quantity: String(Number(item.quantity) || 1),
              unit_amount: {
                currency_code: String(currency).toUpperCase(),
                value: Number(item.price || 0).toFixed(2),
              },
            })),
          },
        ],
        payment_source: {
          paypal: {
            experience_context: {
              brand_name: "Little Wonders",
              locale: "en-US",
              shipping_preference: "NO_SHIPPING",
              user_action: "PAY_NOW",
              return_url: `${baseUrl}/paypal-success?order=${encodeURIComponent(order.order_number)}`,
              cancel_url: `${baseUrl}/payment-cancel?order=${encodeURIComponent(order.order_number)}`,
            },
          },
        },
      }),
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(
        data.message || data.name || "PayPal order could not be created.",
      );
    }

    const approvalUrl = data.links?.find(
      (link: any) => link.rel === "payer-action" || link.rel === "approve",
    )?.href;
    await prisma.orders.update({
      where: { id: order.id },
      data: { payment_reference: data.id },
    });

    return res.json({
      success: true,
      orderId: order.order_number,
      databaseId: order.id,
      paypalOrderId: data.id,
      approvalUrl,
      shippingMethod: selectedShippingMethod,
    });
  } catch (error) {
    return res.status(500).json({
      error: "PayPal checkout failed",
      details: (error as Error).message,
    });
  }
};

const capturePayPalOrderHandler = async (req: Request, res: Response) => {
  try {
    const { token, orderNumber } = req.body;

    if (!token || !orderNumber) {
      return res
        .status(400)
        .json({ error: "Missing PayPal token or order reference." });
    }

    const accessToken = await getPayPalAccessToken();
    const response = await fetch(
      `${getPayPalBaseUrl()}/v2/checkout/orders/${encodeURIComponent(token)}/capture`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
      },
    );

    const data = await response.json();
    if (!response.ok) {
      throw new Error(
        data.message || data.name || "PayPal payment could not be captured.",
      );
    }

    const isCompleted = data.status === "COMPLETED";
    await prisma.orders.update({
      where: { order_number: orderNumber },
      data: {
        payment_status: isCompleted ? "paid" : "pending",
        order_status: "processing",
        payment_reference: data.id || token,
      },
    });

    return res.json({
      success: true,
      status: data.status,
      orderNumber,
      paypalOrderId: data.id || token,
    });
  } catch (error) {
    return res.status(500).json({
      error: "PayPal capture failed",
      details: (error as Error).message,
    });
  }
};

router.post("/paypal/create-order", createPayPalOrderHandler);
router.post("/paypal-create-order", createPayPalOrderHandler);
router.post("/paypal/capture-order", capturePayPalOrderHandler);
router.post("/paypal-capture-order", capturePayPalOrderHandler);

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
