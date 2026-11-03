# Plano de Migração: JSON/InMemoryDB → Supabase (Free Tier)

**Status:** Pronto para implementação  
**Objetivo:** Migrar banco de dados JSON para PostgreSQL hospedado no Supabase mantendo funcionalidade completa  
**Contexto:** Schema atual está 100% definido, poucos dados no banco, ideal para migração agora

## 1. Diagnóstico Atual

### Arquitetura atual
- `src/db.ts`: Classe singleton `InMemoryDB` com 14 coleções principais + suporte multi-tenant
- Persistência: `data/database.json` com salvamento atômico (tmp + rename)
- IDs auto-incrementados com contadores separados
- Seeds extensivos para desenvolvimento/demo
- Multi-tenant parcialmente implementado (`tenantData` Map)
- Testes usam `__resetDb()` para resetar estado

### Coleções a migrar
| Coleção | Tabela | Campos chave | Observações |
|---|---|---|---|
| usuarios | usuarios | id, email, perfil, senha_hash | Auth custom com JWT |
| moradores | moradores | id, nome_completo, cpf, bloco/apartamento | Core |
| veiculos | veiculos | id, placa, morador_id | FK para moradores |
| visitantes | visitantes | id, morador_visitado_id | FK para moradores |
| acessos | acessos | id, tipo_pessoa, pessoa_id, registrado_em | Histórico |
| encomendas | encomendas | id, morador_id, codigo_retirada, status | Com links WhatsApp/Telegram |
| prestadores | prestadores | id, morador_autorizador_id | Com datas início/fim |
| ocorrencias | ocorrencias | id, registrado_por | Com resolução |
| restricoes | restricoes_acesso | id, tipo_identificador, valor_identificador | Bloqueios portaria |
| reservas | reservas | id, morador_id, espaco, data_reserva, periodo | Com status/aprovação |
| comunicados | comunicados | id, publicado_por, ativo | Mural |
| notificacoes | notificacoes_morador | id, morador_id | Histórico notificações |
| preautorizacoes | preautorizacoes_visitante | id, morador_id, codigo_acesso_qr | Portal morador |
| leads | leads | id, email, status | Landing page |

## 2. Design do Schema PostgreSQL

### Estratégia
- **Manter IDs numéricos** (serial/identity) para compatibilidade com código existente
- **Adicionar `tenant_id`** em tabelas com dados por condomínio (preparar para multi-tenant real)
- **Usar TIMESTAMPTZ** para timestamps quando possível
- **Foreign keys** onde fizer sentido (com ON DELETE RESTRICT/SET NULL)
- **Índices** em campos de busca frequente (email, placa, cpf, datas)
- **JSONB** para campos flexíveis (`dados_adicionais` em notificacoes)
- **RLS** opcional agora (pode ser adicionado depois) - manter auth por JWT custom

### Schema SQL (resumido)

