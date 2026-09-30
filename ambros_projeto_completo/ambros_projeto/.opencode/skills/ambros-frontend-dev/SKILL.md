---
name: ambros-frontend-dev
description: >-
  Padrões de desenvolvimento do frontend HTML/Bootstrap 5 do AMBROS (controle
  de acesso condominial). Use ao criar, editar ou revisar telas do sistema.
  Triggers: "tela do ambros", "frontend ambros", "novo html ambros", "dashboard
  ambros", "tela de moradores", "tela de portaria", "bootstrap ambros", "chart
  ambros", "sidebar ambros".
user-invocable: false
disable-model-invocation: false
progressive_disclosure:
  entry_point:
    summary: "Padrões de código do frontend HTML/Bootstrap 5/Chart.js do AMBROS."
    when_to_use:
      - "Ao criar ou editar arquivos .html em frontend/"
      - "Ao adicionar nova tela ou modal"
      - "Ao mexer em cards, tabelas, charts ou sidebar"
      - "Ao revisar UI/UX do sistema"
    quick_start:
      - "Siga o template de tela (estrutura fixa abaixo)"
      - "Use as variáveis CSS em :root para cores"
      - "Mantenha a sidebar/topbar idênticas entre telas"
      - "Para dados: fetch com Authorization Bearer no header"
---

# AMBROS — Frontend Development Skill

## Contexto do projeto

O frontend do AMBROS é composto por **páginas HTML estáticas** (sem build, sem
framework JS). Stack: **HTML + Bootstrap 5.3 + Bootstrap Icons 1.11 +
Font Awesome 6.5 + Chart.js 4.4** (tudo via CDN).

Estrutura atual:

```
frontend/
├── login.html              # tela de login (consome /auth/login)
├── ambros-dashboard.html   # dashboard (cards + 2 charts + 2 tabelas)
├── moradores.html          # listagem com busca, filtros, modal novo morador
└── portaria-entrada.html   # registro de entrada (morador/visitante)
```

## Convenções obrigatórias

### Estrutura fixa de toda tela

```html
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>AMBROS · <Nome da Tela></title>
  <link href="https://cdnjs.cloudflare.com/ajax/libs/bootstrap/5.3.3/css/bootstrap.min.css" rel="stylesheet">
  <link href="https://cdnjs.cloudflare.com/ajax/libs/bootstrap-icons/1.11.3/font/bootstrap-icons.min.css" rel="stylesheet">
  <link href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.2/css/all.min.css" rel="stylesheet">
  <!-- Se usar modais ou dropdown: incluir bundle JS -->
  <script src="https://cdnjs.cloudflare.com/ajax/libs/bootstrap/5.3.3/js/bootstrap.bundle.min.js" defer></script>
  <style>
    :root{
      --sidebar-bg:#1b2434; --sidebar-bg2:#141c29; --sidebar-hover:#243044;
      --brand-blue:#2f6bff; --text-muted:#8a93a6;
      --content-bg:#f4f6f9; --card-radius:12px;
    }
    /* ... estilos específicos da tela ... */
  </style>
</head>
<body>
  <div class="app">
    <aside class="sidebar" id="sidebar"><!-- idêntico em todas telas --></aside>
    <div class="overlay" id="overlay"></div>
    <div class="main">
      <header class="topbar"><!-- idêntico --></header>
      <main class="content"><!-- conteúdo específico --></main>
      <footer class="footer"><!-- idêntico --></footer>
    </div>
  </div>
  <script>/* JS específico */</script>
</body>
</html>
```

### Sidebar (comum a todas telas internas)

- Marca AMBROS com logo `fa-shield-halved` em gradiente.
- Perfil do usuário ("Portaria / Online").
- Menu Principal: Dashboard (ativo em dashboard.html).
- Submenus acolapsáveis: Cadastros, Portaria, Veículos, Relatórios,
  Configurações — cada um com `data-toggle` para `.subnav.open`.
- Footer da sidebar com versão (1.0.0).
- Em telas internas, marcar `.nav-item.active` na página atual.

### Topbar (comum)

- Burger (toggle mobile), `<span class="title">` com nome da tela,
  sino com badge de notificações, avatar com status online.
- Versão mobile: esconde `.tn/.th` do topuser e recolhe sidebar.

### Variáveis CSS (tags padrão)

