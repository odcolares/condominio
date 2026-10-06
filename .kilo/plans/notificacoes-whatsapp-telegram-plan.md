# Plano: Módulo Unificado de Notificações via WhatsApp/Telegram (Links de Abertura Direta)

## Contexto

O AMBROS notifica moradores sobre encomendas, visitas, reservas, prestadores e ocorrências.
Hoje **não existe integração real** com APIs de WhatsApp/Telegram — apenas:

- `gerarLinksNotificacao()` em `src/routes/encomendas.ts` → URLs `api.whatsapp.com/send?...` e `t.me/...`
- Front de encomendas abre URLs via `window.open` e marca `notificacao_enviada_* = true`
- Demais rotas criam apenas `NotificacaoMorador` com `canal: "app"` (simulado)
- `morador_telegram` sempre `null` em encomendas; `Morador` não tem campo `telegram`

## Decisões do Usuário

1. **Escopo:** todas as rotas (encomendas, visitas, reservas, prestadores, ocorrências)
2. **Contato obrigatório:** `whatsapp` e/ou `telegram` — pelo menos um obrigatório; `bloco` e `apartamento` também obrigatórios
3. **Templates:** definir mensagem-template para cada evento

## Escopo (fora de foco)

- Envio real via APIs (Evolution API, WhatsApp Business Cloud, Telegram Bot API) — usar sempre links de abertura direta
- Chatbot interativo bidirecional

---

## Tarefas (ordem de implementação)

### 1. Types (`src/types.ts`)
- [ ] Adicionar `telegram: string | null` na interface `Morador`
- [ ] Adicionar `telegram: string | null` no `NotificacaoMorador.dados_adicionais` opcional (ou manter `canal` existente)

### 2. Lib de notificações (`src/lib/notificacoes.ts`) — criar
- [ ] `normalizarFone(telefone): string` — limpa, adiciona DDI 55, remove 9º dígito se houver
- [ ] `normalizarTelegram(user): string` — remove `@`
- [ ] `gerarLinksNotificacao(morador: Morador, mensagem: string): { whatsappUrl, telegramUrl }`
  - WhatsApp: `https://api.whatsapp.com/send?phone=55XXXXXXXXXX&text=<encoded>`
  - Telegram: `t.me/<username>` (ou share fallback se não houver username)
- [ ] Templates por evento (funções que recebem os dados do domínio e retornam string):
  - `tmplEncomenda(morador, enc)` — "📦 Nova encomenda RET-XXXX para {unidade}. Código: {codigo_retirada}. Retire na portaria."
  - `tmplVisita(morador, visitante)` — "🚪 {nome} chegou. Acompanhe entrada/saída."
  - `tmplVisitaSaida(morador, visitante)` — "👋 {nome} saiu da portaria."
  - `tmplReserva(morador, reserva, confirmada)` — "📅 Reserva {status} para {espaco} no dia {data}. Período: {periodo}."
  - `tmplPrestador(morador, prestador, acao)` — "🛠️ {nome} {acao} hoje. Função: {funcao}."
  - `tmplOcorrencia(morador, ocor)` — "⚠️ Ocorrência registrada: {titulo} — {gravidade}."

### 3. Validação de morador (`src/routes/moradores.ts`)
- [ ] POST: validar `whatsapp` ou `telegram` obrigatório (422 se ambos nulos/vazios)
- [ ] POST: validar `bloco` e `apartamento` obrigatórios
- [ ] PUT: aplicar as mesmas validações
- [ ] Adicionar campo `telegram` no destructure de POST e PUT e adicionar `"telegram"` à lista `campos` no PUT

### 4. Seed/Database (`src/db.ts`)
- [ ] Adicionar `telegram: "@carloslima502"` aos moradores de seed (m1, m2, m3)
- [ ] Garantir pelo menos um de `whatsapp`/`telegram` presente em cada morador seed

### 5. Integrar templates + links em cada rota

#### 5a. Encomendas (`src/routes/encomendas.ts`)
- [ ] Importar `gerarLinksNotificacao` e `tmplEncomenda` de `../lib/notificacoes.js`
- [ ] Substituir `gerarMensagemAviso` local → usar `tmplEncomenda` (ou adaptar nome)
- [ ] POST: se `notificar_whatsapp`/`notificar_telegram`, gerar links e incluir na resposta
- [ ] `/:id`: retornar `whatsappUrl`/`telegramUrl` via helper
- [ ] `/:id/notificar`: manter marcação booleana (não envia de fato), retornar links na resposta
- [ ] Propagar `morador_telegram` do morador (hoje fixo `null`)

