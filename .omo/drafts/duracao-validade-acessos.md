---
slug: duracao-validade-acessos
status: aprovado
intent: clear
pending-action: escrever .omo/plans/duracao-validade-acessos.md
abordagem: Duração derivada na leitura (helper puro, sem mudança de schema), mais auto-saida de visitante 24h, mais validade de serviço em N dias calculada a partir de data_inicio, mais expiração sinalizada apenas. Infraestrutura de teste deve ser criada (repo não tem nenhuma).
aprovação: utilizador disse "Plano aprovado" depois "Siga o plano e as minimas recomendacoes" → 1a + 2a + 3a adotados, todos os defaults aceites
---

# Rascunho: duracao-validade-acessos

## Componentes (ledger de topologia)
| id | resultado | status | evidência |
| --- | --- | --- | --- |
| C1 | Helper puro de pareamento de duração (`emparelharAcessos`) retorna `duracao_minutos` + `em_aberto` por acesso, calculado na leitura, sem persistência | ativo | src/routes/acessos.ts:70-103 |
| C2 | Expor duração derivada no `GET /acessos` SEM quebrar semântica de paginação/filtros | ativo | src/routes/acessos.ts:82-102 |
| C3 | Auto-saida de visitante 24h: idempotente, gerada em entrada+24h | ativo | src/routes/visitantes.ts:233-273 |
| C4 | Validade de serviço: N dias → calcular `data_fim` a partir de `data_inicio` | ativo | src/routes/prestadores.ts:67-73,139-166 |
| C5 | Expiração sinalizada apenas (nunca auto-expirar, nunca virar presente/ativo, nunca bloquear portaria) | ativo | decisão do utilizador 3a |
| C6 | Infraestrutura de teste mínima para o helper puro | ativo | package.json (sem script test) |

## Suposições abertas (defaults anunciados)
| suposição | default adotado | razão | reversível? |
| Estratégia de teste | tests-after com um runner mínimo, cobrindo APENAS o helper puro | repo tem zero infra de teste; a lógica de pareamento é exatamente o tipo que quebra silenciosamente | sim |
| Representação de duração | campo calculado no item de resposta, NÃO persistido | InMemoryDB não tem caminho de migração (src/db.ts:69,83); campo persistido seria `undefined` em todos os registos seedados | sim |
| Representação de expiração | campo de resposta calculado (ex: `dias_restantes`, `expirado`) em vez de flag persistida | evita o mesmo problema de sem-migração; `ativo` já existe como flag manual independente das datas | sim |
| Onde a auto-saida é gerada | lazy na leitura, não por um cron em segundo plano | repo não tem infraestrutura de scheduler/cron; adicionar uma está fora de escopo | sim |

## Achados (citados - caminho:linhas)
- `GET /acessos` pagina ANTES de qualquer pareamento ser possível: `resultado.slice(skip, skip+limit)` em src/routes/acessos.ts:100, ordenação em :99. O pareamento DEVE correr no conjunto filtrado completo antes do slice, senão as durações ficam erradas nas fronteiras de página. ESTA É A PRINCIPAL RESTRIÇÃO ARQUITETURAL.
- O array `acessos` tem ordem de inserção INCONSISTENTE em 3 caminhos de código: `visitantes.ts:263` e `visitantes.ts:297` usam `db.acessos.unshift(...)` (mais recente primeiro), enquanto `acessos.ts:48` e `prestadores.ts` usam `db.acessos.push(...)` (mais recente último). O pareamento NÃO PODE confiar no índice do array; deve ordenar por `registrado_em`.
- `Acesso` não tem campo de duração hoje: src/types.ts:57+ = `{ id, tipo_pessoa, pessoa_id, nome, sentido, placa_veiculo, vaga, observacao, registrado_em }`.
- `Visitante` (src/types.ts:40-55) tem `presente`, `agendado_para`, `criado_em` — SEM campo de validade/expiração.
- `Prestador` (src/types.ts:95-118) JÁ TEM `data_inicio`, `data_fim` (ambos `YYYY-MM-DD`), `horario_permitido`, `presente`, `ativo`. Estes são INERTOS: nada em lado nenhum compara `data_fim` com a data atual. Não existe conceito de `vigente`/`expirado`/`dias_restantes` no codebase.
- Sem caminho de migração: src/db.ts:69 `this.acessos = parsed.acessos || []`, src/db.ts:83 `nextAcessoId = parsed.nextAcessoId || (len+1)`. Campos novos em registos existentes são `undefined`.
- Apenas `visitante` e `prestador` têm `presente` alternado. `POST /acessos` src/routes/acessos.ts:51-64 trata visitante + prestador apenas; `morador` e `funcionario` não têm flag de presença.
- `POST /acessos` (src/routes/acessos.ts:24-68) é um 4º caminho de criação exigindo apenas `tipo_pessoa`, `pessoa_id`, `sentido`; `resolverNome` (:8-22) retorna `""` para desconhecido → 404.
- Handler de entrada de visitante: src/routes/visitantes.ts:233-273. Handler de saida: src/routes/visitantes.ts:275-297+. Ambos `unshift` e sempre definem `presente`.
- `POST /prestadores` EXIGE que o cliente envie ambos `data_inicio` E `data_fim`: src/routes/prestadores.ts:73 retorna 422 caso contrário. A decisão 2a (calcular a partir de N dias) portanto CONFLITA com um endpoint público validado existente → potencial breaking change.
- Hazard de timezone: `Acesso.registrado_em` é um timestamp ISO completo; `Prestador.data_inicio`/`data_fim` são `YYYY-MM-DD` soltos. Comparar uma string de data solta contra um timestamp ISO é um hazard UTC-vs-local. O dashboard já agrega acessos e deve ser verificado quanto à sua convenção de fronteira de dia.
- Repo NÃO tem infraestrutura de teste (sem script test no package.json), sem scheduler/cron.

