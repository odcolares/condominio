# AMBROS — Refinar Permissões do Perfil Morador, Pré-Autorizações com WhatsApp e Restrição de Acesso

## 1. Objetivo

Refinar o perfil de morador (`perfil: "morador"`) no sistema AMBROS:

1. Tornar visíveis e acessíveis as funcionalidades específicas de morador (Área do Morador, Dashboard do Morador).
2. Adicionar fluxo de pré-registro de **visitantes (convidados)** com notificação WhatsApp + confirmação de entrada.
3. Adicionar fluxo de pré-registro de **prestadores de serviço** com notificação WhatsApp + confirmação de entrada.
4. Restringir e esconder todos os outros pontos de acesso do perfil de morador.

## 2. Estado Atual (Contexto)

### Auth & Authorization
- **Nenhum controle de acesso baseado em perfil (RBAC) além de admin.** `authMiddleware` (`src/auth.ts:16`) apenas verifica autenticação JWT. Existe `adminMiddleware` (`src/routes/auth.ts:83`) para rotas `/auth/usuarios`, mas **não há middleware restringindo rotas para `perfil: "morador"`**.
- Login (`public/login.html:143`) redireciona sempre para `ambros-dashboard.html` — moradores caem no dashboard administrativo.
- Frontend esconde `.admin-only` via `ambros-layout.js:653-656`, mas **não há esconderijo de itens para moradores** (ex: Portaria, Cadastros, Auditoria visíveis para moradores).

### Visitor Pre-registration (PARCIAL)
- Tipo `PreAutorizacaoVisitante` existe (`src/types.ts:228`) com `codigo_acesso_qr`, `status`, `morador_id`.
- `POST /portal/preautorizacao` (`src/routes/portal.ts:67`) cria pré-autorização + registro de visitante.
- **FALTA**: Não envia notificação WhatsApp na criação — apenas notificação in-app (`canal: "app"` no banco).
- Entrada/saída (`src/routes/visitantes.ts:269`, `:315`) já enviam WhatsApp via `tmplVisita`/`tmplVisitaSaida`.

### Service Provider Pre-registration (AUSENTE para morador)
- Tipo `Prestador` existe (`src/types.ts:96`) com `morador_autorizador_id`.
- `POST /prestadores` (`src/routes/prestadores.ts:84`) cria prestador e envia WhatsApp via `tmplPrestador(..., "registrado")`.
- `POST /prestadores/:id/entrada` (`src/routes/prestadores.ts:256`) envia WhatsApp no check-in.
- **FALTA**: Não há endpoint ou UI para morador pré-registrar seu próprio prestador. O `portal-morador.html` mostra apenas lista read-only com link para `prestadores.html` (visão de portaria/admin).

### Resident Portal (parcialmente pronto)
- `public/portal-morador.html` existe com: encomendas, passes digitais, reservas, comunicados, veículos, prestadores.
- **FALTA**:
  - Login não redireciona moradores para `portal-morador.html`.
  - Sidebar mostra todos os grupos de navegação (Portaria, Cadastros, Gestão & Auditoria).
  - Não há fluxo de pré-registro de **serviço** (prestador).

## 3. Decisões de Design

### Decisão 1: Middleware RBAC
**Escolha: Criar `requirePerfil(...perfis)` em `src/auth.ts`** aplicado por-rota.

- `authMiddleware` continua sendo o guarda-chuva de autenticação.
- `requirePerfil("administrador", "portaria")` protege rotas restritas a não-moradores.
- Rotas do portal (`/portal/*`) permanecem acessíveis a todos os autenticados (morador vê apenas os seus dados).

**Perfis no sistema**: `administrador`, `morador`, `portaria` (e `sindico` mapeia como administrador).

### Decisão 2: Rotas a restringir para moradores (403 se acessar)
Rotas que morador **NÃO** deve acessar:
- `/moradores` (CRUD completo — lista outros moradores)
- `/veiculos` (todos os veículos)
- `/visitantes` (visualização geral de todos os visitantes — NÃO o pré-registro via portal)
- `/acessos` (auditoria completa)
- `/encomendas` (todas as encomendas)
- `/prestadores` (CRUD completo — NÃO o pré-registro via portal)
- `/ocorrencias` (CRUD completo — morador só deve poder *criar* incidências, não listar todas)
- `/restricoes` (restrições de acesso)
- `/dashboard` (dashboard administrativo)
- `/leads` (leads de prospecção)
- `/auth/usuarios` (já admin-only)

Rotas que morador **PODE** acessar:
- `/auth/login`, `/auth/me`
- `/portal/morador`, `/portal/preautorizacao`, `/portal/comunicados`, `/portal/notificacoes-sistema`, `/portal/notificacoes/disparar`
- `/reservas` (seu próprio — filtrado por `morador_id`)
- `/ocorrencias` POST apenas (criar ocorrência — NÃO GET/PUT/DELETE)

