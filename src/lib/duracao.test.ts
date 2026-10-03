import test from "node:test";
import assert from "node:assert";
import { emparelharAcessos } from "./duracao.js";
import { Acesso } from "../types.js";

test("emparelharAcessos - closed entrada and saida pair", () => {
  const t0 = new Date("2026-10-03T10:00:00.000Z").getTime();
  const t1 = new Date("2026-10-03T11:30:00.000Z").getTime(); // 90 min later

  const acessos: Acesso[] = [
    {
      id: 1,
      tipo_pessoa: "visitante",
      pessoa_id: 10,
      nome: "João Teste",
      sentido: "entrada",
      placa_veiculo: null,
      vaga: null,
      observacao: null,
      registrado_em: new Date(t0).toISOString(),
    },
    {
      id: 2,
      tipo_pessoa: "visitante",
      pessoa_id: 10,
      nome: "João Teste",
      sentido: "saida",
      placa_veiculo: null,
      vaga: null,
      observacao: null,
      registrado_em: new Date(t1).toISOString(),
    },
  ];

  const resultado = emparelharAcessos(acessos, t1 + 1000);
  assert.strictEqual(resultado.length, 2);
  assert.strictEqual(resultado[0].duracao_minutos, 90);
  assert.strictEqual(resultado[0].em_aberto, false);
  assert.strictEqual(resultado[1].duracao_minutos, 90);
  assert.strictEqual(resultado[1].em_aberto, false);
});

test("emparelharAcessos - entrada in open state", () => {
  const t0 = new Date("2026-10-03T10:00:00.000Z").getTime();

  const acessos: Acesso[] = [
    {
      id: 1,
      tipo_pessoa: "prestador",
      pessoa_id: 20,
      nome: "Carlos Eletricista",
      sentido: "entrada",
      placa_veiculo: null,
      vaga: null,
      observacao: null,
      registrado_em: new Date(t0).toISOString(),
    },
  ];

  const resultado = emparelharAcessos(acessos, t0 + 10 * 60 * 1000); // 10 min later
  assert.strictEqual(resultado.length, 1);
  assert.strictEqual(resultado[0].duracao_minutos, null);
  assert.strictEqual(resultado[0].em_aberto, true);
});

test("emparelharAcessos - orphan saida does not throw", () => {
  const t0 = new Date("2026-10-03T10:00:00.000Z").getTime();

  const acessos: Acesso[] = [
    {
      id: 1,
      tipo_pessoa: "visitante",
      pessoa_id: 15,
      nome: "Ana Órfã",
      sentido: "saida",
      placa_veiculo: null,
      vaga: null,
      observacao: null,
      registrado_em: new Date(t0).toISOString(),
    },
  ];

  const resultado = emparelharAcessos(acessos, t0 + 1000);
  assert.strictEqual(resultado.length, 1);
  assert.strictEqual(resultado[0].duracao_minutos, null);
  assert.strictEqual(resultado[0].em_aberto, false);
});

test("emparelharAcessos - visitor 24h auto-saida rule", () => {
  const t0 = new Date("2026-10-03T10:00:00.000Z").getTime();
  const t26h = t0 + 26 * 3600 * 1000; // 26 hours later

  const acessos: Acesso[] = [
    {
      id: 1,
      tipo_pessoa: "visitante",
      pessoa_id: 99,
      nome: "Visitante Esquecido",
      sentido: "entrada",
      placa_veiculo: null,
      vaga: null,
      observacao: null,
      registrado_em: new Date(t0).toISOString(),
    },
  ];

  const resultado = emparelharAcessos(acessos, t26h);
  assert.strictEqual(resultado.length, 1);
  assert.strictEqual(resultado[0].duracao_minutos, 1440); // capped at 24h (1440 min)
  assert.strictEqual(resultado[0].em_aberto, false);
});
