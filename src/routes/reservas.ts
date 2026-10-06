import { Router } from "express";
import { db } from "../db.js";
import { authMiddleware } from "../auth.js";
import { Reserva, EspacoComum, StatusReserva, Morador } from "../types.js";
import { gerarLinksNotificacao, tmplReserva, DestinoNotificacao } from "../lib/notificacoes.js";

function moradorDestino(morador: Morador | null | undefined): DestinoNotificacao | null {
  if (!morador) return null;
  return { whatsapp: morador.whatsapp, telefone: morador.telefone, telegram: morador.telegram };
}

export const reservasRouter = Router();

export const ESPACOS_INFO: Record<
  EspacoComum,
  { nome: string; capacidade: number; regras: string; taxa: string; icone: string }
> = {
  salao_festas: {
    nome: "Salão de Festas Principal",
    capacidade: 80,
    regras: "Uso até as 00h. Proibido som externo após às 22h. Taxa de limpeza R$ 120.",
    taxa: "R$ 120,00",
    icone: "bi-gift",
  },
  churrasqueira_1: {
    nome: "Espaço Gourmet & Churrasqueira 1",
    capacidade: 25,
    regras: "Uso das 10h às 22h. Manter grelhas e bancadas limpas após o uso.",
    taxa: "R$ 50,00",
    icone: "bi-fire",
  },
  churrasqueira_2: {
    nome: "Churrasqueira 2 (Área Piscina)",
    capacidade: 20,
    regras: "Uso das 10h às 21h. Trajes de banho permitidos apenas na área externa.",
    taxa: "R$ 50,00",
    icone: "bi-water",
  },
  quadra: {
    nome: "Quadra Poliesportiva",
    capacidade: 20,
    regras: "Uso das 08h às 22h. Uso obrigatório de tênis adequado. Reservas de até 2h por unidade.",
    taxa: "Gratuito",
    icone: "bi-dribbble",
  },
  coworking: {
    nome: "Coworking & Sala de Reuniões",
    capacidade: 12,
    regras: "Ambiente silencioso. Wi-Fi de alta velocidade disponível. Uso das 07h às 21h.",
    taxa: "Gratuito",
    icone: "bi-laptop",
  },
};

reservasRouter.get("/espacos", authMiddleware, (_req, res) => {
  return res.json(ESPACOS_INFO);
});

reservasRouter.get(["", "/"], authMiddleware, (req, res) => {
  const espaco = req.query.espaco as EspacoComum | undefined;
  const status = req.query.status as StatusReserva | undefined;
  const moradorId = req.query.morador_id ? Number(req.query.morador_id) : undefined;
  const data = req.query.data as string | undefined;

  let resultado = db.reservas.filter((r) => {
    if (espaco && r.espaco !== espaco) return false;
    if (status && r.status !== status) return false;
    if (moradorId && r.morador_id !== moradorId) return false;
    if (data && r.data_reserva !== data) return false;
    return true;
  });

  resultado.sort((a, b) => new Date(b.data_reserva).getTime() - new Date(a.data_reserva).getTime());
  return res.json(resultado);
});

reservasRouter.get("/:id", authMiddleware, (req, res) => {
  const id = parseInt(req.params.id, 10);
  const r = db.reservas.find((item) => item.id === id);
  if (!r) {
    return res.status(404).json({ detail: "Reserva não encontrada" });
  }

  const morador = db.moradores.find((m) => m.id === r.morador_id);
  const destino = moradorDestino(morador);
  const links = destino ? gerarLinksNotificacao(destino, tmplReserva(morador!, r, r.status === "confirmada")) : { whatsappUrl: null, telegramUrl: null };
  return res.json({ ...r, ...links });
});

