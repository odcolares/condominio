# Plano: Seeds de Demonstração + Mockup do Dashboard

**Objetivo:** transformar o AMBROS em algo que um síndico possa ver e reconhecer como "o sistema do meu condomínio" — antes de qualquer conversa comercial.
**Escopo:** conteúdo de demonstração (dados) + material visual (mockup). **Não** inclui o multi-tenant (tratado em `PLANO-MULTITENANT-SUPABASE.md`).

---

## 1. Diagnóstico: por que os dados atuais não vendem

O seed atual (`data/database.json` + `src/db.ts:seed*`) tem **2–3 registros por coleção**. Em uma tela de demonstração isso produz três efeitos:

| Efeito | Como o cliente percebe |
|---|---|
| **Lista parece vazia** | "Meu condomínio tem 48 unidades e a tela mostra 3 moradores?" |
| **Dashboard com gráficos OCOS** | O `dashboard.ts` calcula `movimentacao_hoje` por faixas de 3h e `visitantes_7dias` — com 2 acessos, os gráficos são linhas retas |
| **Impossível demonstrar isolamento** | Sem volume, não há como mostrar "3 condomínios, 3 bases, 0 vazamento" |

> **Princípio:** o cliente não compra "o painel" — ele compra "o painel **do meu** condomínio". A demo precisa estar populada.

### 1.1 O seed atual já contradiz o material de marketing

O `docs/marketing/condominios-prospecting.csv` já lista **Jardim das Acácias — 48 unidades** como lead `001`, com demo marcada. O seed atual usa Acácias com **3 moradores**. Se o cliente que já marcou a demo entrar no sistema, ele vê 3 moradores no próprio condomínio.

> **Consequência:** o conteúdo do seed deve vir do pipeline comercial, não ser inventado do zero.

---

## 2. A regra de coerência do seed (o coração deste plano)

Um seed que parece "fake" é pior que um seed pequeno. Cada dado gerado deve obeyecer a **regra de coerência**:

> **Nenhum registro pode existir sem que seu pré-requisito exista e faça sentido.**

Exemplos derivados do modelo real (`src/types.ts`):

| Registro | Pré-requisito obrigatório | Regra de coerência |
|---|---|---|
| `veiculos` | `moradores` | `morador_id` deve apontar para um morador **ativo**; `vaga` deve bater com `numero_vaga` do morador (ou ser a vaga de visita) |
| `visitantes` | `moradores` | `morador_visitado_id` → morador existente; `bloco`/`apartamento` **deve bater** com o do morador visitado |
| `encomendas` | `moradores` | `morador_unidade` = bloco/apto do morador; `codigo_retirada` único; `codigo_rastreio` **único** |
| `acessos` | `visitantes`/`moradores`/`prestadores` | `pessoa_id` → id da pessoa; `nome` = nome dela; `placa_veiculo` bate com a placa da pessoa |
| `prestadores` | `moradores` | `morador_autorizador_id` → morador existente (quando `tipo_vinculo = "unidade"`); `data_inicio ≤ data_fim` |
| `preautorizacoes` | `moradores` | `bloco`/`apartamento` do morador; `codigo_acesso_qr` único |
| `ocorrencias` | `moradores` | `morador_envolvido` = nome de morador existente |
| `reservas` | `moradores` | `morador_id` → morador; bloco/apto batem; `data_reserva` futura/névoa |
| `notificacoes` | `moradores` | `morador_id` → morador; `dados_adicionais` referencia id real |

**Regra de integridade referencial global:** o seed **nunca** produz referência órfã (id que não existe). Nenhum id de pessoa/veículo/placa/placa/código aparece sem dono.

> Esta regra é o que separa "demo de vendas" de "projeto de faculdade". Ela deve ser **verificada por teste automatizado**, não por inspeção visual.

---

## 3. Os três condomínios

Alinhados ao pipeline comercial (`condominios-prospecting.csv`) e ao portefólio-alvo (Manaus/AM — `condominios-manaus.csv`, `ambros-config.js`):

| # | Condomínio | Schema | Unidades | Perfil | Blocos |
|---|---|---|---|---|---|
| 1 | **Jardim das Acácias** | `acacias` | **48** | Horizontal, portaria única, lazer | A–H (8 blocos de 6) |
| 2 | **Torres do Sol** | `torres_sol` | **120** | Vertical, 6 torres, subsolo garagem | A–F (6 torres de 20) |
| 3 | **Parque das Águas** | `parque_aguas` | **32** | Horizontal pequeno, portaria 24h | A–D (4 blocos de 8) |

