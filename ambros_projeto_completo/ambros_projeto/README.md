# AMBROS — Sistema Inteligente de Controle de Acesso

Projeto completo do AMBROS: **frontend** (telas HTML) + **backend** (API FastAPI + PostgreSQL).

## Estrutura do projeto

```
ambros_projeto/
├── frontend/                     # Telas (HTML + Bootstrap 5 + Chart.js)
│   ├── login.html                # Login (consome /auth/login)
│   ├── ambros-dashboard.html     # Dashboard (cards, gráficos, tabelas)
│   ├── moradores.html            # Cadastro/listagem de moradores + modal
│   └── portaria-entrada.html     # Registro de entrada na portaria
│
├── backend/                      # API (FastAPI + SQLAlchemy)
│   ├── app/
│   │   ├── main.py               # app + CORS + routers
│   │   ├── database.py           # conexão (PostgreSQL / SQLite)
│   │   ├── models.py             # moradores, visitantes, veiculos, acessos
│   │   ├── schemas.py            # validação (Pydantic v2)
│   │   ├── seed.py               # dados de demonstração
│   │   └── routers/              # moradores, visitantes, veiculos, acessos, dashboard
│   ├── requirements.txt
│   ├── .env.example
│   └── README.md                 # detalhes do backend
│
└── README.md                     # este arquivo
```

## Status (roadmap do MVP)

| Item | Frontend | Backend |
|------|----------|---------|
| Dashboard | ✅ | ✅ `/dashboard` |
| Cadastro de Moradores | ✅ | ✅ CRUD |
| Cadastro de Visitantes | ⏳ | ✅ CRUD |
| Cadastro de Veículos | ⏳ | ✅ CRUD |
| Portaria — Entrada | ✅ | ✅ `/acessos` |
| Portaria — Saída / Consulta | ⏳ | ✅ (mesmo endpoint) |
| Relatórios | ⏳ | ✅ `/acessos` com filtro de período |
| Login / Autenticação | ✅ | ✅ JWT + admin padrão |

✅ pronto · ⏳ pendente

## Como rodar

### Backend

```bash
cd backend
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env          # ajuste DATABASE_URL (PostgreSQL ou SQLite p/ teste)
python -m app.seed            # dados de exemplo (opcional)
uvicorn app.main:app --reload
```

API + documentação Swagger em **http://localhost:8000/docs**.

> **Acesso padrão** (criado pelo `seed`): `adm@adm.com` / `123`.
> É uma senha de desenvolvimento — troque antes de ir para produção.

### Frontend

As telas são páginas estáticas (HTML + Bootstrap + Chart.js via CDN). Para o login
conversar com o backend, sirva-as por HTTP (abrir como `file://` faz o navegador
bloquear a chamada à API). O modo mais simples usa o próprio Python:

```bash
cd frontend
python -m http.server 5500
```

Depois abra **http://localhost:5500/login.html** e entre com `adm@adm.com` / `123`.

Você precisa dos **dois servidores no ar ao mesmo tempo** (em dois terminais):

- Backend: `uvicorn app.main:app --reload` → `http://localhost:8000`
- Frontend: `python -m http.server 5500` → `http://localhost:5500`

O CORS do backend já está liberado. No VS Code, a extensão *Live Server* faz o
mesmo (botão direito em `login.html` → "Open with Live Server").

> Os dados das telas internas (dashboard, moradores, portaria) ainda são fixos
> (mock) — só o login faz chamada real. O próximo passo é substituir os mocks por
> chamadas `fetch` aos endpoints, enviando o token `Authorization: Bearer`.

## Tecnologias

- **Frontend:** HTML, Bootstrap 5, Bootstrap Icons, Chart.js
- **Backend:** FastAPI, SQLAlchemy 2.0, Pydantic v2
- **Banco:** PostgreSQL (SQLite suportado para testes)

## Próximos passos sugeridos

1. Conectar o frontend ao backend (trocar os mocks por `fetch`).
2. Telas restantes: Visitantes, Saída, Consulta Rápida, Relatórios, Login.
3. Autenticação (JWT) e tela de Login.
4. Migrações com Alembic.
5. Modelos de Funcionários e Prestadores (mesmo padrão do Morador).