### Decisão 3: Notificação WhatsApp na criação de pré-autorização de visitante
No `POST /portal/preautorizacao` (`portal.ts:67`), adicionar:
- Geração de links de notificação WhatsApp + Telegram usando `gerarLinksNotificacao` + `tmplVisita`.
- Retornar `whatsappUrl`/`telegramUrl` na resposta do endpoint.

### Decisão 4: Novo endpoint `POST /portal/prestador`
Novo endpoint em `portal.ts` para morador pré-registrar prestadores:
- `morador_autorizador_id` é preenchido automaticamente do JWT (não do body).
- Valida `nome`, `documento`, `funcao`, `data_inicio`, `data_fim` ou `prazo_dias`.
- Gera notificação WhatsApp via `tmplPrestador(morador, prestador, "registrado")`.
- Retorna `whatsappUrl`/`telegramUrl`.

### Decisão 5: Confirmação de entrada para visitantes/prestadores pré-registrados
Atualizar os endpoints de entrada existentes:
- `/visitantes/:id/entrada` (`src/routes/visitantes.ts:269`): Se o visitante foi criado via pré-autorização (existe `PreAutorizacaoVisitante` vinculada), atualizar seu `status` para `"acessou"`.
- `/prestadores/:id/entrada` (`src/routes/prestadores.ts:256`): Já envia WhatsApp com `tmplPrestador(..., "entrou")`. Confirmar que a mensagem de entrada é distinta da de registro.

Adicionar templates de notificação:
- `tmplVisitaConfirmada(morador, visitante)` em `src/lib/notificacoes.ts` — mensagem de "seu visitante chegou e foi confirmado na portaria".

### Decisão 6: Login com redirecionamento baseado em perfil
No `login.html`, após login bem-sucedido, redirecionar baseado em `perfil`:
- `administrador` / `sindico` → `ambros-dashboard.html`
- `morador` → `portal-morador.html`
- `portaria` → `portaria-entrada.html`

### Decisão 7: Sidebar restrictivo no frontend para moradores
- Adicionar classe CSS `.no-morador` a nav items que não devem aparecer para moradores.
- Em `ambros-layout.js`, estender `initLayout()` para esconder `.no-morador` quando `perfil === "morador"`.
- Aplicar `.no-morador` em **cada página HTML** que tem sidebar: `ambros-dashboard.html`, `visitantes.html`, `prestadores.html`, `ocorrencias.html`, `moradores.html`, `veiculos.html`, `encomendas.html`, `auditoria.html`, `usuarios.html`, `reservas.html`.

### Decisão 8: UI de pré-registro de serviço no portal do morador
Adicionar ao `portal-morador.html`:
- Card "Prestadores" com botão "Liberar Serviço".
- Modal de pré-registro de prestador (nome, função, empresa, documento, data início/fim, telefone, placa, observação).
- Chamada `POST /portal/prestador` ao submeter.

## 4. Data Flow

### Fluxo: Pré-registro de visitante
```
Morador (portal-morador.html)
  → POST /portal/preautorizacao { morador_id, nome_visitante, data_prevista, ... }
  → Cria PreAutorizacaoVisitante + Visitante
  → Gera links WhatsApp (tmplVisita) + notificação in-app
  → Retorna { ...pre, whatsappUrl, telegramUrl }

Portaria (visitantes.html)
  → POST /visitantes/:id/entrada
  → Atualiza PreAutorizacaoVisitante.status = "acessou"
  → Envia WhatsApp tmplVisitaConfirmada para morador
  → Cria Acesso(sentido=entrada)
```

### Fluxo: Pré-registro de prestador
```
Morador (portal-morador.html)
  → POST /portal/prestador { nome, funcao, empresa, data_inicio, data_fim, ... }
  → morador_autorizador_id preenchido do JWT
  → Cria Prestador
  → Gera links WhatsApp (tmplPrestador(..., "registrado"))
  → Retorna { ...prestador, whatsappUrl, telegramUrl }

Portaria (prestadores.html)
  → POST /prestadores/:id/entrada
  → Envia WhatsApp tmplPrestador(..., "entrou") para morador
  → Cria Acesso(sentido=entrada)
```

## 5. Plano de Implementação (Ordered Task List)

### Backend
1. **`src/auth.ts`**: Adicionar `requirePerfil(...perfis)` middleware.
2. **`src/routes/portal.ts`**: 
   a. Modificar `POST /preautorizacao` para gerar e retornar links WhatsApp.
   b. Adicionar `POST /portal/prestador` (pré-registro de serviço pelo morador).
   c. Adicionar `GET /portal/prestadores` (lista apenas prestadores do morador logado).