> **Por que estes três:** *Acácias* e *Vila Verde* já estão no pipeline comercial (48 e 32 unidades, exatamente estes números). *Torres do Sol* (120) representa o porte vertical grande — o caso que melhor mostra a escalabilidade do controle de acesso. *Parque das Águas* mostra o porte pequeno.
>
> **Nota de cidade:** o material de marketing é de Manaus/AM, mas o seed atual usa São Paulo (blocos "05", "08", "10"; telefones `(11)`). **Decisão pendente** — ver seção 11.

---

## 4. Volume de registros por tenant

Escala = volume de moradores do condomínio. O dashboard precisa de **movimento** (acessos de hoje) e de **histórico** (7 dias de visitantes) para que os gráficos tenham forma.

| Coleção | Acácias (48 un.) | Torres do Sol (120 un.) | Parque das Águas (32 un.) |
|---|---|---|---|
| `usuarios` | 5 | 7 | 4 |
| `moradores` | 48 | 120 | 32 |
| `veiculos` | 62 | 148 | 38 |
| `visitantes` | 40 | 96 | 26 |
| `acessos` | 220 | 520 | 150 |
| `encomendas` | 34 | 86 | 22 |
| `prestadores` | 14 | 28 | 9 |
| `ocorrencias` | 22 | 44 | 15 |
| `restricoes` | 5 | 9 | 3 |
| `reservas` | 16 | 34 | 11 |
| `comunicados` | 9 | 12 | 7 |
| `notificacoes` | 26 | 60 | 18 |
| `preautorizacoes` | 12 | 28 | 8 |
| `leads` | 0 | 0 | 0 |

**Total estimado:** ~545 · ~1.200 · ~360 registros → **~2.100 registros** nos 3 tenants. Volume trivial para Postgres e para a demo.

> **`leads` é global, não por tenant.** Lead é funil comercial da AMBROS, não dado de condomínio. Fica fora dos schemas de tenant (ver decisão D1 na seção 11).

### 4.1 Distribuição temporal — o que faz os gráficos parecerem reais

O `dashboard.ts` filtra acessos por **hoje** e visitantes por **7 dias**. Sem cuidado, "hoje" fica vazio conforme o dia passa.

| Coleção | Regra de data |
|---|---|
| `acessos` | **65% hoje**, 25% nos últimos 6 dias, 10% há 1 semana. Distribuídos nas faixas de 3h (0h–21h) com pico entre 6h–9h (saída) e 17h–19h (entrada) |
| `visitantes` | `criado_em` nos últimos 7 dias (a maioria hoje); ~15% `agendado_para` = amanhã |
| `encomendas` | `recebido_em` nos últimos 10 dias; ~30% `status: "pendente"`, 60% `"entregue"`, 10% `"devolvida"` |
| `prestadores` | 40% `presente: true`; `data_inicio` variando; ~30% `data_fim` **no passado** (vencido → mostra o badge "expirado") |
| `reservas` | 60% `pendente`, 30% `confirmada`, 10% `cancelada`; `data_reserva` de hoje a +30 dias |
| `ocorrencias` | 50% `aberta`, 30% `em_analise`, 20% `resolvida`; gravidade distribuída |
| `comunicados` | 1 urgente ativo + 2–3 assemblies futuras + avisos |
| `preautorizacoes` | 70% `aguardando`, 20% `acessou`, 10% `cancelado` |

### 4.2 Perfis de usuário por tenant (as credenciais de demo)

Cada tenant precisa de **contas demonstráveis** de perfis diferentes — é isso que permite mostrar o RBAC funcionando.

| Perfil | Acácias | Torres do Sol | Parque das Águas |
|---|---|---|---|
| `administrador` | `admin@acacias.com` | `admin@torressol.com` | `admin@parqueaguas.com` |
| `portaria` | `portaria@acacias.com` | `portaria@torressol.com` | `portaria@parqueaguas.com` |
| `sindico` | `sindico@acacias.com` | `sindico@torressol.com` | `sindico@parqueaguas.com` |
| `morador` | `morador@acacias.com` | `morador@torressol.com` | `morador@parqueaguas.com` |

