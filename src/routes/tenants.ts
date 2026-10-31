import { Router } from "express";
import { db } from "../db.js";
import { authMiddleware, tenantMiddleware, AuthenticatedRequest } from "../auth.js";
import { generate } from "../../seeds/generate.ts";

export const tenantsRouter = Router();
tenantsRouter.use(authMiddleware, tenantMiddleware);

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

// GET /tenants/current — tenant atualmente selecionado (header X-Tenant-Id ou default)
tenantsRouter.get("/current", (req: AuthenticatedRequest, res) => {
  const slug = req.tenantSlug || db.tenantConfigs[0]?.slug;
  const current = db.tenantConfigs.find((t) => t.slug === slug) || db.tenantConfigs[0];
  res.json({ slug: current.slug, name: current.name });
});

// POST /tenants/reset — recarrega dados de seed para um tenant específico
tenantsRouter.post("/reset", (req: AuthenticatedRequest, res) => {
  const tenantSlug = typeof req.query.tenant === "string" ? req.query.tenant : req.tenantSlug;

  if (!tenantSlug) {
    return res.status(400).json({ detail: "Informe o parâmetro ?tenant=<slug>" });
  }

  const tenant = db.tenantConfigs.find((t) => t.slug === tenantSlug);
  if (!tenant) {
    return res.status(400).json({ detail: `Tenant '${tenantSlug}' não encontrado` });
  }

  // Regenerar dados para esse tenant usando o gerador de seeds
  const allTenantData = db.tenantConfigs.map((t) => ({ [t.slug]: db.tenantData.get(t.slug) }))
    .reduce((acc, curr) => ({ ...acc, ...curr }), {} as Record<string, any>);

  // Forçar regeneração apenas para o tenant solicitado
  const freshData = generate([tenant]);
  db.tenantData.set(tenantSlug, freshData[tenantSlug]);

  // Se for o tenant ativo, atualizar arrays flat
  if (db.tenantConfigs[0].slug === tenantSlug) {
    const primeiro = freshData[tenantSlug];
    db.moradores = primeiro.moradores;
    db.veiculos = primeiro.veiculos;
    db.visitantes = primeiro.visitantes;
    db.acessos = primeiro.acessos;
    db.encomendas = primeiro.encomendas;
    db.prestadores = primeiro.prestadores;
    db.ocorrencias = primeiro.ocorrencias;
    db.restricoes = primeiro.restricoes;
    db.reservas = primeiro.reservas;
    db.comunicados = primeiro.comunicados;
    db.notificacoes = primeiro.notificacoes;
    db.preautorizacoes = primeiro.preautorizacoes;
  }

  res.json({
    detail: `Dados do tenant '${tenantSlug}' resetados com sucesso`,
    contagens: {
      moradores: freshData[tenantSlug].moradores.length,
      veiculos: freshData[tenantSlug].veiculos.length,
      visitantes: freshData[tenantSlug].visitantes.length,
      acessos: freshData[tenantSlug].acessos.length,
      encomendas: freshData[tenantSlug].encomendas.length,
      prestadores: freshData[tenantSlug].prestadores.length,
    },
  });
});