```sql
-- Usuarios
CREATE TABLE usuarios (
  id SERIAL PRIMARY KEY,
  nome VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  senha_hash VARCHAR(255) NOT NULL,
  perfil VARCHAR(50) NOT NULL,
  ativo BOOLEAN DEFAULT true,
  criado_em TIMESTAMPTZ DEFAULT NOW(),
  tenant_id VARCHAR(50)
);

-- Moradores
CREATE TABLE moradores (
  id SERIAL PRIMARY KEY,
  nome_completo VARCHAR(255) NOT NULL,
  cpf VARCHAR(20) NOT NULL,
  telefone VARCHAR(30),
  whatsapp VARCHAR(30),
  telegram VARCHAR(100),
  bloco VARCHAR(10),
  apartamento VARCHAR(10),
  vinculo VARCHAR(20) NOT NULL,
  foto_url TEXT,
  numero_vaga VARCHAR(20),
  ativo BOOLEAN DEFAULT true,
  criado_em DATE DEFAULT CURRENT_DATE,
  tenant_id VARCHAR(50)
);

-- Veiculos
CREATE TABLE veiculos (
  id SERIAL PRIMARY KEY,
  placa VARCHAR(20) NOT NULL,
  modelo VARCHAR(100),
  cor VARCHAR(50),
  vaga VARCHAR(20),
  morador_id INTEGER REFERENCES moradores(id) ON DELETE SET NULL,
  tipo_vinculo VARCHAR(20) NOT NULL,
  titulo VARCHAR(255),
  criado_em DATE DEFAULT CURRENT_DATE,
  tenant_id VARCHAR(50)
);

-- Visitantes
CREATE TABLE visitantes (
  id SERIAL PRIMARY KEY,
  nome VARCHAR(255) NOT NULL,
  documento VARCHAR(30),
  tipo_documento VARCHAR(20),
  telefone VARCHAR(30),
  foto_url TEXT,
  placa_veiculo VARCHAR(20),
  vaga VARCHAR(20),
  bloco VARCHAR(10),
  apartamento VARCHAR(10),
  morador_visitado_id INTEGER REFERENCES moradores(id) ON DELETE SET NULL,
  agendado_para DATE,
  presente BOOLEAN DEFAULT false,
  criado_em DATE DEFAULT CURRENT_DATE,
  nome_visitante VARCHAR(255) NOT NULL,
  documento_visitante VARCHAR(30),
  data_prevista DATE,
  observacao TEXT,
  tenant_id VARCHAR(50)
);

-- Acessos
CREATE TABLE acessos (
  id SERIAL PRIMARY KEY,
  tipo_pessoa VARCHAR(20) NOT NULL,
  pessoa_id INTEGER NOT NULL,
  nome VARCHAR(255) NOT NULL,
  sentido VARCHAR(10) NOT NULL,
  placa_veiculo VARCHAR(20),
  vaga VARCHAR(20),
  observacao TEXT,
  registrado_em TIMESTAMPTZ DEFAULT NOW(),
  tenant_id VARCHAR(50)
);

-- Encomendas
CREATE TABLE encomendas (
  id SERIAL PRIMARY KEY,
  morador_id INTEGER REFERENCES moradores(id) ON DELETE SET NULL,
  morador_nome VARCHAR(255) NOT NULL,
  morador_unidade VARCHAR(50),
  morador_telefone VARCHAR(30),
  morador_whatsapp VARCHAR(30),
  morador_telegram VARCHAR(100),
  codigo_rastreio VARCHAR(100),
  transportadora VARCHAR(100),
  tipo_volume VARCHAR(50),
  local_armazenamento VARCHAR(100),
  observacoes TEXT,
  codigo_retirada VARCHAR(20),
  status VARCHAR(20) NOT NULL,
  recebido_em TIMESTAMPTZ,
  recebido_por VARCHAR(255),
  retirado_em TIMESTAMPTZ,
  retirado_por VARCHAR(255),
  notificacao_enviada_whatsapp BOOLEAN DEFAULT false,
  notificacao_enviada_telegram BOOLEAN DEFAULT false,
  mensagem_aviso TEXT,
  tenant_id VARCHAR(50)
);

-- Prestadores
CREATE TABLE prestadores (
  id SERIAL PRIMARY KEY,
  nome VARCHAR(255) NOT NULL,
  documento VARCHAR(30) NOT NULL,
  tipo_documento VARCHAR(20) NOT NULL,
  empresa VARCHAR(255),
  funcao VARCHAR(255) NOT NULL,
  telefone VARCHAR(30),
  foto_url TEXT,
  placa_veiculo VARCHAR(20),
  cracha_numero VARCHAR(50),
  tipo_vinculo VARCHAR(20) NOT NULL,
  bloco VARCHAR(10),
  apartamento VARCHAR(10),
  morador_autorizador_id INTEGER REFERENCES moradores(id) ON DELETE SET NULL,
  morador_autorizador_nome VARCHAR(255),
  data_inicio DATE NOT NULL,
  data_fim DATE,
  horario_permitido VARCHAR(100),
  observacao TEXT,
  presente BOOLEAN DEFAULT false,
  ativo BOOLEAN DEFAULT true,
  criado_em TIMESTAMPTZ DEFAULT NOW(),
  tenant_id VARCHAR(50)
);

-- Ocorrencias
CREATE TABLE ocorrencias (
  id SERIAL PRIMARY KEY,
  titulo VARCHAR(255) NOT NULL,
  categoria VARCHAR(50) NOT NULL,
  gravidade VARCHAR(20) NOT NULL,
  status VARCHAR(20) NOT NULL,
  bloco VARCHAR(10),
  apartamento VARCHAR(10),
  morador_envolvido VARCHAR(255),
  descricao TEXT NOT NULL,
  acao_tomada TEXT,
  registrado_por VARCHAR(255) NOT NULL,
  data_hora TIMESTAMPTZ DEFAULT NOW(),
  resolvido_em TIMESTAMPTZ,
  tenant_id VARCHAR(50)
);

-- Restricoes acesso
CREATE TABLE restricoes_acesso (
  id SERIAL PRIMARY KEY,
  tipo_identificador VARCHAR(20) NOT NULL,
  valor_identificador VARCHAR(100) NOT NULL,
  nome_pessoa VARCHAR(255),
  motivo TEXT NOT NULL,
  instrucao_portaria TEXT NOT NULL,
  bloqueio_total BOOLEAN DEFAULT true,
  ativo BOOLEAN DEFAULT true,
  criado_por VARCHAR(255),
  criado_em TIMESTAMPTZ DEFAULT NOW(),
  tenant_id VARCHAR(50)
);

-- Reservas
CREATE TABLE reservas (
  id SERIAL PRIMARY KEY,
  espaco VARCHAR(50) NOT NULL,
  espaco_nome VARCHAR(255) NOT NULL,
  data_reserva DATE NOT NULL,
  periodo VARCHAR(20) NOT NULL,
  morador_id INTEGER REFERENCES moradores(id) ON DELETE SET NULL,
  morador_nome VARCHAR(255) NOT NULL,
  bloco VARCHAR(10),
  apartamento VARCHAR(10),
  status VARCHAR(20) NOT NULL,
  convidados_estimados INTEGER,
  observacoes TEXT,
  solicitado_em TIMESTAMPTZ DEFAULT NOW(),
  aprovado_em TIMESTAMPTZ,
  aprovado_por VARCHAR(255),
  tenant_id VARCHAR(50)
);

-- Comunicados
CREATE TABLE comunicados (
  id SERIAL PRIMARY KEY,
  titulo VARCHAR(255) NOT NULL,
  categoria VARCHAR(50) NOT NULL,
  conteudo TEXT NOT NULL,
  importante BOOLEAN DEFAULT false,
  publicado_por VARCHAR(255) NOT NULL,
  data_publicacao TIMESTAMPTZ DEFAULT NOW(),
  ativo BOOLEAN DEFAULT true,
  tenant_id VARCHAR(50)
);

-- Notificacoes morador
CREATE TABLE notificacoes_morador (
  id SERIAL PRIMARY KEY,
  morador_id INTEGER REFERENCES moradores(id) ON DELETE SET NULL,
  tipo VARCHAR(50) NOT NULL,
  titulo VARCHAR(255) NOT NULL,
  mensagem TEXT NOT NULL,
  canal VARCHAR(20) NOT NULL,
  enviado_em TIMESTAMPTZ DEFAULT NOW(),
  lida BOOLEAN DEFAULT false,
  dados_adicionais JSONB,
  tenant_id VARCHAR(50)
);

-- Pre-autorizacoes
CREATE TABLE preautorizacoes_visitante (
  id SERIAL PRIMARY KEY,
  morador_id INTEGER REFERENCES moradores(id) ON DELETE SET NULL,
  morador_nome VARCHAR(255) NOT NULL,
  bloco VARCHAR(10),
  apartamento VARCHAR(10),
  nome_visitante VARCHAR(255) NOT NULL,
  documento_visitante VARCHAR(30),
  placa_veiculo VARCHAR(20),
  data_prevista DATE NOT NULL,
  observacao TEXT,
  codigo_acesso_qr VARCHAR(20) NOT NULL,
  status VARCHAR(20) NOT NULL,
  criado_em TIMESTAMPTZ DEFAULT NOW(),
  tenant_id VARCHAR(50)
);

-- Leads
CREATE TABLE leads (
  id SERIAL PRIMARY KEY,
  nome VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL,
  telefone VARCHAR(30),
  condominio_nome VARCHAR(255),
  numero_unidades INTEGER,
  sistema_atual VARCHAR(255),
  status VARCHAR(20) NOT NULL,
  origem VARCHAR(100),
  observacao TEXT,
  criado_em TIMESTAMPTZ DEFAULT NOW(),
  atualizado_em TIMESTAMPTZ DEFAULT NOW(),
  tenant_id VARCHAR(50)
);

-- Índices para performance
CREATE INDEX idx_usuarios_email ON usuarios(email);
CREATE INDEX idx_moradores_cpf ON moradores(cpf);
CREATE INDEX idx_veiculos_placa ON veiculos(placa);
CREATE INDEX idx_visitantes_morador ON visitantes(morador_visitado_id);
CREATE INDEX idx_acessos_registrado ON acessos(registrado_em);
CREATE INDEX idx_encomendas_morador ON encomendas(morador_id);
CREATE INDEX idx_encomendas_codigo ON encomendas(codigo_retirada);
CREATE INDEX idx_prestadores_morador ON prestadores(morador_autorizador_id);
CREATE INDEX idx_reservas_data ON reservas(data_reserva);
CREATE INDEX idx_notificacoes_morador ON notificacoes_morador(morador_id);
```

