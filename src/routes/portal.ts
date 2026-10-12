import { Router } from "express";
import { db } from "../db.js";
import { authMiddleware, requirePerfil, AuthenticatedRequest } from "../auth.js";
import { PreAutorizacaoVisitante, Comunicado, NotificacaoMorador, Visitante, Prestador } from "../types.js";
import { gerarLinksNotificacao, DestinoNotificacao, tmplVisita, tmplPrestador } from "../lib/notificacoes.js";

export const portalRouter = Router();

// ===================== DADOS CONSOLIDADOS DO PORTAL DO MORADOR =====================

portalRouter.get("/morador", authMiddleware, (req: AuthenticatedRequest, res) => {
  const moradorIdParam = req.query.morador_id ? Number(req.query.morador_id) : null;
  const usuario = req.user;

  let morador;
  if (moradorIdParam) {
    morador = db.moradores.find((m) => m.id === moradorIdParam);
  } else if (usuario) {
    // Resolve morador automatically from JWT user when no morador_id is passed
    morador = db.moradores.find((m) => m.nome_completo === usuario.nome);
    if (!morador) {
      morador = db.moradores[0];
    }
  } else {
    morador = db.moradores[0];
  }

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
    mensagem: `Passe digital ${pre.codigo_acesso_qr} gerado com sucesso para ${pre.nome_visitante} no dia ${pre.data_prevista}. A portaria já está ciente.`,
    canal: "app",
    enviado_em: new Date().toISOString(),
    lida: false,
    dados_adicionais: { pre_id: pre.id, codigo_qr: pre.codigo_acesso_qr },
  });

  db.save();

  const links = gerarLinksNotificacao(
    { whatsapp: morador.whatsapp, telefone: morador.telefone, telegram: morador.telegram },
    tmplVisita(morador, { ...novoVisitante, criado_em: novoVisitante.criado_em } as Visitante)
  );

  return res.status(201).json({ ...pre, ...links });
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

portalRouter.post("/comunicados", authMiddleware, requirePerfil("administrador", "portaria"), (req, res) => {
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

portalRouter.delete("/comunicados/:id", authMiddleware, requirePerfil("administrador", "portaria"), (req, res) => {
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

  const links = gerarLinksNotificacao(
    { whatsapp: morador.whatsapp, telefone: morador.telefone, telegram: morador.telegram },
    String(mensagem).trim()
  );

  return res.json({
    sucesso: true,
    canal: notif.canal,
    destinatario: morador.whatsapp || morador.telefone || morador.nome_completo,
    notificacao: notif,
    ...links,
  });
});

portalRouter.get("/notificacoes-sistema", authMiddleware, (_req, res) => {
  const todas = [...db.notificacoes].reverse().slice(0, 15);
  const pendentes = db.notificacoes.filter((n) => !n.lida).length;
  return res.json({
    total_pendentes: pendentes,
    notificacoes: todas,
  });
});

portalRouter.post("/notificacoes-sistema/marcar-lidas", authMiddleware, (_req, res) => {
  db.notificacoes.forEach((n) => {
    n.lida = true;
  });
  db.save();
  return res.json({ sucesso: true, total_pendentes: 0 });
});

// ===================== PRÉ-REGISTRO DE PRESTADORES (SERVIÇO) PELO MORADOR =====================

portalRouter.get("/prestadores", authMiddleware, (req: AuthenticatedRequest, res) => {
  const moradorIdParam = req.query.morador_id ? Number(req.query.morador_id) : null;
  const usuario = req.user;

  let morador;
  if (moradorIdParam) {
    morador = db.moradores.find((m) => m.id === moradorIdParam);
  } else if (usuario) {
    morador = db.moradores.find((m) => m.nome_completo === usuario.nome) || db.moradores[0];
  } else {
    morador = db.moradores[0];
  }

  if (!morador) {
    return res.status(404).json({ detail: "Morador não encontrado" });
  }

  const prestadores = db.prestadores.filter((p) => p.morador_autorizador_id === morador.id);

  return res.json(prestadores);
});

portalRouter.post("/prestador", authMiddleware, (req: AuthenticatedRequest, res) => {
  const {
    nome,
    documento,
    tipo_documento,
    empresa,
    funcao,
    telefone,
    placa_veiculo,
    data_inicio,
    data_fim,
    prazo_dias,
    horario_permitido,
    observacao,
  } = req.body;

  if (!nome || !documento || !funcao || !data_inicio || (!data_fim && prazo_dias === undefined)) {
    return res.status(422).json({
      detail: "Nome, documento, função, data de início e data final (ou prazo_dias) são obrigatórios",
    });
  }

  // morador_autorizador_id vem do JWT (quem está logado)
  const usuario = req.user;
  const morador = db.moradores.find(
    (m) => m.nome_completo === usuario?.nome
  );

  if (!morador) {
    return res.status(404).json({ detail: "Morador vinculado ao usuário não encontrado" });
  }

  function addDaysUTC(dateStr: string, days: number): string {
    const [y, m, d] = dateStr.split("-").map(Number);
    const utcMs = Date.UTC(y, m - 1, d + days);
    const dt = new Date(utcMs);
    return dt.toISOString().split("T")[0];
  }

  let finalDataFim = data_fim ? String(data_fim).trim() : "";
  if (!finalDataFim && prazo_dias !== undefined) {
    const dias = parseInt(prazo_dias, 10);
    if (!isNaN(dias) && dias > 0) {
      finalDataFim = addDaysUTC(String(data_inicio).trim(), dias);
    }
  }

  if (!finalDataFim) {
    return res.status(422).json({ detail: "Data final de autorização inválida ou prazo_dias inválido" });
  }

  const novoPrestador: Prestador = {
    id: db.getNextPrestadorId(),
    nome: String(nome).trim(),
    documento: String(documento).trim(),
    tipo_documento: tipo_documento || "CPF",
    empresa: empresa ? String(empresa).trim() : null,
    funcao: String(funcao).trim(),
    telefone: telefone ? String(telefone).trim() : null,
    foto_url: null,
    placa_veiculo: placa_veiculo ? String(placa_veiculo).trim().toUpperCase() : null,
    cracha_numero: null,
    tipo_vinculo: "unidade",
    bloco: morador.bloco,
    apartamento: morador.apartamento,
    morador_autorizador_id: morador.id,
    morador_autorizador_nome: morador.nome_completo,
    data_inicio: String(data_inicio).trim(),
    data_fim: finalDataFim,
    horario_permitido: horario_permitido ? String(horario_permitido).trim() : "08:00 às 17:00",
    observacao: observacao ? String(observacao).trim() : null,
    presente: false,
    ativo: true,
    criado_em: new Date().toISOString(),
  };

  db.prestadores.push(novoPrestador);

  // Notificação no app
  db.notificacoes.push({
    id: db.getNextNotificacaoId(),
    morador_id: morador.id,
    tipo: "prestador",
    titulo: `Prestador Registrado: ${novoPrestador.nome}`,
    mensagem: `${novoPrestador.nome} (${novoPrestador.funcao}) registrado para atender sua unidade até ${novoPrestador.data_fim}.`,
    canal: "app",
    enviado_em: new Date().toISOString(),
    lida: false,
    dados_adicionais: { prestador_id: novoPrestador.id },
  });

  db.save();

  const links = gerarLinksNotificacao(
    { whatsapp: morador.whatsapp, telefone: morador.telefone, telegram: morador.telegram },
    tmplPrestador(morador, novoPrestador, "registrado")
  );

  return res.status(201).json({ ...novoPrestador, ...links });
});
