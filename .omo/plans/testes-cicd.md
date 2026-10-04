# testes-cicd - Plano de Trabalho

## TL;DR (Para humanos)

**O que vais obter:** Testes automatizados para as partes mais importantes do sistema — login, visitantes, registos de acesso e prestadores de serviço — mais um pipeline de CI que executa esses testes automaticamente em cada push e pull request.

**Porquê desta abordagem:** Testes de integração contra o servidor real dão a maior confiança para um protótipo, e executá-los em CI apanha regressões cedo sem esforço manual.

**O que NÃO vai fazer:** Testar todas as rotas, adicionar imposição de cobertura, alterar o funcionamento da app, ou fazer deploy em algum lado.

**Esforço:** Curto
**Risco:** Baixo — os testes são aditivos; a única alteração em produção é tornar a app importável para testes.
**Decisões a verificar:** vitest como framework; testar apenas os quatro grupos de rotas mais críticos por agora.

O teu próximo passo: aprovar para iniciar o trabalho (`$start-work`), ou executar a revisão de alta precisão primeiro. O detalhe completo da execução segue abaixo.

---

> TL;DR (máquina): Curto/Baixo — testes de integração com vitest + supertest para auth/visitantes/acessos/prestadores + CI com GitHub Actions.

## Escopo
### Deve ter
- Exportar `app` de `server.ts` e proteger `app.listen()` para que só execute quando o ficheiro é executado diretamente (não quando importado por testes).
- Infraestrutura de testes: `vitest` + `supertest` como devDependencies, script `test` no `package.json`, ficheiros de teste excluídos da build de produção (`tsconfig.json`).
- Um helper de reset da bd (`__resetDb()`) exportado de `src/db.ts` para isolamento de testes.
- Testes de integração para as rotas auth, visitantes, acessos e prestadores (happy path + casos de erro chave: 401, 404, 422).
- Workflow de CI com GitHub Actions: install → build → test em push para main e pull requests.

### NÃO deve ter (guardrails, anti-slop, limites de escopo)
- NÃO deve adicionar ficheiros de teste à saída da build de produção (`dist/`).
- NÃO deve alterar o comportamento das rotas de produção ou a lógica de negócio.
- NÃO deve adicionar um ficheiro de bd de teste separado nem variáveis de ambiente para isso.
- NÃO deve testar rotas complexas (dashboard, portal, reservas, encomendas, ocorrências, restricoes, veiculos, moradores) — fora do escopo para protótipo.
- NÃO deve adicionar limites de cobertura, imposição, nem relatórios de cobertura.
- NÃO deve adicionar um passo de deploy de staging/produção ao CI.

## Estratégia de verificação
> Zero intervenção humana — toda a verificação é executada por agente.
- Decisão de teste: tests-after + vitest (unit + integration) com supertest para HTTP
- Evidência: `.omo/evidence/task-<N>-testes-cicd.txt`
- Gate de build: `npm run build` (tsc) deve sair com código 0
- Gate de teste: `npm test` deve sair com código 0

## Estratégia de execução
### Ondas de execução paralela
- Onda 1 (infraestrutura, independente): Tarefa 1, Tarefa 2, Tarefa 3
- Onda 2 (testes, bloqueada pela Onda 1): Tarefa 4, 5, 6, 7
- Onda 3 (CI, bloqueada pela Onda 2): Tarefa 8

### Matriz de dependências
| Tarefa | Depende de | Bloqueia | Pode paralelizar com |
| --- | --- | --- | --- |
| 1 | — | 2,4,5,6,7 | 2,3 |
| 2 | 1 | 4,5,6,7,8 | 1,3 |
| 3 | — | 4,5,6,7 | 1,2 |
| 4 | 1,2,3 | 8 | 5,6,7 |
| 5 | 1,2,3 | 8 | 4,6,7 |
| 6 | 1,2,3 | 8 | 4,5,7 |
| 7 | 1,2,3 | 8 | 4,5,6 |
| 8 | 4,5,6,7 | — | — |

## Tarefas
> Implementação + Teste = UMA tarefa. Nunca separar.
<!-- APPEND TASK BATCHES BELOW THIS LINE WITH edit/apply_patch - never rewrite the headers above. -->
- [ ] 1. Exportar `app` de server.ts e proteger `app.listen()`
  O que fazer / NÃO fazer: Em `server.ts`, mudar `const app = express()` para `export const app = express()`. Proteger a chamada `app.listen()` na linha 103 para que só execute quando o ficheiro é executado diretamente (ex: `if (import.meta.url === pathToFileURL(process.argv[1]).href)` ou uma verificação de env `MAIN`). NÃO deve alterar qualquer comportamento de rota, ordem de middleware, nem a porta/host do listen.
  Paralelização: Onda 1 | Bloqueado por: nada | Bloqueia: 2,4,5,6,7
  Referências (o executor NÃO tem contexto de entrevista — ser exaustivo): server.ts:20 (app), server.ts:103 (listen), server.ts:17-18 (padrão import.meta.url já usado)
  Critérios de aceite (executáveis por agente): `npm run build` sai com código 0; `import { app } from "../server"` num ficheiro de teste NÃO inicia um listener; `npm run dev` continua a iniciar o servidor na porta 3000.
  Cenários de QA (nome da ferramenta exata + invocação): sucesso + falha, Evidência .omo/evidence/task-1-testes-cicd.txt
    - sucesso: importar app num teste não liga uma porta
    - falha: `npm run dev` continua a mostrar "Servidor rodando"
  Commit: Y | refactor(server): exporta app e protege listen para testes

