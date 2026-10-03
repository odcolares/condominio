# duracao-validade-acessos - Work Plan

## TL;DR (For humans)

**What you'll get:** The system will report, for each access record, how long that person has been on-site, cap a visitor stay at 24h, let a resident declare a service job in days (with the end date computed for them), and surface a flag when a record is past its validity — without ever kicking anyone out, flipping their presence/active status, or blocking the gate.

**Why this approach:** Duration and expiry are computed at read time from data the system already has, so the existing seeded JSON store is never migrated. Expiry is a warning, not an action, because an extended job should never be cut by a timer.

**What it will NOT do:** Auto-expire a visitor or service worker, change their presence/active flag, block entry at the gate, run a background scheduler, or rewrite the database schema.

**Effort:** Medium
**Risk:** Medium — pairing spans three recording paths and the 24h auto-close must be idempotent.
**Decisions to sanity-check:** Visitor stays auto-close at 24h; service validity is declared in days; past-validity shows a flag but never blocks the gate.

Your next move: approve to start work (`$start-work`), or run the high-accuracy review first. Full execution detail follows below.

---

> TL;DR (machine): Medium/Medium — derived stay-duration + 24h visitor cap + N-day service validity + signal-only expiry, no cron, no migration.

## Scope
### Must have
- Pure helper `src/lib/duracao.ts` exposing `emparelharAcessos(acessos)` that, per access record, derives `duracao_minutos` and `em_aberto` by pairing `entrada`/`saida` events on `(tipo_pessoa, pessoa_id)`, sorting inputs by `registrado_em` (UTC), and tolerating orphans/overlaps/out-of-order records.
- `GET /acessos` returns the derived `duracao_minutos` + `em_aberto` per item WITHOUT changing pagination semantics (pair on the full filtered set BEFORE `skip`/`limit`).
- Visitor 24h rule: an `entrada` for `tipo_pessoa="visitante"` auto-closes with a synthesized `saida` 24h later (idempotent, lazy on read; never a duplicated `saida`).
- Service validity in N days: `POST /prestadores` accepts EITHER `data_fim` (explicit) OR `prazo_dias` (N); when `prazo_dias` is given, the server computes `data_fim = data_inicio + N` (UTC date math consistent with `dashboard.ts:10`). If neither is provided, 422.
- Signal-only expiry: `GET /prestadores/:id`, `GET /visitantes/:id`, and list responses expose a computed `expirado` boolean (and where useful `dias_restantes`); it never mutates `presente`/`ativo` and never blocks a gate operation.
- Minimal test command for the pure helper using Node's built-in `node:test` (no new dependency).

### Must NOT have (guardrails, anti-slop, scope boundaries)
- MUST NOT auto-expire a visitor/prestador, flip `presente` to false, or set `ativo=false` when validity lapses.
- MUST NOT block entry/saida at the gate.
- MUST NOT add a scheduler, cron, or background worker.
- MUST NOT introduce a migration framework for `InMemoryDB`; new derived fields are computed, never persisted.
- MUST NOT refactor the inconsistent `acessos` array insertion order (`unshift` vs `push`) unless a todo requires it.
- MUST NOT change encomendas, reservas, ocorrencias, restricoes, portal, veiculos, moradores beyond what is needed to surface derived fields.
- MUST NOT silently break `POST /prestadores` clients: existing callers that send `data_fim` must keep working.

## Verification strategy
> Zero human intervention - all verification is agent-executed.
- Test decision: tests-after + Node built-in `node:test` / `node:assert` (NO new dependency; `@types/node@22` is already a devDependency)
- Evidence: `.omo/evidence/task-<N>-duracao-validade-acessos.txt`
- Build gate: `npm run build` (tsc) must exit 0 after every wave
- Test gate: `npm test` must exit 0 once the helper tests exist

## Execution strategy
### Parallel execution waves
- Wave 1 (independent): Todo 1, Todo 2 — pairing helper/tests + prestador prazo_dias
- Wave 2 (blocked by Wave 1): Todo 3 [by 1], Todo 4 [by 1], Todo 5 [by 2], Todo 6 [by 1]
- Wave 3 (blocked by Wave 2): Todo 7