## 3. Arquitetura da Migração

### Abstração de banco de dados
Criar interface `IDatabase` para permitir troca entre implementações sem quebrar rotas.

**Arquivos novos:**
```
src/db/
├── interface.ts      # IDatabase interface
├── InMemoryDB.ts     # Mover implementação atual (renomear db.ts)
├── PostgresDB.ts     # Nova implementação com Supabase/pg
├── factory.ts        # Factory para escolher implementação
└── index.ts          # Export singleton baseado em env
```

### Configuração
Adicionar variáveis de ambiente:
```env
# Opções: json | postgres
DB_TYPE=postgres

# Supabase
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_ANON_KEY=xxx
DATABASE_URL=postgresql://postgres:[PASSWORD]@[HOST]:5432/postgres
```

### Dependências a adicionar
```json
{
  "dependencies": {
    "@supabase/supabase-js": "^2.45.0",
    "pg": "^8.12.0"
  },
  "devDependencies": {
    "@types/pg": "^8.11.0"
  }
}
```

## 4. Plano de Implementação

### Fase 1: Preparação Supabase (Manual - Usuário)
- [ ] Criar projeto no Supabase (free tier)
- [ ] Copiar URL, anon key, connection string
- [ ] Executar schema SQL no SQL Editor do Supabase
- [ ] Verificar tabelas criadas
- [ ] Configurar .env com credenciais