reservasRouter.post(["", "/"], authMiddleware, (req, res) => {
  const {
    espaco,
    data_reserva,
    periodo,
    morador_id,
    convidados_estimados,
    observacoes,
  } = req.body;

  if (!espaco || !data_reserva || !periodo || !morador_id) {
    return res.status(422).json({
      detail: "Espaço, data da reserva, período e morador são obrigatórios",
    });
  }

  const morador = db.moradores.find((m) => m.id === Number(morador_id));
  if (!morador) {
    return res.status(404).json({ detail: "Morador não encontrado" });
  }

  const infoEspaco = ESPACOS_INFO[espaco as EspacoComum];
  if (!infoEspaco) {
    return res.status(400).json({ detail: "Espaço comum inválido" });
  }

  // Prevenção de conflito de datas para o mesmo espaço
  const conflito = db.reservas.find(
    (r) =>
      r.espaco === espaco &&
      r.data_reserva === data_reserva &&
      r.status !== "cancelada" &&
      (r.periodo === "dia_inteiro" || periodo === "dia_inteiro" || r.periodo === periodo)
  );

  if (conflito) {
    return res.status(409).json({
      detail: `Este espaço já está reservado no dia ${data_reserva} para o período selecionado (${conflito.periodo}) pela unidade Bloco ${conflito.bloco} / Apto ${conflito.apartamento}.`,
    });
  }

  const novaReserva: Reserva = {
    id: db.getNextReservaId(),
    espaco: espaco as EspacoComum,
    espaco_nome: infoEspaco.nome,
    data_reserva: String(data_reserva).trim(),
    periodo,
    morador_id: morador.id,
    morador_nome: morador.nome_completo,
    bloco: morador.bloco || "—",
    apartamento: morador.apartamento || "—",
    status: "confirmada", // Auto-confirmada para conveniência
    convidados_estimados: Number(convidados_estimados) || 10,
    observacoes: observacoes ? String(observacoes).trim() : null,
    solicitado_em: new Date().toISOString(),
    aprovado_em: new Date().toISOString(),
    aprovado_por: "Sistema / Administração",
  };

  db.reservas.push(novaReserva);

  // Gera notificação automática para o morador
  db.notificacoes.push({
    id: db.getNextNotificacaoId(),
    morador_id: morador.id,
    tipo: "reserva",
    titulo: `Reserva Confirmada: ${infoEspaco.nome}`,
    mensagem: `Sua reserva para o dia ${data_reserva} (${periodo}) foi confirmada com sucesso! Respeite as normas de convivência.`,
    canal: "app",
    enviado_em: new Date().toISOString(),
    lida: false,
    dados_adicionais: { reserva_id: novaReserva.id },
  });

  db.save();
  const links = gerarLinksNotificacao(
    { whatsapp: morador.whatsapp, telefone: morador.telefone, telegram: morador.telegram },
    tmplReserva(morador, novaReserva, true)
  );
  return res.status(201).json({ ...novaReserva, ...links });
});

reservasRouter.put("/:id", authMiddleware, (req, res) => {
  const id = parseInt(req.params.id, 10);
  const r = db.reservas.find((item) => item.id === id);
  if (!r) {
    return res.status(404).json({ detail: "Reserva não encontrada" });
  }

  const { status, observacoes } = req.body;
  if (status !== undefined) {
    r.status = status;
    if (status === "confirmada") {
      r.aprovado_em = new Date().toISOString();
      r.aprovado_por = "Administração";
    }
  }
  if (observacoes !== undefined) r.observacoes = observacoes;

  db.save();

  const morador = db.moradores.find((m) => m.id === r.morador_id);
  const destino: DestinoNotificacao | null = morador
    ? { whatsapp: morador.whatsapp, telefone: morador.telefone, telegram: morador.telegram }
    : null;
  const links = destino ? gerarLinksNotificacao(destino, tmplReserva(morador!, r, r.status === "confirmada")) : { whatsappUrl: null, telegramUrl: null };

  return res.json({ ...r, ...links });
});

reservasRouter.delete("/:id", authMiddleware, (req, res) => {
  const id = parseInt(req.params.id, 10);
  const idx = db.reservas.findIndex((item) => item.id === id);
  if (idx === -1) {
    return res.status(404).json({ detail: "Reserva não encontrada" });
  }

  db.reservas.splice(idx, 1);
  db.save();
  return res.status(204).send();
});
