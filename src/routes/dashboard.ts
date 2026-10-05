import { Router } from "express";
import { db } from "../db.js";
import { authMiddleware } from "../auth.js";

export const dashboardRouter = Router();

dashboardRouter.get(["", "/"], authMiddleware, (_req, res) => {
  try {
    const now = new Date();
    const todayStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 0, 0, 0));
    const todayEnd = new Date(todayStart.getTime() + 24 * 60 * 60 * 1000);

    const moradores = Array.isArray(db.moradores) ? db.moradores : [];
    const veiculos = Array.isArray(db.veiculos) ? db.veiculos : [];
    const visitantes = Array.isArray(db.visitantes) ? db.visitantes : [];
    const acessos = Array.isArray(db.acessos) ? db.acessos : [];

    const moradoresAtivos = moradores.filter((m) => m.ativo).length;
    const veiculosCadastrados = veiculos.length;

    const visitantesHoje = visitantes.filter((v) => {
      if (!v.criado_em) return false;
      const created = new Date(v.criado_em);
      return created >= todayStart && created < todayEnd;
    }).length;

    const dentroCondominio = visitantes.filter((v) => v.presente).length;

    const visitasAgendadas = visitantes.filter((v) => {
      if (!v.agendado_para) return false;
      const agendado = new Date(v.agendado_para);
      return agendado >= todayStart && agendado < todayEnd;
    }).length;

    const acessosHoje = acessos.filter((a) => {
      if (!a.registrado_em) return false;
      const reg = new Date(a.registrado_em);
      return reg >= todayStart && reg < todayEnd;
    });

    const entradasHoje = acessosHoje.filter((a) => a.sentido === "entrada").length;
    const saidasHoje = acessosHoje.filter((a) => a.sentido === "saida").length;

    const sortedAcessos = [...acessos].sort((a, b) => {
      const timeA = a.registrado_em ? new Date(a.registrado_em).getTime() : 0;
      const timeB = b.registrado_em ? new Date(b.registrado_em).getTime() : 0;
      return timeB - timeA;
    });

    const ultimoAcesso = sortedAcessos.length > 0 ? sortedAcessos[0] : null;

    // Movimentação de hoje por faixa de 3h (0h, 3h, 6h, 9h, 12h, 15h, 18h, 21h)
    const faixas = [0, 3, 6, 9, 12, 15, 18, 21];
    const entradas = faixas.map((h) => {
      const startHour = new Date(todayStart.getTime() + h * 3600000);
      const endHour = new Date(startHour.getTime() + 3 * 3600000);
      const count = acessos.filter((a) => {
        if (!a.registrado_em) return false;
        const reg = new Date(a.registrado_em);
        return a.sentido === "entrada" && reg >= startHour && reg < endHour;
      }).length;
      return { label: `${String(h).padStart(2, "0")}h`, valor: count };
    });

    const saidas = faixas.map((h) => {
      const startHour = new Date(todayStart.getTime() + h * 3600000);
      const endHour = new Date(startHour.getTime() + 3 * 3600000);
      const count = acessos.filter((a) => {
        if (!a.registrado_em) return false;
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
      const count = visitantes.filter((v) => {
        if (!v.criado_em) return false;
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
  } catch (err) {
    console.warn("Erro ao calcular dados do dashboard:", err);
    return res.status(500).json({
      detail: "Erro ao gerar dados do dashboard",
      cards: {
        moradores_ativos: 0,
        visitantes_hoje: 0,
        veiculos_cadastrados: 0,
        entradas_hoje: 0,
        saidas_hoje: 0,
        dentro_condominio: 0,
        visitas_agendadas: 0,
        ultimo_acesso: null,
      },
      movimentacao_hoje: { entradas: [], saidas: [] },
      visitantes_7dias: [],
      ultimos_acessos: [],
    });
  }
});
