import { Morador, Encomenda, Visitante, Reserva, Prestador, Ocorrencia } from "../types.js";

export interface DestinoNotificacao {
  whatsapp: string | null;
  telegram: string | null;
  telefone?: string | null;
}

export function normalizarFone(telefone: string | null | undefined): string | null {
  if (!telefone) return null;
  const limpo = telefone.replace(/\D/g, "");
  if (!limpo) return null;

  let base = limpo;
  if (base.length >= 12 && base.startsWith("55")) {
    base = base.slice(2);
  }

  if (base.length === 11) {
    const ddd = base.slice(0, 2);
    const numero = base.slice(2);
    if (numero.startsWith("9")) {
      return `55${ddd}${numero.slice(1)}`;
    }
    return `55${base}`;
  }

  if (base.length === 10) {
    return `55${base}`;
  }

  if (base.length === 9) {
    return `55${base}`;
  }

  return base.startsWith("55") ? base : `55${base}`;
}

export function normalizarTelegram(user: string | null | undefined): string | null {
  if (!user) return null;
  const cleaned = user.replace(/@/g, "").trim();
  return cleaned || null;
}

export function gerarLinksNotificacao(
  morador: DestinoNotificacao,
  mensagem: string
): { whatsappUrl: string | null; telegramUrl: string | null } {
  let whatsappUrl: string | null = null;
  let telegramUrl: string | null = null;

  const telefone = normalizarFone(morador.whatsapp || morador.telefone || null);
  if (telefone) {
    whatsappUrl = `https://api.whatsapp.com/send?phone=${telefone}&text=${encodeURIComponent(mensagem)}`;
  }

  const user = normalizarTelegram(morador.telegram);
  if (user) {
    telegramUrl = `https://t.me/${user}`;
  }

  if (!telegramUrl) {
    telegramUrl = `https://t.me/share/url?url=${encodeURIComponent("https://ambros.condominio.app")}&text=${encodeURIComponent(mensagem)}`;
  }

  return { whatsappUrl, telegramUrl };
}

export function unidadeMorador(morador: Morador): string {
  return `Bloco ${morador.bloco || "—"} / Apt ${morador.apartamento || "—"}`;
}

export function tmplEncomenda(morador: Morador, enc: Encomenda): string {
  const unidade = enc.morador_unidade || unidadeMorador(morador);
  const dataRecebimento = enc.recebido_em ? new Date(enc.recebido_em) : new Date();
  const dataFmt = `${String(dataRecebimento.getDate()).padStart(2, "0")}/${String(dataRecebimento.getMonth() + 1).padStart(2, "0")} ${String(dataRecebimento.getHours()).padStart(2, "0")}:${String(dataRecebimento.getMinutes()).padStart(2, "0")}`;

  let msg = `📦 Nova encomenda ${enc.codigo_retirada} para ${unidade}.\n`;
  msg += `Código: ${enc.codigo_retirada}. Retire na portaria.\n\n`;
  msg += `🚚 ${enc.transportadora || "Transportadora não informada"} (${enc.codigo_rastreio || "Sem rastreio"})\n`;
  msg += `📦 ${enc.tipo_volume || "Volume"}\n`;
  msg += `📍 ${enc.local_armazenamento || "Armário de Encomendas"}\n`;
  msg += `🕒 Recebido em ${dataFmt}`;

  if (enc.observacoes) {
    msg += `\n📝 ${enc.observacoes}`;
  }

  msg += `\n\n⚠️ Apresente o código de retirada na portaria.`;

  return msg;
}

export function tmplVisita(morador: Morador, visitante: Visitante): string {
  const unidade = unidadeMorador(morador);
  return `🚪 ${visitante.nome} chegou para visitar ${unidade}. Acompanhe entrada/saída na portaria.`;
}

export function tmplVisitaConfirmada(morador: Morador, visitante: Visitante): string {
  const unidade = unidadeMorador(morador);
  return `✅ Entrada confirmada: ${visitante.nome} está dentro do condomínio visitando ${unidade}.`;
}

export function tmplVisitaSaida(morador: Morador, visitante: Visitante): string {
  const unidade = unidadeMorador(morador);
  return `👋 ${visitante.nome} saiu da portaria após visitar ${unidade}.`;
}

export function tmplReserva(morador: Morador, reserva: Reserva, confirmada: boolean): string {
  const unidade = unidadeMorador(morador);
  const status = confirmada ? "confirmada" : "cancelada";
  const periodoNome: Record<string, string> = {
    dia_inteiro: "Dia Inteiro",
    manha: "Manhã (08h-12h)",
    tarde: "Tarde (12h-18h)",
    noite: "Noite (18h-23h)",
  };
  const periodo = periodoNome[reserva.periodo] || reserva.periodo;
  const dataFmt = reserva.data_reserva.split("-").reverse().join("/");

  let msg = `📅 Reserva ${status} para ${unidade}.\n`;
  msg += `Espaço: ${reserva.espaco_nome || reserva.espaco}\n`;
  msg += `Data: ${dataFmt}\n`;
  msg += `Período: ${periodo}`;

  if (reserva.convidados_estimados) {
    msg += `\n👥 ${reserva.convidados_estimados} convidados estimados`;
  }

  return msg;
}

export function tmplPrestador(morador: Morador, prestador: Prestador, acao: string): string {
  const unidade = unidadeMorador(morador);
  const acaoTxt = {
    registrado: "registrado para atender",
    entrou: "entrou no condomínio",
    saiu: "saiu do condomínio",
  }[acao] || acao;

  let msg = `🛠️ ${prestador.nome} ${acaoTxt} hoje.`;
  msg += `\nFunção: ${prestador.funcao || "Não informada"}`;

  if (prestador.empresa) {
    msg += ` | Empresa: ${prestador.empresa}`;
  }

  if (prestador.tipo_vinculo === "unidade") {
    msg += `\nUnidade: ${unidade}`;
  } else {
    msg += `\nTipo: Condomínio / Geral`;
  }

  return msg;
}

export function tmplOcorrencia(morador: Morador, ocor: Ocorrencia): string {
  const unidade = ocor.bloco || ocor.apartamento
    ? `Bloco ${ocor.bloco || "—"} / Apt ${ocor.apartamento || "—"}`
    : "Área Comum";

  let statusTxt = "registrada";
  if (ocor.status === "resolvida") {
    statusTxt = "resolvida";
  } else if (ocor.status === "em_analise") {
    statusTxt = "em análise";
  }

  return `⚠️ Ocorrência ${statusTxt}: ${ocor.titulo} — Gravidade: ${ocor.gravidade}.\n${unidade}${ocor.morador_envolvido ? ` | Envolvido: ${ocor.morador_envolvido}` : ""}`;
}
