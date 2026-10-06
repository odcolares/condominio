# Plano: Responsividade Mobile + PC do Frontend AMBROS

## Contexto (auditoria concluída)

Frontend: HTML estático + CSS (Bootstrap 5.3) + JS, servido de `public/`. Layout sidebar-fixa (260px) com sidebar off-canvas mobile. Backend Python/FastAPI não é afetado.

**Páginas com layout de sidebar:** `ambros-dashboard.html` + 10 páginas de conteúdo (`encomendas`, `visitantes`, `prestadores`, `reservas`, `ocorrencias`, `moradores`, `veiculos`, `portal-morador`, `portaria-entrada`, `auditoria`, `usuarios`). `login.html` e `index.html` são páginas fixas responsivas (OK).

### Achados — responsividade atual
1. **Quebra crítica (mobile):** não existe botão "burger" em nenhuma página.
   - `ambros-layout.css:500-505` tem `.topbar .burger { display:none !important }` — esconde qualquer burger.
   - `ambros-layout.js:581-586` (`initLayout`) remove elementos `.burger` do topbar.
   - `ambros-dashboard.html:368-370` topbar = apenas `title` (burger ausente; `.right` hidden).
   - Páginas de conteúdo: inline JS faz `getElementById('burger')?.addEventListener(...)` → burger inexistente → **sidebar nunca abre no mobile**.
   - Media query `@media(max-width:768px){ .sidebar{transform:translateX(-100%)} }` esconde a sidebar, mas **não há gatilho para revelá‑la**. Navegação mobile completamente quebrada.
2. **Dashboard (ChatGPT style):** o `collapse-btn` está DENTRO da sidebar (offline no mobile) → sem gatilho mobile.
3. **Dashboard tabelas sem scroll:** `ambros-dashboard.html:497` e `:507` — `<table>` solto (5 e 6 colunas) dentro de `.panel`, sem `table-responsive` → overflow horizontal no mobile.
4. **Topbar `.right` (botões ação) transborda no mobile:** ex. `encomendas.html:410` (`min-width:300px` + botões) e `visitantes.html:352` / `veiculos.html:372` → botões empilham/fora da tela em ≤375px.
5. **Media queries duplicadas:** bloco `@media(max-width:768px)` (sidebar/overlay/main) repetido em 11 páginas; difere apenas em detalhes (`encomendas`/`auditoria` escondem `.topuser`; `dashboard` colapsa `.cards-grid`→1col e `.footer`).
6. **`ambros-layout.css` NÃO contém breakpoints** — confia nas páginas.
7. **Touch targets:** `btn-sm` (~30px) e `btn-eye` (30px) abaixo de 44px (WCAG) — polish, não crítico.

### Pontos positivos (manter)
- `<meta viewport>` presente em todas as páginas.
- `stats-grid` usa `repeat(auto-fit, minmax(220px,1fr))` (auto-ajusta).
- Tabelas de conteúdo já embrulhadas em `.table-responsive` (exceto dashboard:497/507).
- `@media(max-width:1200px)` dashboard cards→2col e `@media(max-width:768px)`→1col.
- `portaria-entrada.html` colapsa `.grid`→1col @992px.
- `login.html`/`index.html` responsivos.

### Validação existente (não frontend)
- `package.json`: `npm run build` (`tsc`) e `npm test` (`vitest run`). Frontend é estático — não compilado. Mudanças em `public/` não afetam `tsc`/`vitest`; validar responsividade é manual (dev-tools device toggle).

---

## Decisões

- **D1 — Gatilho mobile centralizado:** injetar o burger em `ambros-layout.js` (`initLayout`) dentro de `.topbar` para TODAS as páginas; esconder no desktop (≥768px) e mostrar no mobile (≤767px) via `ambros-layout.css`. Handler único no JS compartilhado (elimina dupla-inscrição).
- **D2 — CSS compartilhado responsivo:** mover o bloco mobile comum (`sidebar translateX(-100%)`, `.show`, `.main{margin-left:0}`, `.overlay.show`) para `ambros-layout.css`; substituir `display:none !important` do burger por display responsivo.
- **D3 — Dashboard:** o burger injetado cobre o mobile (topbar minimal permanece no desktop).
- **D4 — `.right` mobile:** esconder botões secundários no mobile (`d-none d-md-inline-flex`), manter ação primária. Dashboard mantém `.right` hidden (intencional — minimal).
- **D5 — Tabelas:** embrulhar dashboard:497 e :507 em `.table-responsive`.
- **D6 — Breakpoints:** 768px (sidebar off-canvas + burger + cards 1col + padding 16px); 1200px (cards-grid 2col — já no dashboard).
- **D7 — Fora de escopo:** consolidação total do CSS inline de 11 páginas em `ambros-layout.css` (refatoração grande, esforço separado). O plano centraliza apenas as rules mobile; CSS inline permanece.
- **D8 — Touch targets 44px:** polish opcional, incluído como tarefa de baixa prioridade.

