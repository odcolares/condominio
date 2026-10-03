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
| Método | Endpoint | Descrição |
|--------|----------|-----------|
| POST | `/auth/login` | Autenticação por email/senha, retorna JWT |
| GET | `/auth/me` | Dados do usuário autenticado |

### Dashboard
| Método | Endpoint | Descrição |
|--------|----------|-----------|
| GET | `/dashboard` | Cards, movimentação por faixas de 3h, últimos acessos, visitantes 7d |

### Moradores
| Método | Endpoint | Descrição |
|--------|----------|-----------|
| GET | `/moradores` | Lista com busca (nome/CPF/bloco), filtros, skip/limit |
| GET | `/moradores/:id` | Busca por ID |
| POST | `/moradores` | Cadastro (aceita `placa_veiculo` para cadastro simultâneo) |
| PUT | `/moradores/:id` | Atualização parcial |
| DELETE | `/moradores/:id` | Exclusão (remove veículos vinculados) |

### Veículos
| Método | Endpoint | Descrição |
|--------|----------|-----------|
| GET | `/veiculos/stats` | Estatísticas: `total`, `com_morador`, `vagas_ocupadas`, `visitantes_com_carro` |
| GET | `/veiculos` | Lista com busca por placa/modelo/morador |
| GET | `/veiculos/:id` | Busca por ID |
| POST | `/veiculos` | Cadastro (valida placa duplicada) |
| PUT | `/veiculos/:id` | Atualização |
| DELETE | `/veiculos/:id` | Exclusão |

### Visitantes
| Método | Endpoint | Descrição |
|--------|----------|-----------|
| GET | `/visitantes/stats` | Estatísticas: total, presentes, agendados hoje |
| GET | `/visitantes` | Lista com filtros `busca`, `presentes`, `skip`, `limit` |
| GET | `/visitantes/:id` | Busca por ID (inclui dados do morador visitado) |
| POST | `/visitantes` | Cadastro (`entrada_imediata` já gera o acesso de entrada) |
| PUT | `/visitantes/:id` | Atualização |
| POST | `/visitantes/:id/entrada` | Registra entrada: cria `Acesso` e define `presente = true` |
| POST | `/visitantes/:id/saida` | Registra saída: cria `Acesso` e define `presente = false` |
| DELETE | `/visitantes/:id` | Exclusão |

### Acessos
| Método | Endpoint | Descrição |
|--------|----------|-----------|
| GET | `/acessos` | Lista com filtros `tipo_pessoa`, `sentido`, `inicio`, `fim`, `busca`, `skip`, `limit` |
| POST | `/acessos` | Registro manual de entrada/saída (atualiza `presente` de visitante/prestador) |

### Encomendas
| Método | Endpoint | Descrição |
|--------|----------|-----------|
| GET | `/encomendas` | Lista com filtros por status/busca |
| GET | `/encomendas/stats` | Total, pendentes, retiradas hoje |
| GET | `/encomendas/:id` | Busca por ID |
| POST | `/encomendas` | Cadastro (gera código RET-XXXX e links de notificação) |
| POST | `/encomendas/:id/retirar` | Retirada (valida código de retirada) |
| POST | `/encomendas/:id/notificar` | Marca notificação enviada (whatsapp/telegram) |
| DELETE | `/encomendas/:id` | Exclusão |

### Prestadores
| Método | Endpoint | Descrição |
|--------|----------|-----------|
| GET | `/prestadores` | Lista com filtros `presentes`, `busca`, `bloco`, `apartamento` (presentes primeiro) |
| GET | `/prestadores/:id` | Busca por ID |
| POST | `/prestadores` | Cadastro (exige `nome`, `documento`, `funcao`, `data_inicio`, `data_fim`) |
| PUT | `/prestadores/:id` | Atualização |
| POST | `/prestadores/:id/entrada` | Registra entrada: cria `Acesso` e define `presente = true` |
| POST | `/prestadores/:id/saida` | Registra saída: cria `Acesso` e define `presente = false` |
| DELETE | `/prestadores/:id` | Exclusão |

