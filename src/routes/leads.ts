import { Router } from "express";
import { db } from "../db.js";
import { authMiddleware, AuthenticatedRequest } from "../auth.js";
import { Lead } from "../types.js";

export const leadsRouter = Router();

leadsRouter.get("", authMiddleware, (req: AuthenticatedRequest, res) => {
  const busca = typeof req.query.busca === "string" ? req.query.busca.toLowerCase() : null;
  const status = typeof req.query.status === "string" ? req.query.status : null;
  const skip = parseInt(req.query.skip as string, 10) || 0;
  const limit = parseInt(req.query.limit as string, 10) || 50;

  let resultado = db.leads;

  if (busca) {
    resultado = resultado.filter((l) => {
      const matchNome = l.nome.toLowerCase().includes(busca);
      const matchEmail = l.email.toLowerCase().includes(busca);
      const matchCondominio = l.condominio_nome ? l.condominio_nome.toLowerCase().includes(busca) : false;
      return matchNome || matchEmail || matchCondominio;
    });
  }

  if (status) {
    resultado = resultado.filter((l) => l.status === status);
  }

  resultado.sort((a, b) => b.criado_em.localeCompare(a.criado_em));
  resultado = resultado.slice(skip, skip + limit);

  return res.json(resultado);
});

leadsRouter.get("/:id", authMiddleware, (req: AuthenticatedRequest, res) => {
  const id = parseInt(req.params.id, 10);
  const lead = db.leads.find((l) => l.id === id);
  if (!lead) {
    return res.status(404).json({ detail: "Lead não encontrado" });
  }
  return res.json(lead);
});

leadsRouter.post("", (req, res) => {
  const {
    nome,
    email,
    telefone,
    condominio_nome,
    numero_unidades,
    sistema_atual,
    origem,
    observacao,
  } = req.body;

  if (!nome || !String(nome).trim()) {
    return res.status(422).json({ detail: "Nome é obrigatório" });
  }

  if (!email || !String(email).trim()) {
    return res.status(422).json({ detail: "E-mail é obrigatório" });
  }

  const emailTrim = String(email).trim().toLowerCase();
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(emailTrim)) {
    return res.status(422).json({ detail: "E-mail inválido" });
  }

  const now = new Date().toISOString();
  const novoLead: Lead = {
    id: db.getNextLeadId(),
    nome: String(nome).trim(),
    email: emailTrim,
    telefone: telefone ? String(telefone).trim() : null,
    condominio_nome: condominio_nome ? String(condominio_nome).trim() : null,
    numero_unidades: numero_unidades ? parseInt(String(numero_unidades), 10) : null,
    sistema_atual: sistema_atual ? String(sistema_atual).trim() : null,
    status: "novo",
    origem: origem ? String(origem).trim() : null,
    observacao: observacao ? String(observacao).trim() : null,
    criado_em: now,
    atualizado_em: now,
  };

  db.leads.push(novoLead);
  db.save();

  return res.status(201).json({
    ...novoLead,
    mensagem: "Lead capturado com sucesso! Nossa equipe entrará em contato em breve.",
  });
});

leadsRouter.put("/:id", authMiddleware, (req: AuthenticatedRequest, res) => {
  const id = parseInt(req.params.id, 10);
  const lead = db.leads.find((l) => l.id === id);
  if (!lead) {
    return res.status(404).json({ detail: "Lead não encontrado" });
  }

  const { status, observacao, telefone, condominio_nome, numero_unidades, sistema_atual, origem } = req.body;

  if (status !== undefined) {
    lead.status = status;
  }
  if (observacao !== undefined) {
    lead.observacao = observacao;
  }
  if (telefone !== undefined) {
    lead.telefone = telefone ? String(telefone).trim() : null;
  }
  if (condominio_nome !== undefined) {
    lead.condominio_nome = condominio_nome ? String(condominio_nome).trim() : null;
  }
  if (numero_unidades !== undefined) {
    lead.numero_unidades = numero_unidades ? parseInt(String(numero_unidades), 10) : null;
  }
  if (sistema_atual !== undefined) {
    lead.sistema_atual = sistema_atual ? String(sistema_atual).trim() : null;
  }
  if (origem !== undefined) {
    lead.origem = origem ? String(origem).trim() : null;
  }

  lead.atualizado_em = new Date().toISOString();
  db.save();

  return res.json(lead);
});

leadsRouter.delete("/:id", authMiddleware, (req: AuthenticatedRequest, res) => {
  const id = parseInt(req.params.id, 10);
  const idx = db.leads.findIndex((l) => l.id === id);
  if (idx === -1) {
    return res.status(404).json({ detail: "Lead não encontrado" });
  }

  db.leads.splice(idx, 1);
  db.save();
  return res.status(204).send();
});
