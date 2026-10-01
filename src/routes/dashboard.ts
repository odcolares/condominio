import { Router } from "express";
import { db } from "../db.js";
import { authMiddleware } from "../auth.js";

export const dashboardRouter = Router();

dashboardRouter.get("", authMiddleware, (_req, res) => {
  const now = new Date();
  const todayStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 0, 0, 0));
  const todayEnd = new Date(todayStart.getTime() + 24 * 60 * 60 * 1000);

  const moradoresAtivos = db.moradores.filter((m) => m.ativo).length;
  const veiculosCadastrados = db.veiculos.length;

  const visitantesHoje = db.visitantes.filter((v) => {
    const created = new Date(v.criado_em);
    return created >= todayStart && created < todayEnd;
  }).length;

  const dentroCondominio = db.visitantes.filter((v) => v.presente).length;

  const visitasAgendadas = db.visitantes.filter((v) => {
    if (!v.agendado_para) return false;
    const agendado = new Date(v.agendado_para);
    return agendado >= todayStart && agendado < todayEnd;
  }).length;

  const acessosHoje = db.acessos.filter((a) => {
    const reg = new Date(a.registrado_em);
    return reg >= todayStart && reg < todayEnd;
  });

  const entradasHoje = acessosHoje.filter((a) => a.sentido === "entrada").length;
  const saidasHoje = acessosHoje.filter((a) => a.sentido === "saida").length;

  const sortedAcessos = [...db.acessos].sort(
    (a, b) => new Date(b.registrado_em).getTime() - new Date(a.registrado_em).getTime()
  );

  const ultimoAcesso = sortedAcessos.length > 0 ? sortedAcessos[0] : null;

  // Movimentação de hoje por faixa de 3h (0h, 3h, 6h, 9h, 12h, 15h, 18h, 21h)
  const faixas = [0, 3, 6, 9, 12, 15, 18, 21];
  const entradas = faixas.map((h) => {
    const startHour = new Date(todayStart.getTime() + h * 3600000);
    const endHour = new Date(startHour.getTime() + 3 * 3600000);
    const count = db.acessos.filter((a) => {
      const reg = new Date(a.registrado_em);
      return a.sentido === "entrada" && reg >= startHour && reg < endHour;
    }).length;
    return { label: `${String(h).padStart(2, "0")}h`, valor: count };
  });

  const saidas = faixas.map((h) => {
    const startHour = new Date(todayStart.getTime() + h * 3600000);
    const endHour = new Date(startHour.getTime() + 3 * 3600000);
    const count = db.acessos.filter((a) => {
      const reg = new Date(a.registrado_em);
      return a.sentido === "saida" && reg >= startHour && reg < endHour;
    }).length;
    return { label: `${String(h).padStart(2, "0")}h`, valor: count };
  });

  // Visitantes nos últimos 7 dias
  const visitantes7Dias = [];
  for (let i = 6; i >= 0; i--) {
    const dayStart = new Date(todayStart.getTime() - i * 24 * 3600000);
    const dayEnd = new Date(dayStart.getTime() + 24 * 3600000);
    const count = db.visitantes.filter((v) => {
      const created = new Date(v.criado_em);
      return created >= dayStart && created < dayEnd;
    }).length;
    const label = `${String(dayStart.getUTCDate()).padStart(2, "0")}/${String(
      dayStart.getUTCMonth() + 1
    ).padStart(2, "0")}`;
    visitantes7Dias.push({ label, valor: count });
  }

  const ultimosAcessos = sortedAcessos.slice(0, 5);

  return res.json({
    cards: {
      moradores_ativos: moradoresAtivos,
      visitantes_hoje: visitantesHoje,
      veiculos_cadastrados: veiculosCadastrados,
      entradas_hoje: entradasHoje,
      saidas_hoje: saidasHoje,
      dentro_condominio: dentroCondominio,
      visitas_agendadas: visitasAgendadas,
      ultimo_acesso: ultimoAcesso,
    },
    movimentacao_hoje: {
      entradas,
      saidas,
    },
    visitantes_7dias: visitantes7Dias,
    ultimos_acessos: ultimosAcessos,
  });
});
