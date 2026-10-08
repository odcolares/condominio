import { Router } from "express";
import { db } from "../db.js";
import { authMiddleware, requirePerfil } from "../auth.js";
import { Visitante, Acesso, Morador, PreAutorizacaoVisitante } from "../types.js";
import { gerarLinksNotificacao, tmplVisita, tmplVisitaSaida, tmplVisitaConfirmada, DestinoNotificacao } from "../lib/notificacoes.js";

export const visitantesRouter = Router();
visitantesRouter.use(authMiddleware, requirePerfil("administrador", "portaria"));

function moradorDestino(morador: Morador | null | undefined): DestinoNotificacao | null {
  if (!morador) return null;
  return { whatsapp: morador.whatsapp, telefone: morador.telefone, telegram: morador.telegram };
}

function isVisitanteExpirado(v: Visitante): boolean {
  const entradas = db.acessos
    .filter(a => a.tipo_pessoa === "visitante" && a.pessoa_id === v.id && a.sentido === "entrada")
    .sort((a, b) => new Date(b.registrado_em).getTime() - new Date(a.registrado_em).getTime());
  
  if (entradas.length > 0) {
    const ultimaEntrada = new Date(entradas[0].registrado_em).getTime();
    const now = Date.now();
    return now > ultimaEntrada + 24 * 3600 * 1000;
  }
  if (v.agendado_para && !v.presente) {
    const agendadoTime = new Date(v.agendado_para).getTime();
    const now = Date.now();
    if (!isNaN(agendadoTime) && now > agendadoTime + 24 * 3600 * 1000) {
      return true;
    }
  }
  return false;
}

// GET /visitantes/stats
visitantesRouter.get("/stats", (_req, res) => {
  const now = new Date();
  const hojeStr = now.toISOString().slice(0, 10);

  const total = db.visitantes.length;
  const presentes = db.visitantes.filter((v) => v.presente).length;
  const agendados_hoje = db.visitantes.filter(
    (v) => v.agendado_para && v.agendado_para.startsWith(hojeStr)
  ).length;

  return res.json({
    total,
    presentes,
    agendados_hoje,
  });
});

// GET /visitantes
visitantesRouter.get("", (req, res) => {
  const busca = typeof req.query.busca === "string" ? req.query.busca.toLowerCase().trim() : null;
  const presentes =
    req.query.presentes !== undefined
      ? req.query.presentes === "true" || req.query.presentes === "1"
      : null;
  const skip = parseInt(req.query.skip as string, 10) || 0;
  const limit = parseInt(req.query.limit as string, 10) || 100;

  let resultado = db.visitantes.map((v) => {
    const morador = v.morador_visitado_id
      ? db.moradores.find((m) => m.id === v.morador_visitado_id)
      : null;
    return {
      ...v,
      morador_nome: morador ? morador.nome_completo : null,
      morador_unidade: morador
        ? `Bloco ${morador.bloco || "0"} - Apto ${morador.apartamento || "0"}`
        : v.bloco || v.apartamento
        ? `Bloco ${v.bloco || "0"} - Apto ${v.apartamento || "0"}`
        : null,
      expirado: isVisitanteExpirado(v),
    };
  });

  if (busca) {
    resultado = resultado.filter((v) => {
      const matchNome = v.nome.toLowerCase().includes(busca);
      const matchDoc = v.documento ? v.documento.toLowerCase().includes(busca) : false;
      const matchPlaca = v.placa_veiculo ? v.placa_veiculo.toLowerCase().includes(busca) : false;
      const matchTel = v.telefone ? v.telefone.toLowerCase().includes(busca) : false;
      const matchMorador = v.morador_nome ? v.morador_nome.toLowerCase().includes(busca) : false;
      const matchUnidade = v.morador_unidade ? v.morador_unidade.toLowerCase().includes(busca) : false;
      return matchNome || matchDoc || matchPlaca || matchTel || matchMorador || matchUnidade;
    });
  }

  if (presentes !== null) {
    resultado = resultado.filter((v) => v.presente === presentes);
  }

  resultado.sort((a, b) => {
    // Presentes primeiro, depois por data de cadastro desc
    if (a.presente && !b.presente) return -1;
    if (!a.presente && b.presente) return 1;
    return new Date(b.criado_em).getTime() - new Date(a.criado_em).getTime();
  });

  resultado = resultado.slice(skip, skip + limit);

  return res.json(resultado);
});

