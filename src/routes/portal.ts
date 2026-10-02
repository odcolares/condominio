import { Router } from "express";
import { db } from "../db.js";
import { authMiddleware } from "../auth.js";
import { PreAutorizacaoVisitante, Comunicado, NotificacaoMorador, Visitante } from "../types.js";

export const portalRouter = Router();

// ===================== DADOS CONSOLIDADOS DO PORTAL DO MORADOR =====================

portalRouter.get("/morador", authMiddleware, (req, res) => {
  const moradorIdParam = req.query.morador_id ? Number(req.query.morador_id) : null;
  
  // Pega o morador selecionado ou o padrão (Carlos Lima, id 1)
  const morador = moradorIdParam
    ? db.moradores.find((m) => m.id === moradorIdParam)
    : db.moradores[0];

  if (!morador) {
    return res.status(404).json({ detail: "Morador não encontrado" });
  }

  // Veículos do morador
  const veiculos = db.veiculos.filter((v) => v.morador_id === morador.id);

  // Encomendas do morador
  const encomendas = db.encomendas.filter((e) => e.morador_id === morador.id);

  // Pré-autorizações ativas
  const preautorizacoes = db.preautorizacoes.filter((p) => p.morador_id === morador.id);

  // Reservas de áreas comuns feitas pelo morador
  const reservas = db.reservas.filter((r) => r.morador_id === morador.id);

  // Prestadores com obras na unidade do morador
  const prestadores = db.prestadores.filter((p) => p.morador_autorizador_id === morador.id);

  // Comunicados ativos do condomínio
  const comunicados = db.comunicados.filter((c) => c.ativo);

  // Notificações recebidas
  const notificacoes = db.notificacoes.filter((n) => n.morador_id === morador.id);

  // Lista de todos os moradores para permitir trocar de visão no portal
  const moradoresDisponiveis = db.moradores.map((m) => ({
    id: m.id,
    nome: m.nome_completo,
    unidade: `Bloco ${m.bloco || '—'} / Apto ${m.apartamento || '—'}`,
    foto_url: m.foto_url,
  }));

  return res.json({
    morador,
    veiculos,
    encomendas,
    preautorizacoes,
    reservas,
    prestadores,
    comunicados,
    notificacoes,
    moradoresDisponiveis,
  });
});

// ===================== PRÉ-AUTORIZAÇÃO DE VISITANTES / CONVIDADOS =====================

portalRouter.post("/preautorizacao", authMiddleware, (req, res) => {
  const { morador_id, nome_visitante, documento_visitante, placa_veiculo, data_prevista, observacao } = req.body;

  if (!morador_id || !nome_visitante || !data_prevista) {
    return res.status(422).json({ detail: "Morador, nome do visitante e data prevista são obrigatórios" });
  }

  const morador = db.moradores.find((m) => m.id === Number(morador_id));
  if (!morador) {
    return res.status(404).json({ detail: "Morador não encontrado" });
  }

  // Gera código único de acesso QR
  const randomPin = Math.floor(1000 + Math.random() * 9000);
  const codigoQr = `QR-${randomPin}`;

  const pre: PreAutorizacaoVisitante = {
    id: db.getNextPreAutorizacaoId(),
    morador_id: morador.id,
    morador_nome: morador.nome_completo,
    bloco: morador.bloco || "—",
    apartamento: morador.apartamento || "—",
    nome_visitante: String(nome_visitante).trim(),
    documento_visitante: documento_visitante ? String(documento_visitante).trim() : null,
    placa_veiculo: placa_veiculo ? String(placa_veiculo).trim().toUpperCase() : null,
    data_prevista: String(data_prevista).trim(),
    observacao: observacao ? String(observacao).trim() : "Pré-autorizado pelo Morador via App",
    codigo_acesso_qr: codigoQr,
    status: "aguardando",
    criado_em: new Date().toISOString(),
  };

  db.preautorizacoes.push(pre);

  // Também registra na lista geral de visitantes para aparecer na tela da portaria
  const novoVisitante: Visitante = {
    id: db.getNextVisitanteId(),
    nome: pre.nome_visitante,
    documento: pre.documento_visitante,
    tipo_documento: pre.documento_visitante ? "CPF" : null,
    telefone: null,
    foto_url: null,
    placa_veiculo: pre.placa_veiculo,
    vaga: null,
    bloco: morador.bloco,
    apartamento: morador.apartamento,
    morador_visitado_id: morador.id,
    agendado_para: `${pre.data_prevista}T12:00:00.000Z`,
    presente: false,
    criado_em: new Date().toISOString(),
  };
  db.visitantes.push(novoVisitante);

  // Notificação no app
  db.notificacoes.push({
    id: db.getNextNotificacaoId(),
    morador_id: morador.id,
    tipo: "visitante",
    titulo: `Pré-autorização Gerada: ${pre.nome_visitante}`,
    mensagem: `Passe digital ${codigoQr} gerado com sucesso para ${pre.nome_visitante} no dia ${pre.data_prevista}. A portaria já está ciente.`,
    canal: "app",
    enviado_em: new Date().toISOString(),
    lida: false,
    dados_adicionais: { pre_id: pre.id, codigo_qr: codigoQr },
  });

  db.save();
  return res.status(201).json(pre);
});

