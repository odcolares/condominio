import express from "express";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import { authRouter } from "./src/routes/auth.js";
import { dashboardRouter } from "./src/routes/dashboard.js";
import { moradoresRouter } from "./src/routes/moradores.js";
import { veiculosRouter } from "./src/routes/veiculos.js";
import { visitantesRouter } from "./src/routes/visitantes.js";
import { acessosRouter } from "./src/routes/acessos.js";
import { encomendasRouter } from "./src/routes/encomendas.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;
const HOST = "0.0.0.0";

app.use(cors());
app.use(express.json());

// Serve static frontend files
const publicDir = path.join(__dirname, "public");
app.use(express.static(publicDir));

// Health check endpoint (matching original Python API)
app.get("/api/health", (_req, res) => {
  res.json({ app: "AMBROS", status: "ok", docs: "/docs" });
});

// Mount routers under both root (matching original FastAPI) and /api
const routers = [
  { path: "/auth", router: authRouter },
  { path: "/dashboard", router: dashboardRouter },
  { path: "/moradores", router: moradoresRouter },
  { path: "/veiculos", router: veiculosRouter },
  { path: "/visitantes", router: visitantesRouter },
  { path: "/acessos", router: acessosRouter },
  { path: "/encomendas", router: encomendasRouter },
];

for (const { path: routePath, router } of routers) {
  app.use(routePath, router);
  app.use(`/api${routePath}`, router);
}

// Redirect root to login.html or dashboard
app.get("/", (_req, res) => {
  res.sendFile(path.join(publicDir, "index.html"));
});

// Fallback for SPA/HTML navigation
app.get("*", (req, res, next) => {
  if (req.path.startsWith("/api") || req.path.startsWith("/auth")) {
    return next();
  }
  const filePath = path.join(publicDir, req.path.endsWith(".html") ? req.path : `${req.path}.html`);
  res.sendFile(filePath, (err) => {
    if (err) {
      res.sendFile(path.join(publicDir, "index.html"));
    }
  });
});

app.listen(PORT, HOST, () => {
  console.log(`[AMBROS] Servidor rodando em http://${HOST}:${PORT}`);
});