// GET /visitantes/:id
visitantesRouter.get("/:id", (req, res) => {
  const id = parseInt(req.params.id, 10);
  const visitante = db.visitantes.find((v) => v.id === id);
  if (!visitante) {
    return res.status(404).json({ detail: "Visitante não encontrado" });
  }

  const morador = visitante.morador_visitado_id
    ? db.moradores.find((m) => m.id === visitante.morador_visitado_id)
    : null;

  const destino = moradorDestino(morador);
  const links = destino ? gerarLinksNotificacao(destino, tmplVisita(morador!, visitante)) : { whatsappUrl: null, telegramUrl: null };

  return res.json({
    ...visitante,
    morador_nome: morador ? morador.nome_completo : null,
    morador_unidade: morador
      ? `Bloco ${morador.bloco || "0"} - Apto ${morador.apartamento || "0"}`
      : null,
    expirado: isVisitanteExpirado(visitante),
    ...links,
  });
});

// POST /visitantes
visitantesRouter.post("", (req, res) => {
  const {
    nome,
    documento,
    tipo_documento,
    telefone,
    foto_url,
    placa_veiculo,
    vaga,
    bloco,
    apartamento,
    morador_visitado_id,
    agendado_para,
    entrada_imediata,
  } = req.body;

  if (!nome || !nome.trim()) {
    return res.status(422).json({ detail: "Nome do visitante é obrigatório" });
  }

  const mId = morador_visitado_id ? parseInt(morador_visitado_id, 10) : null;
  let morador = null;
  if (mId) {
    morador = db.moradores.find((m) => m.id === mId);
    if (!morador) {
      return res.status(400).json({ detail: "Morador visitado não encontrado" });
    }
  }

  const agora = new Date().toISOString();
  const visitante: Visitante = {
    id: db.getNextVisitanteId(),
    nome: nome.trim(),
    documento: documento ? documento.trim() : null,
    tipo_documento: tipo_documento ? tipo_documento.trim() : "RG",
    telefone: telefone ? telefone.trim() : null,
    foto_url: foto_url || null,
    placa_veiculo: placa_veiculo ? placa_veiculo.trim().toUpperCase() : null,
    vaga: vaga ? vaga.trim().toUpperCase() : null,
    bloco: morador ? morador.bloco : bloco ? bloco.trim() : null,
    apartamento: morador ? morador.apartamento : apartamento ? apartamento.trim() : null,
    morador_visitado_id: mId,
    agendado_para: agendado_para || null,
    presente: Boolean(entrada_imediata),
    criado_em: agora,
  };

  db.visitantes.unshift(visitante);
  
  // Se entrada imediata selecionada, cria registro de acesso de entrada
  if (entrada_imediata) {
    const acesso: Acesso = {
      id: db.getNextAcessoId(),
      tipo_pessoa: "visitante",
      pessoa_id: visitante.id,
      nome: visitante.nome,
      sentido: "entrada",
      placa_veiculo: visitante.placa_veiculo,
      vaga: visitante.vaga,
      observacao: morador
        ? `Visita a ${morador.nome_completo} (Bl ${morador.bloco} Apto ${morador.apartamento})`
        : null,
      registrado_em: agora,
    };
    db.acessos.unshift(acesso);
  }

  db.save();

  const destino = moradorDestino(morador);
  const links = destino ? gerarLinksNotificacao(destino, tmplVisita(morador!, visitante)) : { whatsappUrl: null, telegramUrl: null };

  return res.status(201).json({
    ...visitante,
    morador_nome: morador ? morador.nome_completo : null,
    morador_unidade: morador
      ? `Bloco ${morador.bloco || "0"} - Apto ${morador.apartamento || "0"}`
      : null,
    ...links,
  });
});

// PUT /visitantes/:id
visitantesRouter.put("/:id", (req, res) => {
  const id = parseInt(req.params.id, 10);
  const visitante = db.visitantes.find((v) => v.id === id);
  if (!visitante) {
    return res.status(404).json({ detail: "Visitante não encontrado" });
  }

  const {
    nome,
    documento,
    tipo_documento,
    telefone,
    foto_url,
    placa_veiculo,
    vaga,
    bloco,
    apartamento,
    morador_visitado_id,
    agendado_para,
    presente,
  } = req.body;

  if (nome) visitante.nome = nome.trim();
  if (documento !== undefined) visitante.documento = documento ? documento.trim() : null;
  if (tipo_documento !== undefined) visitante.tipo_documento = tipo_documento;
  if (telefone !== undefined) visitante.telefone = telefone ? telefone.trim() : null;
  if (foto_url !== undefined) visitante.foto_url = foto_url;
  if (placa_veiculo !== undefined) visitante.placa_veiculo = placa_veiculo ? placa_veiculo.trim().toUpperCase() : null;
  if (vaga !== undefined) visitante.vaga = vaga ? vaga.trim().toUpperCase() : null;
  if (bloco !== undefined) visitante.bloco = bloco ? bloco.trim() : null;
  if (apartamento !== undefined) visitante.apartamento = apartamento ? apartamento.trim() : null;
  if (morador_visitado_id !== undefined) {
    visitante.morador_visitado_id = morador_visitado_id ? parseInt(morador_visitado_id, 10) : null;
  }
  if (agendado_para !== undefined) visitante.agendado_para = agendado_para;
  if (presente !== undefined) visitante.presente = Boolean(presente);

  db.save();

  const morador = visitante.morador_visitado_id
    ? db.moradores.find((m) => m.id === visitante.morador_visitado_id)
    : null;

  return res.json({
    ...visitante,
    morador_nome: morador ? morador.nome_completo : null,
    morador_unidade: morador
      ? `Bloco ${morador.bloco || "0"} - Apto ${morador.apartamento || "0"}`
      : null,
  });
});