---

## Tarefas (ordem)

### 1. `public/ambros-layout.js` — burger mobile + toggle (crítica)
- Em `initLayout()`, após o passo "Clean topbar" (onde os `.burger` são removidos), **injetar** um burger em cada `.topbar` (se ausente):
  ```js
  const topbar = document.querySelector(".topbar");
  if (topbar && !topbar.querySelector(".burger")) {
    const burger = document.createElement("button");
    burger.className = "burger";
    burger.id = "burger";
    burger.type = "button";
    burger.setAttribute("aria-label", "Abrir menu");
    burger.innerHTML = '<i class="bi bi-list"></i>';
    topbar.insertBefore(burger, topbar.firstChild);
    burger.addEventListener("click", () => {
      const s = document.getElementById("sidebar");
      const o = document.getElementById("overlay");
      if (s) s.classList.toggle("show");
      if (o) o.classList.toggle("show");
    });
  }
  ```
- Garantir injetar **antes** de `.right`/*.title para ordem visual `[burger][title][right]`.
- Remover (ou marcar obsoletas) as listeners inline de 11 páginas (ver Tarefa 4) — com o burger injetado pelo shared JS, os listeners inline anexam a `null` (timing DOMContentLoaded) e são dead-code; remover evita risco de dupla-toggle.

### 2. `public/ambros-layout.css` — rules responsivas compartilhadas (crítica)
- Substituir bloco `/* Hide all old clutter from the topbar */` (linhas 499-505):
  ```css
  /* Burger: escondido no desktop, visível no mobile */
  .topbar .burger {
    display: none;
    background: none;
    border: none;
    font-size: 20px;
    color: #555;
    cursor: pointer;
    margin-right: 16px;
    padding: 6px;
    border-radius: 6px;
    display: none; /* base: hidden */
  }
  @media (max-width: 767px) {
    .topbar .burger { display: inline-flex; align-items: center; justify-content: center; }
  }
  ```
  (Manter `.topbar .right`, `.topuser`, `.bell` escondidos apenas se inutilizados; o dashboard já tem `.right` hidden via markup.)
- Acrescentar ao final do ficheiro o bloco mobile comum (consolidado):
  ```css
  @media (max-width: 767px) {
    .sidebar { transform: translateX(-100%); }
    .sidebar.show { transform: translateX(0); }
    .main { margin-left: 0 !important; }
    .content { padding: 16px; }
    .overlay.show { display: block; }
    .cards-grid { grid-template-columns: 1fr; }
  }
  ```
- `min-width:0` já em `.main`/`.user-info` (evita overflow texto). Confirmar preservado.

### 3. `public/ambros-dashboard.html` — tabelas + mobile
- [3a] Linha 497: envolver `<table>` em `<div class="table-responsive">...</div>`.
- [3b] Linha 507: idem.
- [3c] O burger do shared JS já cobre o mobile; remover `@media(max-width:768px){...}` duplicado das linhas 204-211 (mantém apenas `.footer` mobile se necessário) — **opcional** para evitar duplicidade. Recomendar: deixar página manter `.cards-grid`/`.footer` mobile e REMOVER apenas as 4 linhas duplicadas de sidebar/overlay/main (`205-207, 209`), confiando no shared CSS.

### 4. Páginas de conteúdo — dedup JS burger + `.right` mobile (11 arquivos)
Para cada uma de: `encomendas, visitantes, prestadores, resem, ocorrencias, moradores, veiculos, portal-morador, portaria-entrada, auditoria, usuarios`:
- Remover/bloco inline de burger listener:
  ```js
  var sidebar=document.getElementById('sidebar'), overlay=document.getElementById('overlay');
  document.getElementById('burger')?.addEventListener('click',function(){
    sidebar.classList.toggle('show'); overlay?.classList.toggle('show');
  });
  overlay?.addEventListener('click',function(){
    sidebar.classList.remove('show'); overlay.classList.remove('show');
  });
  ```
  (o overlay-click pode permanecer se não estiver no shared JS; mas como `overlay.show` ja tem `.overlay.show{display:block}`, manter um listener global seria mais DRY — ver nota). Na prática, remover blocos `sidebar`/`burger` inline; o shared JS trata o burger.
- `.right` mobile: adicionar `d-none d-md-inline-flex` nos botões secundários de cada topbar `.right`, mantendo o primário (ex.: `+ Nova Encomenda`). Exceções páginas já responsivas (se houver 1 só botão, manter).
- Remover bloco `@media(max-width:768px){ .sidebar{...}.overlay.show{...} }` duplicado (4-5 linhas) — confiar no shared CSS (Tarefa 2). Manter apenas overrides específicos (ex.: `.topuser` em encomendas/auditoria — irrelevante, pode remover; `.cards-grid`/`.footer` apenas no dashboard).

> **Nota (opcional DRY):** mover o `overlay` click-close para `ambros-layout.js` (listener global em `#overlay`) e remover o inline de todas as páginas. Incluir como tarefa 4b baixa prioridade.

