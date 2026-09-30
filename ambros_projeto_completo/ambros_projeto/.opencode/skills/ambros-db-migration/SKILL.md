---
name: ambros-db-migration
description: >-
  Skill de migração e evolução do banco de dados do AMBROS. Use ao transitar
  de Base.metadata.create_all para Alembic, adicionar models, ajustar schemas
  ou criar migrations. Triggers: "migração do ambros", "alembic ambros", "nova
  coluna no ambros", "alterar tabela do ambros", "migration do banco",
  "criar migration", "versionar banco do ambros", "evoluir schema do ambros".
user-invocable: false
disable-model-invocation: false
progressive_disclosure:
  entry_point:
    summary: "Padrões para Alembic no AMBROS: setup, criação de migrations, ajuste de models."
    when_to_use:
      - "Quando criar/atualizar models em backend/app/models.py"
      - "Quando for transitar de create_all para Alembic"
      - "Quando for adicionar uma coluna ou tabela nova"
      - "Quando for corrigir um schema em produção"
    quick_start:
      - "Siga o setup Alembic abaixo para inicializar"
      - "Toda alteração de model -> autogenerate migration"
      - "Revise o migration gerado (nem sempre é correto)"
      - "Rode `alembic upgrade head` e valide com seed"
---

# AMBROS — Database Migration Skill

## Estado atual

O AMBROS hoje cria tabelas via `Base.metadata.create_all(bind=engine)` no
startup do `main.py`. Isso funciona em dev, mas **não é apropriado em
produção** porque:

- Não há versão do schema (impossível rollback)
- Alterações em colunas existentes não são detectadas
- Dados em produção são postos em risco por CREATE implícito
- Múltipis deploys simultâneos podem brigar entre si

**Objetivo:** usar **Alembic** (SQLAlchemy's migration tool oficial) para
versionar o schema.

## Setup Alembic (uma vez)

### 1. Instalar dependência

Adicionar em `backend/requirements.txt`:

```
alembic==1.13.3
```

### 2. Inicializar a estrutura

```bash
cd backend
alembic init alembic
```

Gera:

```
backend/
├── alembic.ini
└── alembic/
    ├── env.py
    ├── script.py.mako
    └── versions/
```

### 3. Configurar `alembic.ini`

```ini
[alembic]
script_location = alembic
sqlalchemy.url = postgresql+psycopg2://ambros:ambros@localhost:5432/ambros
# Em produção/deploy ler do .env:
# sqlalchemy.url = ${DATABASE_URL}
```

### 4. Conectar ao Base do projeto

Em `alembic/env.py`, trocar o `target_metadata`:

```python
import sys, os
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))
from app.database import Base
from app import models  # noqa: F401 (garante import dos models)
target_metadata = Base.metadata
```

Habilitar a leitura da URL do ambiente:

```python
from dotenv import load_dotenv
load_dotenv()
config.set_main_option("sqlalchemy.url", os.getenv("DATABASE_URL"))
```

### 5. Gerar migration inicial

Como o banco já tem tabelas em produção, precisamos de uma migration que
**marque** o estado atual sem recriar tabelas. Opção A: gerar e depois
marcar como já aplicada:

```bash
alembic revision --autogenerate -m "baseline"
# Edite o arquivo gerado: comente as operações create_table
# Mantenha apenas o que for realmente novo
alembic stamp head   # marca como aplicada sem rodar
```

Ou opção B: gerar baseline vazio e seguir:

```bash
alembic revision -m "baseline"  # vazio, sem operacoes
alembic stamp head
```

### 6. Remover o create_all

Em `backend/app/main.py`:

```python
# ANTES
Base.metadata.create_all(bind=engine)

# DEPOIS — remover a linha; Alembic assume a responsabilidade
```

## Fluxo de alteração de model

### 1. Editar o model

Em `backend/app/models.py`, adicionar/alterar coluna. Exemplo:

```python
class Morador(Base):
    # ... campos existentes
    rg: Mapped[str | None] = mapped_column(String(20))  # NOVO
```

### 2. Atualizar schema Pydantic correspondente

Em `backend/app/schemas.py`, adicionar o campo no `Base`, `Create`,
`Update` e `Out` conforme aplicável.

### 3. Gerar migration

```bash
cd backend
alembic revision --autogenerate -m "add rg to morador"
```

### 4. **Revisar o migration gerado** (sempre)

Alembic nem sempre entende a intenção. Verifique o arquivo em
`alembic/versions/<hash>_add_rg_to_morador.py`:

- Para coluna nova, deve ter `op.add_column("moradores", sa.Column("rg",
  sa.String(20), nullable=True))`.
- Para renomear, Alembic gera drop+add; ajuste para `op.alter_column` se
  for rename.
- Para drop com dados, considere data migration manual antes.

### 5. Rodar migration

```bash
alembic upgrade head
```

Validar subindo o backend e rodando `python -m app.seed` em um banco de
teste:

```bash
# Em ambiente SQLite p/ teste:
DATABASE_URL=sqlite:///./test.db alembic upgrade head
python -m app.seed
```

### 6. Atualizar seed se necessário

Se a nova coluna precisa de dados de exemplo, editar `backend/app/seed.py`.

## Comandos úteis

| Comando | O que faz |
|---|---|
| `alembic current` | Mostra revision atual |
| `alembic history` | Lista migrations aplicadas |
| `alembic upgrade head` | Aplica todas pendentes |
| `alembic upgrade +1` | Aplica próxima |
| `alembic downgrade -1` | Desfaz última (rollback!) |
| `alembic stamp <rev>` | Marca como aplicada sem rodar |
| `alembic revision -m "X"` | Cria migration vazia (manual) |

## Convenções

- **Mensagem do migration**: verbo + entidade + detalhe. Ex:
  `add rg to morador`, `create prestadores table`, `drop visitantes.vaga`.
- **Uma migration = um conceito lógico** (não agrupar mudanças
  não-relacionadas na mesma revision).
- **Migrations são reversíveis**: toda `upgrade` tem `downgrade` espelho.
- **Não editar migration já aplicada em produção** — crie nova.
- **Tests**: sempre rodar `alembic upgrade head` em CI antes dos testes.

## Estado atual das entidades (jul/2026)

| Tabela | Colunas | Notas |
|---|---|---|
| `usuarios` | id, nome, email, senha_hash, perfil, ativo, criado_em | — |
| `moradores` | id, nome_completo, cpf, telefone, whatsapp, bloco, apartamento, vinculo, foto_url, numero_vaga, ativo, criado_em | 1:N veiculos, 1:N visitantes |
| `veiculos` | id, placa, modelo, cor, vaga, morador_id, criado_em | FK moradores |
| `visitantes` | id, nome, documento, tipo_documento, telefone, foto_url, placa_veiculo, vaga, bloco, apartamento, morador_visitado_id, agendado_para, presente, criado_em | FK moradores |
| `acessos` | id, tipo_pessoa, pessoa_id, nome, sentido, placa_veiculo, vaga, observacao, registrado_em | Sem FK; snapshot do nome |

## Gaps identificados (roadmap)

1. **Falta tabela `funcionarios`** (mesma estrutura de morador)
2. **Falta tabela `prestadores`** (com tipos e horários recorrentes)
3. **Falta tabela `logs_operacao`** (auditoria administrativa)
4. **`acessos.pessoa_id` não tem FK** — polimórfico por `tipo_pessoa`;
   considere tabela auxiliar ou FKs nullables para integridade
5. **`datetime.utcnow` deprecado** em Python 3.12+ — migrar para
   `datetime.now(timezone.utc)` gradualmente
