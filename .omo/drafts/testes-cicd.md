---
slug: testes-cicd
status: aprovado
intent: clear
pending-action: escrever .omo/plans/testes-cicd.md
abordagem: vitest + supertest para testes de integração, GitHub Actions para CI. Exportar app de server.ts, excluir testes da build, adicionar helper de reset da bd.
aprovação: utilizador disse "Sim add um plano são necessarios os teste"
---

# Rascunho: testes-cicd

## Componentes (ledger de topologia)
| id | resultado | status | evidência |
| --- | --- | --- | --- |
| C1 | Exportar `app` de server.ts + proteger `app.listen()` para testabilidade | ativo | server.ts:20,103 |
| C2 | Infraestrutura de testes: vitest + supertest + scripts package.json + exclusão no tsconfig | ativo | package.json (sem script test), tsconfig.json (inclui src/**/*) |
| C3 | Helper de reset da bd para isolamento de testes | ativo | src/db.ts (singleton, seed em :93) |
| C4 | Testes de integração das rotas de autenticação | ativo | src/routes/auth.ts |
| C5 | Testes de integração das rotas de visitantes | ativo | src/routes/visitantes.ts |
| C6 | Testes de integração das rotas de acessos | ativo | src/routes/acessos.ts |
| C7 | Testes de integração das rotas de prestadores | ativo | src/routes/prestadores.ts |
| C8 | Workflow de CI com GitHub Actions | ativo | .github/workflows/ (não existe) |

## Suposições abertas (defaults anunciados)
| suposição | default adotado | razão | reversível? |
| Framework de teste | vitest | Padrão moderno TS, watch mode, boas assertions, funciona com tsx | sim |
| Estilo de teste | Integração (supertest) para rotas + unit para lógica pura | Testes de integração dão mais confiança para um protótipo | sim |
| Reset da bd | Exportar `__resetDb()` de db.ts, chamar no `beforeEach` | Singleton não tem mecanismo de reset; mais limpo sem mudar código de produção | sim |
| Trigger de CI | push para main + pull_request | Padrão para protótipo | sim |
| Versão Node no CI | 22 | Corresponde à devDependency @types/node | sim |

## Achados (citados - caminho:linhas)
- `server.ts:20` — `const app = express()` NÃO é exportado. `server.ts:103` chama `app.listen()` incondicionalmente. Para supertest, `app` deve ser exportado e `listen` protegido.
- `tsconfig.json` — `"include": ["server.ts", "src/**/*"]` significa que ficheiros de teste sob `src/` seriam compilados para `dist/`. Testes devem ser excluídos da tsconfig de build.
- `package.json` — sem script `test`, sem dependências de teste. devDependencies: tsx, typescript, @types/*.
- `src/db.ts:22` — `class InMemoryDB` singleton. `src/db.ts:93` — seed corre se coleções vazias. Não existe mecanismo de reset.
- `src/db.ts:51-63` — construtor lê `database.json` se existir, senão semeia. `src/db.ts:112-128` — `save()` escreve todas as coleções.
- Rotas montam sob root e `/api` (server.ts:52-55), por isso os testes podem atingir qualquer um dos dois.
- Handler de erro global em server.ts:98-101 retorna JSON — testes podem assertar em respostas de erro.
- Auth: `POST /auth/login` retorna JWT; `authMiddleware` protege rotas de negócio. Públicas: `POST /auth/login`, `GET /api/health`.

## Decisões (com razão)
- vitest em vez de node:test: melhor DX (watch mode, snapshots, melhor output de erro), padrão da indústria para TS, zero config com tsx. Reversível.
- supertest para integração: testa fluxo HTTP real → route → bd. Mais valioso que testes unitários para um protótipo sem camada de lógica de negócio.
- exportar `__resetDb()`: mudança mínima em código de produção, só usada em testes. Alternativa (ficheiro de bd de teste separado) requer plumbing de variáveis de ambiente.
- GitHub Actions em vez de outro CI: repo já está no GitHub, gratuito para privado, zero config.

## Escopo IN
- Exportar `app` de server.ts + proteger listen
- vitest + supertest + scripts de teste + exclusão no tsconfig
- Helper de reset da bd
- Testes de integração para auth, visitantes, acessos, prestadores
- Workflow de CI com GitHub Actions

## Escopo OUT (NÃO deve ter)
- NÃO deve adicionar ficheiros de teste à saída da build de produção (`dist/`).
- NÃO deve alterar o comportamento das rotas de produção ou a lógica de negócio.
- NÃO deve adicionar um ficheiro de bd de teste separado nem variáveis de ambiente para isso.
- NÃO deve testar rotas complexas (dashboard, portal, reservas, encomendas, ocorrências, restricoes, veiculos, moradores) — fora do escopo para protótipo.
- NÃO deve adicionar limites de cobertura, imposição, nem relatórios de cobertura.
- NÃO deve adicionar um passo de deploy de staging/produção ao CI.

## Perguntas abertas
- (nenhuma bloqueante)

## Gate de aprovação
status: aprovado
aprovado-por: utilizador — "Sim add um plano são necessarios os teste"
registado: 2026-10-03
próximo: APPEND tarefas, preencher TL;DR por último, apresentar resumo
