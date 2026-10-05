import { Router } from "express";
import { db } from "../db.js";
import { authMiddleware } from "../auth.js";
import { Encomenda } from "../types.js";

export const encomendasRouter = Router();

function gerarCodigoRetirada(): string {
  // Gera código único no formato RET-XXXX (ex: RET-5819)
  let code = "";
  let exists = true;
  while (exists) {
    const num = Math.floor(1000 + Math.random() * 9000);
    code = `RET-${num}`;
    exists = db.encomendas.some((e) => e.codigo_retirada === code && e.status === "pendente");
  }
  return code;
}

function formatarDataHora(isoString: string): string {
  const d = new Date(isoString);
  const dia = String(d.getDate()).padStart(2, "0");
  const mes = String(d.getMonth() + 1).padStart(2, "0");
  const ano = d.getFullYear();
  const hora = String(d.getHours()).padStart(2, "0");
  const min = String(d.getMinutes()).padStart(2, "0");
  return `${dia}/${mes}/${ano} às ${hora}:${min}`;
}

function gerarMensagemAviso(
  moradorNome: string,
  unidade: string,
  transportadora: string,
  codigoRastreio: string,
  tipoVolume: string,
  localArmazenamento: string,
  codigoRetirada: string,
  recebidoEm: string
): string {
  const dataFormatada = formatarDataHora(recebidoEm);
  return (
    `📦 *AMBROS CONDOMÍNIO - AVISO DE ENCOMENDA* 📦\n\n` +
    `Olá, *${moradorNome}*!\n` +
    `Uma nova encomenda foi recebida na portaria para sua unidade (*${unidade}*).\n\n` +
    `🚚 *Transportadora:* ${transportadora || "Não informada"}\n` +
    `🏷️ *Código / Rastreio:* ${codigoRastreio || "Sem etiqueta"}\n` +
    `📦 *Tipo de Volume:* ${tipoVolume || "Volume padrão"}\n` +
    `📍 *Local na Portaria:* ${localArmazenamento || "Armário de Encomendas"}\n` +
    `🕒 *Horário de Chegada:* ${dataFormatada}\n\n` +
    `══════════════════════════\n` +
    `🔐 *CÓDIGO ÚNICO DE RETIRADA:* 👉 *${codigoRetirada}* 👈\n` +
    `══════════════════════════\n\n` +
    `⚠️ *Importante:* Apresente este código na portaria para autorizar a entrega e retirada segura do pacote.\n` +
    `Condomínio Residencial AMBROS`
  );
}

function gerarLinksNotificacao(telefone: string | null, telegram: string | null, mensagem: string) {
  let whatsappUrl: string | null = null;
  let telegramUrl: string | null = null;

  if (telefone) {
    const limpo = telefone.replace(/\D/g, "");
    const numeroFinal = limpo.startsWith("55") ? limpo : `55${limpo}`;
    whatsappUrl = `https://api.whatsapp.com/send?phone=${numeroFinal}&text=${encodeURIComponent(mensagem)}`;
  }

  // Telegram link: share or direct username
  if (telegram) {
    const userClean = telegram.replace("@", "").trim();
    if (userClean) {
      telegramUrl = `https://t.me/${userClean}`;
    }
  }
  const telegramShareUrl = `https://t.me/share/url?url=${encodeURIComponent("https://ambros.condominio.app")}&text=${encodeURIComponent(mensagem)}`;

  return { whatsappUrl, telegramUrl: telegramUrl || telegramShareUrl };
}

// GET /encomendas/stats
encomendasRouter.get("/stats", authMiddleware, (_req, res) => {
  const now = new Date();
  const hojeStr = now.toISOString().slice(0, 10);

  const total = db.encomendas.length;
  const pendentes = db.encomendas.filter((e) => e.status === "pendente").length;
  const retiradas_hoje = db.encomendas.filter(
    (e) => e.status === "entregue" && e.retirado_em && e.retirado_em.startsWith(hojeStr)
  ).length;

  return res.json({
    total,
    pendentes,
    retiradas_hoje,
  });
});