3. **`src/routes/visitantes.ts`**: No `POST /:id/entrada`, atualizar `PreAutorizacaoVisitante.status` para `"acessou"` se vinculada.
4. **`src/routes/prestadores.ts`**: Manter comportamento atual (já envia WhatsApp na entrada).
5. **`src/lib/notificacoes.ts`**: Adicionar `tmplVisitaConfirmada(morador, visitante)`.
6. **Aplicar `requirePerfil`** em rotas administrativas/portaria:
   - `src/routes/moradores.ts`: todos os endpoints → `requirePerfil("administrador", "portaria")`
   - `src/routes/veiculos.ts`: todos → `requirePerfil("administrador", "portaria")`
   - `src/routes/visitantes.ts`: todos exceto nada (todo acesso via portal usa `/portal/preautorizacao`) → `requirePerfil("administrador", "portaria")`
   - `src/routes/acessos.ts`: todos → `requirePerfil("administrador", "portaria")`
   - `src/routes/encomendas.ts`: todos → `requirePerfil("administrador", "portaria")`
   - `src/routes/prestadores.ts`: POST/PUT/DELETE/entrada/saida → `requirePerfil("administrador", "portaria")`
   - `src/routes/ocorrencias.ts`: GET/PUT/DELETE → `requirePerfil("administrador", "portaria")`; POST → qualquer autenticado (morador pode reportar)
   - `src/routes/restricoes.ts` (sub-router): todos → `requirePerfil("administrador", "portaria")`
   - `src/routes/reservas.ts`: GET lista → `requirePerfil("administrador", "portaria")` (se sem morador_id filtro); POST → qualquer um (morador cria para si); PUT/DELETE → `requirePerfil("administrador", "portaria")`
   - `src/routes/dashboard.ts`: todos → `requirePerfil("administrador", "portaria")`
   - `src/routes/leads.ts`: todos → `requirePerfil("administrador")`
   - `src/routes/portal.ts`: `POST /portal/comunicados` → `requirePerfil("administrador", "portaria")`; `DELETE /portal/comunicados/:id` → `requirePerfil("administrador", "portaria")`. Outros permanecem para todos.

### Frontend
7. **`public/login.html`**: Login redirect baseado em `perfil` (lado JS).
8. **`public/ambros-layout.js`**: Estender `initLayout()` para esconder `.no-morador` quando `perfil === "morador"`.
9. **Todas as páginas HTML com sidebar**: Marcar nav items administrativos com `.no-morador`:
   - `ambros-dashboard.html`, `visitantes.html`, `prestadores.html`, `ocorrencias.html`, `moradores.html`, `veiculos.html`, `encomendas.html`, `auditoria.html`, `usuarios.html`, `reservas.html`, `portaria-entrada.html`
10. **`public/portal-morador.html`**: 
    a. Adicionar card de "Prestadores" com botão "Liberar Serviço" + modal.
    b. Remover/esconder o dropdown "Simular como morador" para moradores reais (manter apenas para admin).
    c. Marcar nav items com `.no-morador` nos itens que não são da área do morador.

### Testes
11. **`src/routes/portal.test.ts`** (novo):
    - Testa `POST /portal/preautorizacao` retorna `whatsappUrl`/`telegramUrl`.
    - Testa `POST /portal/prestador` com morador logado cria prestador e retorna links.
    - Testa `GET /portal/prestadores` retorna apenas prestadores do morador.
12. **`src/routes/rbac.test.ts`** (novo):
    - Morador (carlos@ambros.com / 123) recebe 403 em `/moradores`, `/visitantes`, `/dashboard`, `/acessos`, `/encomendas`, `/prestadores`, `/ocorrencias` (GET), `/leads`.
    - Morador recebe 200 em `/portal/morador`, `/portal/comunicados`, `/reservas` (GET).
    - Portaria recebe 200 em `/visitantes`, `/prestadores`, `/dashboard`.

## 6. Riscos & Considerações

- **Compatibilidade**: Moradores existentes no seed (Carlos Lima, `carlos@ambros.com`) usam senha `123`. O teste de RBAC usará este login.
- **Reservas**: Morador deve poder listar e criar reservas apenas para sua unidade. O endpoint `GET /reservas` atual lista todas — considerar filtrar por `morador_id` quando perfil for `morador`.
- **Ocorrências**: Morador deve poder criar (denunciar) mas não listar todas as ocorrências. O POST atual não filtra por morador — considerar auto-definir `bloco`/`apartamento` do morador.
- **WhatsApp notification**: A infraestrutura gera links para WhatsApp/Telegram. O "envio" real depende de alguém clicar no link. Isso é o comportamento atual e não precisa mudar.

## 7. Validação

- `npm test` — todos os testes existentes devem continuar passando (67 testes).
- Novos testes de RBAC e portal devem passar.
- `npx tsc --noEmit` — typecheck sem erros.
- Manual: Login como morador → redireciona para `portal-morador.html` → sidebar mostra apenas "Área do Morador" → pode pré-autorizar visitante → recebe links WhatsApp → pré-registrar prestador → confirmação de entrada atualiza status.

## 8. Fora de Escopo

- UI móvel nativa (PWA): não implementar.
- Integração real de API WhatsApp (necessita server externo): apenas links.
- Novo sistema de roles/tabelas de permissões: usar o campo `perfil` string existente.
- Refatoração completa do frontend para component-based: trabalhar com HTML estático atual.
