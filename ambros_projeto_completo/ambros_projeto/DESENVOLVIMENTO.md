# AMBROS — Documento de Desenvolvimento

**Projeto:** AMBROS — Sistema Inteligente de Controle de Acesso para Condomínios
**Versão:** 1.0.0
**Data:** 22/07/2026

Este documento registra tudo o que foi desenvolvido no projeto até o momento: objetivo, arquitetura, telas, backend, autenticação, testes realizados, status do roadmap e próximos passos.

---

## 1. Objetivo

O AMBROS é um sistema web para gerenciar o acesso de moradores, visitantes, veículos e prestadores em condomínios, com futura integração às controladoras de acesso físicas. O foco atual é entregar o MVP: login, dashboard, cadastros, controle de entrada/saída e relatórios.

---

## 2. Tecnologias

| Camada | Tecnologia |
|--------|-----------|
| Frontend | HTML, Bootstrap 5, Bootstrap Icons, Chart.js |
| Backend | FastAPI (Python), SQLAlchemy 2.0, Pydantic v2 |
| Autenticação | JWT (PyJWT) + hash de senha (passlib / pbkdf2_sha256) |
| Banco de dados | PostgreSQL (SQLite suportado para testes) |

---

## 3. Estrutura do projeto

```
ambros_projeto/
├── frontend/                     # Telas (HTML)
│   ├── login.html                # Login (consome /auth/login)
│   ├── ambros-dashboard.html     # Dashboard (cards, gráficos, tabelas)
│   ├── moradores.html            # Cadastro/listagem de moradores + modal
│   └── portaria-entrada.html     # Registro de entrada na portaria
│
├── backend/                      # API (FastAPI)
│   ├── app/
│   │   ├── main.py               # app + CORS + registro dos routers
│   │   ├── database.py           # engine/sessão SQLAlchemy
│   │   ├── security.py           # hash de senha + JWT + get_current_user
│   │   ├── models.py             # usuarios, moradores, visitantes, veiculos, acessos
│   │   ├── schemas.py            # validação/serialização (Pydantic)
│   │   ├── seed.py               # dados de demonstração + admin padrão
│   │   └── routers/
│   │       ├── auth.py           # login e /me
│   │       ├── moradores.py      # CRUD
│   │       ├── visitantes.py     # CRUD
│   │       ├── veiculos.py       # CRUD
│   │       ├── acessos.py        # portaria (entrada/saída) + histórico
│   │       └── dashboard.py      # agrega cards e gráficos
│   ├── requirements.txt
│   ├── .env.example
│   └── README.md
│
├── README.md                     # visão geral e como rodar
└── DESENVOLVIMENTO.md            # este documento
```

---

## 4. Histórico do desenvolvimento

O projeto foi construído de forma incremental, seguindo o roadmap do MVP:

1. **Dashboard (frontend).** Recriação fiel do mockup: barra lateral escura com marca AMBROS e menus expansíveis, oito cards de indicadores, gráfico de linha (entradas × saídas), gráfico de barras (visitantes por período) e duas tabelas (últimos acessos e visitantes no condomínio). Responsivo, com Bootstrap 5 e Chart.js.

2. **Telas de cadastro e portaria (frontend).**
   - *Moradores:* listagem com busca e filtros, paginação e modal "Novo Morador" com todos os campos do escopo (nome, CPF, telefone, WhatsApp, foto, bloco, apartamento, vínculo, veículo, vaga).
   - *Portaria — Entrada:* registro rápido com alternância morador/visitante, busca por nome/CPF/placa, seleção de veículo/vaga, relógio ao vivo e movimentações recentes.
   - Navegação da barra lateral ligando as três telas.

3. **Backend (FastAPI + PostgreSQL).** Modelos, schemas e CRUD das entidades centrais; endpoint de portaria para registrar acessos; endpoint de dashboard que agrega exatamente os números e gráficos da tela inicial; script de *seed* com dados de exemplo.

4. **Autenticação e login.** Modelo de usuário com senha protegida por hash, login com token JWT, proteção de todas as rotas de dados, criação do administrador padrão e tela `login.html` integrada ao backend.

---

## 5. Modelo de dados

### Entidades

- **Usuario** — `id, nome, email (único), senha_hash, perfil, ativo, criado_em`
- **Morador** — `id, nome_completo, cpf (único), telefone, whatsapp, bloco, apartamento, vinculo (proprietario/inquilino), foto_url, numero_vaga, ativo, criado_em`
- **Veiculo** — `id, placa, modelo, cor, vaga, morador_id (FK), criado_em`
- **Visitante** — `id, nome, documento, tipo_documento, telefone, foto_url, placa_veiculo, vaga, bloco, apartamento, morador_visitado_id (FK), agendado_para, presente, criado_em`
- **Acesso** — `id, tipo_pessoa (morador/visitante/funcionario/prestador), pessoa_id, nome (snapshot), sentido (entrada/saida), placa_veiculo, vaga, observacao, registrado_em`

### Relacionamentos

- Um **Morador** possui vários **Veículos** (1:N).
- Um **Morador** pode ser visitado por vários **Visitantes** (1:N).
- **Acesso** referencia a pessoa por `tipo_pessoa` + `pessoa_id` e guarda um *snapshot* do nome no momento do registro.
- Registrar entrada/saída de um visitante atualiza automaticamente o campo `presente` (usado no indicador "dentro do condomínio").