// POST /visitantes/:id/entrada (Registra entrada do visitante)
visitantesRouter.post("/:id/entrada", (req, res) => {
  const id = parseInt(req.params.id, 10);
  const visitante = db.visitantes.find((v) => v.id === id);
  if (!visitante) {
    return res.status(404).json({ detail: "Visitante não encontrado" });
  }

  const { placa_veiculo, vaga, observacao } = req.body;
  const agora = new Date().toISOString();

  visitante.presente = true;
  if (placa_veiculo) visitante.placa_veiculo = placa_veiculo.trim().toUpperCase();
  if (vaga) visitante.vaga = vaga.trim().toUpperCase();

  const morador = visitante.morador_visitado_id
    ? db.moradores.find((m) => m.id === visitante.morador_visitado_id)
    : null;

  const novoAcesso: Acesso = {
    id: db.getNextAcessoId(),
    tipo_pessoa: "visitante",
    pessoa_id: visitante.id,
    nome: visitante.nome,
    sentido: "entrada",
    placa_veiculo: visitante.placa_veiculo,
    vaga: visitante.vaga,
    observacao: observacao || (morador ? `Visita a ${morador.nome_completo} (${morador.apartamento})` : null),
    registrado_em: agora,
  };

  // Atualiza pré-autorização associada (se existir) para status "acessou"
  const preAuth = db.preautorizacoes.find(
    (p) =>
      p.morador_id === visitante.morador_visitado_id &&
      p.nome_visitante === visitante.nome &&
      p.status === "aguardando"
  );
  if (preAuth) {
    preAuth.status = "acessou";
  }

  db.acessos.unshift(novoAcesso);
  db.save();

  const destino = moradorDestino(morador);
  const links = destino ? gerarLinksNotificacao(destino, tmplVisitaConfirmada(morador!, visitante)) : { whatsappUrl: null, telegramUrl: null };

  return res.json({
    sucesso: true,
    visitante,
    acesso: novoAcesso,
    ...links,
    mensagem: `Entrada de ${visitante.nome} registrada com sucesso!`,
  });
});

// POST /visitantes/:id/saida (Registra saída do visitante)
visitantesRouter.post("/:id/saida", (req, res) => {
  const id = parseInt(req.params.id, 10);
  const visitante = db.visitantes.find((v) => v.id === id);
  if (!visitante) {
    return res.status(404).json({ detail: "Visitante não encontrado" });
  }

  const { observacao } = req.body;
  const agora = new Date().toISOString();

  visitante.presente = false;

  const novoAcesso: Acesso = {
    id: db.getNextAcessoId(),
    tipo_pessoa: "visitante",
    pessoa_id: visitante.id,
    nome: visitante.nome,
    sentido: "saida",
    placa_veiculo: visitante.placa_veiculo,
    vaga: visitante.vaga,
    observacao: observacao || "Saída registrada pela portaria",
    registrado_em: agora,
  };

  db.acessos.unshift(novoAcesso);
  db.save();

  const morador = visitante.morador_visitado_id
    ? db.moradores.find((m) => m.id === visitante.morador_visitado_id)
    : null;

  const destino = moradorDestino(morador);
  const links = destino ? gerarLinksNotificacao(destino, tmplVisitaSaida(morador!, visitante)) : { whatsappUrl: null, telegramUrl: null };

  return res.json({
    sucesso: true,
    visitante,
    acesso: novoAcesso,
    ...links,
    mensagem: `Saída de ${visitante.nome} registrada com sucesso!`,
  });
});

// DELETE /visitantes/:id
visitantesRouter.delete("/:id", (req, res) => {
  const id = parseInt(req.params.id, 10);
  const idx = db.visitantes.findIndex((v) => v.id === id);
  if (idx === -1) {
    return res.status(404).json({ detail: "Visitante não encontrado" });
  }

  db.visitantes.splice(idx, 1);
  db.save();
  return res.status(204).send();
});