- [ ] 2. Adicionar vitest + supertest e configurar scripts de teste
  O que fazer / NÃO fazer: Adicionar `vitest` e `supertest` (+ `@types/supertest`) às devDependencies. Adicionar `"test": "vitest run"` e `"test:watch": "vitest"` aos scripts do package.json. Adicionar `"exclude": ["src/**/*.test.ts", "src/**/__tests__/**"]` ao tsconfig.json para que os testes NÃO sejam compilados para `dist/`. Criar `vitest.config.ts` se necessário (os defaults normalmente chegam). NÃO deve adicionar vitest às `dependencies` (apenas devDependencies). NÃO deve quebrar `npm run build` ou `npm run dev`.
  Paralelização: Onda 1 | Bloqueado por: 1 | Bloqueia: 4,5,6,7,8
  Referências: package.json (scripts + devDependencies), tsconfig.json (include/exclude)
  Critérios de aceite: `npm test` sai com código 0 (mesmo com zero testes); `npm run build` sai com código 0 e `dist/` não contém ficheiros `.test.js`.
  Cenários de QA: sucesso + falha, Evidência .omo/evidence/task-2-testes-cicd.txt
    - sucesso: `npm test` executa vitest e sai com código 0
    - falha: `dist/` não tem ficheiros de teste após build
  Commit: Y | chore(test): adiciona vitest e supertest com scripts de teste

- [ ] 3. Adicionar helper de reset da bd para isolamento de testes
  O que fazer / NÃO fazer: Em `src/db.ts`, exportar uma função `__resetDb()` que re-semeia as 13 coleções para o seu estado inicial (ou as limpa para que o construtor re-semeie). Chamá-la no `beforeEach` ou `beforeAll` dos testes. NÃO deve alterar o comportamento de produção — a função só é chamada de testes. NÃO deve exportá-la de forma que polua o bundle de produção (é tree-shaken ou protegida).
  Paralelização: Onda 1 | Bloqueado por: nada | Bloqueia: 4,5,6,7
  Referências: src/db.ts:22 (class), src/db.ts:51-63 (construtor + seed), src/db.ts:93 (lógica de seed)
  Critérios de aceite: chamar `__resetDb()` duas vezes produz o mesmo estado de seed; um teste que muta dados e depois faz reset vê o seed original.
  Cenários de QA: sucesso + falha, Evidência .omo/evidence/task-3-testes-cicd.txt
    - sucesso: reset restaura dados de seed
    - falha: dois resets consecutivos produzem estado idêntico
  Commit: Y | test(db): adiciona helper de reset para isolamento de testes

- [ ] 4. Testes de integração das rotas de autenticação
  O que fazer / NÃO fazer: Criar `src/routes/auth.test.ts` testando `POST /auth/login` (sucesso retorna token + 200; senha errada retorna 401/422; campos em falta retornam 422) e `GET /auth/me` (com token válido retorna 200 + utilizador; sem token retorna 401). Usar supertest contra o `app` exportado. Chamar `__resetDb()` no `beforeEach`. NÃO deve testar expiração ou refresh de token (não implementado).
  Paralelização: Onda 2 | Bloqueado por: 1,2,3 | Bloqueia: 8
  Referências: src/routes/auth.ts, src/auth.ts (createToken, authMiddleware), server.ts:38 (mount de auth)
  Critérios de aceite: `npm test` sai com código 0; login com `adm@adm.com`/`123` retorna 200 + token; login com senha errada retorna 401; `GET /auth/me` sem token retorna 401.
  Cenários de QA: sucesso + falha, Evidência .omo/evidence/task-4-testes-cicd.txt
    - sucesso: login válido retorna JWT
    - falha: login inválido retorna 401
  Commit: Y | test(auth): testes de integração das rotas de autenticação

- [ ] 5. Testes de integração das rotas de visitantes
  O que fazer / NÃO fazer: Criar `src/routes/visitantes.test.ts` testando: `POST /visitantes` (criar + 201), `GET /visitantes` (listar + 200), `POST /visitantes/:id/entrada` (201 + `presente=true`), `POST /visitantes/:id/saida` (200 + `presente=false`), `GET /visitantes/:id` (200). Usar supertest + `__resetDb()`. NÃO deve testar a auto-saida de 24h (ainda não implementado — isso é o plano de duração).
  Paralelização: Onda 2 | Bloqueado por: 1,2,3 | Bloqueia: 8
  Referências: src/routes/visitantes.ts:233-273 (entrada), :275-297+ (saida), src/types.ts:40-55 (Visitante)
  Critérios de aceite: `npm test` sai com código 0; criar um visitante retorna 201; entrada define `presente=true`; saida define `presente=false`; listar retorna o visitante criado.
  Cenários de QA: sucesso + falha, Evidência .omo/evidence/task-5-testes-cicd.txt
    - sucesso: ciclo completo CRUD + entrada/saida funciona
    - falha: entrada em id inexistente retorna 404
  Commit: Y | test(visitantes): testes de integração das rotas de visitantes