### Dependency matrix
| Todo | Depends on | Blocks | Can parallelize with |
| --- | --- | --- | --- |
| 1 | — | 3,4,6 | 2 |
| 2 | — | 5 | 1 |
| 3 | 1 | 7 | 4,5,6 |
| 4 | 1 | 7 | 3,5,6 |
| 5 | 2 | 7 | 3,4,6 |
| 6 | 1 | — | 3,4,5 |
| 7 | 3,4,5 | — | — |

## Todos
> Implementation + Test = ONE todo. Never separate.
<!-- APPEND TASK BATCHES BELOW THIS LINE WITH edit/apply_patch - never rewrite the headers above. -->
- [ ] 1. Create pure duration-pairing helper with tests
  What to do / Must NOT do: Create `src/lib/duracao.ts` exporting `emparelharAcessos(acessos: Acesso[])` that, per access, derives `duracao_minutos` and `em_aberto` by pairing `entrada`/`saida` on `(tipo_pessoa, pessoa_id)`. Sort inputs by `registrado_em` (UTC epoch ms) before pairing — never rely on array index (`acessos.ts:48` uses `push` while `visitantes.ts:263` uses `unshift`, so order is inconsistent). MUST handle: orphan saida (0/null duration, no throw), multiple overlapping entradas (pair within the same open window), out-of-order records, and registros for `morador`/`funcionario` (no presence flag in types.ts — pairing still applies). MUST NOT mutate the input array; MUST NOT persist anything. Co-create `src/lib/duracao.test.ts` with `node:test`/`node:assert`.
  Parallelization: Wave 1 | Blocked by: none | Blocks: 3,4,6
  References (executor has NO interview context - be exhaustive): src/types.ts:57-66 (Acesso), src/routes/acessos.ts:36-46 (Acesso construction), src/routes/visitantes.ts:233-273 (entrada) + :275-297+ (saida), src/routes/prestadores.ts:185-218 (entrada) + :221-250 (saida), src/routes/acessos.ts:24-68 (POST /acessos path), src/db.ts:112-128 (save)
  Acceptance criteria (agent-executable): `npx tsx --test src/lib/duracao.test.ts` exits 0; asserts a closed entrada+saida pair yields `duracao_minutos === (saida - entrada)/60000`; asserts `em_aberto === true` for an entrada with no saida; asserts an orphan saida yields null/0 duration and does NOT throw.
  QA scenarios (name the exact tool + invocation): happy + failure, Evidence .omo/evidence/task-1-duracao-validade-acessos.txt
    - happy: closed entrada+saida pair returns correct `duracao_minutos`
    - failure: orphan saida returns null duration, does NOT throw
  Commit: Y | feat(acessos): adiciona helper puro de pareamento de duração

- [ ] 2. Accept `prazo_dias` (N) on POST /prestadores and compute data_fim
  What to do / Must NOT do: In `POST /prestadores` (src/routes/prestadores.ts:64-110), accept EITHER `data_fim` (explicit YYYY-MM-DD) OR `prazo_dias` (positive integer N). When `prazo_dias` is present, compute `data_fim = addDaysUTC(data_inicio, N)` matching the UTC convention at src/routes/dashboard.ts:10 (`Date.UTC(...)`). When neither is present, keep the existing 422 at src/routes/prestadores.ts:73. Existing clients that send `data_fim` MUST keep working (no breaking change). Mirror the same acceptance in `PUT /prestadores/:id` (src/routes/prestadores.ts:138-170). MUST NOT auto-set `ativo`/`presente`.
  Parallelization: Wave 1 | Blocked by: none | Blocks: 5
  References: src/routes/prestadores.ts:64-110 (POST), src/routes/prestadores.ts:138-170 (PUT), src/types.ts:95-118 (Prestador), src/routes/dashboard.ts:10 (UTC day-boundary convention)
  Acceptance criteria: `npm run build` exits 0; a POST with `prazo_dias=3` + `data_inicio=2026-10-03` yields `data_fim=2026-10-06`; a POST with `data_fim` directly is still accepted; a POST with neither returns 422.
  QA scenarios: happy + failure, Evidence .omo/evidence/task-2-duracao-validade-acessos.txt
    - happy: prazo_dias=3 → data_fim = data_inicio + 3 days (UTC)
    - failure: neither data_fim nor prazo_dias → 422
  Commit: Y | feat(prestadores): aceita prazo_dias e calcula data_fim