> **Senha de todos:** `demo1234` (será **hash com scrypt**, nunca texto puro — Fase 5 do plano principal).
>
> **Importante:** as senhas em texto puro **não** podem aparecer no HTML público. O `login.html` atual tem `value="adm@adm.com"` e `value="123"` hardcoded — remover na Fase 5. Na demo, a credencial é dita em voz alta ou mostrada em slide.

### 4.3 Distribuição de `vinculo` e `bloco`

- `vinculo`: ~65% `proprietario`, ~35% `inquilino`.
- Moradores distribuídos **uniformemente** pelos blocos do condomínio (nenhum bloco vazio).
- `numero_vaga`: ~70% dos moradores têm vaga; para vertical, `V-<torre>-<nnn>`; para horizontal, `V-<nnn>`.

---

## 5. O gerador: determinístico e versionado

### 5.1 Por que determinístico

O seed **não pode** ser aleatório puro: se rodar duas vezes, o banco muda e a demo perde coerência entre deploys (uma encomenda "de 3 dias atrás" vira "de 2 dias atrás").

**Solução:** PRNG com semente fixa (`mulberry32` com seed por tenant). Rodar o gerador N vezes produz **exatamente** o mesmo banco. Isso permite:
- Commitar o resultado no Git e versioná-lo.
- Rodar testes de coerência sobre dados estáveis.
- Reproduzir um bug de demo exatamente.

### 5.2 Estrutura de arquivos

Quatro módulos coesos, com responsabilidade bem separada:

| Arquivo | Responsabilidade |
|---|---|
| `seeds/tenants.ts` | Config declarativa dos 3 condomínios (nome, schema, unidades, blocos, qtd. registros, seed do PRNG) |
| `seeds/rng.ts` | `mulberry32`, `pick`, `pickWeighted`, `intBetween`, `chance` |
| `seeds/names.ts` | Listas de nomes, telefones, CPFs e placas **sintéticos** por região |
| `seeds/generate.ts` | Gera os 3 tenants, aplicando a **regra de coerência** da seção 2 |

### 5.3 Dados sintéticos — regras obrigatórias

> **Regra de ouro: nenhum dado pode identificar uma pessoa real.**

| Dado | Como gerar |
|---|---|
| **CPF** | Dígitos verificadores calculados corretamente sobre a base aleatória. **Nunca** usar CPFs reais de exemplo |
| **Telefone** | DDD da região escolhida (seção 11) + número sintético. **Não** reutilizar o `(11) 98765-4321` do seed atual — é um número de exemplo genérico que o cliente pode reconhecer como "fictício" |
| **Placa** | Formato Mercosul `LLL-NL-NN` com letras/números válidos do alfabeto oficial (sem I, O, Q) |
| **Nome** | Lista de ~120 prenomes + ~80 sobrenomes brasileiros, combináveis. Garantir diversidade de origem |
| **Telegram** | Handle sintético derivado do nome (`@nomeSobrenome123`) |

### 5.4 Validação: a regra de coerência vira teste

O ponto crítico do plano. Um arquivo `seeds/seeds.test.ts` verifica **automaticamente**:

```
✅ Todo morador_id em veiculos/visitantes/encomendas/... existe e está ativo
✅ Todo morador_visitado_id aponta para morador do MESMO tenant
✅ bloque/apartamento de visitante == bloque/apartamento do morador visitado
✅ morador_unidade de encomenda == unidade real do morador
✅ placa de veiculo == placa da pessoa, quando aplicável
✅ codigo_rastreio, codigo_retirada, codigo_acesso_qr são únicos no tenant
✅ CPF de todo morador passa na validação de dígito verificador
✅ placa de todo veiculo tem formato Mercosul válido
✅ data_inicio <= data_fim em prestadores
✅ nenhum id órfão em nenhuma coleção
✅ dados do tenant A não aparecem no tenant B
```

> **Critério:** o gerador **não pode** gerar dados que falhem nesses testes. O PRNG é determinístico, então a falha aparece no CI, não na frente do cliente.

---

## 6. O mockup do dashboard (`public/mockup-dashboard.png`)

### 6.1 O problema atual