#### 5b. Visitantes (`src/routes/visitantes.ts`)
- [ ] POST: ao criar visitante (e se `entrada_imediata`), buscar morador e gerar links via `gerarLinksNotificacao` + `tmplVisita`; incluir `whatsappUrl`/`telegramUrl` na resposta
- [ ] `entrada`: notificar morador com `tmplVisita`
- [ ] `saida`: notificar morador com `tmplVisitaSaida`
- [ ] DELETE: sem notificação (visitante cancelado)

#### 5c. Reservas (`src/routes/reservas.ts`)
- [ ] POST: gerar links com `tmplReserva(confirmada=true)`; incluir na resposta JSON
- [ ] PUT (status): se status muda de confirmada→cancelada ou outro, disparar `tmplReserva(confirmada=false)`

#### 5d. Prestadores (`src/routes/prestadores.ts`)
- [ ] POST: notificar morador_autorizador com `tmplPrestador(acao="registrado")` — links na resposta
- [ ] `entrada`/`saida`: `tmplPrestador(acao="entrou"/"saiu")`

#### 5e. Ocorrências (`src/routes/ocorrencias.ts`)
- [ ] POST: notificar morador_envolvido (se houver) com `tmplOcorrencia`; incluir links na resposta
- [ ] PUT (resolvida): `tmplOcorrencia` com status "resolvida"

### 6. Frontend — padronizar botões de notificação

Objetivo: em cada tela de lista/detalhe, botões "Avisar no WhatsApp" e "Avisar no Telegram" que abrem a URL gerada pelo backend (igual encomendas faz hoje).

- [ ] Criar snippet reutilizável (colado em cada página ou via `ambros-layout.js`): `abrirWhats(appLink)`, `abrirTelegram(tgLink)`
- [ ] `encomendas.html`: adaptar para usar helper do lib, manter comportamento atual
- [ ] `visitantes.html`: ao registrar entrada/saída, abrir modal de notificação com os mesmos botões
- [ ] `reservas.html`: ao salvar/alterar reserva, mostrar links de notificação
- [ ] `prestadores.html`: botão de notificar na entrada/saída
- [ ] `ocorrencias.html`: botão de notificar ao registrar/resolvida

### 7. API pública de notificação (`src/routes/portal.ts`)
- [ ] `POST /portal/notificacoes/disparar` — já existe; atualizar para usar `gerarLinksNotificacao` e retornar `whatsappUrl`/`telegramUrl` quando canal for whatsapp/telegram (hoje só grava NotificacaoMorador)

### 8. Testes (`vitest`)
- [ ] `src/lib/notificacoes.test.ts`: testar `normalizarFone`, `normalizarTelegram`, `gerarLinksNotificacao`
- [ ] Atualizar/estender testes de encomendas para checar `whatsappUrl`/`telegramUrl` na resposta
- [ ] Adicionar teste para validação obrigatória de morador (`whatsapp` ou `telegram`)

### 9. Docs (`docs/`)
- [ ] Atualizar `MANUAL-V2-OPERACAO.md` §§ encomendas, visitas, reservas, prestadores, ocorrências com o fluxo de notificação por link
- [ ] Atualizar README seção de API endpoints para incluir `notificacao_enviada_*` / `whatsappUrl`/`telegramUrl` onde pertinente

---

## Riscos / Limites

- **Link só abre no aparelho do portaria:** o link é aberto pelo navegador do guichê, não disparado de forma assíncona. O morador só recebe se o porta-serviço clicar no botão. — **aceitável**, combinado pelo usuário.
- **Número de WhatsApp sem formatação:** `normalizarFone` deve tratar DDD 11 prefixado, 9º dígito, e garantir começar com 55.
- **Telegram sem username:** fallback para `t.me/share/url`. — definido.
- **Validação obsoleta em frontend:** manter sincronizada com backend (422 de morador sem contato).
- **Seed data:** existem moradores sem `telegram` até o momento; adicionar para testes locais.

## Migração / Rollout

- Seed atualizado; sem migrations (JSON file).
- Compatibilidade: campo `telegram` novo em `Morador` — código antigo que só usa `whatsapp` continua funcionando (field opcional).
- Build: `npm run build` e `npm test` devem passar no CI.
- Não altera contrato público existente — apenas **enriquece** respostas com `whatsappUrl`/`telegramUrl`.

## Validação

- [ ] `npm run build` → sem errors
- [ ] `npm test` → 19+ testes verdes + novos testes
- [ ] Manual: cadastrar morador sem contato → 422; com contato → 201; notificar encomenda → link abre WhatsApp/Telegram com mensagem correta
