# Changelog — AMBROS

> Registro de alterações do projeto **AMBROS — Sistema Inteligente de Controle
> de Acesso para Condomínios**.
> Formato baseado em [Keep a Changelog](https://keepachangelog.com/pt-BR/1.1.0/),
> versão [SemVer](https://semver.org/lang/pt-BR/).

---

## [Unreleased]

### Adicionado — 2026-07-22 (sessão de organização e planejamento)

#### Reorganização do workspace

Os 2 arquivos `.md`/`.html` que estavam soltos na raiz do workspace
(`C:\...\Ambros\`) foram reorganizados dentro do projeto:

| Antigo (raiz do workspace) | Novo local | Notas |
|---|---|---|
| `AMBROS_Controle_de_Acesso.md` | `ambros_projeto/docs/AMBROS_Controle_de_Acesso.md` | Spec original movida para `docs/` |
| `ambros-dashboard.html` | Já existia em `frontend/ambros-dashboard.html` (versão mais recente, com `<a href>` na sidebar) | Cópia da raiz era mockup antigo sem navigation; removida |
| `README.md` (novo) | `Ambros/README.md` | Explica a reorganização e aponta para o projeto real |

Novo diretório `ambros_projeto/docs/` criado para abrigar specs e
referências (pode ser usado para ADRs, RFCs e outras referências).

#### Skills de agentes (`.opencode/skills/`)

Criadas 5 skills operacionais para guiar desenvolvimento, segurança e
evolução do projeto. Cada skill em `SKILL.md` com YAML frontmatter e
progressive disclosure.

| Skill | Arquivo | Função |
|---|---|---|
| `ambros-backend-dev` | `ambros-backend-dev/SKILL.md` | Padrões de código backend FastAPI (routers, models, schemas, CRUD, security) |
| `ambros-frontend-dev` | `ambros-frontend-dev/SKILL.md` | Padrões de frontend HTML/Bootstrap 5/Chart.js (estrutura fixa, variáveis CSS, fetch com Bearer) |
| `ambros-feature-builder` | `ambros-feature-builder/SKILL.md` | Orquestra implementação de feature full-stack (model+schema+router+tela+integração) |
| `ambros-security-guard` | `ambros-security-guard/SKILL.md` | Auditoria de segurança (JWT, CORS, secrets, LGPD, logs, senhas) |
| `ambros-db-migration` | `ambros-db-migration/SKILL.md` | Transição `create_all` → Alembic; criação e revisão de migrations |

**Como invocar:** as skills descrevem triggers no `description`; agentes de
IA ligados a elas devem disparar quando o usuário pedir "padrão do backend",
"auditar segurança do AMBROS", "migrar o banco", "criar feature completa", etc.

#### Documentação de alterações

- `CHANGELOG.md` (este arquivo) — histórico de mudanças em formato Keep a
  Changelog, registrado a partir de 2026-07-22.

### Próximos passos planejados

Plano definido em 2026-07-22 para evoluir o projeto do MVP parcial até produção.

#### P1 — Integrar frontend ↔ backend (~1-2 dias)

Hoje apenas `login.html` faz chamada real à API. As demais telas usam dados
fixos (mock). Esta é a prioridade máxima porque destrava 90% do fluxo do
usuário.

| Tela | Endpoint a consumir | Status |
|---|---|---|
| `ambros-dashboard.html` | `GET /dashboard` | Pendente |
| `moradores.html` | `GET/POST/PUT/DELETE /moradores` | Pendente |
| `portaria-entrada.html` | `GET /moradores?busca=X`, `GET /visitantes?busca=X`, `POST /acessos`, `GET /acessos?limit=5` | Pendente |

#### P2 — Telas restantes do MVP (~1-2 dias)

| Tela | Base | Endpoint | Status |
|---|---|---|---|
| `visitantes.html` | Clonar `moradores.html` | `/visitantes?presentes=true` | Pendente |
| `portaria-saida.html` | Clonar `portaria-entrada.html` | `POST /acessos` (`sentido=saida`) | Pendente |
| `relatorios.html` | Nova com datepickers | `GET /acessos?inicio=..&fim=..` | Pendente |
| `consulta.html` | Nova com busca unificada | `/moradores`, `/visitantes`, `/veiculos` em paralelo | Pendente |

#### P3 — Hardening para produção (~2-3 dias)

| Item | Ação | Skill de referência |
|---|---|---|
| CORS `allow_origins=["*"]` | Restringir para origens confiáveis | `ambros-security-guard` |
| `SECRET_KEY` default | Injetar por variável de ambiente | `ambros-security-guard` |
| `.env` no `.gitignore` | Garantir que não seja versionado | `ambros-security-guard` |
| Senha admin `123` | Forçar troca no primeiro login ou remover do seed | `ambros-security-guard` |
| Rate limiting no `/auth/login` | Adicionar `slowapi` (5 tentativas/min) | `ambros-security-guard` |
| Headers de segurança | Middleware com `X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy` | `ambros-security-guard` |
| Migrações Alembic | Substituir `Base.metadata.create_all` por Alembic versionado | `ambros-db-migration` |
| `datetime.utcnow()` | Migrar para `datetime.now(timezone.utc)` em models e seed | `ambros-backend-dev` |

#### P4 — Ampliar escopo (~1-2 semanas)

- Modelos de **Funcionários** e **Prestadores** (mesmo padrão de `Morador`)
- **Upload de fotos** (multipart + validação MIME/tamanho + servir via rota
  estática com URL assinada)
- **RBAC granular** (`perfil="portaria"`, `"sindico"`, `"morador"` +
  dependência `require_admin`)
- **Log de operação** (`LogOperacao` model para auditoria administrativa)
- **LGPD**: endpoint de exportação de dados, soft delete/anonimização, termo
  de uso visível no login

#### P5 — Visão futura (pós-MVP)

QR Code de entrada, LPR (reconhecimento de placas), OCR de documentos,
notificações WhatsApp, app móvel, integração com controladoras físicas,
refresh token + blacklist de logout, exportar CSV/PDF de relatórios.

---

## [1.0.0] — 2026-07-22

> **Tags:** MVP parcial — backend completo + frontend visual; login integrado,
> demais telas com dados mock.

### Adicionado

#### Backend (FastAPI)

- **Estrutura inicial** em `backend/app/` com `main.py` (app FastAPI + CORS +
  registro de routers), `database.py` (engine SQLAlchemy + `get_db`).
- **5 modelos ORM** (`models.py`): `Usuario`, `Morador`, `Veiculo`,
  `Visitante`, `Acesso` — com enums `VinculoMorador`, `TipoPessoa`,
  `SentidoAcesso`.
- **15 schemas Pydantic v2** (`schemas.py`): pares `Base/Create/Update/Out`
  + `DashboardOut`, `LoginIn`, `TokenOut`, `UsuarioOut`.
- **6 routers**:
  - `auth.py` — `POST /auth/login`, `GET /auth/me`.
  - `moradores.py` — CRUD completo (`GET/POST/PUT/DELETE /moradores`) com
    busca por nome/CPF/bloco, filtro por vínculo, paginação `skip/limit`.
  - `visitantes.py` — CRUD + filtro `presentes=true`.
  - `veiculos.py` — CRUD + filtro por placa/morador.
  - `acessos.py` — `POST` (registra entrada/saída com snapshot de nome;
    atualiza `presente` em visitante) e `GET` (histórico com filtros tipo,
    sentido e período).
  - `dashboard.py` — `GET /dashboard` com cards, movimentação de hoje em
    faixas de 3h, visitantes nos últimos 7 dias e últimos 5 acessos.
- **Segurança** (`security.py`): hash pbkdf2_sha256 com passlib, JWT via
  PyJWT, `get_current_user` validando Bearer token; rotas de dados protegidas
  em `main.py` via `Depends(get_current_user)`.
- **Seed** (`seed.py`): admin padrão (`adm@adm.com` / `123`), 3 moradores,
  2 veículos, 2 visitantes, 4 acessos de exemplo.
- **Dependências** (`requirements.txt`): FastAPI 0.115, uvicorn 0.30.6,
  SQLAlchemy 2.0.35, psycopg2-binary 2.9.9, Pydantic 2.9.2, python-dotenv
  1.0.1, passlib 1.7.4, PyJWT 2.9.0.
- **Configuração** (`.env.example`): `DATABASE_URL` PostgreSQL e fallback
  SQLite, `SECRET_KEY` e `ACCESS_TOKEN_EXPIRE_MINUTES=480`.
- **Documentação Swagger** auto-gerada em `/docs`.

#### Frontend (HTML + Bootstrap 5)

- **`login.html`** — tela de login com card centralizada, gradientes, toggle
  de senha, integração real com `POST /auth/login`; armazena token em
  `localStorage`/`sessionStorage` e redireciona para o dashboard.
- **`ambros-dashboard.html`** — dashboard completo com sidebar escura
  (gradiente `#1b2434` → `#141c29`), 8 cards de métricas, gráfico de linha
  Chart.js (entradas × saídas, faixas de 3h), gráfico de barras (visitantes
  últimos 7 dias), 2 tabelas (últimos acessos, visitantes no condomínio),
  responsivo (breakpoints `1200px` e `768px` com sidebar drawer + overlay).
- **`moradores.html`** — listagem com busca, filtros, paginação, modal
  "Novo Morador" com todos os campos do escopo (nome, CPF, telefone,
  WhatsApp, foto, bloco, apartamento, vínculo, veículo, vaga).
- **`portaria-entrada.html`** — registro de entrada com alternância
  morador/visitante, busca por nome/CPF/placa, relógio ao vivo,
  movimentações recentes.
- **Variáveis CSS** em `:root` compartilhadas entre todas as telas:
  `--sidebar-bg`, `--sidebar-bg2`, `--sidebar-hover`, `--brand-blue`,
  `--text-muted`, `--content-bg`, `--card-radius`.
- **Bibliotecas via CDN**: Bootstrap 5.3.3, Bootstrap Icons 1.11.3,
  Font Awesome 6.5.2, Chart.js 4.4.3.

#### Documentação

- **`README.md`** — visão geral, estrutura, como rodar (backend + frontend),
 Roadmap MVP, próximos passos.
- **`DESENVOLVIMENTO.md`** — documento técnico completo: objetivo,
  tecnologias, estrutura, histórico de desenvolvimento, modelo de dados,
  endpoints da API, autenticação, como rodar, testes realizados, status do
  roadmap e próximos passos.
- **`backend/README.md`** — instruções específicas do backend, endpoints
  principais e próximos passos sugeridos.

### Testes realizados (registrar para posteridade)

- Seed populou o banco: admin, 3 moradores, 2 veículos, 2 visitantes,
  4 acessos.
- CRUD de moradores/visitantes/veículos respondeu corretamente (criação,
  listagem e busca).
- Registro de acesso funcionou e atualizou presença do visitante
  (`presente=True` em entrada, `False` em saída).
- Endpoint `/dashboard` agregou cards, movimentação por faixa de 3h e
  visitantes dos últimos 7 dias.
- Autenticação: acesso sem token bloqueado (401), senha errada recusada
  (401), login correto retornou token JWT e liberou as rotas protegidas.

### Limitações conhecidas em 1.0.0

- CORS atual: `allow_origins=["*"]` — **inadequado para produção**.
- `SECRET_KEY` default no `.env` — **trocar antes de qualquer deploy**.
- Senha admin padrão `123` — **apenas desenvolvimento**.
- Apenas `login.html` faz chamada real à API; as telas internas
  (dashboard, moradores, portaria) ainda usam dados fixos (mock).
- Tabelas criadas via `Base.metadata.create_all` no startup — sem
  versionamento Alembic.
- `datetime.utcnow()` em `models.py` e `seed.py` é deprecado no Python
  3.12+.
- Sem testes automatizados (apenas validação manual via `TestClient` e
  script de seed).
- Cada tela HTML duplica todo o CSS/JS da sidebar/topbar (sem extração
  para `components/` ou arquivo compartilhado).
- Sem upload real de fotos (apenas o campo `foto_url`).
- Sem rate limiting no `/auth/login`.
- Sem RBAC granular (hoje só `perfil="admin"`).

### Roadmap futuro (pós-MVP)

1. **Integração frontend ↔ backend** — substituir mocks das telas por
   `fetch` com `Authorization: Bearer`; começar pelo `/dashboard`.
2. **Telas restantes** — Visitantes, Portaria — Saída, Consulta Rápida,
   Relatórios.
3. **Migrações com Alembic** — ver skill `ambros-db-migration`.
4. **Funcionários e Prestadores** — modelos e CRUD no padrão de
   `Morador`.
5. **Upload de fotos** — armazenamento real com validação MIME/tamanho.
6. **Integrações visionárias** — QR Code, OCR, WhatsApp, LPR (leitura de
   placas), aplicativo móvel.

---

## Como manter este changelog

- **Ordem**: versões mais recentes no topo; dentro de cada versão,
  seções `Adicionado / Alterado / Corrigido / Removido / Segurança`.
- **Tom**: descrição objetiva do que mudou, referenciando arquivo ou módulo.
- **Versionamento**: `MAJOR.MINOR.PATCH` — MAJOR para mudanças incompatíveis,
  MINOR para features compatíveis, PATCH para correções compatíveis.
- **Unreleased**: tudo que ainda não foi "lançado" fica nesta seção até
  um tag ser criada; então mova para uma nova seção `[x.y.z] — AAAA-MM-DD`.
- **Referencie PRs/issues**: se usar GitHub, anexar `(#123)` ao final da
  linha da mudança.
- **Não apagar**: changelog é histórico — mesmo itens obsoletos ficam
  para análise futura.
