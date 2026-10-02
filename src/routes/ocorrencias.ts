import { Router } from "express";
import { db } from "../db.js";
import { authMiddleware } from "../auth.js";
import { Ocorrencia, RestricaoAcesso } from "../types.js";

export const ocorrenciasRouter = Router();

// ===================== OCORRÊNCIAS =====================

ocorrenciasRouter.get(["", "/"], authMiddleware, (req, res) => {
  const status = req.query.status as string | undefined;
  const categoria = req.query.categoria as string | undefined;
  const gravidade = req.query.gravidade as string | undefined;
  const busca = (req.query.busca as string | undefined)?.toLowerCase().trim();

  let resultado = db.ocorrencias.filter((o) => {
    if (status && o.status !== status) return false;
    if (categoria && o.categoria !== categoria) return false;
    if (gravidade && o.gravidade !== gravidade) return false;

    if (busca) {
      const matchTitulo = o.titulo.toLowerCase().includes(busca);
      const matchDesc = o.descricao.toLowerCase().includes(busca);
      const matchMorador = o.morador_envolvido?.toLowerCase().includes(busca);
      const matchBloco = o.bloco?.toLowerCase().includes(busca);
      const matchApto = o.apartamento?.toLowerCase().includes(busca);
      const matchAcao = o.acao_tomada?.toLowerCase().includes(busca);
      if (!matchTitulo && !matchDesc && !matchMorador && !matchBloco && !matchApto && !matchAcao) {
        return false;
      }
    }
    return true;
  });

  resultado.sort((a, b) => new Date(b.data_hora).getTime() - new Date(a.data_hora).getTime());
  return res.json(resultado);
});

ocorrenciasRouter.get("/:id", authMiddleware, (req, res) => {
  const id = parseInt(req.params.id, 10);
  const o = db.ocorrencias.find((item) => item.id === id);
  if (!o) {
    return res.status(404).json({ detail: "Ocorrência não encontrada" });
  }
  return res.json(o);
});

ocorrenciasRouter.post(["", "/"], authMiddleware, (req, res) => {
  const {
    titulo,
    categoria,
    gravidade,
    bloco,
    apartamento,
    morador_envolvido,
    descricao,
    acao_tomada,
    registrado_por,
  } = req.body;

  if (!titulo || !categoria || !gravidade || !descricao) {
    return res.status(422).json({ detail: "Título, categoria, gravidade e descrição são obrigatórios" });
  }

  const nova: Ocorrencia = {
    id: db.getNextOcorrenciaId(),
    titulo: String(titulo).trim(),
    categoria,
    gravidade,
    status: "aberta",
    bloco: bloco ? String(bloco).trim() : null,
    apartamento: apartamento ? String(apartamento).trim() : null,
    morador_envolvido: morador_envolvido ? String(morador_envolvido).trim() : null,
    descricao: String(descricao).trim(),
    acao_tomada: acao_tomada ? String(acao_tomada).trim() : null,
    registrado_por: registrado_por ? String(registrado_por).trim() : "Portaria",
    data_hora: new Date().toISOString(),
    resolvido_em: null,
  };

  db.ocorrencias.push(nova);
  db.save();
  return res.status(201).json(nova);
});

ocorrenciasRouter.put("/:id", authMiddleware, (req, res) => {
  const id = parseInt(req.params.id, 10);
  const o = db.ocorrencias.find((item) => item.id === id);
  if (!o) {
    return res.status(404).json({ detail: "Ocorrência não encontrada" });
  }

  const {
    titulo,
    categoria,
    gravidade,
    status,
    bloco,
    apartamento,
    morador_envolvido,
    descricao,
    acao_tomada,
  } = req.body;

  if (titulo !== undefined) o.titulo = String(titulo).trim();
  if (categoria !== undefined) o.categoria = categoria;
  if (gravidade !== undefined) o.gravidade = gravidade;
  if (bloco !== undefined) o.bloco = bloco ? String(bloco).trim() : null;
  if (apartamento !== undefined) o.apartamento = apartamento ? String(apartamento).trim() : null;
  if (morador_envolvido !== undefined) o.morador_envolvido = morador_envolvido ? String(morador_envolvido).trim() : null;
  if (descricao !== undefined) o.descricao = String(descricao).trim();
  if (acao_tomada !== undefined) o.acao_tomada = acao_tomada ? String(acao_tomada).trim() : null;

  if (status !== undefined) {
    o.status = status;
    if (status === "resolvida" && !o.resolvido_em) {
      o.resolvido_em = new Date().toISOString();
    } else if (status !== "resolvida") {
      o.resolvido_em = null;
    }
  }

  db.save();
  return res.json(o);
});