## Decisões (com razão)
- DURAÇÃO: derivada na leitura via helper PURO, nunca persistida. Razão: db.ts não tem caminho de migração, por isso um `duracao_minutos` persistido seria `undefined` em todos os registos seedados; o log de acesso é append-only por isso o pareamento é confiável. Reversível.
- VISITANTE 24h: auto-registar `saida` em entrada+24h (decisão do utilizador 1a). Uma única `entrada` produz uma `saida`, por isso o histórico fecha sem depender do operador de portaria.
- SERVIÇO N DIAS: o sistema calcula `data_fim = data_inicio + N` (decisão do utilizador 2a) em vez do morador digitar uma data; elimina datas digitadas erradas.
- EXPIRAÇÃO: sinalizar apenas (decisão do utilizador 3a) — flag, nunca auto-expirar, nunca virar `presente`/`ativo`, nunca bloquear entrada. Razão: expirar ou bloquear interfere com trabalho de serviço legitimamente prolongado; isso é uma decisão de produto do dono, não um detalhe de implementação.

## Escopo IN
- Helper puro de pareamento de duração + exposição no `GET /acessos`
- Auto-saida de visitante 24h
- Validade de serviço em N dias calculada a partir de `data_inicio`
- Expiração sinalizada apenas
- Setup mínimo de teste para o helper puro
- Atualização do README para o novo comportamento

## Escopo OUT (NÃO deve ter)
- NÃO deve auto-expirar um visitante/prestador, virar `presente`/`ativo`, ou bloquear entrada na portaria.
- NÃO deve adicionar um scheduler/cron/worker em segundo plano.
- NÃO deve inventar um framework de migração para `InMemoryDB`.
- NÃO deve refatorar a ordem inconsistente de inserção do array `acessos` (`unshift` vs `push`) a menos que uma tarefa o exija.
- NÃO deve alterar módulos não relacionados (encomendas, reservas, ocorrências, restricoes, portal, veiculos, moradores, dashboard) além do mínimo necessário para expor os novos campos.
- NÃO deve quebrar silenciosamente clientes de `POST /prestadores`: chamadores existentes que enviam `data_fim` devem continuar a funcionar.

## Perguntas abertas
- (nenhuma bloqueante — utilizador aprovou 1a/2a/3a e "minimas recomendacoes")
- Levantado para o registo: 2a é uma breaking change para `POST /prestadores`. Metis foi pedido para avaliar. O plano manterá `data_fim` opcional-na-escrita (aceitar tanto N dias quanto uma data explícita) para evitar quebrar clientes existentes, a menos que Metis encontre um argumento mais forte.

## Gate de aprovação
status: aprovado
aprovado-por: utilizador — "Plano aprovado" + "Siga o plano e as minimas recomendacoes e quaisquer ajustes iremos fazendo apos as validacoes"
registado: 2026-10-03
próximo: aguardar análise de gaps (Metis), dobrar achados, APPEND tarefas, preencher TL;DR por último, depois apresentar resumo e perguntar start-or-high-accuracy-review.