### Fase 2: Abstrair camada de dados
- [ ] Criar `src/db/interface.ts` com todos os métodos necessários
- [ ] Mover `src/db.ts` para `src/db/InMemoryDB.ts` e adaptar para implementar interface
- [ ] Criar `src/db/factory.ts` com lógica de seleção por env
- [ ] Criar `src/db/index.ts` exportando instância correta
- [ ] Atualizar imports em todas as rotas/testes para usar novo caminho
- [ ] Testar que app continua funcionando com `DB_TYPE=json`

### Fase 3: Implementar PostgresDB
- [ ] Criar `src/db/PostgresDB.ts` com conexão via `pg` ou `@supabase/supabase-js`
- [ ] Implementar métodos CRUD para todas as coleções
- [ ] Implementar contadores de IDs (usar `MAX(id)` ou sequences)
- [ ] Implementar `save()` - no Postgres não precisa salvar em arquivo, pode ser no-op
- [ ] Implementar `__resetDb()` para testes (truncate tables ou drop/recreate)
- [ ] Adicionar tratamento de erros e transações onde necessário

### Fase 4: Migração de dados
- [ ] Criar script `scripts/migrate-json-to-supabase.ts`
- [ ] Ler `data/database.json`
- [ ] Inserir dados em ordem correta (respeitando FKs)
- [ ] Mapear IDs mantendo consistência
- [ ] Validar contagem por tabela
- [ ] Testar integridade (FKs)

