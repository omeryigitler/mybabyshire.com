import dotenv from "dotenv";
import express from "express";
import path from "path";

dotenv.config({ path: ".env.local" });
dotenv.config();

async function startServer() {
  const { default: apiRoutes } = await import("./server/api.js");
  const { default: accountRoutes } = await import("./server/accountApi.js");
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Mount API paths
  app.use("/api", apiRoutes);
  app.use("/api", accountRoutes);

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on port ${PORT}`);
  });
}

startServer();