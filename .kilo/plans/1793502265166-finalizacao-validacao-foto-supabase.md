# Plano: Finalizar validação — foto de usuário + Supabase (Fases 3-5)

## Contexto

- Migração JSON → Supabase/Postgres: fases 3-5 concluídas (14 tabelas populadas, login validado, persistência validada).
- Bug foto de usuário: código corrigido em `src/routes/auth.ts` (`PUT /me`, `PUT /me/foto`, `POST /usuarios`), `src/types.ts` (`foto_url: string | null`), `src/db/base.ts` (seed `foto_url: null`), `src/db/PostgresDB.ts` (coluna `foto_url TEXT`).
- `tsc --noEmit`: 0 erros. `npm test` (`DB_TYPE=json`): 111/111 passando.
- Bloqueador atual: 2 processos node rodando (PIDs 23748, 26532), porta 3000 ocupada. Servidor não reiniciou com as mudanças de código. `PUT /me/foto` retornou 404.

## Objetivo

Liberar porta 3000, reiniciar servidor, validar `PUT /me/foto` (não afeta outros usuários), rodar validação final e marcar planos como concluídos.

## Tarefas (ordem de execução)

1. **Matar processos node e liberar porta 3000**
   - `Get-Process node | Stop-Process -Force`
   - Confirmar que não resta processo node na porta 3000

2. **Reiniciar servidor com código atualizado**
   - `npm run dev` (ou `DB_TYPE=json npm run dev`)
   - Confirmar `/api/health` → `{"status":"ok"}`

3. **Validar endpoint `PUT /me/foto`**
   - Login: `POST /auth/login` com `adm@adm.com` / `123` → obter `access_token`
   - `PUT /me/foto` com `{ "foto_url": "https://exemplo.com/foto-admin.jpg" }` e header `Authorization: Bearer <token>`
   - Verificar resposta: apenas o usuário logado recebeu a nova `foto_url`
   - `GET /me` sem token de outro usuário / `GET /usuarios` como admin: confirmar que outros usuários mantêm `foto_url: null` (ou original)

4. **Validação final**
   - `tsc --noEmit` → 0 erros
   - `$env:DB_TYPE="json"; npm test` → 111/111 passando

5. **Marcar planos como concluídos**
   - `.kilo\plans\bug-foto-usuario-afeta-todos.md`: itens 6 e 7 → [x]
   - `.kilo\plans\1793499223979-supabase-execucao-fases-3-5.md`: item 16 → [x]

## Critérios de aceitação

- Nenhum processo node órfão na porta 3000
- Servidor responde em `/api/health`
- `PUT /me/foto` atualiza apenas o usuário autenticado (não afeta outros)
- `tsc --noEmit` = 0 erros
- `npm test` (`DB_TYPE=json`) = 111/111

## Decisões já tomadas (não reabrir)

- Foto armazenada como `foto_url: string | null` na entidade `Usuario` (auth)
- Endpoint dedicado `PUT /me/foto` separado de `PUT /me`
- Testes rodam com `DB_TYPE=json` (não dependem de Postgres)
- Cliente `pg` direto; JWT custom mantido; sem RLS agora

## Open questions (se houver durante a execução)

- Se `PUT /me/foto` continuar retornando 404 após restart: verificar ordem de registro de rotas em `src/server.ts` (rotas auth registradas antes de outras que possam casar `/me`)
- Se algum teste falhar: identificar se é regressão do bug da foto ou falha pré-existente
