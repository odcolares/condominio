# Plano: Conexão Supabase — Criar banco e configurar .env (Fases 3-5)

**Status:** Fases 3-5 100% concluídas — banco Supabase conectado, `.env` configurado, servidor validado, testes passando, persistência validada.  
**Contexto:** Fase 2 (abstração DB) concluída e validada: `tsc --noEmit` = 0 erros, `npm test` = 111/111 passando.  
**Objetivo:** Criar projeto Supabase, rodar schema SQL, preencher `.env` com credenciais reais e validar `DB_TYPE=postgres` — **concluído**.

---

## Pré-requisitos já atendidos (Fase 2 — concluída)

- `src/db/interface.ts`, `src/db/base.ts`, `src/db/InMemoryDB.ts`, `src/db/PostgresDB.ts`
- `src/db/factory.ts` + `src/db/index.ts` + `src/db.ts` (shim; rotas importam `../db.js`)
- `.env` / `.env.example` com `DB_TYPE=json`
- `pg` + `@types/pg` instalados
- Decisões técnicas (não reabrir): cliente `pg` direto; JWT custom mantido; `tenant_id` VARCHAR(50) nullable; sem RLS agora; testes em `DB_TYPE=json`.

---

## Checklist de execução (Fases 3-5)

| # | Tarefa | Status |
|---|--------|--------|
| 1 | Instalar pg + @types/pg | [x] Concluído |
| 2 | Criar projeto no Supabase (`kyzayhxtmivmkkwdvfbd`) | [x] Concluído |
| 3 | Obter `DATABASE_URL` + senha (`@Colares81@`) | [x] Concluído |
| 4 | Configurar `.env` com `DATABASE_URL`, `SECRET_KEY`, `PORT`, `DB_TYPE=postgres` | [x] Concluído |
| 5 | Adicionar `dotenv` e carregar `.env` em `server.ts` | [x] Concluído |
| 6 | Validar conexão: `npm run dev` + `/api/health` → `{status:"ok"}` | [x] Concluído |
| 7 | Testes com `DB_TYPE=json`: 111/111 passando | [x] Concluído |
| 8 | `tsc --noEmit`: 0 erros | [x] Concluído |
| 9 | Rodar schema SQL de 14 tabelas no SQL Editor (feito automaticamente por `ensureTables()` ao subir com Postgres) | [x] Concluído |
| 10 | Script de migração `scripts/migrate-json-to-supabase.ts` (criado e executado: 14 tabelas populadas) | [x] Concluído |
| 11 | Validar login `adm@adm.com` / `123` + CRUD moradores (50 rows retornados via API autenticada) | [x] Concluído |
| 12 | Desbloquear conexão: obter connection string IPv4 do pooler Supabase (porta 6543) | [x] Concluído |
| 13 | Atualizar `.env` com `DATABASE_URL` funcional (IPv4 pooler) | [x] Concluído |
| 14 | Re-executar script de migração `scripts/migrate-json-to-supabase.ts` | [x] Concluído |
| 15 | Validar persistência: POST novo dado → GET → confirmar no Supabase Table Editor | [x] Concluído |
| 16 | Validação final: `tsc --noEmit` = 0 erros + `npm test` (DB_TYPE=json) = 111/111 | [x] Concluído |

---

## Passo a passo

### 1. Criar projeto no Supabase (MANUAL — usuário no dashboard)

1. Acesse https://supabase.com e faça login (GitHub).
2. **"New project"**.
3. Organização: escolher a existente. Nome: `condominio-ambros`.
4. Região: South America / São Paulo.
5. Defina senha do banco de dados (anote-a).
6. Aguarde provisionamento (~1-2 min).

### 2. Obter credenciais (MANUAL — usuário anota)

Dashboard → **Settings → Database**:
- Connection string (URI) → `DATABASE_URL`  
  Ex: `postgresql://postgres:SUA_SENHA@db.xxx.supabase.co:5432/postgres`

Dashboard → **Settings → API**:
- Project URL → `SUPABASE_URL`  
  Ex: `https://xxx.supabase.co`
- anon public key → `SUPABASE_ANON_KEY`

### 3. Executar schema SQL no Supabase (MANUAL — usuário cola no SQL Editor)

Dashboard → **SQL Editor** → cole o schema abaixo → **Run**. Verificar **Table Editor** que 14 tabelas foram criadas.

```sql
-- Usuarios
CREATE TABLE IF NOT EXISTS usuarios (
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
CREATE TABLE IF NOT EXISTS moradores (
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
CREATE TABLE IF NOT EXISTS veiculos (
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
CREATE TABLE IF NOT EXISTS visitantes (
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
CREATE TABLE IF NOT EXISTS acessos (
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
CREATE TABLE IF NOT EXISTS encomendas (
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
CREATE TABLE IF NOT EXISTS prestadores (
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
CREATE TABLE IF NOT EXISTS ocorrencias (
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
CREATE TABLE IF NOT EXISTS restricoes_acesso (
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
CREATE TABLE IF NOT EXISTS reservas (
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
CREATE TABLE IF NOT EXISTS comunicados (
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
CREATE TABLE IF NOT EXISTS notificacoes_morador (
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
CREATE TABLE IF NOT EXISTS preautorizacoes_visitante (
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
CREATE TABLE IF NOT EXISTS leads (
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

-- Indices
CREATE INDEX IF NOT EXISTS idx_usuarios_email ON usuarios(email);
CREATE INDEX IF NOT EXISTS idx_moradores_cpf ON moradores(cpf);
CREATE INDEX IF NOT EXISTS idx_veiculos_placa ON veiculos(placa);
CREATE INDEX IF NOT EXISTS idx_visitantes_morador ON visitantes(morador_visitado_id);
CREATE INDEX IF NOT EXISTS idx_acessos_registrado ON acessos(registrado_em);
CREATE INDEX IF NOT EXISTS idx_encomendas_morador ON encomendas(morador_id);
CREATE INDEX IF NOT EXISTS idx_encomendas_codigo ON encomendas(codigo_retirada);
CREATE INDEX IF NOT EXISTS idx_prestadores_morador ON prestadores(morador_autorizador_id);
CREATE INDEX IF NOT EXISTS idx_reservas_data ON reservas(data_reserva);
CREATE INDEX IF NOT EXISTS idx_notificacoes_morador ON notificacoes_morador(morador_id);
```