---

## 6. API — endpoints

Todas as rotas de dados exigem o cabeçalho `Authorization: Bearer <token>` obtido no login.

| Método | Rota | Autenticação | Descrição |
|--------|------|:---:|-----------|
| POST | `/auth/login` | — | Autentica e retorna token JWT + usuário |
| GET | `/auth/me` | ✔ | Dados do usuário logado |
| GET/POST/PUT/DELETE | `/moradores` | ✔ | CRUD de moradores (busca por nome/CPF/bloco, filtros) |
| GET/POST/DELETE | `/visitantes` | ✔ | CRUD e filtro de quem está no condomínio |
| GET/POST/DELETE | `/veiculos` | ✔ | CRUD de veículos |
| POST | `/acessos` | ✔ | Registra entrada/saída na portaria |
| GET | `/acessos` | ✔ | Histórico com filtro por tipo/sentido/período (relatórios) |
| GET | `/dashboard` | ✔ | Cards + dados dos gráficos da tela inicial |
| GET | `/` | — | Health check |

Documentação interativa (Swagger) disponível em `/docs`.

---

## 7. Autenticação

- Senhas são armazenadas apenas como **hash** (pbkdf2_sha256) — nunca em texto puro.
- O login gera um **token JWT** assinado com a `SECRET_KEY` (configurável por variável de ambiente), com expiração padrão de 8 horas.
- A dependência `get_current_user` valida o token em cada requisição protegida; sem token válido a API responde **401**.
- **Administrador padrão** criado pelo `seed`:
  - E-mail: `adm@adm.com`
  - Senha: `123`

> ⚠️ A senha `123` e a `SECRET_KEY` de exemplo são adequadas apenas para desenvolvimento. Ambas devem ser trocadas antes de qualquer uso em produção.

---

## 8. Como rodar

### Backend

```bash
cd backend
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env          # ajuste DATABASE_URL e SECRET_KEY
python -m app.seed            # cria admin padrão + dados de exemplo
uvicorn app.main:app --reload
```

- API e Swagger: `http://localhost:8000/docs`
- Para teste rápido sem PostgreSQL, use `DATABASE_URL=sqlite:///./ambros.db` no `.env`.

### Frontend

As telas são páginas estáticas. Para o login funcionar com o backend, sirva a pasta por HTTP (não abra como `file://`, senão o navegador bloqueia a chamada à API):

```bash
cd frontend
python -m http.server 5500
```

Acesse `http://localhost:5500/login.html` e entre com `adm@adm.com` / `123`. É preciso ter os dois servidores rodando ao mesmo tempo: o backend (`uvicorn app.main:app --reload`, na porta 8000) e o frontend (`http.server`, na porta 5500). O CORS do backend já está liberado. Alternativa no VS Code: extensão *Live Server*.

Observação: apenas o `login.html` faz chamada real à API. As telas internas ainda usam dados fixos (mock) — a integração via `fetch` é o próximo passo.

---

## 9. Testes realizados

Os componentes do backend foram validados executando de fato (via `TestClient` e o script de seed):

- Seed populou o banco (admin, 3 moradores, 2 veículos, 2 visitantes, 4 acessos).
- CRUD de moradores/visitantes/veículos respondeu corretamente (criação, listagem e busca).
- Registro de acesso funcionou e atualizou a presença do visitante.
- Endpoint de dashboard agregou cards, movimentação por faixa de 3h e visitantes dos últimos 7 dias.
- Autenticação: acesso sem token bloqueado (401), senha errada recusada (401), login correto retornou token e liberou as rotas protegidas.

---

## 10. Status do roadmap (MVP)

| Item | Frontend | Backend |
|------|:---:|:---:|
| Login / Autenticação | ✅ | ✅ |
| Dashboard | ✅ | ✅ |
| Cadastro de Moradores | ✅ | ✅ |
| Cadastro de Visitantes | ⏳ | ✅ |
| Cadastro de Veículos | ⏳ | ✅ |
| Portaria — Entrada | ✅ | ✅ |
| Portaria — Saída / Consulta Rápida | ⏳ | ✅ (mesmo endpoint) |
| Relatórios | ⏳ | ✅ (`/acessos` com filtro) |

✅ concluído · ⏳ pendente

---

## 11. Próximos passos

1. **Integração frontend ↔ backend:** substituir os dados fixos (mock) das telas por chamadas `fetch` aos endpoints, enviando o token `Authorization: Bearer`. Começar pelo dashboard consumindo `/dashboard`.
2. **Telas restantes do MVP:** Visitantes, Portaria — Saída, Consulta Rápida e Relatórios.
3. **Migrações com Alembic:** hoje as tabelas são criadas no *startup*; migrações versionadas dão mais controle em produção.
4. **Funcionários e Prestadores:** modelos e CRUD seguindo o mesmo padrão do Morador.
5. **Upload de fotos:** hoje existe apenas o campo `foto_url`; falta o armazenamento real das imagens.
6. **Integrações futuras (visão do projeto):** QR Code, OCR, WhatsApp e leitura de placas (LPR).

---

*Documento gerado como registro do desenvolvimento do AMBROS até a versão 1.0.0.*
