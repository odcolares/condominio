# AMBROS — Sistema de Controle de Acesso

> Sistema de gestão de condomínio residencial com backend em **TypeScript + Express**,
> autenticação JWT e 12 routers cobrindo controle de acesso, visitantes, prestadores,
> ocorrências, restrições de portaria, reservas de áreas comuns e portal do morador.

## 📂 Estrutura do Projeto

```
AMBROS/
├── server.ts                    # Entry point — app Express (PORT 3000)
├── src/
│   ├── auth.ts                  # JWT: createToken, authMiddleware
│   ├── db.ts                    # InMemoryDB persistindo em data/database.json
│   ├── types.ts                 # Types do domínio (13 interfaces + unions)
│   └── routes/                  # 11 arquivos → 12 routers montados
│       ├── auth.ts              # /auth
│       ├── dashboard.ts         # /dashboard
│       ├── moradores.ts          # /moradores
│       ├── veiculos.ts           # /veiculos
│       ├── visitantes.ts         # /visitantes
│       ├── acessos.ts            # /acessos
│       ├── encomendas.ts         # /encomendas
│       ├── prestadores.ts         # /prestadores
│       ├── ocorrencias.ts         # /ocorrencias + /restricoes (2 routers, 1 arquivo)
│       ├── reservas.ts            # /reservas
│       └── portal.ts              # /portal
├── public/                      # Frontend estático (13 páginas HTML + Bootstrap 5 + Chart.js)
│   ├── login.html
│   ├── index.html
│   ├── ambros-dashboard.html
│   ├── auditoria.html           # Consulta GET /acessos (sem router próprio)
│   ├── moradores.html
│   ├── veiculos.html
│   ├── visitantes.html
│   ├── prestadores.html
│   ├── ocorrencias.html
│   ├── reservas.html
│   ├── encomendas.html
│   ├── portaria-entrada.html
│   └── portal-morador.html
├── data/
│   └── database.json             # Persistência em JSON (gerenciada pelo InMemoryDB)
├── .env.example                 # Configurações: SECRET_KEY, PORT, etc.
├── package.json                 # express, jsonwebtoken, cors, chart.js
└── tsconfig.json                # ES2022, NodeNext, strict
```

## 🚀 Como rodar

```bash
npm install
npm run dev      # desenvolvimento (tsx watch)
npm run build    # produção (tsc)
npm start        # produção (node dist/server.js)
```

O servidor fica em `http://0.0.0.0:3000`.

## 🔌 API Endpoints

Todas as rotas estão montadas sob `/` e `/api` (ex: `/auth/login` e `/api/auth/login`).

### Auth

| Método | Endpoint        | Descrição                                 |
| ------- | --------------- | ------------------------------------------- |
| POST    | `/auth/login` | Autenticação por email/senha, retorna JWT |
| GET     | `/auth/me`    | Dados do usuário autenticado               |

### Dashboard

| Método | Endpoint       | Descrição                                                             |
| ------- | -------------- | ----------------------------------------------------------------------- |
| GET     | `/dashboard` | Cards, movimentação por faixas de 3h, últimos acessos, visitantes 7d |

### Moradores

| Método | Endpoint           | Descrição                                                  |
| ------- | ------------------ | ------------------------------------------------------------ |
| GET     | `/moradores`     | Lista com busca (nome/CPF/bloco), filtros, skip/limit        |
| GET     | `/moradores/:id` | Busca por ID                                                 |
| POST    | `/moradores`     | Cadastro (aceita`placa_veiculo`; valida contato e bloco/apartamento) |
| PUT     | `/moradores/:id` | Atualização parcial (valida contato e bloco/apartamento)           |
| DELETE  | `/moradores/:id` | Exclusão (remove veículos vinculados)                      |

### Veículos

