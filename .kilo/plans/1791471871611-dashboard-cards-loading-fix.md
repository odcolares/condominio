# Plano: Correção de Cards do Portal do Morador — "Carregando..." Infinito

## Problema
Ao acessar o portal do morador (`portal-morador.html`), os cards como "Minhas Encomendas na Portaria", "Passes Digitais de Visitantes & Convidados", "Minhas Reservas de Áreas Comuns" ficam presos na mensagem "Carregando..." e nunca exibem os dados, mesmo quando há conteúdo disponível (ex.: passes criados, reservas existentes).

## Causa Raiz

### Bug 1 (CRÍTICO): Referência a elemento HTML inexistente — crash em `renderizarPortal()`
- **Arquivo**: `public/portal-morador.html`, linha 559
- **Código**: `document.getElementById("sidebarMoradorNome").textContent = morador.nome_completo;`
- O elemento com `id="sidebarMoradorNome"` **não existe** no HTML. O elemento correto é `sidebarUserName` (linha 232, gerenciado por `ambros-layout.js`).
- `getElementById` retorna `null`, e acessar `.textContent` em `null` lança `TypeError`, que **interrompe a execução de `renderizarPortal()`** antes de qualquer card ser renderizado.

### Bug 2: Falta de tratamento de erros em `carregarPortal()`
- **Arquivo**: `public/portal-morador.html`, linhas 537-553
- O `catch` apenas faz `console.warn(...)` — silencioso para o usuário. Todos os boxes permanecem com "Carregando...".

### Bug 3: Falta de tratamento de erros em `renderizarPortal()`
- **Arquivo**: `public/portal-morador.html`, linhas 555-705
- Nenhum `try-catch` em volta de acessos a propriedades que podem ser `null/undefined`:
  - Linha 615: `p.data_prevista.split('-')` — crash se `data_prevista` for `null`
  - Linha 643: `r.data_reserva.split('-')` — crash se `data_reserva` for `null`
  - Linha 666: `new Date(c.data_publicacao).toLocaleDateString(...)` — comportamento inesperado se null

### Bug 4: `moradorAtualId` hardcodado
- **Arquivo**: `public/portal-morador.html`, linha 526
- `let moradorAtualId = 1;` — deve ser derivado do JWT token do usuário logado.

### Bug 5: `salvarPreAutorizacao()` e `salvarPrestador()` — sem feedback após refresh
- Ambas chamam `carregarPortal()` no sucesso, mas se o reload falhar, o usuário não é notificado.

## Plano de Correção — Tarefas

### Tarefa 1: Corrigir referência ao elemento da sidebar (Bug 1)
- **Arquivo**: `public/portal-morador.html`
- Remover a linha `document.getElementById("sidebarMoradorNome").textContent = morador.nome_completo;` (linha 559)
- O `sidebarUserName` já é preenchido por `ambros-layout.js` via `getAuthUser()`. Se preciso sobrescrever, usar `sidebarUserName`.

### Tarefa 2: Adicionar tratamento de erros em `carregarPortal()` (Bug 2)
- Envolver o fetch em `try-catch` já existe, mas no `catch`, exibir mensagem de erro em todos os boxes:
  - `boxEncomendas`, `boxPreAutorizacoes`, `boxMinhasReservas`, `boxComunicados`, `boxMeusVeiculos`, `boxMeusPrestadores`
- Mensagem: "Não foi possível carregar os dados. Tente recarregar a página."

### Tarefa 3: Adicionar tratamento de erros e null-checks em `renderizarPortal()` (Bug 3)
- Envolver o corpo de `renderizarPortal()` em `try-catch`
- No `catch`, exibir erro em todos os boxes (mesma abordagem do Tarefa 2)
- Adicionar null-checks para:
  - `p.data_prevista` antes de `.split('-')`
  - `r.data_reserva` antes de `.split('-')`
  - `c.data_publicacao` antes de `new Date()`

### Tarefa 4: Derivar `moradorAtualId` do JWT (Bug 4)
- **Arquivo**: `public/portal-morador.html`
- Fazer `GET /auth/me` ao carregar a página (ou decodificar JWT) para obter o `morador_id` do usuário logado
- Alternativa: usar o endpoint `/portal/morador` sem `morador_id` (usa o primeiro morador como fallback, mas isso não é correto)
- Melhor: adicionar endpoint que retorna o morador vinculado ao usuário logado, ou usar a resposta de `/auth/me` que já contém `usuario.nome` (que bate com `morador.nome_completo`)

### Tarefa 5: Melhorar feedback em `salvarPreAutorizacao()` e `salvarPrestador()` (Bug 5)
- Após `carregarPortal()`, se houver erro, não fechar o modal silenciosamente
- Manter o modal aberto e exibir mensagem de erro se o reload falhar

### Tarefa 6: Adicionar estado de erro vazio para cards
- Cada box deve ter:
  1. Estado "Carregando..." (placeholder inicial — já existe)
  2. Estado "Vazio" (mensagem quando não há dados — já existe parcialmente)
  3. Estado "Erro" (mensagem quando falha o carregamento — **não existe**)

### Tarefa 7: Adicionar refresh após criação bem-sucedida
- Após `salvarPreAutorizacao()` ou `salvarPrestador()` bem-sucedidos, garantir que `carregarPortal()` seja chamada e que o card específico seja atualizado
- Mostrar feedback visual (ex: "Passe atualizado!") no card relevante

## Arquivos Afetados
| Arquivo | Mudanças |
|---|---|
| `public/portal-morador.html` | Corrigir `sidebarMoradorNome`, adicionar try-catch em `carregarPortal` e `renderizarPortal`, adicionar null-checks em datas, derivar `moradorAtualId` de JWT, melhorar feedback pós-salvamento |

## Riscos
- Nenhum risco de quebra de backend — todas as mudanças são frontend
- Testes existentes (backend) não são afetados

## Validação
1. Abrir `portal-morador.html` no navegador
2. Verificar que todos os cards carregam e exibem dados (ou estado vazio apropriado)
3. Criar um passe de visitante e verificar que aparece na lista
4. Criar um prestador e verificar que aparece na lista
5. Verificar consoles de desenvolvedor — não devem mostrar erros JavaScript
6. Rodar `npx tsc --noEmit` para garantir que não há erros de tipo (se houver tipos JSDoc)