`public/landing.html:601` referencia `/mockup-dashboard.png`, mas **o arquivo não existe**. É a **seção "Veja na prática"** (`landing.html:707`) — exatamente a parte que um prospect olha para entender o produto. A imagem aparece quebrada.

### 6.2 Como gerar (sem dependência nova)

O `package.json` não tem `sharp`, `canvas` nem `playwright` (verificado). Duas opções:

| Opção | Como | Prós | Contras |
|---|---|---|---|
| **A — Screenshot do app real** | Login com `admin@acacias.com` → abrir `/ambros-dashboard.html` → capturar via Playwright/Chrome headless | **Fidelidade real**: é a tela de verdade, com dados de verdade | Exige Playwright (~300 MB) ou Chrome instalado |
| **B — SVG → PNG** | Desenhar o dashboard em SVG (texto + retângulos) → converter para PNG | Ilustração versionável em texto | É uma *ilustração*, não a tela real; conversão exige dependência |

> **Recomendação: Opção A**, com **Opção B como fallback**. A Opção A é superior porque o mockup passa a ser regenerável a cada mudança de seed (`npm run mockup`), e nunca diverge da tela real.
>
> **Sem dependência nova:** o Windows já traz Edge (`msedge.exe`), que roda headless com `--screenshot`. Um script Node (`tools/generate-mockup.mjs`) pode invocá-lo diretamente — nada é adicionado ao `package.json`.

### 6.3 Especificação da imagem

| Atributo | Valor |
|---|---|
| **Dimensões** | 1440 × 900 (suficiente para `max-height: 520px` em desktop, sem ficar pixelada em 2×) |
| **Formato** | PNG, com o dashboard do tenant **Acácias** (o mais "vendável" — 48 unidades, layout horizontal legível) |
| **Conteúdo** | Header com nome do condomínio, os cards de `dashboard.ts` (`moradores_ativos`, `visitantes_hoje`, `veiculos_cadastrados`, `entradas_hoje`, `dentro_condominio`), gráfico de movimentação por faixa de 3h e lista de últimos acessos |
| **Dados** | Deve bater com o seed de Acácias — **exatamente** os mesmos números que a tela mostra ao vivo |
| **Mascaramento** | CPF e telefone **parcialmente mascarados** na imagem (ex.: `123.456.***-00`), mesmo sendo sintéticos — é o que se espera de uma imagem de produto |
| **Sem dados de acesso** | Não incluir token, URL de API, id interno de tenant |

### 6.4 Efeito na landing

A imagem entra na seção "Veja na prática" e passa a ser o **elemento de prova visual**: o prospect vê o sistema populado antes de logar.

---

## 7. Onde o seed entra no fluxo de inicialização

### 7.1 Cenário atual (quebra em produção)

```
Render Free sobe → git clone → data/database.json (seed de 3 moradores) → app funciona
                                    ↑ MAS: qualquer POST → save() → grava em disco efêmero
                                    ↑ E no redeploy: tudo que foi criado APAGA
```

### 7.2 Cenário alvo

```
Render Free sobe → sem data/database.json local
                  → bootstrap: conecta no Postgres → verifica se o tenant tem dados
                     ├─ tem → hidrata cache em memória
                     └─ não tem → roda o gerador de seeds → persiste no Postgres
                                └─ (demo) Popula Acácias com 48 moradores, 220 acessos, ...
```

> **Nota sobre o `data/database.json`:** com o Postgres como fonte de verdade, esse arquivo deixa de ser o banco e passa a ser **apenas o seed de referência** (versionado no Git, útil para diff e para o fallback em memória). A regra: **Postgres é a verdade; o JSON é o bootstrap**.

---

## 8. Ordem de execução (fases deste plano)

| Fase | Tarefa | Saída | Esforço |
|---|---|---|---|
| **S1** | `seeds/rng.ts` + `seeds/names.ts` | PRNG + listas sintéticas | 1,5 h |
| **S2** | `seeds/tenants.ts` | Config dos 3 condomínios | 1 h |
| **S3** | `seeds/generate.ts` — moradores, veículos, prestadores | Gerador base | 2 h |
| **S4** | `seeds/generate.ts` — visitantes, acessos, encomendas, ocorrências, reservas, comunicados, notificações, preautorizações | Gerador completo | 3 h |
| **S5** | `seeds/seeds.test.ts` | Testes de coerência (seção 5.4) | 1,5 h |
| **S6** | Script de persistência → Postgres (ou JSON de fallback) | `npm run seed` | 1 h |
| **S7** | Geração do `mockup-dashboard.png` | Imagem + script `npm run mockup` | 1 h |
| **S8** | Frontend: nome do condomínio no header | Mostrar o tenant ativo | 1 h |

