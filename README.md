# AMBROS — Sistema de Controle de Acesso

> Sistema de gestão de condomínio residencial com backend em **TypeScript + Express**,
> autenticação JWT e CRUD completo para moradores, veículos, visitantes, acessos e encomendas.

## 📂 Estrutura do Projeto

```
AMBROS/
├── server.ts                    # Entry point — app Express (PORT 3000)
├── src/
│   ├── auth.ts                  # JWT middleware, createToken, authMiddleware
│   ├── db.ts                    # InMemoryDB persistindo em data/database.json
│   ├── types.ts                 # Interfaces: Morador, Veiculo, Visitante, Acesso, Encomenda
│   └── routes/                  # 7 routers: auth, dashboard, moradores, veiculos, visitantes, acessos, encomendas
├── public/                      # Frontend estático (HTML + Bootstrap 5 + Chart.js)
│   ├── login.html
│   ├── index.html
│   ├── ambros-dashboard.html
│   ├── moradores.html
│   ├── veiculos.html
│   ├── visitantes.html
│   ├── encomendas.html
│   └── portaria-entrada.html
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
| GET | `/veiculos` | Lista com busca por placa/modelo/morador |
| GET | `/veiculos/:id` | Busca por ID |
| POST | `/veiculos` | Cadastro (valida placa duplicada) |
| PUT | `/veiculos/:id` | Atualização |
| DELETE | `/veiculos/:id` | Exclusão |

### Visitantes
| Método | Endpoint | Descrição |
|--------|----------|-----------|
| GET | `/visitantes` | Lista com filtros |
| GET | `/visitantes/stats` | Estatísticas |
| POST | `/visitantes` | Cadastro (opcional entrada imediata) |
| PUT | `/visitantes/:id` | Atualização |
| DELETE | `/visitantes/:id` | Exclusão |

### Acessos
| Método | Endpoint | Descrição |
|--------|----------|-----------|
| GET | `/acessos` | Lista com filtros por tipo/pessoa/sentido/data |
| POST | `/acessos` | Registro de entrada/saída (atualiza presença do visitante) |

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

## 🔐 Autenticação

- Token **JWT** com expiração de **8h**
- Credenciais padrão de desenvolvimento: `adm@adm.com` / `123` (perfil: admin)
- Middleware `authMiddleware` protege todas as rotas exceto `/auth/login`
- Uso: `Authorization: Bearer <token>`

## 💾 Persistência

- **InMemoryDB** (singleton `db`) mantém dados em memória e persiste em `data/database.json`
- Salvamento atômico via tmp + rename
- Seed automático na inicialização (3 moradores, 2 veículos, 2 visitantes, 4 acessos, 2 encomendas)

## ⚠️ Notas Técnicas

- Frontend em HTML estático + Bootstrap 5 + Chart.js (sem SPA framework)
- Sem testes automatizados
- Senha em texto plano em desenvolvimento (`123`) — substituir por hash em produção
- `SECRET_KEY` padrão: `troque-esta-chave-em-producao` — deve ser sobrescrito via `.env`
