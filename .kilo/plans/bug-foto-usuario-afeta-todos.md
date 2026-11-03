# Plano: Corrigir bug de foto de usuário afetando todos os usuários

## Problema

Quando troca a foto do usuário logado, a mesma foto é aplicada a todos os usuários (admin, morador, portaria ficam com a mesma foto).

## Causa raiz (identificada no código)

| # | Descoberta | Arquivo | Linhas | Impacto |
|---|-----------|---------|--------|---------|
| 1 | `Usuario` não tem campo `foto_url` | `src/types.ts` | 5-13 | Não há onde armazenar a foto do usuário autenticado |
| 2 | `PUT /me` não trata `foto_url` | `src/routes/auth.ts` | 45-81 | Usuário logado não pode atualizar sua própria foto |
| 3 | `PUT /moradores/:id` exige admin/portaria | `src/routes/moradores.ts` | 7 | Morador comum não consegue atualizar sua foto |
| 4 | `authMiddleware` usa referência direta | `src/auth.ts` | 26-30 | `req.user` aponta para objeto compartilhado em `db.usuarios` |
| 5 | Resolução de morador por nome é frágil | `src/portal.ts` | 20 | `m.nome_completo === usuario.nome` pode casar errado |

## Tarefas de correção

| # | Tarefa | Detalhes |
|---|--------|----------|
| 1 | Adicionar `foto_url` à interface `Usuario` | `src/types.ts:5-13` — incluir `foto_url: string \| null` |
| 2 | Adicionar `foto_url` ao `PUT /me` | `src/routes/auth.ts:45-81` — tratar `foto_url` no corpo da requisição, atualizar apenas o usuário logado |
| 3 | Criar endpoint `PUT /me/foto` (opcional, se quiser separar) | Endpoint dedicado para atualização de foto do usuário logado, sem exigir admin |
| 4 | Proteger contra atualização em lote de `foto_url` | Revisar se há código que faz `forEach`/`map` em `db.usuarios` ou `db.moradores` definindo `foto_url` para todos; remover se houver |
| 5 | Corrigir resolução de morador por nome no portal | `src/portal.ts:20` — considerar resolver por ID do usuário vinculado ao morador, não apenas por nome |
| 6 | Adicionar teste de não-regressão | Testar que atualizar a foto de um usuário não altera a foto de outros usuários |
| 7 | Executar `tsc --noEmit` e `npm test` | Verificar que não há erros de tipo e todos os 111 testes passam |

## Validação

- `tsc --noEmit` deve retornar 0 erros
- `npm test` (com `DB_TYPE=json`) deve passar 111/111
- Fazer login como admin, atualizar foto via `PUT /me`, verificar que apenas o admin recebeu a nova foto
- Fazer login como morador, atualizar foto via `PUT /me`, verificar que apenas o morador recebeu a nova foto
- Confirmar que outros usuários mantêm suas fotos originais

## Decisões resolvidas

- Foto armazenada como `foto_url: string | null` na entidade `Usuario` (auth).
- Apenas URL de foto (string), não upload multipart.
- Endpoint dedicado `PUT /me/foto` separado de `PUT /me`.
- Testes rodam com `DB_TYPE=json`.

## Status

Implementação concluída (src/routes/auth.ts, src/types.ts, src/db/base.ts, src/db/PostgresDB.ts). Validação operacional pendente: liberar porta 3000, reiniciar servidor, validar `PUT /me/foto`.