**Total: ~12 h** (~1,5 dia)

> **S6 depende da Fase 2 do plano principal** (persistência Postgres). Se a persistência ainda não existir, o S6 grava o JSON de fallback e o seed funciona igual — só não sobrevive a redeploy.

---

## 9. Critérios de aceite

- [ ] `npm run seed` gera os 3 tenants de forma **determinística** (2 execuções → mesmo resultado byte a byte)
- [ ] `seeds/seeds.test.ts` passa: **zero** referências órfãs, **zero** inconsistências de bloco/apto/placa/código
- [ ] CPF de todo morador passa na validação de dígito verificador
- [ ] Nenhuma placa usa letras inválidas (I, O, Q) ou formato pré-Mercosul
- [ ] Dashboard de Acácias mostra ≥ 48 moradores, ≥ 20 entradas hoje e gráficos **não vazios**
- [ ] Visitantes dos últimos 7 dias formam série com variação (não linha reta)
- [ ] `public/mockup-dashboard.png` existe, é 1440×900 e os números batem com o seed
- [ ] Nenhum dado de Acácias aparece ao logar em Torres do Sol (e vice-versa)
- [ ] Os 4 perfis por tenant (`administrador`, `portaria`, `sindico`, `morador`) autenticam e veem exatamente o que o RBAC permite
- [ ] Dados do tenant A **não** aparecem nos dumps do tenant B (verificação em nível de schema)

---

## 10. Riscos

| Risco | Impacto | Mitigação |
|---|---|---|
| Gerador com bug de coerência | Demo com dado incoerente (visitante em bloco errado) | Testes de coerência no CI (S5) bloqueiam o merge |
| Volume grande demais deixa a demo lenta | Demo lenta vende mal | ~2.100 registros no total é trivial; medir e ajustar |
| Mockup desatualizado após mudança de seed | Imagem não bate com a tela | Gerar via script `npm run mockup` a partir do app real |
| Dados sintéticos reconhecíveis | Cliente percebe "fictício" | Nomes variados, DDD coerente, eventos plausíveis |
| Acácias = 48 un. (do pipeline) mas o cliente tem 60 | Demo não bate com a realidade do cliente | Gerador parametrizável por `unidades` — recriar seed em minutos para o porte real |

---

## 11. Decisões em aberto

| # | Decisão | Recomendação |
|---|---|---|
| **D1** | `leads` global ou por tenant? | **Global** — é funil comercial da AMBROS, não dado de condomínio. Fica em schema `public` |
| **D2** | Cidade dos dados: Manaus/AM (alvo do marketing) ou São Paulo (seed atual)? | **Manaus** — o material comercial (`ambros-config.js`, `condominios-manaus.csv`) é de Manaus. DDD `(92)`. Se preferir SP, é uma constante em `seeds/names.ts` |
| **D3** | Nomes dos condomínios de demo | Os 3 da seção 3, alinhados ao pipeline. "Parque das Águas" é genérico o bastante para renomear por cliente |
| **D4** | Senha única `demo1234` ou senha por tenant? | **Única** (`demo1234`) — facilita a demonstração; as contas são de demonstração, não de produção |
| **D5** | Expor a lista de contas de demo na UI? | **Sim, em página de login separada** (`/demo`), com aviso "ambiente de demonstração". Nunca no `login.html` normal |

---

## 12. Relação com o plano principal

| Este plano (seeds) | `PLANO-MULTITENANT-SUPABASE.md` |
|---|---|
| S1–S5 (gerador + testes) | Independente — pode começar agora |
| S6 (persistência do seed) | Depende da **Fase 2** (pool `pg` + repositórios) |
| S7 (mockup) | Depende de os seeds existirem, mas não do multi-tenant |
| S8 (tenant no header) | Depende da **Fase 1** (`condominio_id` no JWT) |

> **Sequência recomendada:** S1–S5 → S7 (mockup, já vendável) → Fase 1 do plano principal → S6 e S8.





