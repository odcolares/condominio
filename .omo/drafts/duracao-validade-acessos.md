---
slug: duracao-validade-acessos
status: approved
intent: clear
pending-action: write .omo/plans/duracao-validade-acessos.md
approach: Derived-on-read duration (pure helper, no schema change), plus visitor 24h auto-saida, plus N-day service validity computed from data_inicio, plus signal-only expiry. Test infrastructure must be created (repo has none).
approval: user said "Plano aprovado" then "Siga o plano e as minimas recomendacoes" -> 1a + 2a + 3a adopted, all defaults accepted
---

# Draft: duracao-validade-acessos

## Components (topology ledger)
<!-- id | outcome (one line) | status | evidence path -->
| id | outcome | status | evidence |
| --- | --- | --- | --- |
| C1 | Pure duration-pairing helper (`emparelharAcessos`) returns `duracao_minutos` + `em_aberto` per access, computed on read, no persistence | active | src/routes/acessos.ts:70-103 |
| C2 | Expose derived duration on `GET /acessos` WITHOUT breaking pagination/filter semantics | active | src/routes/acessos.ts:82-102 |
| C3 | Visitor 24h auto-`saida`: idempotent, generated at entrada+24h | active | src/routes/visitantes.ts:233-273 |
| C4 | Service validity: N days -> compute `data_fim` from `data_inicio` | active | src/routes/prestadores.ts:67-73,139-166 |
| C5 | Expiry signal only (never auto-expire, never flip presente/ativo, never block gate) | active | user decision 3a |
| C6 | Minimal test infrastructure for the pure helper | active | package.json (no test script) |

## Open assumptions (announced defaults)
<!-- assumption | adopted default | rationale | reversible? -->
| Test strategy | tests-after with a minimal runner, covering ONLY the pure helper | repo has zero test infra; pairing logic is exactly the kind that breaks silently | yes |
| Duration representation | computed field on the response item, NOT persisted | InMemoryDB has no migration path (src/db.ts:69,83); persisted field would be `undefined` on all seeded records | yes |
| Expiry signal representation | computed response field (e.g. `dias_restantes`, `expirado`) rather than a persisted boolean flag | avoids the same no-migration problem; `ativo` already exists as a manual flag independent of dates | yes |
| Where auto-saida is generated | lazily on read, not by a background cron | repo has no scheduler/cron infrastructure at all; adding one is out of scope | yes |

## Findings (cited - path:lines)
- `GET /acessos` paginates BEFORE any pairing is possible: `resultado.slice(skip, skip+limit)` at src/routes/acessos.ts:100, sort at :99. Pairing MUST run on the full filtered set before slice, or durations will be wrong at page boundaries. THIS IS THE MAIN ARCHITECTURAL CONSTRAINT.
- The `acessos` array has INCONSISTENT insertion order across 3 code paths: `visitantes.ts:263` and `visitantes.ts:297` use `db.acessos.unshift(...)` (newest first), while `acessos.ts:48` and `prestadores.ts` use `db.acessos.push(...)` (newest last). Pairing CANNOT rely on array index; it must sort by `registrado_em`.
- `Acesso` has no duration field today: src/types.ts:57+ = `{ id, tipo_pessoa, pessoa_id, nome, sentido, placa_veiculo, vaga, observacao, registrado_em }`.
- `Visitante` (src/types.ts:40-55) has `presente`, `agendado_para`, `criado_em` — NO validity/expiry field.
- `Prestador` (src/types.ts:95-118) ALREADY has `data_inicio`, `data_fim` (both `YYYY-MM-DD`), `horario_permitido`, `presente`, `ativo`. These are INERT: nothing anywhere compares `data_fim` to the current date. There is no `vigente`/`expirado`/`dias_restantes` concept in the codebase.
- No migration path: src/db.ts:69 `this.acessos = parsed.acessos || []`, src/db.ts:83 `nextAcessoId = parsed.nextAcessoId || (len+1)`. New fields on existing records are `undefined`.
- Only `visitante` and `prestador` get `presente` toggled. `POST /acessos` src/routes/acessos.ts:51-64 handles visitante + prestador only; `morador` and `funcionario` have no presence flag at all.
- `POST /acessos` (src/routes/acessos.ts:24-68) is a 4th creation path requiring only `tipo_pessoa`, `pessoa_id`, `sentido`; `resolverNome` (:8-22) returns `""` for unknown -> 404.
- Visitor entrada handler: src/routes/visitantes.ts:233-273. Saida handler: src/routes/visitantes.ts:275-297+. Both `unshift` and always set `presente`.
- `POST /prestadores` REQUIRES client to send both `data_inicio` AND `data_fim`: src/routes/prestadores.ts:73 returns 422 otherwise. Decision 2a (compute from N days) therefore CONFLICTS with an existing validated public endpoint -> potential breaking change.
- Timezone hazard: `Acesso.registrado_em` is a full ISO timestamp; `Prestador.data_inicio`/`data_fim` are bare `YYYY-MM-DD`. Comparing a bare date string against an ISO timestamp is a UTC-vs-local hazard. Dashboard already aggregates acessos and must be checked for its day-boundary convention.
- Repo has NO test infrastructure (no test script in package.json), no scheduler/cron.

## Decisions (with rationale)
- DURATION: derived on read via a PURE helper, never persisted. Rationale: db.ts has no migration path, so a persisted `duracao_minutos` would be `undefined` across all seeded records; the access log is append-only so pairing is reliable. Reversible.
- VISITOR 24h: auto-register `saida` at entrada+24h (user decision 1a). Single `entrada` produces a `saida`, so history closes without depending on the gate operator.
- SERVICE N DAYS: system computes `data_fim = data_inicio + N` (user decision 2a) rather than the resident typing a date; eliminates wrong-typed dates.
- EXPIRY: signal only (user decision 3a) — flag, never auto-expire, never flip `presente`/`ativo`, never block entry. Rationale: expiring or blocking interferes with legitimately extended service work; that is an owner product decision, not an implementation detail.

## Scope IN
- Pure duration-pairing helper + exposure on `GET /acessos`
- Visitor 24h auto-`saida`
- N-day service validity computed from `data_inicio`
- Signal-only expiry surface
- Minimal test setup for the pure helper
- README update for the new behavior

## Scope OUT (Must NOT have)
- MUST NOT auto-expire a visitor/prestador, flip `presente`/`ativo`, or block entry at the gate.
- MUST NOT add a scheduler/cron/background worker.
- MUST NOT invent a migration framework for `InMemoryDB`.
- MUST NOT change unrelated modules (encomendas, reservas, ocorrencias, restricoes, portal, veiculos, moradores, dashboard) beyond the minimum needed to surface the new fields.
- MUST NOT refactor `acessos` array insertion order (pre-existing inconsistency) unless a todo explicitly requires it.

## Open questions
- (none blocking — user approved 1a/2a/3a and "minimas recomendacoes")
- Surfaced for the record: 2a is a breaking change to `POST /prestadores`. Metis was asked to assess. Plan will keep `data_fim` optional-on-write (accept both N days and an explicit date) to avoid breaking existing clients, unless Metis finds a stronger argument.

## Approval gate
status: approved
approved-by: user — "Plano aprovado" + "Siga o plano e as minimas recomendacoes e quaisquer ajustes iremos fazendo apos as validacoes"
recorded: 2026-10-03
next: await Metis gap analysis (bg_9695c303), fold findings, APPEND todos, fill TL;DR last, then present summary and ask start-or-high-accuracy-review.
