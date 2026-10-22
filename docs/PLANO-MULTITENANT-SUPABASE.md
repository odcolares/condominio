# Plano: Isolamento Multi-Tenant no Supabase + Demo com 3 Bases

**Escopo:** stack 100% gratuita (Render Free + Supabase Free) para demonstração e vídeo.
**Motivo:** hoje todas as coleções vivem em um único `database.json`, sem qualquer conceito de condomínio/tenant — o que impede demonstrar 3 bases isoladas.

---

## 1. Diagnóstico (verificado no código)

| Fato | Evidência | Consequência |
|---|---|---|
| Não existe `condominio_id`/tenant | **0 ocorrências** em `src/` (grep por `condominio_id\|tenant\|tenant_id`) | Todas as 14 coleções num array global |
| 14 coleções em `database.json` | 17 KB total — 2 a 3 registros cada | Dataset minúsculo → cache hidratado é viável |
| 254 pontos de coleta de dados | `db.moradores` (45), `db.visitantes` (17), `db.veiculos` (16), `db.prestadores` (13) | Reescrever tudo = 2–4 semanas |
| Rotas usam **só métodos de array** | `find` 65 · `filter` 26 · `push` 21 · `splice` 10 · `findIndex` 10 · `unshift` 5 · `map` 4 · `length` 3 · `some` 3 · `forEach` 1 | **Proxy é viável** sem tocar nas rotas |
| Senhas em texto puro | `senha_hash: "123"` (seed, `src/db.ts:174`) | Risco de segurança |
| Credenciais no HTML público | `login.html` linhas 65–91 | Passaporte de entrada para viewers do vídeo |
| `mockup-dashboard.png` inexistente | referenciado em `landing.html:600` | Imagem quebrada na landing |
| `render.yaml` usa `npm install` | sem `healthCheckPath` | Build não reprodutível; sem health check |
| `DATABASE_URL` já previsto | `.env.example` linha 2, vazio | Ponto de conexão a preencher |

---

## 2. Restrição que define a arquitetura

> "**Limit of 2 active projects.**" — https://supabase.com/pricing

3 projetos = 3 bancos via projetos está **bloqueado no Free**. Duas saídas avaliadas:

