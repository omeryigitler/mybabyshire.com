import { Router, Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { PrismaClient } from "@prisma/client";
import { createAdminToken, getAdminCredentials } from "../lib/auth.js";

const router = Router();
const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || "fallback-secret-development";

type MemberRequest = Request & {
  member?: {
    id: string;
    email: string;
    name?: string;
    role?: string;
    type?: string;
  };
};

const getBaseUrl = (req: Request) => {
  const configuredUrl = process.env.PUBLIC_SITE_URL?.replace(/\/$/, "");
  if (configuredUrl) return configuredUrl;

  const host = req.headers["x-forwarded-host"] || req.headers.host;
  const protocol = req.headers["x-forwarded-proto"] || "http";
  return `${protocol}://${host}`;
};

const isGoogleOAuthConfigured = () => {
  return Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET);
};

const getMemberGoogleRedirectUri = (req: Request) => {
  const configuredRedirect = process.env.GOOGLE_MEMBER_REDIRECT_URI?.replace(/\/$/, "");
  if (configuredRedirect) return configuredRedirect;
  return `${getBaseUrl(req)}/api/account/google/callback`;
};

const redirectMemberAuthError = (res: Response, message: string) => {
  res.redirect(`/login?auth_error=${encodeURIComponent(message)}`);
};

const createMemberToken = (member: { id: string; email: string; name: string; role: string }) => {
  return jwt.sign(
    {
      id: member.id,
      email: member.email,
      name: member.name,
      role: member.role || "customer",
      type: "member",
    },
    JWT_SECRET,
    { expiresIn: "30d" },
  );
};

const isAdminEmail = (email: string) => {
  return getAdminCredentials().emails.includes(email.trim().toLowerCase());
};

const createAuthSuccessHtml = (token: string, role: "member" | "admin") => {
  const tokenJson = JSON.stringify(token);
  const tokenKey = role === "admin"
    ? "mybabyshire-admin-token-v1"
    : "mybabyshire-member-token-v1";
  const removedTokenKey = role === "admin"
    ? "mybabyshire-member-token-v1"
    : "mybabyshire-admin-token-v1";
  const target = role === "admin" ? "/admin" : "/account";

  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width,initial-scale=1" />
    <title>MY BABY SHIRE Account</title>
  </head>
  <body>
    <script>
      localStorage.setItem('${tokenKey}', ${tokenJson});
      localStorage.removeItem('${removedTokenKey}');
      window.location.replace('${target}');
    </script>
  </body>
</html>`;
};

const requireMember = (req: MemberRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;

  if (!authHeader?.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Unauthorized: Missing member token" });
  }

  try {
    const decoded = jwt.verify(authHeader.split(" ")[1], JWT_SECRET) as MemberRequest["member"];

    if (!decoded?.id || decoded.type !== "member") {
      return res.status(401).json({ error: "Unauthorized: Invalid member token" });
    }

    req.member = decoded;
    next();
  } catch {
    return res.status(401).json({ error: "Unauthorized: Invalid member token" });
  }
};

const mapMember = (user: any) => ({
  id: user.id,
  name: user.name,
  email: user.email,
  role: user.role,
  createdAt: user.created_at,
});

const mapMemberOrder = (order: any) => ({
  id: order.id,
  orderNumber: order.order_number,
  orderStatus: order.order_status,
  paymentStatus: order.payment_status,
  totalAmount: Number(order.total_amount),
  currency: order.currency,
  createdAt: order.created_at,
  trackingReference: order.tracking_reference,
  items: order.items.map((item: any) => ({
    id: item.id,
    productName: item.product_name_snapshot,
    quantity: Number(item.quantity) || 1,
    price: Number(item.price_snapshot) || 0,
  })),
});

router.get("/account/google/start", (req, res) => {
  if (!isGoogleOAuthConfigured()) {
    return redirectMemberAuthError(
      res,
      "Google sign-in is not configured yet. Add GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET in Vercel.",
    );
  }

  const state = jwt.sign(
    { provider: "google-member", createdAt: Date.now() },
    JWT_SECRET,
    { expiresIn: "10m" },
  );

  const params = new URLSearchParams({
    client_id: process.env.GOOGLE_CLIENT_ID || "",
    redirect_uri: getMemberGoogleRedirectUri(req),
    response_type: "code",
    scope: "openid email profile",
    prompt: "select_account",
    state,
  });

  return res.redirect(`https://accounts.google.com/o/oauth2/v2/auth?${params}`);
});