// GET /encomendas
encomendasRouter.get("", authMiddleware, (req, res) => {
  const status = typeof req.query.status === "string" ? req.query.status : null;
  const busca = typeof req.query.busca === "string" ? req.query.busca.toLowerCase().trim() : null;

  let resultado = db.encomendas.filter((e) => {
    if (status && status !== "todos" && e.status !== status) {
      return false;
    }
    if (busca) {
      const matchNome = e.morador_nome.toLowerCase().includes(busca);
      const matchUnidade = e.morador_unidade.toLowerCase().includes(busca);
      const matchRastreio = e.codigo_rastreio.toLowerCase().includes(busca);
      const matchCodigo = e.codigo_retirada.toLowerCase().includes(busca);
      const matchTransp = e.transportadora.toLowerCase().includes(busca);
      if (!matchNome && !matchUnidade && !matchRastreio && !matchCodigo && !matchTransp) {
        return false;
      }
    }
    return true;
  });

  // Sort: pendentes first, then by recebido_em desc
  resultado.sort((a, b) => {
    if (a.status === "pendente" && b.status !== "pendente") return -1;
    if (a.status !== "pendente" && b.status === "pendente") return 1;
    return new Date(b.recebido_em).getTime() - new Date(a.recebido_em).getTime();
  });

  return res.json(resultado);
});

// GET /encomendas/:id
encomendasRouter.get("/:id", authMiddleware, (req, res) => {
  const id = parseInt(req.params.id, 10);
  const encomenda = db.encomendas.find((e) => e.id === id);
  if (!encomenda) {
    return res.status(404).json({ detail: "Encomenda não encontrada" });
  }

  const links = gerarLinksNotificacao(
    encomenda.morador_whatsapp || encomenda.morador_telefone,
    encomenda.morador_telegram,
    encomenda.mensagem_aviso
  );

  return res.json({ ...encomenda, ...links });
});

// POST /encomendas
encomendasRouter.post("", authMiddleware, (req, res) => {
  const {
    morador_id,
    codigo_rastreio,
    transportadora,
    tipo_volume,
    local_armazenamento,
    observacoes,
    notificar_whatsapp,
    notificar_telegram,
  } = req.body;

  if (!morador_id) {
    return res.status(400).json({ detail: "O morador destinatário é obrigatório" });
  }

  const morador = db.moradores.find((m) => m.id === parseInt(morador_id, 10));
  if (!morador) {
    return res.status(404).json({ detail: "Morador não encontrado no condomínio" });
  }

  const codigoRetirada = gerarCodigoRetirada();
  const recebidoEm = new Date().toISOString();
  const unidade = `Bloco ${morador.bloco || "00"} - Apto ${morador.apartamento || "00"}`;
  const transpFinal = transportadora ? transportadora.trim() : "Transportadora Geral";
  const rastreioFinal = codigo_rastreio ? codigo_rastreio.trim() : `ENC-${Date.now().toString().slice(-6)}`;
  const volumeFinal = tipo_volume ? tipo_volume.trim() : "Pacote";
  const localFinal = local_armazenamento ? local_armazenamento.trim() : "Armário de Encomendas";

  const mensagemAviso = gerarMensagemAviso(
    morador.nome_completo,
    unidade,
    transpFinal,
    rastreioFinal,
    volumeFinal,
    localFinal,
    codigoRetirada,
    recebidoEm
  );

  const novaEncomenda: Encomenda = {
    id: db.getNextEncomendaId(),
    morador_id: morador.id,
    morador_nome: morador.nome_completo,
    morador_unidade: unidade,
    morador_telefone: morador.telefone,
    morador_whatsapp: morador.whatsapp || morador.telefone,
    morador_telegram: null,
    codigo_rastreio: rastreioFinal,
    transportadora: transpFinal,
    tipo_volume: volumeFinal,
    local_armazenamento: localFinal,
    observacoes: observacoes ? observacoes.trim() : null,
    codigo_retirada: codigoRetirada,
    status: "pendente",
    recebido_em: recebidoEm,
    recebido_por: "Portaria Central",
    retirado_em: null,
    retirado_por: null,
    notificacao_enviada_whatsapp: Boolean(notificar_whatsapp),
    notificacao_enviada_telegram: Boolean(notificar_telegram),
    mensagem_aviso: mensagemAviso,
  };

  db.encomendas.unshift(novaEncomenda);
  db.save();

  const links = gerarLinksNotificacao(
    novaEncomenda.morador_whatsapp || novaEncomenda.morador_telefone,
    novaEncomenda.morador_telegram,
    novaEncomenda.mensagem_aviso
  );

  return res.status(201).json({
    ...novaEncomenda,
    ...links,
    mensagem_sucesso: `Encomenda registrada com sucesso! Código gerado: ${codigoRetirada}`,
  });
});