### Fase 5: Testes e Cutover
- [ ] Rodar todos os testes com `DB_TYPE=json` (garantir não quebrou)
- [ ] Configurar `DB_TYPE=postgres` com credenciais Supabase
- [ ] Rodar script de migração
- [ ] Rodar testes com Postgres
- [ ] Testar app manualmente (login, CRUD básico)
- [ ] Atualizar `.env.example` com novas variáveis
- [ ] Deploy no Render com variáveis Supabase

## 5. Decisões Técnicas

| Decisão | Recomendação | Justificativa |
|---|---|---|
| **Cliente Supabase** | Usar `pg` (node-postgres) direto | Mais controle, sem dependências extras do SDK, funciona bem com Express/TypeScript |
| **Manter auth JWT custom** | SIM | Menor refatoração, sistema já funciona. Supabase Auth não é necessário agora |
| **Adicionar tenant_id** | SIM (nullable por enquanto) | Preparar para futuro multi-tenant sem quebrar dados existentes |
| **RLS no Supabase** | NÃO agora | Com auth custom e camada app, melhor adicionar depois. RLS pode complicar queries |
| **Migrar sequences** | SIM | Garantir `nextId` correto após migração (usar `SELECT setval(...)`) |
| **Manter seeds** | SIM | Útil para dev/testes. Adicionar flag para não rodar seeds em produção com Postgres |

## 6. Riscos e Mitigações

| Risco | Impacto | Probabilidade | Mitigação |
|---|---|---|---|
| **Quebrar rotas existentes** | Alto | Média | Criar interface IDatabase idêntica à API atual. Testar com json primeiro |
| **Problemas com FKs na migração** | Alto | Média | Inserir em ordem: usuarios/moradores primeiro, depois dependentes |
| **Diferenças de tipos (Date vs string)** | Médio | Alta | Normalizar formatos. Postgres aceita ISO strings, mas melhor usar tipos corretos |
| **Testes quebram com Postgres** | Alto | Alta | Adaptar `__resetDb()` para truncate. Ou manter json para testes, postgres só para dev/prod |
| **Conexão com Supabase free** | Médio | Baixa | Usar connection pooling (`pg.Pool`), limitar conexões |
| **Projeto Supabase pausa** | Médio | Média | Free tier pausa após inatividade. Para demo OK, para produção considerar upgrade ou keep-alive |

## 7. Validação

### Checklist pré-migração
- [ ] Backup de `data/database.json`
- [ ] Todos os testes passando com `DB_TYPE=json`
- [ ] Build TypeScript sem erros
- [ ] Schema SQL revisado e testado

### Checklist pós-migração
- [ ] Todas as 14 tabelas criadas com dados
- [ ] Contagens batem com JSON original
- [ ] Login funciona (adm@adm.com/123)
- [ ] CRUD de moradores/veículos funciona
- [ ] Fluxo de visitantes (entrada/saída) funciona
- [ ] Encomendas com código de retirada funciona
- [ ] Dashboard carrega dados
- [ ] Testes passam com `DB_TYPE=postgres`
- [ ] App sobe no Render com Supabase

## 8. Comandos Úteis

```bash
# Instalar dependências
npm install @supabase/supabase-js pg
npm install -D @types/pg

# Rodar com JSON (padrão atual)
npm run dev

# Rodar com Postgres
DB_TYPE=postgres npm run dev

# Migrar dados
npx tsx scripts/migrate-json-to-supabase.ts

# Testar
npm test
```

## 9. Próximos Passos Imediatos

1. **Criar projeto Supabase** - Fazer no dashboard supabase.com
2. **Executar schema SQL** - Copiar schema acima no SQL Editor
3. **Configurar .env** - Adicionar credenciais
4. **Implementar abstração** - Começar pela interface e mover InMemoryDB
5. **Implementar PostgresDB** - Uma coleção por vez, testando incrementalmente
6. **Migrar dados** - Rodar script
7. **Validar** - Testar fluxos principais

**Recomendação:** Começar pela Fase 2 (abstração) mantendo `DB_TYPE=json` funcionando. Só passar para Postgres depois que abstração estiver estável e testada. Isso reduz risco drasticamente.