| Método | Endpoint            | Descrição                                                                            |
| ------- | ------------------- | -------------------------------------------------------------------------------------- |
| GET     | `/veiculos/stats` | Estatísticas:`total`, `com_morador`, `vagas_ocupadas`, `visitantes_com_carro` |
| GET     | `/veiculos`       | Lista com busca por placa/modelo/morador                                               |
| GET     | `/veiculos/:id`   | Busca por ID                                                                           |
| POST    | `/veiculos`       | Cadastro (valida placa duplicada)                                                      |
| PUT     | `/veiculos/:id`   | Atualização                                                                          |
| DELETE  | `/veiculos/:id`   | Exclusão                                                                              |

### Visitantes

| Método | Endpoint                    | Descrição                                                                                           |
| ------- | --------------------------- | ----------------------------------------------------------------------------------------------------- |
| GET     | `/visitantes/stats`       | Estatísticas: total, presentes, agendados hoje                                                       |
| GET     | `/visitantes`             | Lista com filtros`busca`, `presentes`, `skip`, `limit` (inclui flag `expirado`)             |
| GET     | `/visitantes/:id`         | Busca por ID (inclui dados do morador visitado e`expirado`)                                         |
| POST    | `/visitantes`             | Cadastro (`entrada_imediata` gera acesso; retorna `whatsappUrl`/`telegramUrl`) |
| PUT     | `/visitantes/:id`         | Atualização                                                                                         |
| POST    | `/visitantes/:id/entrada` | Registra entrada: cria`Acesso`, define `presente = true`; retorna `whatsappUrl`/`telegramUrl`        |
| POST    | `/visitantes/:id/saida`   | Registra saída: cria`Acesso`, define `presente = false` (visitantes possuem auto-saída em 24h)       |
| DELETE  | `/visitantes/:id`         | Exclusão                                                                                             |

### Acessos

| Método | Endpoint     | Descrição                                                                                                                                               |
| ------- | ------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| GET     | `/acessos` | Lista com filtros`tipo_pessoa`, `sentido`, `inicio`, `fim`, `busca`, `skip`, `limit` (inclui `duracao_minutos` e `em_aberto` derivados) |
| POST    | `/acessos` | Registro manual de entrada/saída (atualiza`presente` de visitante/prestador)                                                                           |

### Encomendas

| Método | Endpoint                      | Descrição                                               |
| ------- | ----------------------------- | --------------------------------------------------------- |
| GET     | `/encomendas`               | Lista com filtros por status/busca                        |
| GET     | `/encomendas/stats`         | Total, pendentes, retiradas hoje                          |
| GET     | `/encomendas/:id`           | Busca por ID (inclui`whatsappUrl`/`telegramUrl`)                                                 |
| POST    | `/encomendas`               | Cadastro (gera código RET-XXXX; propaga`morador_telegram` do morador e inclui links de notificação) |
| POST    | `/encomendas/:id/retirar`   | Retirada (valida código de retirada)                                                              |
| POST    | `/encomendas/:id/notificar` | Marca notificação enviada (whatsapp/telegram); retorna `whatsappUrl`/`telegramUrl`                |
| DELETE  | `/encomendas/:id`           | Exclusão                                                 |

### Prestadores

| Método | Endpoint                     | Descrição                                                                                            |
| ------- | ---------------------------- | ------------------------------------------------------------------------------------------------------ |
| GET     | `/prestadores`             | Lista com filtros`presentes`, `busca`, `bloco`, `apartamento` (inclui `expirado`)            |
| GET     | `/prestadores/:id`         | Busca por ID (inclui`expirado` e `whatsappUrl`/`telegramUrl`)                                     |
| POST    | `/prestadores`             | Cadastro (exige`nome`, `documento`, `funcao`, `data_inicio`, e `data_fim` ou `prazo_dias`; retorna links) |
| PUT     | `/prestadores/:id`         | Atualização (aceita`prazo_dias` para recalcular `data_fim`)                                      |
| POST    | `/prestadores/:id/entrada` | Registra entrada: cria`Acesso`, define `presente = true`; retorna `whatsappUrl`/`telegramUrl`    |
| POST    | `/prestadores/:id/saida`   | Registra saída: cria`Acesso`, define `presente = false`; retorna links                           |
| DELETE  | `/prestadores/:id`         | Exclusão                                                                                              |

### Ocorrências

