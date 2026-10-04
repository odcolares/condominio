# duracao-validade-acessos - Plano de Trabalho

## TL;DR (Para humanos)

**O que vais obter:** O sistema vai reportar, para cada registo de acesso, quanto tempo essa pessoa esteve no condomínio, limitar a estadia de visitantes a 24h, permitir que um morador declare um serviço em dias (com a data final calculada por ele), e sinalizar quando um registo está passado da sua validade — sem nunca expulsar ninguém, alterar o seu estado de presença/ativo, ou bloquear a portaria.

**Porquê desta abordagem:** Duração e validade são calculadas no momento da leitura a partir de dados que o sistema já tem, por isso o ficheiro JSON existente nunca é migrado. A validade é um aviso, não uma ação, porque um trabalho prolongado nunca deve ser cortado por um temporizador.

**O que NÃO vai fazer:** Auto-expirar um visitante ou prestador, alterar o seu flag de presença/ativo, bloquear a entrada na portaria, executar um scheduler em segundo plano, ou reescrever o esquema da base de dados.

**Esforço:** Médio
**Risco:** Médio — o pareamento abrange três caminhos de registo e o fecho automático de 24h deve ser idempotente.
**Decisões a verificar:** Visitantes fecham automaticamente às 24h; validade de serviço é declarada em dias; passado da validade mostra um flag mas nunca bloqueia a portaria.

O teu próximo passo: aprovar para iniciar o trabalho (`$start-work`), ou executar a revisão de alta precisão primeiro. O detalhe completo da execução segue abaixo.

---

> TL;DR (máquina): Médio/Médio — duração derivada + limite de 24h para visitante + validade de serviço em N dias + expiração sinalizada, sem cron, sem migração.

## Escopo
### Deve ter
- Helper puro `src/lib/duracao.ts` expondo `emparelharAcessos(acessos)` que, por registo de acesso, deriva `duracao_minutos` e `em_aberto` pareando eventos `entrada`/`saida` em `(tipo_pessoa, pessoa_id)`, ordenando os inputs por `registrado_em` (UTC), e tolerando órfãos/sobreposições/registos fora de ordem.
- `GET /acessos` retorna os `duracao_minutos` + `em_aberto` derivados por item SEM alterar a semântica de paginação (parear no conjunto filtrado completo ANTES de `skip`/`limit`).
- Regra de 24h para visitante: uma `entrada` para `tipo_pessoa="visitante"` fecha automaticamente com uma `saida` sintetizada 24h depois (idempotente, lazy na leitura; nunca uma `saida` duplicada).
- Validade de serviço em N dias: `POST /prestadores` aceita OU `data_fim` (explícita) OU `prazo_dias` (N); quando `prazo_dias` é dado, o servidor calcula `data_fim = data_inicio + N` (matemática de data UTC consistente com `dashboard.ts:10`). Se nenhum for fornecido, 422.
- Expiração sinalizada apenas: `GET /prestadores/:id`, `GET /visitantes/:id`, e respostas de lista expõem um booleano `expirado` calculado (e `dias_restantes` onde útil); nunca muta `presente`/`ativo` e nunca bloqueia uma operação de portaria.
- Comando mínimo de teste para o helper puro usando o `node:test` embutido do Node (sem nova dependência).

### NÃO deve ter (guardrails, anti-slop, limites de escopo)
- NÃO deve auto-expirar um visitante/prestador, alterar `presente` para false, ou definir `ativo=false` quando a validade expira.
- NÃO deve bloquear entrada/saída na portaria.
- NÃO deve adicionar um scheduler, cron, ou worker em segundo plano.
- NÃO deve introduzir um framework de migração para `InMemoryDB`; novos campos derivados são calculados, nunca persistidos.
- NÃO deve refatorar a ordem inconsistente de inserção do array `acessos` (`unshift` vs `push`) a menos que uma tarefa o exija.
- NÃO deve alterar encomendas, reservas, ocorrências, restricoes, portal, veiculos, moradores além do necessário para expor campos derivados.
- NÃO deve quebrar silenciosamente clientes de `POST /prestadores`: chamadores existentes que enviam `data_fim` devem continuar a funcionar.

## Estratégia de verificação
> Zero intervenção humana — toda a verificação é executada por agente.
- Decisão de teste: tests-after + `node:test` / `node:assert` embutidos do Node (SEM nova dependência; `@types/node@22` já é devDependency)
- Evidência: `.omo/evidence/task-<N>-duracao-validade-acessos.txt`
- Gate de build: `npm run build` (tsc) deve sair com código 0 após cada onda
- Gate de teste: `npm test` deve sair com código 0 assim que os testes do helper existirem