### Ocorrências
| Método | Endpoint | Descrição |
|--------|----------|-----------|
| GET | `/ocorrencias` | Lista com filtros `status`, `categoria`, `gravidade`, `busca` (mais recentes primeiro) |
| GET | `/ocorrencias/:id` | Busca por ID |
| POST | `/ocorrencias` | Cadastro (exige `titulo`, `categoria`, `gravidade`, `descricao`; status inicia como `aberta`) |
| PUT | `/ocorrencias/:id` | Atualização; ao mudar para `resolvida` preenche `resolvido_em` |
| DELETE | `/ocorrencias/:id` | Exclusão |

### Restrições de acesso
| Método | Endpoint | Descrição |
|--------|----------|-----------|
| GET | `/restricoes` | Lista apenas as restrições ativas |
| POST | `/restricoes` | Cadastro (exige `tipo_identificador`, `valor_identificador`, `motivo`, `instrucao_portaria`) |
| GET | `/restricoes/verificar` | Checagem rápida por `termo`/`documento`/`placa`; normaliza pontuação e retorna `{ alerta, bloqueio_total, restricoes }` |
| DELETE | `/restricoes/:id` | Soft delete — define `ativo = false` |

### Reservas
| Método | Endpoint | Descrição |
|--------|----------|-----------|
| GET | `/reservas/espacos` | Catálogo de áreas comuns (capacidade, regras, taxa) |
| GET | `/reservas` | Lista com filtros `espaco`, `status`, `morador_id`, `data` |
| POST | `/reservas` | Cadastro; retorna `409` em conflito de período e notifica o morador |
| PUT | `/reservas/:id` | Atualização de `status` e `observacoes` |
| DELETE | `/reservas/:id` | Exclusão |

### Portal do morador
| Método | Endpoint | Descrição |
|--------|----------|-----------|
| GET | `/portal/morador` | Visão consolidada (morador, veículos, encomendas, pré-autorizações, reservas, prestadores, comunicados, notificações) |
| POST | `/portal/preautorizacao` | Pré-autoriza visitante: gera `codigo_acesso_qr` (`QR-XXXX`), registra o visitante na portaria e notifica o morador |
| DELETE | `/portal/preautorizacao/:id` | Exclusão |
| GET | `/portal/comunicados` | Mural: comunicados ativos (mais recentes primeiro) |
| POST | `/portal/comunicados` | Publica comunicado e notifica todos os moradores |
| DELETE | `/portal/comunicados/:id` | Soft delete — define `ativo = false` |
| POST | `/portal/notificacoes/disparar` | Simula o envio de uma notificação a um morador |

## 🔄 Fluxo de visitantes

```
POST /visitantes            → cria o registro (com entrada_imediata já gera o acesso)
POST /visitantes/:id/entrada → Accesso(sentido="entrada") + visitante.presente = true
POST /visitantes/:id/saida   → Acesso(sentido="saida")   + visitante.presente = false
```

**Tempo de permanência:** não é armazenado nem calculado. Cada evento de acesso guarda
apenas `registrado_em` (timestamp ISO). A duração poderia ser derivada emparelhando os
eventos de `entrada` e `saida` do mesmo `pessoa_id`, mas não existe endpoint nem campo
que faça esse cálculo. Idem para prestadores (`POST /prestadores/:id/entrada|saida`).

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
- Sem testes automatizados
- Senha em texto plano em desenvolvimento (`123`) — substituir por hash em produção
- `SECRET_KEY` padrão: `troque-esta-chave-em-producao` — deve ser sobrescrito via `.env`
- `GET /restricoes/verificar` faz normalização de pontuação para comparar CPF/placa
- Rotas de API retornam JSON; erros não tratados retornam JSON (não HTML)
