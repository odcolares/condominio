# AMBROS — Backend (FastAPI + PostgreSQL)

API do sistema de controle de acesso para condomínios. Fornece os dados
consumidos pelas telas do frontend (Dashboard, Moradores, Portaria, etc.).

## Estrutura

```
ambros_backend/
├── app/
│   ├── main.py            # app FastAPI + CORS + routers
│   ├── database.py        # engine/sessão SQLAlchemy
│   ├── models.py          # tabelas: moradores, visitantes, veiculos, acessos
│   ├── schemas.py         # validação/serialização (Pydantic v2)
│   ├── seed.py            # dados de demonstração
│   └── routers/
│       ├── moradores.py   # CRUD
│       ├── visitantes.py  # CRUD
│       ├── veiculos.py    # CRUD
│       ├── acessos.py     # portaria (entrada/saída) + histórico
│       └── dashboard.py   # agrega cards e gráficos
├── requirements.txt
└── .env.example
```

## Como rodar

```bash
# 1. Ambiente virtual
python -m venv .venv && source .venv/bin/activate

# 2. Dependências
pip install -r requirements.txt

# 3. Banco de dados
cp .env.example .env      # ajuste DATABASE_URL
# (ou, para teste rápido, deixe DATABASE_URL=sqlite:///./ambros.db)

# 4. Popular com dados de exemplo (opcional)
python -m app.seed

# 5. Subir a API
uvicorn app.main:app --reload
```

Documentação interativa em **http://localhost:8000/docs** (Swagger).

## Principais endpoints

| Método | Rota | Descrição |
|--------|------|-----------|
| GET/POST/PUT/DELETE | `/moradores` | CRUD de moradores (busca por nome/CPF/bloco) |
| GET/POST/DELETE | `/visitantes` | CRUD e filtro de quem está no condomínio |
| GET/POST/DELETE | `/veiculos` | CRUD de veículos |
| POST | `/acessos` | Registra entrada/saída na portaria |
| GET | `/acessos` | Histórico com filtro por período (relatórios) |
| GET | `/dashboard` | Cards + dados dos gráficos da tela inicial |

## Próximos passos sugeridos

- **Alembic** para migrações versionadas (hoje as tabelas são criadas no startup).
- **Autenticação** (JWT/OAuth2) para a tela de Login.
- Modelos de **Funcionários** e **Prestadores** (mesmo padrão do Morador).
- Upload real de **fotos** (hoje só o campo `foto_url`).