- [ ] 6. Testes de integração das rotas de acessos
  O que fazer / NÃO fazer: Criar `src/routes/acessos.test.ts` testando: `GET /acessos` (listar + 200, com filtros), `POST /acessos` (registo manual + 201; campos em falta + 422; pessoa desconhecida + 404). Usar supertest + `__resetDb()`. NÃO deve testar campos de duração derivada (ainda não implementado).
  Paralelização: Onda 2 | Bloqueado por: 1,2,3 | Bloqueia: 8
  Referências: src/routes/acessos.ts:24-68 (POST), :70-103 (GET), src/types.ts:57-66 (Acesso)
  Critérios de aceite: `npm test` sai com código 0; registo manual de acesso retorna 201; listar retorna o acesso registado; sem `tipo_pessoa` retorna 422; `pessoa_id` desconhecido retorna 404.
  Cenários de QA: sucesso + falha, Evidência .omo/evidence/task-6-testes-cicd.txt
    - sucesso: registo manual + listagem funciona
    - falha: POST sem campos obrigatórios retorna 422
  Commit: Y | test(acessos): testes de integração das rotas de acessos

- [ ] 7. Testes de integração das rotas de prestadores
  O que fazer / NÃO fazer: Criar `src/routes/prestadores.test.ts` testando: `POST /prestadores` (criar + 201; sem `data_fim` + 422), `GET /prestadores` (listar + 200), `POST /prestadores/:id/entrada` (201 + `presente=true`), `POST /prestadores/:id/saida` (200 + `presente=false`). Usar supertest + `__resetDb()`. NÃO deve testar `prazo_dias` (ainda não implementado — isso é o plano de duração).
  Paralelização: Onda 2 | Bloqueado por: 1,2,3 | Bloqueia: 8
  Referências: src/routes/prestadores.ts:64-110 (POST), :185-218 (entrada), :221-250 (saida), src/types.ts:95-118 (Prestador)
  Critérios de aceite: `npm test` sai com código 0; criar um prestador com `data_inicio` + `data_fim` retorna 201; sem `data_fim` retorna 422; entrada/saida alternam `presente`.
  Cenários de QA: sucesso + falha, Evidência .omo/evidence/task-7-testes-cicd.txt
    - sucesso: ciclo completo CRUD + entrada/saida funciona
    - falha: POST sem data_fim retorna 422
  Commit: Y | test(prestadores): testes de integração das rotas de prestadores

- [ ] 8. Workflow de CI com GitHub Actions
  O que fazer / NÃO fazer: Criar `.github/workflows/ci.yml` com: trigger em push para main + pull_request; job em ubuntu-latest; passos: checkout@v4, setup-node@v4 (node 22, cache npm), `npm ci`, `npm run build`, `npm test`. NÃO deve adicionar deploy, staging, nem segredos. NÃO deve usar uma versão de Node diferente de 22.
  Paralelização: Onda 3 | Bloqueado por: 4,5,6,7 | Bloqueia: —
  Referências: .github/workflows/ (não existe), package.json (scripts)
  Critérios de aceite: fazer push para main trigger o workflow; o workflow executa `npm ci && npm run build && npm test` e passa.
  Cenários de QA: sucesso + falha, Evidência .omo/evidence/task-8-testes-cicd.txt
    - sucesso: CI passa num push verde
    - falha: CI falha se build ou teste falhar (prova que o gate funciona)
  Commit: Y | ci: adiciona workflow de CI com build e testes

## Onda de verificação final
> Executa em paralelo após TODAS as tarefas. TODAS devem APROVAR. Mostra os resultados e espera pelo teu ok explícito antes de declarar completo.
- [ ] F1. Auditoria de conformidade com o plano
- [ ] F2. Revisão de qualidade de código
- [ ] F3. QA manual real
- [ ] F4. Fidelidade ao escopo

## Estratégia de commit
- Um commit convencional por tarefa, ex: `refactor(server): ...`, `chore(test): ...`, `test(auth): ...`, `ci: ...`
- Todos os commits em `main` (sem branch de feature a menos que peças)
- Verificação pré-commit: `npm run build` deve sair com código 0

## Critérios de sucesso
- `npm run build` (tsc) sai com código 0 e `dist/` não contém ficheiros de teste
- `npm test` sai com código 0 e executa vitest com supertest
- As rotas auth, visitantes, acessos e prestadores têm testes de integração cobrindo happy path + erros chave
- `__resetDb()` fornece isolamento de testes
- O workflow de CI corre em push para main e PR, executando build + teste
- Nenhum comportamento de rota de produção foi alterado