ocorrenciasRouter.delete("/:id", authMiddleware, (req, res) => {
  const id = parseInt(req.params.id, 10);
  const idx = db.ocorrencias.findIndex((item) => item.id === id);
  if (idx === -1) {
    return res.status(404).json({ detail: "Ocorrência não encontrada" });
  }

  db.ocorrencias.splice(idx, 1);
  db.save();
  return res.status(204).send();
});

// ===================== RESTRIÇÕES E ALERTAS DE PORTARIA =====================

export const restricoesRouter = Router();

restricoesRouter.get(["", "/"], authMiddleware, (_req, res) => {
  const ativas = db.restricoes.filter((r) => r.ativo);
  return res.json(ativas);
});

restricoesRouter.post(["", "/"], authMiddleware, (req, res) => {
  const { tipo_identificador, valor_identificador, nome_pessoa, motivo, instrucao_portaria, bloqueio_total } = req.body;

  if (!tipo_identificador || !valor_identificador || !motivo || !instrucao_portaria) {
    return res.status(422).json({
      detail: "Tipo de identificador, valor do identificador, motivo e instrução são obrigatórios",
    });
  }

  const nova: RestricaoAcesso = {
    id: db.getNextRestricaoId(),
    tipo_identificador,
    valor_identificador: String(valor_identificador).trim().toUpperCase(),
    nome_pessoa: nome_pessoa ? String(nome_pessoa).trim() : null,
    motivo: String(motivo).trim(),
    instrucao_portaria: String(instrucao_portaria).trim(),
    bloqueio_total: bloqueio_total !== false,
    ativo: true,
    criado_por: "Administração",
    criado_em: new Date().toISOString(),
  };

  db.restricoes.push(nova);
  db.save();
  return res.status(201).json(nova);
});

restricoesRouter.delete("/:id", authMiddleware, (req, res) => {
  const id = parseInt(req.params.id, 10);
  const r = db.restricoes.find((item) => item.id === id);
  if (!r) {
    return res.status(404).json({ detail: "Restrição não encontrada" });
  }

  r.ativo = false;
  db.save();
  return res.status(204).send();
});

// Endpoint rápido de checagem para a portaria
restricoesRouter.get("/verificar", authMiddleware, (req, res) => {
  const termo = ((req.query.termo || req.query.documento || req.query.placa) as string | undefined)?.toLowerCase().trim();

  if (!termo) {
    return res.json({ alerta: false, restricoes: [] });
  }

  // Limpar pontuação para comparação de CPF/Placa
  const termoLimpo = termo.replace(/[^a-zA-Z0-9]/g, "");

  const correspondencias = db.restricoes.filter((r) => {
    if (!r.ativo) return false;
    const valorLimpo = r.valor_identificador.toLowerCase().replace(/[^a-zA-Z0-9]/g, "");
    const nomeLimpo = r.nome_pessoa?.toLowerCase() || "";

    return (
      valorLimpo.includes(termoLimpo) ||
      termoLimpo.includes(valorLimpo) ||
      (nomeLimpo && nomeLimpo.includes(termo))
    );
  });

  return res.json({
    alerta: correspondencias.length > 0,
    bloqueio_total: correspondencias.some((c) => c.bloqueio_total),
    restricoes: correspondencias,
  });
});
