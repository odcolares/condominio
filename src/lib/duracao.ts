import { Acesso } from "../types.js";

export interface AcessoEnriquecido extends Acesso {
  duracao_minutos: number | null;
  em_aberto: boolean;
  expirado?: boolean;
}

/**
 * Helper puro para emparelhar eventos de entrada e saída por (tipo_pessoa, pessoa_id).
 * Ordena os acessos cronologicamente por `registrado_em` antes do pareamento.
 * Aplica também a regra de 24h para auto-saída de visitantes.
 */
export function emparelharAcessos(acessos: Acesso[], nowMs: number = Date.now()): AcessoEnriquecido[] {
  if (!acessos || acessos.length === 0) return [];

  // Clonar e ordenar por timestamp UTC ascendente (mais antigo para mais recente)
  const ordenados = [...acessos].sort((a, b) => {
    return new Date(a.registrado_em).getTime() - new Date(b.registrado_em).getTime();
  });

  // Mapear resultados indexados pelo id original ou referência
  const resultadosMap = new Map<number, { duracao_minutos: number | null; em_aberto: boolean }>();

  // Dicionário de pilhas/filas de entradas abertas por chave: `${tipo_pessoa}:${pessoa_id}`
  const entradasAbertas = new Map<string, { id: number; tempoMs: number }[]>();

  // Primeira passada: processar cronologicamente
  for (const ac of ordenados) {
    const key = `${ac.tipo_pessoa}:${ac.pessoa_id}`;
    const tMs = new Date(ac.registrado_em).getTime();

    if (ac.sentido === "entrada") {
      if (!entradasAbertas.has(key)) {
        entradasAbertas.set(key, []);
      }
      entradasAbertas.get(key)!.push({ id: ac.id, tempoMs: tMs });
      resultadosMap.set(ac.id, { duracao_minutos: null, em_aberto: true });
    } else if (ac.sentido === "saida") {
      const pilha = entradasAbertas.get(key);
      if (pilha && pilha.length > 0) {
        // Pega a entrada mais antiga em aberto (FIFO)
        const entradaMatch = pilha.shift()!;
        const duracaoMin = Math.max(0, Math.round((tMs - entradaMatch.tempoMs) / 60000));
        resultadosMap.set(entradaMatch.id, { duracao_minutos: duracaoMin, em_aberto: false });
        resultadosMap.set(ac.id, { duracao_minutos: duracaoMin, em_aberto: false });
      } else {
        // Orphan saída (sem entrada correspondente)
        resultadosMap.set(ac.id, { duracao_minutos: null, em_aberto: false });
      }
    } else {
      // Sentido desconhecido ou neutro
      resultadosMap.set(ac.id, { duracao_minutos: null, em_aberto: false });
    }
  }

  const TWENTY_FOUR_HOURS_MS = 24 * 3600 * 1000;

  // Segunda passada: verificar entradas ainda abertas (aplicando regra 24h para visitantes)
  for (const [key, pilha] of entradasAbertas.entries()) {
    const tipoPessoa = key.split(":")[0];
    for (const ent of pilha) {
      const tempoDecorrido = nowMs - ent.tempoMs;
      if (tipoPessoa === "visitante" && tempoDecorrido >= TWENTY_FOUR_HOURS_MS) {
        // Auto-saída 24h sintética
        const duracaoMax = 24 * 60; // 1440 min
        resultadosMap.set(ent.id, { duracao_minutos: duracaoMax, em_aberto: false });
      } else {
        resultadosMap.set(ent.id, { duracao_minutos: null, em_aberto: true });
      }
    }
  }

  // Mapear de volta para a ordem original (ou manter a ordem solicitada pelo chamador)
  // Nota: A rota /acessos costuma retornar em ordem decrescente (mais recente primeiro).
  // Preservamos a ordem original do array de entrada (`acessos`) para não quebrar ordenações da API.
  return acessos.map(ac => {
    const res = resultadosMap.get(ac.id) || { duracao_minutos: null, em_aberto: false };
    return {
      ...ac,
      duracao_minutos: res.duracao_minutos,
      em_aberto: res.em_aberto,
    };
  });
}