// POST /encomendas/:id/retirar
encomendasRouter.post("/:id/retirar", authMiddleware, (req, res) => {
  const id = parseInt(req.params.id, 10);
  const { codigo_retirada, retirado_por, observacao } = req.body;

  const encomenda = db.encomendas.find((e) => e.id === id);
  if (!encomenda) {
    return res.status(404).json({ detail: "Encomenda não encontrada" });
  }

  if (encomenda.status === "entregue") {
    return res.status(400).json({ detail: "Esta encomenda já foi retirada anteriormente" });
  }

  // Validação do código de retirada
  if (!codigo_retirada) {
    return res.status(400).json({ detail: "Informe o código de retirada apresentado pelo morador" });
  }

  const codDigitado = String(codigo_retirada).trim().toUpperCase();
  const codEsperado = encomenda.codigo_retirada.trim().toUpperCase();

  if (codDigitado !== codEsperado) {
    return res.status(400).json({
      detail: `Código de retirada inválido! O código digitado (${codDigitado}) não confere com o código desta encomenda.`,
    });
  }

  encomenda.status = "entregue";
  encomenda.retirado_em = new Date().toISOString();
  encomenda.retirado_por = retirado_por && String(retirado_por).trim() ? String(retirado_por).trim() : `${encomenda.morador_nome} (Titular)`;
  if (observacao) {
    encomenda.observacoes = encomenda.observacoes ? `${encomenda.observacoes} | ${observacao}` : observacao;
  }

  db.save();

  return res.json({
    sucesso: true,
    encomenda,
    mensagem: `Retirada confirmada com sucesso para ${encomenda.retirado_por}!`,
  });
});

// POST /encomendas/:id/notificar
encomendasRouter.post("/:id/notificar", authMiddleware, (req, res) => {
  const id = parseInt(req.params.id, 10);
  const { canal } = req.body; // 'whatsapp' | 'telegram' | 'ambos'

  const encomenda = db.encomendas.find((e) => e.id === id);
  if (!encomenda) {
    return res.status(404).json({ detail: "Encomenda não encontrada" });
  }

  if (canal === "whatsapp" || canal === "ambos") {
    encomenda.notificacao_enviada_whatsapp = true;
  }
  if (canal === "telegram" || canal === "ambos") {
    encomenda.notificacao_enviada_telegram = true;
  }

  db.save();

  const links = gerarLinksNotificacao(
    encomenda.morador_whatsapp || encomenda.morador_telefone,
    encomenda.morador_telegram,
    encomenda.mensagem_aviso
  );

  return res.json({
    sucesso: true,
    encomenda,
    ...links,
    mensagem: "Notificação despachada com sucesso!",
  });
});

// DELETE /encomendas/:id
encomendasRouter.delete("/:id", authMiddleware, (req, res) => {
  const id = parseInt(req.params.id, 10);
  const idx = db.encomendas.findIndex((e) => e.id === id);
  if (idx === -1) {
    return res.status(404).json({ detail: "Encomenda não encontrada" });
  }

  db.encomendas.splice(idx, 1);
  db.save();
  return res.json({ sucesso: true, mensagem: "Registro de encomenda removido com sucesso" });
});