## Estratégia de execução
### Ondas de execução paralela
- Onda 1 (independente): Tarefa 1, Tarefa 2 — helper de pareamento/testes + prazo_dias do prestador
- Onda 2 (bloqueada pela Onda 1): Tarefa 3 [por 1], Tarefa 4 [por 1], Tarefa 5 [por 2], Tarefa 6 [por 1]
- Onda 3 (bloqueada pela Onda 2): Tarefa 7

### Matriz de dependências
| Tarefa | Depende de | Bloqueia | Pode paralelizar com |
| --- | --- | --- | --- |
| 1 | — | 3,4,6 | 2 |
| 2 | — | 5 | 1 |
| 3 | 1 | 7 | 4,5,6 |
| 4 | 1 | 7 | 3,5,6 |
| 5 | 2 | 7 | 3,4,6 |
| 6 | 1 | — | 3,4,5 |
| 7 | 3,4,5 | — | — |

## Tarefas
> Implementação + Teste = UMA tarefa. Nunca separar.
<!-- APPEND TASK BATCHES BELOW THIS LINE WITH edit/apply_patch - never rewrite the headers above. -->
- [ ] 1. Criar helper puro de pareamento de duração com testes
  O que fazer / NÃO fazer: Criar `src/lib/duracao.ts` exportando `emparelharAcessos(acessos: Acesso[])` que, por acesso, deriva `duracao_minutos` e `em_aberto` pareando `entrada`/`saida` em `(tipo_pessoa, pessoa_id)`. Ordenar os inputs por `registrado_em` (epoch UTC ms) antes de parear — nunca confiar no índice do array (`acessos.ts:48` usa `push` enquanto `visitantes.ts:263` usa `unshift`, por isso a ordem é inconsistente). DEVE lidar com: saida órfã (duração 0/null, sem lançar exceção), múltiplas entradas sobrepostas (parear dentro da mesma janela aberta), registos fora de ordem, e registos para `morador`/`funcionario` (sem flag de presença em types.ts — o pareamento ainda se aplica). NÃO deve mutar o array de input; NÃO deve persistir nada. Criar também `src/lib/duracao.test.ts` com `node:test`/`node:assert`.
  Paralelização: Onda 1 | Bloqueado por: nada | Bloqueia: 3,4,6
  Referências (o executor NÃO tem contexto de entrevista — ser exaustivo): src/types.ts:57-66 (Acesso), src/routes/acessos.ts:36-46 (construção de Acesso), src/routes/visitantes.ts:233-273 (entrada) + :275-297+ (saida), src/routes/prestadores.ts:185-218 (entrada) + :221-250 (saida), src/routes/acessos.ts:24-68 (caminho POST /acessos), src/db.ts:112-128 (save)
  Critérios de aceite (executáveis por agente): `npx tsx --test src/lib/duracao.test.ts` sai com código 0; asserta que um par entrada+saida fechado produz `duracao_minutos === (saida - entrada)/60000`; asserta `em_aberto === true` para uma entrada sem saida; asserta que uma saida órfã produz duração null/0 e NÃO lança exceção.
  Cenários de QA (nome da ferramenta exata + invocação): sucesso + falha, Evidência .omo/evidence/task-1-duracao-validade-acessos.txt
    - sucesso: par entrada+saida fechado retorna `duracao_minutos` correto
    - falha: saida órfã retorna duração null, NÃO lança exceção
  Commit: Y | feat(acessos): adiciona helper puro de pareamento de duração

- [ ] 2. Aceitar `prazo_dias` (N) no POST /prestadores e calcular data_fim
  O que fazer / NÃO fazer: No handler `POST /prestadores` (src/routes/prestadores.ts:64-110), aceitar OU `data_fim` (YYYY-MM-DD explícito) OU `prazo_dias` (inteiro positivo N). Quando `prazo_dias` está presente, calcular `data_fim = addDaysUTC(data_inicio, N)` correspondendo à convenção UTC em src/routes/dashboard.ts:10 (`Date.UTC(...)`). Quando nenhum é fornecido, manter o 422 existente em src/routes/prestadores.ts:73. Clientes existentes que enviam `data_fim` DEVEM continuar a funcionar (sem breaking change). Espelhar a mesma aceitação em `PUT /prestadores/:id` (src/routes/prestadores.ts:138-170). NÃO deve auto-definir `ativo`/`presente`.
  Paralelização: Onda 1 | Bloqueado por: nada | Bloqueia: 5
  Referências: src/routes/prestadores.ts:64-110 (POST), src/routes/prestadores.ts:138-170 (PUT), src/types.ts:95-118 (Prestador), src/routes/dashboard.ts:10 (convenção de fronteira de dia UTC)
  Critérios de aceite: `npm run build` sai com código 0; um POST com `prazo_dias=3` + `data_inicio=2026-10-03` produz `data_fim=2026-10-06`; um POST com `data_fim` diretamente ainda é aceite; um POST sem nenhum dos dois retorna 422.
  Cenários de QA: sucesso + falha, Evidência .omo/evidence/task-2-duracao-validade-acessos.txt
    - sucesso: prazo_dias=3 → data_fim = data_inicio + 3 dias (UTC)
    - falha: sem data_fim nem prazo_dias → 422
  Commit: Y | feat(prestadores): aceita prazo_dias e calcula data_fim