### 4. Configurar `.env` (MANUAL — usuário edita o arquivo)

Edite `C:\Users\Usuário\Documents\Condominio\.env` e preencha com os valores reais:

```env
ACCESS_TOKEN_EXPIRE_MINUTES=480
DATABASE_URL=postgresql://postgres:SUA_SENHA@db.xxx.supabase.co:5432/postgres
SECRET_KEY=troque-esta-chave-em-producao
PORT=3000
DB_TYPE=postgres
```

Substitua `SUA_SENHA` e `db.xxx.supabase.co` pelos valores reais do passo 2. Não commitar `.env`.

### 5. Validar conexão (agente executa)

```bash
DB_TYPE=postgres npm run dev
```

Deve subir sem erros de conexão. Acesse `http://localhost:3000/api/health` → deve retornar `{ status: "ok" }`.

Depois volte para `DB_TYPE=json` para continuar desenvolvendo/testando localmente (testes não dependem de Postgres).

### 6. Desbloquear conexão Supabase (IPv6 → IPv4 pooler)

O host `db.kyzayhxtmivmkkwdvfbd.supabase.co` expõe apenas **IPv6** e este ambiente não tem conectividade IPv6. Para validar a persistência, obter uma connection string IPv4 via **connection pooler** do Supabase:

1. Dashboard do Supabase → **Settings → Database**
2. Procure por **"Connection pooling"** / **"Pooler"**
3. Anote o host IPv4 e porta (ex: `aws-0-sa-east-1.pooler.supabase.com:6543`)
4. Montar nova `DATABASE_URL`:
   ```
   postgresql://postgres:<senha>@<host-pooler>:6543/postgres
   ```
   Ou use o usuário do pooler (ex: `postgres.kyzayhxtmivmkkwdvfbd:<senha>@<host-pooler>:6543/postgres`)
5. Atualizar `.env` com a nova `DATABASE_URL` (manter `DB_TYPE=postgres`)
6. Re-executar `scripts/migrate-json-to-supabase.ts` para popular as tabelas
7. Validar persistência: POST novo dado → GET → confirmar no Table Editor

Alternativa: usar um ambiente com conectividade IPv6 para rodar diretamente com o host `db.kyzayhxtmivmkkwdvfbd.supabase.co:5432`.

### 7. Validar persistência de dados no Supabase (round-trip completo)

Com a connection string funcionando (IPv4 pooler ou ambiente IPv6), rode o servidor com Postgres:

```bash
npm run dev
```

1. **Obter token de autenticação** (login adm@adm.com / 123):
   ```bash
   POST http://localhost:3000/auth/login
   body: { "email": "adm@adm.com", "senha": "123" }
   ```
   Guarde o `access_token` retornado.

2. **Inserir novo dado** (ex: criar um morador):
   ```bash
   POST http://localhost:3000/moradores
   headers: { Authorization: "Bearer <token>" }
   body: { "nome_completo": "Teste Supabase", "cpf": "000.000.000-00", "vinculo": "proprietario", ... }
   ```
   Anote o `id` retornado.

3. **Confirmar via GET** que o dado veio do Supabase:
   ```bash
   GET http://localhost:3000/moradores
   headers: { Authorization: "Bearer <token>" }
   ```
   Verifique que o novo morador aparece na lista.

4. **Confirmar diretamente no Supabase** (Table Editor ou SQL Editor):
   ```sql
   SELECT * FROM moradores WHERE cpf = '000.000.000-00';
   ```
   O registro deve existir com `tenant_id` null.

5. **Repetir para outras tabelas** (visitantes, veiculos, acessos, encomendas, etc.) usando seus respectivos endpoints POST/GET.

---

## Validação final (antes de considerar concluído)

| Tarefa | Comando | Resultado esperado |
|--------|---------|-------------------|
| TypeScript | `tsc --noEmit` | 0 erros |
| Testes (local) | `$env:DB_TYPE="json"; npm test` | 111/111 passando |
| Servidor (Postgres) | `npm run dev` | Sobe sem erros de conexão; `/api/health` → `{status:"ok"}` |
| Persistência | POST → GET → Table Editor | Novo dado aparece no Supabase |

---

## Próximos passos (após validação — fora deste plano)

1. Testes continuam em `DB_TYPE=json` (111/111 passando).
2. Deploy Render: adicionar `DB_TYPE=postgres`, `DATABASE_URL`, `SECRET_KEY`, `PORT`.

---

## Deploy Render (variáveis de ambiente)

Adicionar no Render: `DB_TYPE=postgres`, `DATABASE_URL`, `SECRET_KEY`, `PORT`.