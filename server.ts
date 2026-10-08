import express from "express";
import cors from "cors";
import path from "path";
import { fileURLToPath, pathToFileURL } from "url";
import { authRouter } from "./src/routes/auth.js";
import { dashboardRouter } from "./src/routes/dashboard.js";
import { moradoresRouter } from "./src/routes/moradores.js";
import { veiculosRouter } from "./src/routes/veiculos.js";
import { visitantesRouter } from "./src/routes/visitantes.js";
import { acessosRouter } from "./src/routes/acessos.js";
import { encomendasRouter } from "./src/routes/encomendas.js";
import { prestadoresRouter } from "./src/routes/prestadores.js";
import { ocorrenciasRouter, restricoesRouter } from "./src/routes/ocorrencias.js";
import { reservasRouter } from "./src/routes/reservas.js";
import { portalRouter } from "./src/routes/portal.js";
import { leadsRouter } from "./src/routes/leads.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const app = express();
const PORT = parseInt(process.env.PORT || "3000", 10);
const HOST = "0.0.0.0";

app.use(cors());
app.use(express.json());

// Serve static frontend files
const publicDir = path.join(__dirname, "public");
app.use(express.static(publicDir));

// Health check endpoint
app.get("/api/health", (_req, res) => {
  res.json({ app: "AMBROS", status: "ok", docs: "/docs" });
});

// Mount routers under both root and /api
const routers = [
  { path: "/auth", router: authRouter },
  { path: "/dashboard", router: dashboardRouter },
  { path: "/moradores", router: moradoresRouter },
  { path: "/veiculos", router: veiculosRouter },
  { path: "/visitantes", router: visitantesRouter },
  { path: "/acessos", router: acessosRouter },
  { path: "/encomendas", router: encomendasRouter },
  { path: "/prestadores", router: prestadoresRouter },
  { path: "/ocorrencias", router: ocorrenciasRouter },
  { path: "/restricoes", router: restricoesRouter },
  { path: "/reservas", router: reservasRouter },
  { path: "/portal", router: portalRouter },
  { path: "/leads", router: leadsRouter },
];

for (const { path: routePath, router } of routers) {
  app.use(routePath, router);
  app.use(`/api${routePath}`, router);
}

// Serve landing page at root for unauthenticated visitors
app.get("/", (_req, res) => {
  res.sendFile(path.join(publicDir, "landing.html"));
});

// Explicit API 404 handler: guarantees API endpoints NEVER return HTML
const apiPrefixes = [
  "/api",
  "/auth",
  "/dashboard",
  "/moradores",
  "/veiculos",
  "/visitantes",
  "/acessos",
  "/encomendas",
  "/prestadores",
  "/ocorrencias",
  "/restricoes",
  "/reservas",
  "/portal",
  "/leads",
];

app.use((req, res, next) => {
  const isApi = apiPrefixes.some((p) => req.path === p || req.path.startsWith(`${p}/`));
  if (isApi) {
    return res.status(404).json({ detail: "Endpoint da API não encontrado" });
  }
  next();
});

// Fallback for HTML pages navigation
app.get("*", (req, res) => {
  const filePath = path.join(publicDir, req.path.endsWith(".html") ? req.path : `${req.path}.html`);
  res.sendFile(filePath, (err) => {
    if (err) {
      res.sendFile(path.join(publicDir, "index.html"));
    }
  });
});

// Global Express error handler: ensures unhandled server errors return JSON, not HTML
app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.warn("Erro no servidor capturado:", err);
  res.status(err.status || 500).json({ detail: err.message || "Erro interno do servidor" });
});

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  app.listen(PORT, HOST, () => {
    console.log(`[AMBROS] Servidor rodando em http://${HOST}:${PORT}`);
  });
}