- [ ] 3. Expor duração derivada no GET /acessos sem quebrar paginação
  O que fazer / NÃO fazer: No `GET /acessos` (src/routes/acessos.ts:70-103), calcular o pareamento no conjunto filtrado completo ANTES de `skip`/`limit` ser aplicado — o código atual faz slice em :100, o que parearia contra uma fatia parcial e corromperia durações que atravessam uma fronteira de página. Anexar `duracao_minutos` e `em_aberto` a cada item. Manter os filtros existentes (:71-75) e a paginação (:76-77, :99-100) idênticas para clientes que ignoram os novos campos. NÃO deve alterar a ordenação mais-recente-primeiro nem o default limit=100.
  Paralelização: Onda 2 | Bloqueado por: 1 | Bloqueia: 7
  Referências: src/routes/acessos.ts:70-103, src/lib/duracao.ts (novo, Tarefa 1), src/types.ts:57-66
  Critérios de aceite: um teste corre e sai com código 0; um par entrada+saida que atravessa uma fronteira de página produz o MESMO `duracao_minutos` independentemente de `skip`/`limit`; items-por-página e resultados de filtro ficam inalterados.
  Cenários de QA: sucesso + falha, Evidência .omo/evidence/task-3-duracao-validade-acessos.txt
    - sucesso: duração correta mesmo quando entrada está na página 1 e saida na página 2
    - falha: lista de acessos vazia retorna array vazio sem lançar exceção
  Commit: Y | feat(acessos): expõe duração derivada sem quebrar paginação

- [ ] 4. Auto-saida de visitante 24h, idempotente e lazy
  O que fazer / NÃO fazer: Em `src/lib/duracao.ts`, adicionar `autoSaidas24h()`: para cada `entrada` de `tipo_pessoa="visitante"` sem `saida` correspondente e `now >= entrada.registrado_em + 24h`, sintetizar uma `saida` datada de `entrada.registrado_em + 24h`. Isso limita o `duracao_minutos` derivado a 1440 e vira `em_aberto` para false após 24h. Idempotente: correr duas vezes NÃO deve duplicar a saida (chave no id da entrada + 24h). Lazy na leitura — SEM cron. NÃO deve escrever a saida sintetizada de volta em `db.acessos` (derivada, não persistida). NÃO deve definir `visitante.presente=false`.
  Paralelização: Onda 2 | Bloqueado por: 1 | Bloqueia: 7
  Referências: src/routes/visitantes.ts:233-273 (entrada), src/routes/visitantes.ts:275-297+ (saida), src/lib/duracao.ts (novo), src/types.ts:40-55 (Visitante)
  Critérios de aceite: uma entrada com >24h produz `duracao_minutos === 1440` e `em_aberto === false`; correr a derivação duas vezes produz uma única saida sintetizada (sem duplicado); uma entrada com <24h produz `em_aberto === true` e `duracao_minutos < 1440`.
  Cenários de QA: sucesso + falha, Evidência .omo/evidence/task-4-duracao-validade-acessos.txt
    - sucesso: entrada com 25h → duração 1440min, em_aberto false
    - falha: correr duas vezes NÃO duplica a saida
  Commit: Y | feat(visitantes): duração de 24h com saída auto-derivada

- [ ] 5. Expiração sinalizada apenas em respostas de prestador/visitante
  O que fazer / NÃO fazer: Adicionar um booleano `expirado` calculado (e `dias_restantes` onde útil) a `GET /prestadores/:id`, aos itens de lista de `GET /prestadores`, a `GET /visitantes/:id`, e aos itens de lista de `GET /visitantes`. Para prestadores: `expirado = hoje_UTC > data_fim` (data_fim agora calculável a partir de prazo_dias via Tarefa 2). Para visitantes: `expirado = now > entrada + 24h` via o acessor derivado da Tarefa 4. NÃO deve definir `presente=false`, NÃO deve definir `ativo=false`, NÃO deve retornar 403 nem bloquear qualquer operação de portaria. `POST /acessos` (src/routes/acessos.ts:24-68), `POST /visitantes/:id/entrada|saida`, `POST /prestadores/:id/entrada|saida`, e `POST /portal/preautorizacao` DEVEM continuar a funcionar independentemente de `expirado`.
  Paralelização: Onda 2 | Bloqueado por: 2 | Bloqueia: 7
  Referências: src/routes/prestadores.ts:117+ (GET /:id) + handler de lista, src/routes/visitantes.ts lista + GET, src/types.ts:95-118 (Prestador data_fim), src/routes/dashboard.ts:10 (UTC), src/types.ts:40-55 (Visitante)
  Critérios de aceite: um prestador com `data_fim` no passado retorna `expirado: true` E continua a ser retornado com HTTP 200, com `presente`/`ativo` INALTERADOS; um visitante cuja janela de 24h passou retorna `expirado: true` mas `POST /acessos` ainda cria um novo acesso normalmente.
  Cenários de QA: sucesso + falha, Evidência .omo/evidence/task-5-duracao-validade-acessos.txt
    - sucesso: expirado=true sinalizado, registo ainda retornado com 200
    - falha: um registo expirado ainda permite POST /acessos (não bloqueado)
  Commit: Y | feat(expiry): sinaliza expiração sem bloquear ou auto-expirar

