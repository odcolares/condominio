# ✅ CHECKLIST-DEMO.md — Verificações Pré-Apresentação

> **Objetivo:** Garantir que o ambiente esteja 100% funcional antes de iniciar a apresentação ao cliente.
> **Quando executar:** 30 minutos antes da demo.
> **Quem executa:** Quem vai apresentar.

---

## 🖥️ Antes de ligar o servidor

| # | Verificação | Como testar | Status |
|---|-------------|-------------|--------|
| 1 | Node.js instalado | `node --version` → deve mostrar v18+ | ⬜ |
| 2 | npm instalado | `npm --version` | ⬜ |
| 3 | Porta 3000 livre | `netstat -ano \| findstr :3000` → deve estar vazia | ⬜ |
| 4 | Repositório atualizado | `git status` → sem alterações pendentes | ⬜ |
| 5 | Dependências instaladas | Pasta `node_modules` existe | ⬜ |

---

## 🚀 Depois de iniciar o servidor (`npm run dev`)

| # | Verificação | Como testar | Resultado esperado | Status |
|---|-------------|-------------|-------------------|--------|
| 6 | Servidor responde | Acessar `http://localhost:3000/api/health` | JSON `{ status: "ok" }` | ⬜ |
| 7 | Login admin | `admin@ambros.com` / `admin123` | Redireciona para dashboard | ⬜ |
| 8 | Login porteiro | `portaria@ambros.com` / `portaria123` | Acesso permitido | ⬜ |
| 9 | Login morador | `carlos@ambros.com` / `morador123` | Redireciona para portal-morador | ⬜ |
| 10 | Login síndico | `sindico@ambros.com` / `sindico123` | Acesso permitido | ⬜ |
| 11 | Endpoint tenants | `GET /api/tenants` (com token JWT) | Lista com pelo menos 1 tenant | ⬜ |
| 12 | Seletor visual | Dropdown "Condomínio:" aparece no cabeçalho | Exibe opções de condomínio | ⬜ |

---

## 📊 Verificar dados carregados (seed)

| # | Coleção | Quantidade mínima | Como verificar | Status |
|---|---------|------------------|----------------|--------|
| 13 | Moradores | ≥ 10 | `GET /api/moradores` com token | ⬜ |
| 14 | Visitantes | ≥ 5 | `GET /api/visitantes` com token | ⬜ |
| 15 | Veículos | ≥ 5 | `GET /api/veiculos` com token | ⬜ |
| 16 | Prestadores | ≥ 1 | `GET /api/prestadores` com token | ⬜ |
| 17 | Encomendas | ≥ 1 | `GET /api/encomendas` com token | ⬜ |
| 18 | Comunicados | ≥ 1 | `GET /portal/comunicados` com token | ⬜ |

---

## 🎬 Validar fluxos críticos

| # | Fluxo | Passos | Resultado esperado | Status |
|---|-------|--------|-------------------|--------|
| 19 | Pré-autorizar visitante | Portal morador → pré-autorizar → ver QR code | QR code gerado com sucesso | ⬜ |
| 20 | Check-in portaria | Portaria → validar QR → entrada registrada | Visitante aparece como "presente" | ⬜ |
| 21 | Reserva área comum | Portal morador → reservar salão → confirmar | Reserva aparece na lista | ⬜ |
| 22 | Alternar tenant | Selecionar outro condomínio no dropdown | Página recarrega com dados diferentes | ⬜ |

---

## 🧹 Limpeza pós-teste

| # | Ação | Como fazer | Status |
|---|------|------------|--------|
| 23 | Limpar dados de teste | Se adicionou dados manualmente, excluir `data/database.json` e reiniciar | ⬜ |
| 24 | Fechar abas desnecessárias | Navegador só com as telas da demo | ⬜ |
| 25 | Desativar notificações do SO | Modo "Não perturbe" ativado | ⬜ |
| 26 | Verificar projeção/tela compartilhada | Resolução e zoom adequados | ⬜ |

---

## 📅 Dia da apresentação

| # | Item | Observação |
|---|------|------------|
| 27 | Credenciais impressas ou em notas | Ter os 4 emails/senhas à mão |
| 28 | Roteiro aberto | `docs/ROTEIRO-DEMO.md` visível para consulta |
| 29 | Celular perto | Para demonstrar notificação WhatsApp (opcional) |
| 30 | Água e fôlego | Apresentação dura 5 minutos, vá com calma |

---

## 🚨 Se algo falhar (Plano de emergência)

| Problema | Ação imediata |
|----------|---------------|
| Servidor não sobe | Matar processo na porta 3000 e reiniciar `npm run dev` |
| Login não funcionar | Verificar se digitou email/senha exatos da tabela |
| Dados não aparecem | Recarregar página (F5) após selecionar tenant |
| Erro de tela | Ter o `docs/ROTEIRO-DEMO.md` como referência do que mostrar |

---

**✅ Demo aprovado quando:** todos os itens acima estão marcados e os 4 perfis de login funcionam.