| | **Schema-per-tenant** ✅ | `CREATE DATABASE` (3 bancos) |
|---|---|---|
| Supabase | **Documentado** (https://supabase.com/docs/guides/api/using-custom-schemas) | Fora da plataforma (https://supabase.com/docs/guides/troubleshooting/manually-created-databases-are-not-visible-in-the-supabase-dashboard-4415aa) |
| Dashboard / Backup / Auth / PostgREST | ✅ | ❌ |
| Isolamento | Schema + **role por tenant** | Mais forte, mas sem recursos de plataforma |
| Esforço | 2–4 dias | 2–4 semanas |
| Free (2 projetos) | 1 projeto | 1 projeto |

**Decisão: schema-per-tenant.** Três schemas num único database `postgres`.

---

## 3. Arquitetura de conexão

Render é **IPv4**; a conexão direta no Supabase é **IPv6-only** → só o pooler serve.

| Modo | Host:Port | Free | Uso |
|---|---|---|---|
| Direct | `db.[REF].supabase.co:5432` | IPv6 ❌ | — |
| **Shared pooler, transaction** | `aws-[IDX]-[REGION].pooler.supabase.com:6543` | **IPv4 ✅** | **✅ escolhido** |
| Shared pooler, session | `aws-[IDX]-[REGION].pooler.supabase.com:5432` | IPv4 ✅ | fallback |

Transaction mode exige `BEGIN`/`COMMIT` explícito (para `SET LOCAL search_path`) e `prepare: false`.

Limites do compute **Nano (free)**: 60 max DB connections · 200 max pooler clients → um pool `max: 2` compartilhado serve os 3 tenants folgado.

---

## 4. Desenho do núcleo

### 4.1 `src/tenant.ts` — contexto do tenant

`AsyncLocalStorage<TenantCtx>` com `{ condominioId, schema, role }` + `runWithTenant(ctx, fn)`. Propaga automaticamente por todo o async call chain — **sem tocar em nenhuma rota**.

### 4.2 `src/db.ts` — Proxy (ponto crítico)

Preserva a sintaxe `db.moradores` intacta. O Proxy resolve a coleção do tenant ativo e devolve um **array-em memória hidratado**; mutações (`push`/`splice`/`unshift`) disparam persistência no schema correto.

> **Por que memória e não query-por-request:** o dataset é de 17 KB e as rotas usam semântica de array (`find`, `filter`). Trocar para SQL por request reescreveria as 254 referências. O cache hidratado mantém a arquitetura e faz a Fase 1 (isolamento) chegar antes da Fase 2 (persistência).

### 4.3 `src/auth.ts` — tenant no token

O JWT passa a carregar `condominio_id` + `role` do Postgres. `authMiddleware` popula o `AsyncLocalStorage` via `runWithTenant`.

### 4.4 Isolamento real (2 camadas)

1. **Role por tenant** no Postgres + `GRANT` restrito → um bug de query não vaza entre schemas.
2. **RLS** como rede de segurança (https://supabase.com/docs/guides/database/postgres/row-level-security.md).

---

## 5. Fases de execução

### Fase 1 — Isolamento multi-tenant (~1 dia) — entregável principal

1. `migrations/001_tenants.sql` — schema + role por tenant + 14 tabelas + índices + `GRANT` + RLS.
2. `src/tenant.ts` — ALS + `runWithTenant`.
3. `src/db.ts` → Proxy — **as 254 referências das rotas não mudam**.
4. `src/auth.ts` — `condominio_id` no JWT; seed com 3 admins (um por condomínio).
5. `src/routes/*.test.ts` — testes de isolamento: tenant A não enxerga dados do tenant B.

### Fase 2 — Persistência real no Supabase (~1–1,5 dia)

6. `src/lib/pg.ts` — pool `pg`: `max: 2`, `ssl: require`, `prepare: false`, porta 6543.
7. `src/repos/*` — 1 repo por entidade: `BEGIN` → `SET LOCAL search_path` → query → `COMMIT`.
8. **Fallback controlado** — Postgres fora do ar → seed em memória (demo não quebra) + log de alerta. **Leads sem fallback silencioso**: lead perdido é lead perdido.

### Fase 3 — Demo com 3 bases (~0,5 dia)

9. Seed com 3 datasets realistas e distintos: *Jardim das Acácias* (48 un.) · *Torres do Sol* (120 un.) · *Parque das Águas* (32 un.) — moradores, veículos, visitantes, encomendas, ocorrências próprios.
10. Frontend: nome do condomínio no header/dashboard; 3 contas de login.

### Fase 4 — Anti-pausa / anti-cold-start (~0,5 dia)

11. UptimeRobot (free, 5 min) → `/api/health`: mantém o Render **acordado** (elimina spin-down de 15 min) **e** gera atividade no Postgres (evita pausa de 7 dias do Free).
12. GitHub Actions agendado como ping **backup** (Actions é gratuito, não depende de terceiro).
13. `render.yaml`: `npm ci` (não `install`), `healthCheckPath: /api/health`, `plan: free`.

### Fase 5 — Higiene (~0,5 dia)

14. Gerar `public/mockup-dashboard.png` (imagem referenciada e ausente).
15. Hash de senha com `node:crypto` `scrypt` — **zero dependência nova** — + migração do seed.
16. Consentimento LGPD obrigatório no form da landing + validação server-side (`consentimento_lgpd` + timestamp no `Lead`).
17. Remover credenciais do `login.html` público.
18. Rate limit simples em `POST /leads`.

---

## 6. Fora de escopo (e por quê)

| Item | Motivo |
|---|---|
| RLS por `condominio_id` (row-per-tenant) | Não é o desenho escolhido; schema-per-tenant já isola |
| Billing / planos por condomínio | Entra com o 1º cliente pagante |
| Migração do histórico `database.json` | Não há dado real — só seed; vira seed do tenant "Acácias" |
| Migrar as 14 tabelas para `pg`/Prisma | Reescreveria as 254 referências; ganho real baixo nesse estágio |

---

## 7. Riscos e mitigações

| Risco | Impacto | Mitigação |
|---|---|---|
| Migração SQL das 14 entidades é o gargalo | Atraso na Fase 1 | Tabelas criadas por template; seed só dos 3 tenants |
| **Schema não isola permissões sozinho** | Vazamento entre tenants | Role por tenant + `GRANT` restrito + RLS |
| Ping anti-pausa é mitigação, não garantia | Pausa de 7 dias / spin-down | Camadas: UptimeRobot + Actions + aquecer antes de gravar + fallback em memória |
| Free: 60 conexões / pooler | Exaustão sob carga | `max: 2`, transaction mode, 1 pool compartilhado |
| Proxy sobre arrays: mutação sem `save()` | Dado não persistido | `db.save()` auditado nos testes; hook de auto-persist no Proxy |
| `db.ts` tocado em 43 chamadas de `save()` | Regressão | Testes de integração existentes (`src/routes/*.test.ts`) como rede |

---

## 8. Critérios de aceite

- [ ] Login com 3 contas → cada uma vê **exclusivamente** os dados do seu condomínio
- [ ] Nenhum dado do tenant A aparece nas respostas do tenant B (verificado por teste automatizado)
- [ ] Postgres pausado/fora → app **continua servindo** (fallback em memória) e registra alerta
- [ ] Lead enviado pela landing **persiste** após restart da instância
- [ ] `npm run build` e `npm test` passam no CI
- [ ] `curl /api/health` responde < 200 ms
- [ ] Custo total: **$0**

---

## 9. Dependências

**1 nova:** `pg` + `@types/pg`. Hash de senha usa `node:crypto` (nada novo). Seed usa `node:crypto` para aleatoriedade.

---

## 10. Decisões em aberto (para o momento da execução)

1. **Leads**: globais (funil comercial único) ou por tenant? → *recomendo globais, com `condominio_id` de origem quando aplicável*
2. **Porte dos tenants**: 3 ou mais condomínios à vontade? → *o esquema é dinâmico; 3 é o mínimo da demo*
3. **Nome do schema**: `acacias` / `torres_sol` / `parque_aguas` (snake_case) vs. prefixo `t_` → *recomendo snake_case sem prefixo*
4. **Upgrade pago**: Supabase Pro ($25) + Render Starter ($7) no 1º cliente pagante — sem reescrever backend



