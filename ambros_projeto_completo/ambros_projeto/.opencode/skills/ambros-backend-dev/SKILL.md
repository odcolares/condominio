---
name: ambros-backend-dev
description: >-
  Padrões de desenvolvimento do backend FastAPI do AMBROS (controle de acesso
  condominial). Use ao escrever, editar ou revisar código dos routers, models,
  schemas ou seed do backend. Triggers: "backend do ambros", "fastapi ambros",
  "novo endpoint no ambros", "model do ambros", "schema ambros", "router
  ambros", "api de controle de acesso", "registrar acesso", "portaria api".
user-invocable: false
disable-model-invocation: false
progressive_disclosure:
  entry_point:
    summary: "Padrões de código do backend FastAPI do AMBROS (routers, models, schemas, seed)."
    when_to_use:
      - "Ao criar ou editar arquivos em backend/app/"
      - "Ao adicionar um novo endpoint, router, model ou schema"
      - "Ao revisar código que mexe na API do AMBROS"
      - "Ao discutir migrações, seed ou autenticação"
    quick_start:
      - "Confira as convenções abaixo antes de escrever código novo"
      - "Siga o padrão de router existente (prefix, tags, Depends(get_db))"
      - "Valide entrada com schemas Pydantic v2 (Base/Create/Update/Out)"
      - "Proteja rotas de dados com Depends(get_current_user)"
---

# AMBROS — Backend Development Skill

## Contexto do projeto

O backend do AMBROS é uma API FastAPI que atende a um sistema de controle de
acesso condominial. Stack: **FastAPI 0.115 + SQLAlchemy 2.0 + Pydantic v2 +
PyJWT + passlib**, banco **PostgreSQL** (com fallback SQLite para testes).

Estrutura:

```
backend/app/
├── main.py             # app FastAPI + CORS + include_router
├── database.py         # engine, SessionLocal, get_db, Base
├── models.py           # ORM (Usuario, Morador, Veiculo, Visitante, Acesso)
├── schemas.py          # validação Pydantic (Base/Create/Update/Out)
├── security.py         # hash_senha, JWT, get_current_user (Bearer)
├── seed.py             # popular banco p/ desenvolvimento
└── routers/
    ├── auth.py         # /auth/login, /auth/me
    ├── moradores.py    # CRUD + busca
    ├── visitantes.py   # CRUD + filtro presentes
    ├── veiculos.py     # CRUD
    ├── acessos.py      # POST (entrada/saída) + GET histórico
    └── dashboard.py    # GET /dashboard (cards + gráficos)
```

## Convenções obrigatórias

### Routers

- `APIRouter(prefix="/<entidade>", tags=["<Entidade>"])` no topo.
- Todas as rotas de dados **devem** depender de `get_current_user`; isso é
  aplicado no `main.py` via `dependencies=[Depends(get_current_user)]` ao
  incluir o router — não proteja rota a rota.
- `get_db` como dependência;Sessions são gerenciadas pelo `get_db()` que
  abre/fecha em finally.
- Retorna modelos Pydantic via `response_model=`; nunca retorne dicts crus.
- Erros: `HTTPException(<codigo>, "<mensagem pt-BR>")` — sempre mensagem em
  português claro, já que usuários finais são Brazilian.

### Padrão de CRUD

```python
@router.get("", response_model=list[schemas.XOut])
def listar(busca: str | None = None, skip: int = 0, limit: int = 50,
           db: Session = Depends(get_db)):
    stmt = select(models.X)
    if busca:
        like = f"%{busca}%"
        stmt = stmt.where(or_(models.X.campo1.ilike(like),
                              models.X.campo2.ilike(like)))
    stmt = stmt.order_by(models.X.criado_em.desc()).offset(skip).limit(limit)
    return db.scalars(stmt).all()

@router.get("/{id}", response_model=schemas.XOut)
def obter(id: int, db: Session = Depends(get_db)):
    obj = db.get(models.X, id)
    if not obj:
        raise HTTPException(404, "X não encontrado")
    return obj

@router.post("", response_model=schemas.XOut, status_code=201)
def criar(dados: schemas.XCreate, db: Session = Depends(get_db)):
    # validação de unicidade / FK antes de inserir
    obj = models.X(**dados.model_dump())
    db.add(obj); db.commit(); db.refresh(obj)
    return obj

@router.delete("/{id}", status_code=204)
def remover(id: int, db: Session = Depends(get_db)):
    obj = db.get(models.X, id)
    if not obj:
        raise HTTPException(404, "X não encontrado")
    db.delete(obj); db.commit()
```

### Models (SQLAlchemy 2.0)

- `Mapped[...]` + `mapped_column(...)` — estilo 2.0, não `Column`.
- Enums como `class X(str, enum.Enum)` no topo de `models.py`.
- `datetime.utcnow` está depreciado no Python 3.12+; use
  `datetime.now(timezone.utc)` em código novo. (Models existentes ainda
  usam `utcnow` — migrar gradualmente.)
- Snapshot de nomes em `Acesso.nome` quando precisar registrar o estado
  histórico — nunca faça JOIN para mostrar nome de acesso.

### Schemas (Pydantic v2)

- Padrão de classes: `XBase -> XCreate(XBase) / XUpdate(BaseModel com tudo
  opcional) / XOut(XBase)`.
- `XOut` sempre com `model_config = ConfigDict(from_attributes=True)` e os
  campos extras que saem da ORM (`id`, `criado_em`, etc).
- Nunca use `BaseModel.Config` (v1); intendente é Pydantic v2.

### Segurança

- Senhas **sempre** via `security.hash_senha(senha)` — nunca em texto puro.
- Tokens JWT via `security.criar_token(sub=email)`; `sub` é o e-mail.
- `get_current_user` valida Bearer token e retorna o `Usuario` ORM.
- Rotas de dados no router `auth` ficam **públicas**; todo o resto é
  protegido no nível de router em `main.py`.

### Acesso (portaria)

- `POST /acessos` recebe `tipo_pessoa + pessoa_id + sentido` e grava
  snapshot de `nome` via `_resolver_nome`.
- Se `tipo_pessoa == visitante`, atualiza `visitante.presente` para
  refletir entrada/saida — isso alimenta o card "dentro do condomínio".
- `GET /acessos` usa `inicio`/`fim` (ISO datetime) para relatórios.

### Dashboard

- `GET /dashboard` retorna `DashboardOut` com `cards`, `movimentacao_hoje`
  (faixa de 3h), `visitantes_7dias` e `ultimos_acessos`.
- Cálculos de "hoje" usam `datetime.utcnow().date()` — consideração de
  timezone é TODO (pode adicionar `TIMEZONE` no futuro).

###Seed

- Roda com `python -m app.seed`.
- Idempotente: cria admin padrão sempre; restante só se banco estiver vazio.
- Senha padrão `123` **apenas para desenvolvimento** — NUNCA usar em prod.

## Checklist de PR

- [ ] Novo endpoint tem `response_model` definido
- [ ] Rotas de dados passam por `get_current_user` (em `main.py`)
- [ ] Mensagens de erro em português
- [ ] Schema `Out` tem `from_attributes=True`
- [ ] Busca/listagem tem `skip`/`limit` (paginacao)
- [ ] Snapshot de nome gravado quando aplicável (Acesso)
- [ ] Sem `datetime.utcnow()` em código novo
- [ ] `.env.example` atualizado se nova variável foi adicionada
