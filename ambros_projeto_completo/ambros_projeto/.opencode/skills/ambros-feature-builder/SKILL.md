---
name: ambros-feature-builder
description: >-
  Skill de orquestração para construir uma funcionalidade completa no AMBROS,
  cobrindo o stack full-stack do projeto (backend FastAPI + frontend HTML +
  integração fetch). Use quando o usuário pedir "adicionar feature X ao
  ambros", "implementar nova funcionalidade no controle de acesso", "criar
  tela de Y", "integrar frontend com backend do ambros", "porter uma funcionalidade
  de ponta a ponta". Triggers: "feature no ambros", "funcionalidade completa
  ambros", "implementar no ambros", "adicionar ao ambros", "ponta a ponta".
user-invocable: false
disable-model-invocation: false
progressive_disclosure:
  entry_point:
    summary: "Orquestra a implementação de feat no AMBROS de ponta a ponta: backend + frontend + integração."
    when_to_use:
      - "Quando precisar adicionar uma feature nova composta (tela + endpoint + integração)"
      - "Quando for destinar trabalhos entre backend e frontend do projeto"
      - "Quando tiver que substituir mocks do frontend por chamadas reais"
      - "Paracionar fiducial features do roadmap do MVP"
    quick_start:
      - "Identifique a entidade/tela alvo"
      - "Crie/ajuste o model + schema no backend"
      - "Crie/ajuste o router exposto na API"
      - "Crie/ajuste a tela HTML no frontend"
      - "Substitua mocks por chamadas api() com Bearer token"
      - "Teste синтеграция com swagger + browse"
---

# AMBROS — Feature Builder Skill

## Quando usar

Esta skill orquestra a implementação de uma **funcionalidade completa** no
AMBROS, cobrindo as três camadas necessárias: **backend** (model + schema +
router), **frontend** (tela HTML) e **integração** (fetch com Bearer token).

Use quando:
- Adicionar uma nova entidade (ex: Funcionários, Prestadores).
- Criar uma nova tela do roadmap (ex: Visitantes, Saída, Relatórios).
- Substituir mocks de uma tela existente por chamadas reais à API.
- Implementar uma feature transversal (ex: upload de fotos, exportar PDF).

## Fluxo completo (6 etapas)

### 1. Identificar o requisito

Antes de codar, defina:
- **Entidade**: é nova ou extensão de uma existente?
- **Endpoint(s)**: GET/POST/PUT/DELETE? Quais filtros?
- **Tela(s)**: nova HTML ou modificação em `moradores.html`/`portaria-entrada.html`?
- **Integração**: tela vai ler da API, escrever na API, ou ambos?

### 2. Backend — Model (se entidade nova)

Em `backend/app/models.py`:

```python
class Entidade(Base):
    __tablename__ = "entidades"
    id: Mapped[int] = mapped_column(primary_key=True)
    # campos...
    criado_em: Mapped[datetime] = mapped_column(
        DateTime, default=datetime.now(timezone.utc))
```

Se houver relacionamento, declare `relationship(back_populates=...)` e
`ForeignKey` no filho. Renderize tipo enum se aplicável:

```python
class TipoX(str, enum.Enum):
    a = "a"
    b = "b"
```

### 3. Backend — Schemas

Em `backend/app/schemas.py`, criar subclasses no padrão:

```python
class EntidadeBase(BaseModel):
    nome: str
    # campos...

class EntidadeCreate(EntidadeBase): pass

class EntidadeUpdate(BaseModel):
    nome: str | None = None
    # todos opcionais...

class EntidadeOut(EntidadeBase):
    model_config = ConfigDict(from_attributes=True)
    id: int
    criado_em: datetime
```

### 4. Backend — Router

Criar `backend/app/routers/<entidade>.py`:

```python
router = APIRouter(prefix="/<entidade>", tags=["<Entidade>"])

@router.get("", response_model=list[schemas.EntidadeOut])
def listar(skip: int = 0, limit: int = 50, db: Session = Depends(get_db)):
    ...

@router.post("", response_model=schemas.EntidadeOut, status_code=201)
def criar(dados: schemas.EntidadeCreate, db: Session = Depends(get_db)):
    ...
```

Registrar no `main.py`:

```python
from .routers import <entidade>
app.include_router(<entidade>.router, dependencies=[Depends(get_current_user)])
```

**Validar via Swagger UI** em `http://localhost:8000/docs` antes de seguir.

### 5. Frontend — Tela HTML

Se for tela nova: duplicar `moradores.html` (mais completo) como template,
preservar sidebar/topbar/footer, ajustar `<title>`, marcar `.nav-item.active`.
Para componentes novos, siga as classes em `ambros-frontend-dev` (cards,
panels, tables, badges, modais).

### 6. Integração — fetch com Bearer

No `<script>` da tela, declarar `API_BASE` e `api()` (ver
`ambros-frontend-dev` para o snippet completo). Substituir os dados mock
pelos retornos reais. Padrões obrigatórios:

- Ler token de `localStorage.ambros_token` ou `sessionStorage.ambros_token`.
- Em 401, redirecionar para `login.html`.
- Renderizar erros em `.alert-erro` (mesma estética de `login.html`).
- Filtros de listagem viram query string: `?busca=joao&skip=0&limit=50`.
- Paginação com `skip/limit`; "Carregar mais" sugerido até ter total.

## Checklist final

- [ ] Model criado com defaults corretos e FKs com `ForeignKey`
- [ ] Schemas seguem o padrão Base/Create/Update/Out
- [ ] Router registrado em `main.py` com `Depends(get_current_user)`
- [ ] Endpoint testado no Swagger em `/docs`
- [ ] Tela HTML criada usando o template (sidebar/topbar idênticos)
- [ ] Variáveis CSS em `:root` idênticas ao padrão
- [ ] Tela responsiva testada (375px e 1200px)
- [ ] `api()` com Bearer token, redirect em 401
- [ ] Mock substituído por chamada real; erros em `.alert-erro`
- [ ] Atualizar `DESENVOLVIMENTO.md` Status do roadmap

## Exemplos de aplicação no roadmap atual

| Feature | Backend | Frontend | Integração |
|---|---|---|---|
| Tela de Visitantes | CRUD já existe em `/visitantes` | Nova `visitantes.html` (clone de moradores) | `api("/visitantes?presentes=true")` |
| Portaria — Saída | `/acessos` já suporta sentido=saida | Nova `portaria-saida.html` (clone de entrada) | `api("/acessos", POST)` |
| Consulta Rápida | `/moradores?busca=X`, `/visitantes?busca=X` | Nova `consulta.html` com busca unificada | `api("/moradores?busca=X")` + `api("/visitantes?busca=X")` |
| Relatórios | `/acessos?inicio=...&fim=...` | Nova `relatorios.html` com datepickers | `api("/acessos?inicio=X&fim=Y")` |
| Dashboard integrado | `/dashboard` já retorna tudo | Atualizar `ambros-dashboard.html` para `api("/dashboard")` | `api("/dashboard")` |
