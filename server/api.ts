import { Router, Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { v2 as cloudinary } from "cloudinary";
import Stripe from "stripe";
import { prisma } from "../lib/prisma.js";
import {
  assertAdminLoginAllowed,
  clearAdminLoginAttempts,
  createAdminToken,
  getJwtSecret,
  getLoginRateLimitKey,
  hasConfiguredAdminCredentials,
  isConfiguredAdminLogin,
  recordFailedAdminLogin,
} from "../lib/auth.js";
import {
  buildVerifiedCheckout,
  createPendingOrderFromCheckout,
  getAbsoluteImageUrl as getCheckoutAbsoluteImageUrl,
  isCheckoutValidationError,
  toCents as checkoutToCents,
  verifyPayPalCaptureForOrder,
} from "../lib/checkout.js";
import { sendPaymentConfirmedEmail } from "../lib/email.js";
import {
  CLOUDINARY_PRODUCT_FOLDER,
  isUploadValidationError,
  parseImageDataUrl,
} from "../lib/upload.js";
import {
  mapPersonalizationFields,
  mapProductPersonalizationFields,
  normalizePersonalizationFieldCreateData,
} from "../lib/products.js";
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
const JWT_SECRET = getJwtSecret();
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
  { label: "Blue", image: "card-design:classic:rounded:blue" },
  { label: "Peach", image: "card-design:classic:rounded:peach" },
  { label: "Mint", image: "card-design:classic:rounded:mint" },
  { label: "Lavender", image: "card-design:classic:rounded:lavender" },
  { label: "Butter", image: "card-design:classic:rounded:butter" },
  { label: "Rose", image: "card-design:classic:rounded:rose" },
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

const uniqueCategorySlug = async (name: string, currentId?: string) => {
  const baseSlug = slugify(name) || `category-${Date.now()}`;
  let slug = baseSlug;
  let counter = 1;

  while (true) {
    const existingCategory = await prisma.categories.findUnique({
      where: { slug },
    });
    if (!existingCategory || existingCategory.id === currentId) return slug;
    slug = `${baseSlug}-${counter}`;
    counter += 1;
  }
};

const normalizeEmail = (value: unknown) =>
  String(value || "").trim().toLowerCase();

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
    personalizationFields: mapProductPersonalizationFields(product),
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

const mapCategoryForAdmin = (category: any) => ({
  id: category.id,
  name: category.name,
  slug: category.slug,
  description: category.description || "",
  imageUrl: category.image_url || "",
  productCount: Number(category._count?.products || 0),
});

const mapTemplateForAdmin = (template: any) => ({
  id: template.id,
  name: template.name,
  description: template.description || "",
  used: 0,
  fields: mapPersonalizationFields(template.fields || []),
  createdAt: template.created_at,
  updatedAt: template.updated_at,
});

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
    <title>MY BABY SHIRE Admin</title>
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
    internalNote: order.internal_note || "",
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
  const forwardedFor = req.headers["x-forwarded-for"];
  const loginIp =
    typeof forwardedFor === "string"
      ? forwardedFor.split(",")[0]?.trim()
      : req.ip;
  const loginKey = getLoginRateLimitKey(email, loginIp);

  try {
    assertAdminLoginAllowed(loginKey);

    if (!hasConfiguredAdminCredentials()) {
      return res
        .status(500)
        .json({ error: "Admin credentials are not configured." });
    }

    if (isConfiguredAdminLogin(email, password)) {
      clearAdminLoginAttempts(loginKey);
      const token = createAdminToken(email);

      return res.json({
        token,
        user: { email, role: "admin" },
      });
    }

    recordFailedAdminLogin(loginKey);
    return res.status(401).json({ error: "Invalid credentials" });
  } catch (error) {
    const statusCode =
      error instanceof Error && "statusCode" in error
        ? Number((error as any).statusCode)
        : 500;

    res.status(statusCode || 500).json({
      error: statusCode === 429 ? (error as Error).message : "Login failed",
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
        "This Google account is not allowed to access the MY BABY SHIRE admin.",
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
    const { file } = req.body;
    const image = parseImageDataUrl(file);

    if (
      !process.env.CLOUDINARY_CLOUD_NAME ||
      !process.env.CLOUDINARY_API_KEY ||
      !process.env.CLOUDINARY_API_SECRET
    ) {
      return res.status(500).json({
        error: "Cloudinary environment variables are missing.",
      });
    }

    const result = await cloudinary.uploader.upload(image.dataUrl, {
      folder: CLOUDINARY_PRODUCT_FOLDER,
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
    if (isUploadValidationError(error)) {
      return res.status(error.statusCode).json({ error: error.message });
    }

    console.error("Cloudinary upload failed", error);
    res.status(500).json({
      error: "Cloudinary upload failed. Please try again.",
    });
  }
});

// ---------------------------------------------------------
// remove.bg + Cloudinary Upload
// ---------------------------------------------------------
router.post("/admin/remove-bg-upload", requireAdmin, async (req, res) => {
  try {
    const { file } = req.body;
    const image = parseImageDataUrl(file);

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

    const imageBlob = new Blob([image.buffer], {
      type: image.mimeType,
    });

    const formData = new FormData();
    formData.append("size", "auto");
    formData.append("format", "png");
    formData.append("image_file", imageBlob, "image");

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
      console.error("remove.bg failed", errorText);

      return res.status(removeBgResponse.status).json({
        error: "remove.bg failed",
      });
    }

    const transparentArrayBuffer = await removeBgResponse.arrayBuffer();
    const transparentBuffer = Buffer.from(transparentArrayBuffer);
    const transparentBase64 = transparentBuffer.toString("base64");

    const result = await cloudinary.uploader.upload(
      `data:image/png;base64,${transparentBase64}`,
      {
        folder: CLOUDINARY_PRODUCT_FOLDER,
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
    if (isUploadValidationError(error)) {
      return res.status(error.statusCode).json({ error: error.message });
    }

    console.error("Background removal upload failed", error);
    res.status(500).json({
      error: "Background removal upload failed. Please try again.",
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
    console.error("Failed to fetch products", error);
    res.status(500).json({
      error: "Failed to fetch products",
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
        personalization_fields: true,
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
      personalizationFields = [],
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
    const fieldCreateData = Boolean(personalizationRequired)
      ? normalizePersonalizationFieldCreateData(personalizationFields)
      : [];

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
          personalization_fields: fieldCreateData.length
            ? { create: fieldCreateData }
            : undefined,
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
          personalization_fields: true,
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
      personalizationFields = [],
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

    const fieldCreateData = Boolean(personalizationRequired)
      ? normalizePersonalizationFieldCreateData(personalizationFields)
      : [];

    await prisma.products.update({
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
        personalization_fields: Boolean(personalizationRequired)
          ? {
              deleteMany: {},
              create: fieldCreateData,
            }
          : { deleteMany: {} },
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
    });

    const product = await prisma.products.findUnique({
      where: { id: req.params.id },
      include: { images: true, category: true, personalization_fields: true },
    });

    if (!product) return res.status(404).json({ error: "Product not found." });

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
    const orderItemCount = await prisma.order_items.count({
      where: { product_id: req.params.id },
    });

    if (orderItemCount > 0) {
      await prisma.products.update({
        where: { id: req.params.id },
        data: { status: "archived" },
      });

      return res.json({
        success: true,
        archived: true,
        message:
          "Product is linked to existing orders, so it was archived instead of deleted.",
      });
    }

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

const updateAdminOrder = async (req: Request, res: Response) => {
  try {
    const orderId = String(req.params.id || req.query.id || req.body.id || "");
    const {
      orderStatus,
      paymentStatus,
      trackingReference,
      carrier,
      shipmentStatus,
      estimatedDelivery,
      trackingUrl,
      internalNote,
    } = req.body;
    const shouldUpdateInternalNote = typeof internalNote === "string";
    const hasShipmentUpdate = [
      "orderStatus",
      "paymentStatus",
      "trackingReference",
      "carrier",
      "shipmentStatus",
      "estimatedDelivery",
      "trackingUrl",
    ].some((key) => Object.prototype.hasOwnProperty.call(req.body, key));

    if (!orderId) {
      return res.status(400).json({ error: "Order id is required." });
    }

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
      where: { id: orderId },
    });

    if (!previousOrder) {
      return res.status(404).json({ error: "Order not found." });
    }

    if (!hasShipmentUpdate && shouldUpdateInternalNote) {
      const updatedOrder = await prisma.orders.update({
        where: { id: orderId },
        data: { internal_note: internalNote.trim() || null },
        include: { items: true },
      });

      return res.json(mapOrderForAdmin(updatedOrder));
    }

    const previousSnapshot =
      parseJson(previousOrder.personalization_data_json) || {};
    const nextOrderStatus = orderStatus || previousOrder.order_status;
    const nextPaymentStatus = paymentStatus || previousOrder.payment_status;
    const hasTrackingReference = Object.prototype.hasOwnProperty.call(
      req.body,
      "trackingReference",
    );
    const nextTrackingReference = hasTrackingReference
      ? String(trackingReference || "").trim() || null
      : previousOrder.tracking_reference || previousSnapshot.trackingNumber || null;
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
            description: `${getCarrierDisplayName(nextCarrier)} shipment details were updated by MY BABY SHIRE.`,
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
      where: { id: orderId },
      data: {
        order_status: nextOrderStatus,
        payment_status: nextPaymentStatus,
        tracking_reference: nextTrackingReference,
        personalization_data_json: JSON.stringify(nextSnapshot),
        ...(shouldUpdateInternalNote
          ? { internal_note: internalNote.trim() || null }
          : {}),
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
      internalNote: updatedOrder.internal_note || "",
    });
  } catch (error) {
    res.status(400).json({
      error: "Failed to update order",
      details: (error as Error).message,
    });
  }
};

router.put("/admin/orders", requireAdmin, updateAdminOrder);
router.put("/admin/orders/:id", requireAdmin, updateAdminOrder);

// ---------------------------------------------------------
// Customer Admin Notes
// ---------------------------------------------------------
router.get("/admin/customer-notes", requireAdmin, async (req, res) => {
  try {
    const notes = await prisma.customer_notes.findMany({
      orderBy: { updated_at: "desc" },
    });

    res.json(
      notes.map((note) => ({
        id: note.id,
        customerEmail: note.customer_email,
        note: note.note,
        updatedAt: note.updated_at,
      })),
    );
  } catch (error) {
    res.status(500).json({
      error: "Failed to fetch customer notes",
      details: (error as Error).message,
    });
  }
});

const updateCustomerNote = async (req: Request, res: Response) => {
  try {
    const customerEmail = normalizeEmail(
      decodeURIComponent(
        String(req.params.email || req.query.email || req.body.email || ""),
      ),
    );
    const note = String(req.body.note || "").trim();

    if (!customerEmail) {
      return res.status(400).json({ error: "Customer email is required." });
    }

    if (!note) {
      await prisma.customer_notes.deleteMany({
        where: { customer_email: customerEmail },
      });

      return res.json({
        customerEmail,
        note: "",
        updatedAt: null,
      });
    }

    const savedNote = await prisma.customer_notes.upsert({
      where: { customer_email: customerEmail },
      update: { note },
      create: { customer_email: customerEmail, note },
    });

    res.json({
      id: savedNote.id,
      customerEmail: savedNote.customer_email,
      note: savedNote.note,
      updatedAt: savedNote.updated_at,
    });
  } catch (error) {
    res.status(400).json({
      error: "Failed to save customer note",
      details: (error as Error).message,
    });
  }
};

router.put("/admin/customer-notes", requireAdmin, updateCustomerNote);
router.put("/admin/customer-notes/:email", requireAdmin, updateCustomerNote);

// ---------------------------------------------------------
// Category CRUD
// ---------------------------------------------------------
router.get("/categories", async (req, res) => {
  try {
    const categories = await prisma.categories.findMany({
      orderBy: { name: "asc" },
    });
    res.json(categories);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch categories" });
  }
});

router.get("/admin/categories", requireAdmin, async (req, res) => {
  try {
    const categories = await prisma.categories.findMany({
      include: { _count: { select: { products: true } } },
      orderBy: { name: "asc" },
    });

    res.json(categories.map(mapCategoryForAdmin));
  } catch (error) {
    res.status(500).json({
      error: "Failed to fetch categories",
      details: (error as Error).message,
    });
  }
});

router.post("/admin/categories", requireAdmin, async (req, res) => {
  try {
    const name = String(req.body.name || "").trim();
    const description = String(req.body.description || "").trim();
    const imageUrl = String(req.body.imageUrl || req.body.image_url || "").trim();

    if (!name) {
      return res.status(400).json({ error: "Category name is required." });
    }

    const slug = await uniqueCategorySlug(req.body.slug || name);
    const category = await prisma.categories.create({
      data: {
        name,
        slug,
        description: description || null,
        image_url: imageUrl || null,
      },
      include: { _count: { select: { products: true } } },
    });

    res.status(201).json(mapCategoryForAdmin(category));
  } catch (error) {
    res.status(400).json({
      error: "Failed to create category",
      details: (error as Error).message,
    });
  }
});

const updateAdminCategory = async (req: Request, res: Response) => {
  try {
    const categoryId = String(req.params.id || req.query.id || req.body.id || "");
    if (!categoryId) {
      return res.status(400).json({ error: "Category id is required." });
    }

    const existingCategory = await prisma.categories.findUnique({
      where: { id: categoryId },
    });

    if (!existingCategory) {
      return res.status(404).json({ error: "Category not found." });
    }

    const name = String(req.body.name || "").trim();
    const description = String(req.body.description || "").trim();
    const imageUrl = String(req.body.imageUrl || req.body.image_url || "").trim();

    if (!name) {
      return res.status(400).json({ error: "Category name is required." });
    }

    const slugSource = String(req.body.slug || name).trim();
    const slug = await uniqueCategorySlug(slugSource, existingCategory.id);
    const category = await prisma.categories.update({
      where: { id: existingCategory.id },
      data: {
        name,
        slug,
        description: description || null,
        image_url: imageUrl || null,
      },
      include: { _count: { select: { products: true } } },
    });

    res.json(mapCategoryForAdmin(category));
  } catch (error) {
    res.status(400).json({
      error: "Failed to update category",
      details: (error as Error).message,
    });
  }
};

const deleteAdminCategory = async (req: Request, res: Response) => {
  try {
    const categoryId = String(req.params.id || req.query.id || req.body.id || "");
    if (!categoryId) {
      return res.status(400).json({ error: "Category id is required." });
    }

    const existingCategory = await prisma.categories.findUnique({
      where: { id: categoryId },
    });

    if (!existingCategory) {
      return res.status(404).json({ error: "Category not found." });
    }

    await prisma.products.updateMany({
      where: { category_id: existingCategory.id },
      data: { category_id: null },
    });
    await prisma.categories.delete({ where: { id: existingCategory.id } });

    res.json({ success: true });
  } catch (error) {
    res.status(400).json({
      error: "Failed to delete category",
      details: (error as Error).message,
    });
  }
};

router.put("/admin/categories", requireAdmin, updateAdminCategory);
router.put("/admin/categories/:id", requireAdmin, updateAdminCategory);
router.delete("/admin/categories", requireAdmin, deleteAdminCategory);
router.delete("/admin/categories/:id", requireAdmin, deleteAdminCategory);

// ---------------------------------------------------------
// Personalization CRUD
// ---------------------------------------------------------
router.get("/admin/templates", requireAdmin, async (req, res) => {
  try {
    const templates = await prisma.personalization_templates.findMany({
      include: { fields: true },
      orderBy: { updated_at: "desc" },
    });

    res.json(templates.map(mapTemplateForAdmin));
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch templates" });
  }
});

router.post("/admin/templates", requireAdmin, async (req, res) => {
  try {
    const name = String(req.body.name || "").trim();
    const description = String(req.body.description || "").trim();
    const fields = Array.isArray(req.body.fields)
      ? req.body.fields
      : Array.isArray(req.body.personalizationFields)
        ? req.body.personalizationFields
        : [];

    if (!name) {
      return res.status(400).json({ error: "Template name is required." });
    }

    const template = await prisma.personalization_templates.create({
      data: {
        name,
        description: description || null,
        fields: {
          create: normalizePersonalizationFieldCreateData(fields),
        },
      },
      include: { fields: true },
    });

    res.status(201).json(mapTemplateForAdmin(template));
  } catch (error) {
    res.status(400).json({
      error: "Failed to create template",
      details: (error as Error).message,
    });
  }
});

const updateAdminTemplate = async (req: Request, res: Response) => {
  try {
    const templateId = String(req.params.id || req.query.id || req.body.id || "");
    const name = String(req.body.name || "").trim();
    const description = String(req.body.description || "").trim();
    const fields = Array.isArray(req.body.fields)
      ? req.body.fields
      : Array.isArray(req.body.personalizationFields)
        ? req.body.personalizationFields
        : [];

    if (!templateId) {
      return res.status(400).json({ error: "Template id is required." });
    }

    if (!name) {
      return res.status(400).json({ error: "Template name is required." });
    }

    const template = await prisma.personalization_templates.update({
      where: { id: templateId },
      data: {
        name,
        description: description || null,
        fields: {
          deleteMany: {},
          create: normalizePersonalizationFieldCreateData(fields),
        },
      },
      include: { fields: true },
    });

    res.json(mapTemplateForAdmin(template));
  } catch (error) {
    res.status(400).json({
      error: "Failed to update template",
      details: (error as Error).message,
    });
  }
};

const deleteAdminTemplate = async (req: Request, res: Response) => {
  try {
    const templateId = String(req.params.id || req.query.id || req.body.id || "");
    if (!templateId) {
      return res.status(400).json({ error: "Template id is required." });
    }

    await prisma.personalization_templates.delete({
      where: { id: templateId },
    });

    res.json({ success: true });
  } catch (error) {
    res.status(400).json({
      error: "Failed to delete template",
      details: (error as Error).message,
    });
  }
};

router.put("/admin/templates", requireAdmin, updateAdminTemplate);
router.put("/admin/templates/:id", requireAdmin, updateAdminTemplate);
router.delete("/admin/templates", requireAdmin, deleteAdminTemplate);
router.delete("/admin/templates/:id", requireAdmin, deleteAdminTemplate);

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
    console.error("Cart sync failed", error);
    res.status(500).json({
      error: "Cart sync failed",
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

  let pendingOrderId: string | null = null;

  try {
    const checkout = await buildVerifiedCheckout(req.body);
    const order = await createPendingOrderFromCheckout(checkout, "stripe");
    pendingOrderId = order.id;
    const baseUrl = getBaseUrl(req);
    const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] =
      checkout.items.map((item) => {
        const productImage = getCheckoutAbsoluteImageUrl(item.imageUrl, baseUrl);
        return {
          quantity: item.quantity,
          price_data: {
            currency: checkout.currency.toLowerCase(),
            unit_amount: checkoutToCents(item.price),
            product_data: {
              name: item.name,
              description: item.description || "Personalized MY BABY SHIRE gift",
              images: productImage ? [productImage] : undefined,
              metadata: { productId: item.productId },
            },
          },
        };
      });

    if (checkout.shipping > 0) {
      lineItems.push({
        quantity: 1,
        price_data: {
          currency: checkout.currency.toLowerCase(),
          unit_amount: checkoutToCents(checkout.shipping),
          product_data: {
            name: checkout.shippingMethod.label,
            description: `${checkout.shippingMethod.carrier} · ${checkout.shippingMethod.service} · ${checkout.shippingMethod.estimatedDelivery}`,
          },
        },
      });
    }

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      locale: "en",
      customer_email: checkout.customer.email,
      line_items: lineItems,
      success_url: `${baseUrl}/payment-success?session_id={CHECKOUT_SESSION_ID}&order=${encodeURIComponent(order.order_number)}`,
      cancel_url: `${baseUrl}/payment-cancel?order=${encodeURIComponent(order.order_number)}`,
      payment_method_types: ["card"],
      custom_text: {
        submit: {
          message:
            "Your personalized gift order will be prepared after payment confirmation.",
        },
      },
      metadata: {
        orderId: order.id,
        orderNumber: order.order_number,
        shippingMethod: checkout.shippingMethod.id,
      },
      payment_intent_data: {
        metadata: {
          orderId: order.id,
          orderNumber: order.order_number,
          shippingMethod: checkout.shippingMethod.id,
        },
      },
    });
    pendingOrderId = null;

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
      subtotal: checkout.subtotal,
      shipping: checkout.shipping,
      shippingMethod: checkout.shippingMethod,
      total: Number(order.total_amount) || 0,
      message: "Stripe Checkout session created.",
    });
  } catch (error) {
    if (isCheckoutValidationError(error)) {
      return res.status(error.statusCode).json({ error: error.message });
    }

    if (pendingOrderId) {
      await prisma.orders
        .delete({ where: { id: pendingOrderId } })
        .catch((cleanupError) =>
          console.error("Failed to clean up pending Stripe order", cleanupError),
        );
    }

    console.error("Checkout setup failed", error);
    res.status(500).json({
      error: "Checkout setup failed. Please try again.",
    });
  }
});

const createPayPalOrderHandler = async (req: Request, res: Response) => {
  let pendingOrderId: string | null = null;

  try {
    const checkout = await buildVerifiedCheckout(req.body);
    const order = await createPendingOrderFromCheckout(checkout, "paypal");
    pendingOrderId = order.id;
    const baseUrl = getBaseUrl(req);

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
            description: `MY BABY SHIRE order ${order.order_number}`,
            amount: {
              currency_code: checkout.currency,
              value: checkout.total.toFixed(2),
              breakdown: {
                item_total: {
                  currency_code: checkout.currency,
                  value: checkout.subtotal.toFixed(2),
                },
                shipping: {
                  currency_code: checkout.currency,
                  value: checkout.shipping.toFixed(2),
                },
              },
            },
              items: checkout.items.map((item) => ({
                name: String(item.name).slice(0, 127),
                quantity: String(item.quantity),
                unit_amount: {
                  currency_code: checkout.currency,
                  value: item.price.toFixed(2),
                },
              })),
          },
        ],
        payment_source: {
          paypal: {
            experience_context: {
              brand_name: "MY BABY SHIRE",
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
    pendingOrderId = null;

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
      shippingMethod: checkout.shippingMethod,
    });
  } catch (error) {
    if (isCheckoutValidationError(error)) {
      return res.status(error.statusCode).json({ error: error.message });
    }

    if (pendingOrderId) {
      await prisma.orders
        .delete({ where: { id: pendingOrderId } })
        .catch((cleanupError) =>
          console.error("Failed to clean up pending PayPal order", cleanupError),
        );
    }

    console.error("PayPal checkout failed", error);
    return res.status(500).json({
      error: "PayPal checkout failed. Please try again.",
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
    const existingOrder = await prisma.orders.findUnique({
      where: { order_number: String(orderNumber) },
      include: { items: true },
    });

    if (!existingOrder) {
      return res.status(404).json({ error: "Order not found." });
    }

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

    const { isCompleted, paypalOrderId } = verifyPayPalCaptureForOrder(
      existingOrder,
      data,
      String(token),
    );
    const updatedOrder = await prisma.orders.update({
      where: { order_number: existingOrder.order_number },
      data: {
        payment_status: isCompleted ? "paid" : "pending",
        order_status: "processing",
        payment_reference: paypalOrderId,
      },
      include: { items: true },
    });

    if (isCompleted) {
      await sendPaymentConfirmedEmail({
        to: updatedOrder.customer_email,
        customerName: updatedOrder.customer_name,
        orderNumber: updatedOrder.order_number,
        total: Number(updatedOrder.total_amount) || 0,
        paymentProvider: "PayPal",
        items:
          updatedOrder.items?.map((item: any) => ({
            productName: item.product_name_snapshot,
            quantity: Number(item.quantity) || 1,
            price: Number(item.price_snapshot) || 0,
          })) || [],
      });
    }

    return res.json({
      success: true,
      status: data.status,
      orderNumber: existingOrder.order_number,
      paypalOrderId,
    });
  } catch (error) {
    if (isCheckoutValidationError(error)) {
      return res.status(error.statusCode).json({ error: error.message });
    }

    console.error("PayPal capture failed", error);
    return res.status(500).json({
      error: "PayPal capture failed. Please try again.",
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
  const verifier = String(
    req.query.verify || req.query.email || req.query.zip || "",
  )
    .trim()
    .toLowerCase()
    .slice(0, 180);

  if (!query) {
    return res
      .status(400)
      .json({ error: "Missing order or tracking reference." });
  }

  if (!verifier) {
    return res.status(400).json({
      error: "Enter the order email or shipping ZIP code to view tracking.",
    });
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
    const orderEmail = String(order.customer_email || "").trim().toLowerCase();
    const orderZip = String(snapshot?.customer?.zip || "").trim().toLowerCase();

    if (verifier !== orderEmail && verifier !== orderZip) {
      return res.status(403).json({
        error: "Order verification failed. Check the email or ZIP code and try again.",
      });
    }

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
          : "Live carrier API is not connected yet. Updates are managed by MY BABY SHIRE.",
        events: [],
      },
    });
  } catch (error) {
    console.error("Tracking lookup failed", error);
    res
      .status(500)
      .json({
        error: "Tracking lookup failed",
      });
  }
});

router.get("/orders/:orderNumber/tracking", async (req, res) => {
  try {
    const { orderNumber } = req.params;
    const verifier = String(req.query.verify || req.query.email || req.query.zip || "")
      .trim()
      .toLowerCase()
      .slice(0, 180);

    if (!verifier) {
      return res.status(400).json({
        error: "Enter the order email or shipping ZIP code to view tracking.",
      });
    }

    const order = await prisma.orders.findUnique({
      where: { order_number: orderNumber },
    });

    if (!order) {
      return res.status(404).json({ error: "Order not found." });
    }

    const snapshot = parseJson(order.personalization_data_json) || {};
    const orderEmail = String(order.customer_email || "").trim().toLowerCase();
    const orderZip = String(snapshot?.customer?.zip || "").trim().toLowerCase();

    if (verifier !== orderEmail && verifier !== orderZip) {
      return res.status(403).json({
        error: "Order verification failed. Check the email or ZIP code and try again.",
      });
    }

    res.json({
      orderNumber,
      status: order.order_status,
      trackingReference: order.tracking_reference,
    });
  } catch (error) {
    console.error("Tracking query failed", error);
    res.status(500).json({ error: "Tracking query failed" });
  }
});

export default router;