- [ ] 3. Expose derived duration on GET /acessos without breaking pagination
  What to do / Must NOT do: In `GET /acessos` (src/routes/acessos.ts:70-103), compute pairing on the FULL filtered set BEFORE `skip`/`limit` is applied — the current code slices at :100, which would pair against a partial slice and corrupt durations spanning a page boundary. Attach `duracao_minutos` and `em_aberto` to each item. Keep existing filters (:71-75) and pagination (:76-77, :99-100) semantics identical for clients that ignore the new fields. MUST NOT change the newest-first sort or the default limit=100.
  Parallelization: Wave 2 | Blocked by: 1 | Blocks: 7
  References: src/routes/acessos.ts:70-103, src/lib/duracao.ts (new, Todo 1), src/types.ts:57-66
  Acceptance criteria: a test run exits 0; a closed entrada+saida pair straddling a page boundary yields the SAME `duracao_minutos` regardless of `skip`/`limit`; items-per-page and filter results are unchanged.
  QA scenarios: happy + failure, Evidence .omo/evidence/task-3-duracao-validade-acessos.txt
    - happy: duration correct even when entrada is on page 1 and saida on page 2
    - failure: empty acessos list returns empty array without throwing
  Commit: Y | feat(acessos): expõe duração derivada sem quebrar paginação

- [ ] 4. Visitor 24h auto-saida, idempotent and lazy
  What to do / Must NOT do: In `src/lib/duracao.ts`, add `autoSaidas24h()`: for every `entrada` of `tipo_pessoa="visitante"` with no matching `saida` and `now >= entrada.registrado_em + 24h`, synthesize a `saida` dated `entrada.registrado_em + 24h`. This caps derived `duracao_minutos` at 1440 and flips `em_aberto` to false after 24h. Idempotent: running twice must NOT duplicate the saida (key on entrada id + 24h). Lazy on read — NO cron. MUST NOT write the synthesized saida back into `db.acessos` (derived, not persisted). MUST NOT set `visitante.presente=false`.
  Parallelization: Wave 2 | Blocked by: 1 | Blocks: 7
  References: src/routes/visitantes.ts:233-273 (entrada), src/routes/visitantes.ts:275-297+ (saida), src/lib/duracao.ts (new), src/types.ts:40-55 (Visitante)
  Acceptance criteria: an entrada dated >24h ago yields `duracao_minutos === 1440` and `em_aberto === false`; running the derivation twice yields a single synthesized saida (no duplicate); an entrada <24h ago yields `em_aberto === true` and `duracao_minutos < 1440`.
  QA scenarios: happy + failure, Evidence .omo/evidence/task-4-duracao-validade-acessos.txt
    - happy: entrada 25h ago → duracao 1440min, em_aberto false
    - failure: running twice does NOT duplicate the saida
  Commit: Y | feat(visitantes): duração de 24h com saída auto-derivada

- [ ] 5. Signal-only expiry on prestador/visitor responses
  What to do / Must NOT do: Add a computed `expirado` boolean (and `dias_restantes` where useful) to `GET /prestadores/:id`, the `GET /prestadores` list items, `GET /visitantes/:id`, and `GET /visitantes` list items. For prestadores: `expirado = today_UTC > data_fim` (data_fim now computable from prazo_dias via Todo 2). For visitantes: `expirado = now > entrada + 24h` via the derived accessor from Todo 4. MUST NOT set `presente=false`, MUST NOT set `ativo=false`, MUST NOT return 403 or block any gate operation. `POST /acessos` (src/routes/acessos.ts:24-68), `POST /visitantes/:id/entrada|saida`, `POST /prestadores/:id/entrada|saida`, and `POST /portal/preautorizacao` MUST keep working regardless of `expirado`.
  Parallelization: Wave 2 | Blocked by: 2 | Blocks: 7
  References: src/routes/prestadores.ts:117+ (GET /:id) + list handler, src/routes/visitantes.ts list + GET, src/types.ts:95-118 (Prestador data_fim), src/routes/dashboard.ts:10 (UTC), src/types.ts:40-55 (Visitante)
  Acceptance criteria: a prestador with `data_fim` in the past returns `expirado: true` AND is still returned with HTTP 200, `presente`/`ativo` UNCHANGED; a visitor whose 24h window passed returns `expirado: true` yet `POST /acessos` still creates a new acesso normally.
  QA scenarios: happy + failure, Evidence .omo/evidence/task-5-duracao-validade-acessos.txt
    - happy: expirado=true surfaced, record still returned 200
    - failure: an expired record still allows POST /acessos (not blocked)
  Commit: Y | feat(expiry): sinaliza expiração sem bloquear ou auto-expirar

