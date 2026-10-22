// seeds/rng.ts
//
// Gerador de números pseudo-aleatórios (PRNG) totalmente determinístico.
// A semente é fixada por tenant, então rodar o seed N vezes produz
// EXATAMENTE o mesmo banco. Sem isso, uma encomenda de 3 dias atras
// vira de 2 dias atras a cada deploy — perda de coerencia da demo.
//
// Algoritmo: mulberry32. Eficiente, sem BigInt, periodo 2^32 —
// suficiente para ~2100 registros.
//
// Uso:
//   import { makeRng, pick, pickWeighted, intBetween, chance } from './seeds/rng';
//   const rng = makeRng(TENANT_SEED);        // ex: 1001
//   const nome = pick(['Ana','Bruno','Carla'], rng);
//   if (chance(70, rng)) { /* 70% */ }

/**
 * Cria um PRNG com semente fixa. A mesma semente sempre gera a mesma
 * sequencia — determinismo absoluto de deploy para deploy.
 */
export function makeRng(seed: number): () => number {
  let state = seed | 0;
  return () => {
    state = (state + 0x6D2B79F5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Retorna um numero aleatorio entre 0 (inclusivo) e 1 (exclusivo). */
export const random = makeRng(0);

/**
 * Pega um elemento aleatorio de um array.
 * O callback rng permite varias instancias com sementes diferentes.
 */
export function pick<T>(arr: readonly T[], rng: () => number): T {
  if (arr.length === 0) throw new Error('pick() de array vazio');
  return arr[Math.floor(rng() * arr.length)];
}

/**
 * Pega um elemento com pesos.
 * @param arr     elementos
 * @param weights pesos (nao precisam ser normalizados; normalizados internamente)
 * @param rng     callback PRNG
 */
export function pickWeighted<T>(
  arr: readonly T[],
  weights: readonly number[],
  rng: () => number,
): T {
  if (arr.length !== weights.length || arr.length === 0) {
    throw new Error('pickWeighted: arr e weights precisam ter o mesmo tamanho nao-vazio');
  }
  const total = weights.reduce((s, w) => s + w, 0);
  if (total <= 0) throw new Error('pickWeighted: soma dos pesos precisa ser > 0');
  const r = rng() * total;
  let acc = 0;
  for (let i = 0; i < arr.length; i++) {
    acc += weights[i];
    if (r <= acc) return arr[i];
  }
  return arr[arr.length - 1];
}

/**
 * Retorna um inteiro entre min (inclusivo) e max (inclusivo).
 */
export function intBetween(min: number, max: number, rng: () => number): number {
  if (min > max) throw new Error('intBetween: min > max');
  return min + Math.floor(rng() * (max - min + 1));
}

/**
 * Verifica se um evento com determinada probabilidade ocorre.
 * @param percent 1–100
 */
export function chance(percent: number, rng: () => number): boolean {
  if (percent < 0 || percent > 100) throw new Error('chance: percent deve ser 0–100');
  return rng() * 100 < percent;
}