| Variável | Valor | Uso |
|---|---|---|
| `--sidebar-bg` | `#1b2434` | Fundo da sidebar (topo) |
| `--sidebar-bg2` | `#141c29` | Fundo da sidebar (baixo) |
| `--sidebar-hover` | `#243044` | Hover do item |
| `--brand-blue` | `#2f6bff` | Cor da marca, botões, links |
| `--text-muted` | `#8a93a6` | Textos secundários |
| `--content-bg` | `#f4f6f9` | Fundo da área de conteúdo |
| `--card-radius` | `12px` | Cantos arredondados de cards/painéis |

### Cards de estatística (dashboard)

- `.stat` com `.row1` (ícone colorido + label + número + descrição).
- Ícones com fundo colorido: `.ico.blue/.green/.amber/.purple/.teal/.orange/.red/.sky`.
- Rodapé com link "Ver todos <i class='bi bi-arrow-right'>".

### Charts (Chart.js 4.4)

- Canvas dentro de `.chart-wrap` (height: 260px).
- Configuração padrão: `responsive:true, maintainAspectRatio:false`.
- Cores: entradas `#2f6bff`, saídas `#ef4444`, barras `#6ea3f5`.
- Sempre com `grid:{display:false}` no eixo X e `#{color:'#eef0f3'}` no Y.

### Tabelas

- `<thead>` com `th` em cinza (#9aa2b1), sem uppercase.
- `<tbody>` com bordas finas (`#f4f6f8`).
- Badges `.badge-in` (verde) para entrada, `.badge-out` (vermelho) para saída.
- Avatar inline `.avatar-i` (siglas do nome) — use iniciais, não emoji.

### Modais (Bootstrap modal)

- Use `bootstrap.bundle.min.js` (já no CDN).
- Modal padrão: `.modal-dialog.modal-lg` com header, body (form) e footer
  (Cancelar + Salvar). Botão Salvar com classe `btn-primary` (var
  `--brand-blue`).

### Responsividade

- Breakpoints: `1200px` (cards em 2 colunas, painéis em 1 coluna) e
  `768px` (sidebar vira drawer com overlay, cards em 1 coluna).
- **Sempre** testar a tela em mobile (viewport 375px) — clique no burger
  confirma que overlay abre e fecha.

### Integração com backend (importante)

- **Apenas `login.html` faz `fetch` real hoje.** As demais telas usam dados
  fixos (mock).
- Toda chamada nova deve enviar `Authorization: Bearer <token>` lido de
  `localStorage.getItem("ambros_token")` ou `sessionStorage`.
-瓠URL base: declarar no topo do `<script>` como
  `const API_BASE = "http://localhost:8000";` ( mesmo padrão de login.html).
- Em caso de 401, redirecionar para `login.html` (token expirado).
- Em caso de erro, exibir `.alert-erro` com mensagem do `data.detail`.

### Padrão de fetch

```js
const API_BASE = "http://localhost:8000";
function token() {
  return localStorage.getItem("ambros_token")
      || sessionStorage.getItem("ambros_token");
}
async function api(path, opts = {}) {
  const t = token();
  if (!t) { window.location.href = "login.html"; return; }
  const r = await fetch(`${API_BASE}${path}`, {
    ...opts,
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${t}`,
      ...(opts.headers || {}),
    },
  });
  if (r.status === 401) { window.location.href = "login.html"; return; }
  if (!r.ok) {
    const d = await r.json().catch(() => ({}));
    throw new Error(d.detail || `Erro ${r.status}`);
  }
  return r.status === 204 ? null : r.json();
}
```

### Navegação entre telas

- Itens da sidebar são `<div class="nav-item">` — converter para `<a href>`
  quando linkar entre páginas.
- Após login, redirect para `ambros-dashboard.html`.
- Logout (TODO): limpar `ambros_token` do storage e voltar para `login.html`.

## Checklist de PR

- [ ] Variáveis CSS em `:root` idênticas ao padrão
- [ ] Sidebar idêntica (marca, perfil, menus, footer)
- [ ] Topbar idêntica (burger, title, bell, topuser)
- [ ] Responsive testado em 375px e 1200px
- [ ] Dados dinâmicos via `api()` com Bearer token (não usar mocks novos)
- [ ] Em 401, redireciona para `login.html`
- [ ] Badges de entrada/saída seguem o padrão `.badge-in/.badge-out`
- [ ] Ícones de Bootstrap Icons ou Font Awesome (não usar emojis)
- [ ] `<title>` no formato "AMBROS · <Nome>"