router.get("/account/google/callback", async (req, res) => {
  try {
    if (!isGoogleOAuthConfigured()) {
      return redirectMemberAuthError(res, "Google sign-in is not configured yet.");
    }

    if (req.query.error) {
      return redirectMemberAuthError(
        res,
        `Google sign-in was cancelled or failed: ${String(req.query.error)}`,
      );
    }

    const code = String(req.query.code || "");
    const state = String(req.query.state || "");

    if (!code || !state) {
      return redirectMemberAuthError(res, "Missing Google sign-in response.");
    }

    const decodedState = jwt.verify(state, JWT_SECRET) as { provider?: string };
    if (decodedState.provider !== "google-member") {
      return redirectMemberAuthError(res, "Invalid Google sign-in state.");
    }

    const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id: process.env.GOOGLE_CLIENT_ID || "",
        client_secret: process.env.GOOGLE_CLIENT_SECRET || "",
        redirect_uri: getMemberGoogleRedirectUri(req),
        grant_type: "authorization_code",
      }),
    });
    const tokenData = await tokenResponse.json();

    if (!tokenResponse.ok || !tokenData.id_token) {
      return redirectMemberAuthError(
        res,
        tokenData.error_description || tokenData.error || "Google token exchange failed.",
      );
    }

    const profileResponse = await fetch(
      `https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(tokenData.id_token)}`,
    );
    const profile = await profileResponse.json();

    if (!profileResponse.ok) {
      return redirectMemberAuthError(res, "Google profile verification failed.");
    }

    const email = String(profile.email || "").trim().toLowerCase();
    const emailVerified = profile.email_verified === true || profile.email_verified === "true";
    const name = String(profile.name || email.split("@")[0] || "Customer").trim();

    if (profile.aud !== process.env.GOOGLE_CLIENT_ID || !emailVerified || !email) {
      return redirectMemberAuthError(res, "Google account could not be verified.");
    }

    if (isAdminEmail(email)) {
      const token = createAdminToken(email);
      res.setHeader("Content-Type", "text/html; charset=utf-8");
      return res.status(200).send(createAuthSuccessHtml(token, "admin"));
    }

    const existingUser = await prisma.users.findUnique({ where: { email } });
    const user = existingUser
      ? await prisma.users.update({
          where: { email },
          data: {
            name: existingUser.name || name,
            role: existingUser.role || "customer",
          },
        })
      : await prisma.users.create({
          data: {
            name,
            email,
            password_hash: `google-oauth:${String(profile.sub || "member")}`,
            role: "customer",
          },
        });

    const token = createMemberToken({
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    });

    res.setHeader("Content-Type", "text/html; charset=utf-8");
    return res.status(200).send(createAuthSuccessHtml(token, "member"));
  } catch (error) {
    return redirectMemberAuthError(
      res,
      (error as Error).message || "Google member sign-in failed.",
    );
  }
});

router.get("/account/me", requireMember, async (req: MemberRequest, res) => {
  try {
    const user = await prisma.users.findUnique({ where: { id: req.member!.id } });

    if (!user) {
      return res.status(404).json({ error: "Member not found." });
    }

    return res.json({ member: mapMember(user) });
  } catch (error) {
    return res.status(500).json({
      error: "Member profile could not be loaded.",
      details: (error as Error).message,
    });
  }
});

router.get("/account/orders", requireMember, async (req: MemberRequest, res) => {
  try {
    const orders = await prisma.orders.findMany({
      where: { customer_email: { equals: req.member!.email, mode: "insensitive" } },
      include: { items: true },
      orderBy: { created_at: "desc" },
    });

    return res.json({ orders: orders.map(mapMemberOrder) });
  } catch (error) {
    return res.status(500).json({
      error: "Member orders could not be loaded.",
      details: (error as Error).message,
    });
  }
});

export default router;