| Método | Endpoint             | Descrição                                                                                            |
| ------- | -------------------- | ------------------------------------------------------------------------------------------------------ |
| GET     | `/ocorrencias`     | Lista com filtros`status`, `categoria`, `gravidade`, `busca` (mais recentes primeiro)          |
| GET     | `/ocorrencias/:id` | Busca por ID (inclui`whatsappUrl`/`telegramUrl`)                                               |
| POST    | `/ocorrencias`     | Cadastro (exige`titulo`, `categoria`, `gravidade`, `descricao`; status inicia como `aberta`; notifica morador) |
| PUT     | `/ocorrencias/:id` | Atualização; ao mudar para`resolvida` preenche `resolvido_em`; retorna links                    |
| DELETE  | `/ocorrencias/:id` | Exclusão                                                                                              |

### Restrições de acesso

| Método | Endpoint                  | Descrição                                                                                                                       |
| ------- | ------------------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| GET     | `/restricoes`           | Lista apenas as restrições ativas                                                                                               |
| POST    | `/restricoes`           | Cadastro (exige`tipo_identificador`, `valor_identificador`, `motivo`, `instrucao_portaria`)                               |
| GET     | `/restricoes/verificar` | Checagem rápida por`termo`/`documento`/`placa`; normaliza pontuação e retorna `{ alerta, bloqueio_total, restricoes }` |
| DELETE  | `/restricoes/:id`       | Soft delete — define`ativo = false`                                                                                            |

### Reservas

| Método | Endpoint              | Descrição                                                                                  |
| ------- | --------------------- | -------------------------------------------------------------------------------------------- |
| GET     | `/reservas/espacos`   | Catálogo de áreas comuns (capacidade, regras, taxa)                                         |
| GET     | `/reservas`           | Lista com filtros`espaco`, `status`, `morador_id`, `data`                                   |
| GET     | `/reservas/:id`       | Busca por ID (inclui`whatsappUrl`/`telegramUrl`)                                            |
| POST    | `/reservas`           | Cadastro; retorna`409` em conflito de período; notifica morador com links                  |
| PUT     | `/reservas/:id`       | Atualização de`status` e `observacoes`; retorna links                                     |
| DELETE  | `/reservas/:id`       | Exclusão                                                                                     |

### Portal do morador

| Método | Endpoint                          | Descrição                                                                                                                  |
| ------- | --------------------------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| GET     | `/portal/morador`               | Visão consolidada (morador, veículos, encomendas, pré-autorizações, reservas, prestadores, comunicados, notificações) |
| POST    | `/portal/preautorizacao`        | Pré-autoriza visitante: gera`codigo_acesso_qr` (`QR-XXXX`), registra o visitante na portaria e notifica o morador       |
| DELETE  | `/portal/preautorizacao/:id`    | Exclusão                                                                                                                    |
| GET     | `/portal/comunicados`           | Mural: comunicados ativos (mais recentes primeiro)                                                                           |
| POST    | `/portal/comunicados`           | Publica comunicado e notifica todos os moradores                                                                             |
| DELETE  | `/portal/comunicados/:id`       | Soft delete — define`ativo = false`                                                                                       |
| POST    | `/portal/notificacoes/disparar` | Simula envio de notificação a um morador; retorna `whatsappUrl`/`telegramUrl`                       |

## 🔄 Fluxo de visitantes

```
POST /visitantes            → cria o registro (com entrada_imediata já gera o acesso)
POST /visitantes/:id/entrada → Accesso(sentido="entrada") + visitante.presente = true
POST /visitantes/:id/saida   → Acesso(sentido="saida")   + visitante.presente = false
```

**Tempo de permanência:** derivado em leitura via `src/lib/duracao.ts`. Cada registro de
acesso expõe `duracao_minutos` (tempo entre `entrada` e `saida`) e `em_aberto` (pessoa ainda
dentro no momento). Para visitantes, a janela considera o limite de 24h.
Prestador: `prazo_dias` (ou `data_fim` explícito) e `expirado` derivado.
Nenhum destes campos é persistido — são calculados a cada leitura.