- [ ] 6. Ligar `npm test` para correr os testes do helper puro
  O que fazer / NÃO fazer: Adicionar `"test": "tsx --test src/**/*.test.ts"` ao `package.json` — `tsx` 4.x e `@types/node` 22 já são devDependencies, por isso SEM novo pacote. Garantir que `npx tsx --test src/lib/duracao.test.ts` sai com código 0. NÃO deve adicionar vitest/jest. NÃO deve quebrar `npm run build` ou `npm run dev`.
  Paralelização: Onda 2 | Bloqueado por: 1 | Bloqueia: —
  Referências: package.json, tsconfig.json
  Critérios de aceite: `npm test` sai com código 0 e corre no mínimo `src/lib/duracao.test.ts`; `npm run build` continua a sair com código 0.
  Cenários de QA: sucesso + falha, Evidência .omo/evidence/task-6-duracao-validade-acessos.txt
    - sucesso: npm test corre os testes do helper e sai com código 0
    - falha: uma assertion deliberadamente falhada faz `npm test` sair com código não-zero (prova que o harness funciona)
  Commit: Y | chore(test): adiciona script de teste com node:test

- [ ] 7. Atualizar README com o novo comportamento de duração/validade
  O que fazer / NÃO fazer: Adicionar uma secção curta ao `README.md` documentando: `duracao_minutos`/`em_aberto` derivados no `GET /acessos`, a janela de 24h para visitante, `prazo_dias` no `POST /prestadores`, e `expirado` sinalizado apenas. Manter o enquadramento existente "12 routers / 13 páginas". DEVE substituir a nota antiga de que o tempo de permanência "não é calculado" pelo novo comportamento. NÃO deve removê-la sem substituição.
  Paralelização: Onda 3 | Bloqueado por: 3,4,5 | Bloqueia: —
  Referências: README.md (atual), src/routes/acessos.ts, src/routes/visitantes.ts, src/routes/prestadores.ts
  Critérios de aceite: `npm run build` sai com código 0; `README.md` contém "duracao_minutos" (ou "duração"), "prazo_dias", e "expira"; a nota antiga "não é calculado" desaparece.
  Cenários de QA: sucesso + falha, Evidência .omo/evidence/task-7-duracao-validade-acessos.txt
    - sucesso: README documenta os novos campos e build passa
    - falha: remover a menção a prazo_dias é apanhada pela assertion de grep
  Commit: Y | docs(readme): documenta duração, validade e expiração

## Onda de verificação final
> Executa em paralelo após TODAS as tarefas. TODAS devem APROVAR. Mostra os resultados e espera pelo teu ok explícito antes de declarar completo.
- [ ] F1. Auditoria de conformidade com o plano
- [ ] F2. Revisão de qualidade de código
- [ ] F3. QA manual real
- [ ] F4. Fidelidade ao escopo

## Estratégia de commit
- Um commit convencional por tarefa, ex: `feat(acessos): ...`, `chore(test): ...`, `docs(readme): ...`
- Todos os commits em `main` (sem branch de feature a menos que peças)
- Verificação pré-commit: `npm run build` deve sair com código 0

## Critérios de sucesso
- `npm run build` (tsc) sai com código 0
- `npm test` sai com código 0 e corre os testes do helper puro (`src/lib/duracao.test.ts`)
- `GET /acessos` retorna `duracao_minutos` + `em_aberto` por item, com paginação, filtros e ordenação mais-recente-primeiro inalterados
- Um visitante cuja `entrada` tem >24h reporta `duracao_minutos === 1440` e `em_aberto === false`, derivado idempotentemente
- `POST /prestadores` aceita `prazo_dias` e calcula `data_fim`, enquanto `data_fim` direto continua a funcionar (422 apenas quando nenhum é enviado)
- Registos expirados retornam `expirado: true`, permanecem HTTP 200, mantêm `presente`/`ativo` inalterados, e ainda permitem `POST /acessos`
- `README.md` documenta o novo comportamento de duração/validade/expiração
