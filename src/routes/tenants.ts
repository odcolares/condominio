import { Router } from "express";
import { db } from "../db.js";
import { authMiddleware } from "../auth.js";

export const tenantsRouter = Router();
tenantsRouter.use(authMiddleware);

// GET /tenants — lista tenants disponíveis para seleção no frontend
tenantsRouter.get("", (_req, res) => {
  const tenants = db.tenantConfigs.map((t) => ({
    slug: t.slug,
    name: t.name,
    unidades: t.unidades,
    blocos: t.blocos,
    vagas: t.vagas,
  }));
  res.json(tenants);
});

// GET /tenants/current — tenant atualmente selecionado (header ou default)
tenantsRouter.get("/current", (_req, res) => {
  // Por enquanto retorna o primeiro tenant como default
  // No futuro, pode ler de um header X-Tenant-Id ou localStorage
  const current = db.tenantConfigs[0];
  res.json({ slug: current.slug, name: current.name });
});