## 🔐 Autenticação

- Token **JWT** com expiração de **8h** (`sub` = e-mail do usuário)
- Credenciais padrão de desenvolvimento: `adm@adm.com` / `123` (perfil: admin)
- `authMiddleware` protege todas as rotas de negócio; públicas: `POST /auth/login` e `GET /api/health`
- Uso: `Authorization: Bearer <token>`

## 💾 Persistência

- **InMemoryDB** (singleton `db`) mantém dados em memória e persiste em `data/database.json`
- Salvamento atômico via tmp + rename
- 13 coleções: `usuarios`, `moradores`, `veiculos`, `visitantes`, `acessos`, `encomendas`,
  `prestadores`, `ocorrencias`, `restricoes`, `reservas`, `comunicados`, `notificacoes`,
  `preautorizacoes`
- Seed automático na inicialização para todas as coleções

## ⚠️ Notas Técnicas

- Frontend em HTML estático + Bootstrap 5 + Chart.js (sem SPA framework)
- `public/auditoria.html` não possui router dedicado — consome `GET /acessos`
- Testes automatizados com **vitest** + **supertest** (67 testes, 8 ficheiros) — rode `npm test`
- CI com **GitHub Actions** (`.github/workflows/ci.yml`): build + teste em push e PR (Node 22)
- Deploy configurado via **`render.yaml`** (Blueprint) — ver secção "Deploy" abaixo
- Senha em texto plano em desenvolvimento (`123`) — substituir por hash em produção
- `SECRET_KEY` padrão: `troque-esta-chave-em-producao` — deve ser sobrescrito via `.env`
- `GET /restricoes/verificar` faz normalização de pontuação para comparar CPF/placa
- Rotas de API retornam JSON; erros não tratados retornam JSON (não HTML)

## 📲 Notificações (WhatsApp & Telegram)

AMBROS notifica moradores sobre encomendas, visitas, reservas, prestadores e
ocorrências. Como o projeto não integra APIs reais de envio, as notificações
são realizadas por **links de abertura direta**:

- **WhatsApp:** `https://api.whatsapp.com/send?phone=55<ddd><numero>&text=<mensagem>`
- **Telegram:** `https://t.me/<username>` (ou `https://t.me/share/url?...` como fallback)

### Como funciona

1. `src/lib/notificacoes.ts` contém a lógica central:
   - `normalizarFone` — limpa dígitos, adiciona DDI `55`, remove o nono dígito
   - `normalizarTelegram` — remove `@` e normaliza username
   - `gerarLinksNotificacao` — gera `whatsappUrl` e `telegramUrl` a partir de um `Morador`
   - Templates: `tmplEncomenta`, `tmplVisita`, `tmplVisitaSaida`, `tmplReserva`,
     `tmplPrestador`, `tmplOcorrencia` — geram a mensagem de aviso

2. As rotas retornam `whatsappUrl` e `telegramUrl` em `GET /:id`, `POST`,
   `POST /:id/entrada`, `POST /:id/saida` e `POST /:id/notificar`.

3. O frontend (HTML) abre os links via `window.open()` — abrindo o app do
   celular ou a web versão.

### Cadastro de morador

- `whatsapp`, `telegram` e/ou `telefone` são opcionais individualmente, mas
  **pelo menos um contato é obrigatório**
- `bloco` e `apartamento` são obrigatórios
- O campo `telegram` aceita o username com ou sem `@` (ex: `@carloslima502`)

## 🚀 Deploy

O projeto está pronto para deploy no **Render** via Blueprint (`render.yaml`):

- `env`: Node 22, `buildCommand: npm install`, `startCommand: npm start`
- Env vars: `SECRET_KEY` (gere um valor forte), `ACCESS_TOKEN_EXPIRE_MINUTES=480`
- `PORT` é injetada pelo Render (o código lê `process.env.PORT`)
- Tipo: Web Service (Node), plano Free para demo

Para rodar localmente:

```bash
npm run dev        # http://localhost:3000
npm test           # testes (vitest)
npm run build      # tsc
```