portalRouter.delete("/preautorizacao/:id", authMiddleware, (req, res) => {
  const id = parseInt(req.params.id, 10);
  const idx = db.preautorizacoes.findIndex((item) => item.id === id);
  if (idx === -1) {
    return res.status(404).json({ detail: "Pré-autorização não encontrada" });
  }

  db.preautorizacoes.splice(idx, 1);
  db.save();
  return res.status(204).send();
});

// ===================== COMUNICADOS DO MURAL =====================

portalRouter.get("/comunicados", authMiddleware, (_req, res) => {
  const comunicados = db.comunicados.filter((c) => c.ativo);
  comunicados.sort((a, b) => new Date(b.data_publicacao).getTime() - new Date(a.data_publicacao).getTime());
  return res.json(comunicados);
});

portalRouter.post("/comunicados", authMiddleware, (req, res) => {
  const { titulo, categoria, conteudo, importante, publicado_por } = req.body;

  if (!titulo || !categoria || !conteudo) {
    return res.status(422).json({ detail: "Título, categoria e conteúdo são obrigatórios" });
  }

  const novo: Comunicado = {
    id: db.getNextComunicadoId(),
    titulo: String(titulo).trim(),
    categoria,
    conteudo: String(conteudo).trim(),
    importante: Boolean(importante),
    publicado_por: publicado_por ? String(publicado_por).trim() : "Administração Condominial",
    data_publicacao: new Date().toISOString(),
    ativo: true,
  };

  db.comunicados.push(novo);

  // Dispara notificação para todos os moradores cadastrados no mural
  for (const m of db.moradores) {
    db.notificacoes.push({
      id: db.getNextNotificacaoId(),
      morador_id: m.id,
      tipo: "comunicado",
      titulo: `Novo Comunicado: ${novo.titulo}`,
      mensagem: novo.conteudo.slice(0, 120) + (novo.conteudo.length > 120 ? "..." : ""),
      canal: "app",
      enviado_em: new Date().toISOString(),
      lida: false,
      dados_adicionais: { comunicado_id: novo.id },
    });
  }

  db.save();
  return res.status(201).json(novo);
});

portalRouter.delete("/comunicados/:id", authMiddleware, (req, res) => {
  const id = parseInt(req.params.id, 10);
  const c = db.comunicados.find((item) => item.id === id);
  if (!c) {
    return res.status(404).json({ detail: "Comunicado não encontrado" });
  }

  c.ativo = false;
  db.save();
  return res.status(204).send();
});

// ===================== ENVIO / SIMULAÇÃO DE NOTIFICAÇÃO IMEDIATA =====================

portalRouter.post("/notificacoes/disparar", authMiddleware, (req, res) => {
  const { morador_id, canal, tipo, mensagem, titulo } = req.body;

  if (!morador_id || !mensagem) {
    return res.status(422).json({ detail: "Morador e mensagem são obrigatórios" });
  }

  const morador = db.moradores.find((m) => m.id === Number(morador_id));
  if (!morador) {
    return res.status(404).json({ detail: "Morador não encontrado" });
  }

  const notif: NotificacaoMorador = {
    id: db.getNextNotificacaoId(),
    morador_id: morador.id,
    tipo: tipo || "comunicado",
    titulo: titulo || "Notificação da Portaria",
    mensagem: String(mensagem).trim(),
    canal: canal || "whatsapp",
    enviado_em: new Date().toISOString(),
    lida: false,
    dados_adicionais: null,
  };

  db.notificacoes.push(notif);
  db.save();

  return res.json({
    sucesso: true,
    canal: notif.canal,
    destinatario: morador.whatsapp || morador.telefone || morador.nome_completo,
    notificacao: notif,
  });
});