- [ ] 6. Wire `npm test` to run the pure-helper tests
  What to do / Must NOT do: Add `"test": "tsx --test src/**/*.test.ts"` to `package.json` — `tsx` 4.x and `@types/node` 22 are already devDependencies, so NO new package. Ensure `npx tsx --test src/lib/duracao.test.ts` exits 0. MUST NOT add vitest/jest. MUST NOT break `npm run build` or `npm run dev`.
  Parallelization: Wave 2 | Blocked by: 1 | Blocks: —
  References: package.json, tsconfig.json
  Acceptance criteria: `npm test` exits 0 and runs at minimum `src/lib/duracao.test.ts`; `npm run build` still exits 0.
  QA scenarios: happy + failure, Evidence .omo/evidence/task-6-duracao-validade-acessos.txt
    - happy: npm test runs the helper tests and exits 0
    - failure: a deliberately failing assertion makes `npm test` exit non-zero (proves the harness works)
  Commit: Y | chore(test): adiciona script de teste com node:test

- [ ] 7. Update README with the new duration/validity behavior
  What to do / Must NOT do: Add a short section to `README.md` documenting: derived `duracao_minutos`/`em_aberto` on `GET /acessos`, the 24h visitor window, `prazo_dias` on `POST /prestadores`, and signal-only `expirado`. Keep the existing "12 routers / 13 pages" framing. MUST replace the old note that stay time is "not calculated" with the new behavior. MUST NOT remove it without replacement.
  Parallelization: Wave 3 | Blocked by: 3,4,5 | Blocks: —
  References: README.md (current), src/routes/acessos.ts, src/routes/visitantes.ts, src/routes/prestadores.ts
  Acceptance criteria: `npm run build` exits 0; `README.md` contains "duracao_minutos" (or "duração"), "prazo_dias", and "expira"; the old "not calculated" note is gone.
  QA scenarios: happy + failure, Evidence .omo/evidence/task-7-duracao-validade-acessos.txt
    - happy: README documents the new fields and build passes
    - failure: removing the prazo_dias mention is caught by the grep assertion
  Commit: Y | docs(readme): documenta duração, validade e expiração

## Final verification wave
> Runs in parallel after ALL todos. ALL must APPROVE. Surface results and wait for the user's explicit okay before declaring complete.
- [ ] F1. Plan compliance audit
- [ ] F2. Code quality review
- [ ] F3. Real manual QA
- [ ] F4. Scope fidelity

## Commit strategy
- One conventional commit per todo, e.g. `feat(acessos): ...`, `chore(test): ...`, `docs(readme): ...`
- All commits on `main` (no feature branch unless the user asks)
- Pre-commit check: `npm run build` must exit 0

## Success criteria
- `npm run build` (tsc) exits 0
- `npm test` exits 0 and runs the pure-helper tests (`src/lib/duracao.test.ts`)
- `GET /acessos` returns `duracao_minutos` + `em_aberto` per item, with pagination, filters, and newest-first sort unchanged
- A visitor whose `entrada` is >24h old reports `duracao_minutos === 1440` and `em_aberto === false`, derived idempotently
- `POST /prestadores` accepts `prazo_dias` and computes `data_fim`, while direct `data_fim` keeps working (422 only when neither is sent)
- Expired records return `expirado: true`, remain HTTP 200, keep `presente`/`ativo` unchanged, and still allow `POST /acessos`
- `README.md` documents the new duration/validity/expiry behavior