### 5. Tabelas em mobile (tabelas >4 colunas)
- Confirmar `table-responsive` em todas as páginas de conteúdo (já presente: encomendas, auditoria, moradores, ocorrencias, prestadores, reservas, usuarios, veiculos, visitantes). Apenas dashboard:497/507 (Tarefa 3).
- Nenhuma outra tabela larga detectada.

### 6. Toques mobile (low priority / polish)
- [6a] `btn-sm` primários em telas de formulário: garantir `min-height:44px` via utilitário shared ou trocar para `btn` padrão. Opcional.
- [6b] `portaria-entrada`: confirmar inputs de placa/vaga/vaga — textarea `fObs` ocupa 100%, OK. `.grid` colapsa @992px ✓.

---

## Riscos / Limites
- **Timing JS:** burger injetado no `DOMContentLoaded`; listeners inline de página anexam a `null` (no-op). Remover inline listeners (T4) elimina risco de dupla-execução e confusão.
- **Dashboard minimal topbar:** `.right` hidden via markup `display:none` (não via classe) — não conflitará com burger.
- **`!important` herdado:** shared CSS usa `!important` em várias rules; garantir burger não usar `!important` para deixar override per-page fácil — usar specificity normal.
- **Sem build frontend:** `npm run build`/`npm test` não validam CSS. Não há linter CSS configurado. Validação é manual.
- **Consistência visual:** páginas mantêm CSS inline duplicado — risco teor de drift. Mitigado centralizando mobile core; full-consolidation fora de escopo.

## Migração / Rollout
- Mudanças apenas em `public/` (frontend estático). Sem migrations, sem API.
- Ordem: shared JS/CSS (T1,T2) → dashboard tables (T3) → páginas conteúdo (T4) → polish (T6).
- Deploy estático: recarregar navegador (cache bust recomendado se houver service worker — não detectado).

## Validação
- Desktop ≥1024px: sidebar fixa 260px, collapse-btn funciona, topbar direto ao conteúdo, tabelas inline.
- Tablet 768-1023px: sidebar fixa (desktop), `.right` botões visíveis, cards 1col (dashboard) / auto-fit (páginas).
- Mobile ≤767px: **burger visível**, clique abre sidebar + overlay, clique overlay/esc/fechar → sidebar some; `.main` margem 0; `.right` secundário oculto (primário visível); tables `table-responsive` scroll horizontal; `content` padding 16px.
- Navegar: dashboard → abrir burger → clicar `Visitantes`/`Encomendas` → burger continua funcionando (shared JS).
- Comandos CI (garantir sem regressão TS): `npm run build` e `npm test` — sem alterações em `server/`/, mas rodar para confirmar.
- Manual: Chrome dev-tools device toggle (iPhone SE 375px, Pixel 360px, iPad 768, desktop 1366) percorrendo ≥3 páginas.

---

## Referências de arquivo
- `public/ambros-layout.css` — shared styles; **sem breakpoints** (auditar).
- `public/ambros-layout.js:77-87,580-606` — `toggleSidebarCollapse` (desktop) e `initLayout` (topstrip burger removal a refatorar).
- `public/ambros-dashboard.html:364,368-370,497,507,204-211` — overlay, topbar minimal, tabelas soltas, media query.
- Páginas: burger JS inline + `.right` — `encomendas.html:317,410,793-799`; `visitantes.html:295,352`; `moradores.html:274,93`; `veiculos.html:307,372`; `prestadores.html:299`; `reservas.html:276`; `ocorrencias.html:297`; `portal-morador.html:271,455-464`; `portaria-entrada.html:285`; `auditoria.html:318,492-501`; `usuarios.html:297,506-513`.
