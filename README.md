# AMBROS — Workspace

> **Este diretório é apenas o workspace raiz.** O projeto real está em
> `ambros_projeto_completo/ambros_projeto/`.

## O que aconteceu com os arquivos soltos

Em 22/07/2026 os arquivos `AMBROS_Controle_de_Acesso.md` e
`ambros-dashboard.html` que ficavam na raiz foram **reorganizados** dentro do
projeto:

| Antigo (raiz) | Novo local | Motivo |
|---|---|---|
| `AMBROS_Controle_de_Acesso.md` | `ambros_projeto/docs/AMBROS_Controle_de_Acesso.md` | Spec original — faz parte da documentação do projeto |
| `ambros-dashboard.html` | Já existe em `ambros_projeto/frontend/ambros-dashboard.html` (versão **mais recente**, com navgação entre telas via `<a href>`) | A cópia da raiz era o mockup antigo sem links; a versão do `frontend/` é a oficial |

## Onde encontrar tudo

```
Ambros/
└── ambros_projeto_completo/
    └── ambros_projeto/               # ← projeto real
        ├── README.md                 # visão geral
        ├── CHANGELOG.md              # histórico de alterações
        ├── DESENVOLVIMENTO.md        # documento técnico
        ├── docs/                     # specs e referências
        │   └── AMBROS_Controle_de_Acesso.md
        ├── .opencode/skills/         # 5 skills de agentes
        ├── backend/                   # FastAPI + SQLAlchemy
        └── frontend/                  # HTML + Bootstrap 5 + Chart.js
```

## Como rodar o projeto

Veja `ambros_projeto_completo/ambros_projeto/README.md` para instruções
completas (backend + frontend + seed).
