import dotenv from "dotenv";
import express from "express";
import path from "path";

dotenv.config({ path: ".env.local" });
dotenv.config();

async function startServer() {
  const { default: apiRoutes } = await import("./server/api.js");
  const { default: accountRoutes } = await import("./server/accountApi.js");
  const app = express();
  const PORT = Number(process.env.PORT || 3000);

  app.use((req, res, next) => {
    res.setHeader(
      "Content-Security-Policy",
      "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; img-src 'self' data: https://res.cloudinary.com https://*.cloudinary.com https://flagcdn.com; media-src 'self' blob:; font-src 'self' data: https://fonts.gstatic.com; connect-src 'self' https://api.stripe.com https://api-m.paypal.com https://api-m.sandbox.paypal.com https://api.cloudinary.com https://api.resend.com; object-src 'none'; base-uri 'self'; frame-ancestors 'none'; upgrade-insecure-requests",
    );
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
    res.setHeader("Permissions-Policy", "camera=(), microphone=(), geolocation=(), payment=(self)");
    next();
  });

  app.use(express.json());

  // Legacy alternate upload path is intentionally disabled. Product images use
  // /api/admin/upload-image -> Cloudinary -> database -> storefront API.
  app.all("/api/admin/remove-bg-upload", (_req, res) =>
    res.status(404).json({ error: "Not found" }),
  );

  app.use("/api", apiRoutes);
  app.use("/api", accountRoutes);

  if (process.env.NODE_ENV !== "production") {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on port ${PORT}`);
  });
}

startServer();
