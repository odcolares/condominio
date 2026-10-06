# AMBROS — Manual de Operação (Como Usar)

Guia passo a passo para usar cada funcionalidade do AMBROS. Acesse o sistema em `https://condominio-ambros.onrender.com`.

---

## 🔐 Login
1. Abra a página de login (`public/login.html`)
2. Use as credenciais de demonstração: **adm@adm.com** / **123**
3. Após login, você será redirecionado ao dashboard (`public/index.html`)

> **Nota:** em produção, o administrador cria os usuários via API (`POST /api/auth/register`).

---

## 🏠 Moradores
**Página:** `public/moradores.html`

**Cadastrar morador:**
1. Clique em **"Novo Morador"**
2. Preencha: nome, CPF, telefone, **WhatsApp**, **Telegram** (username opcional, ex: `@carlos`)
3. Preencha **bloco** e **apartamento** — campos obrigatórios
4. Salve — o sistema valida que pelo menos um contato (WhatsApp, Telegram ou telefone) foi informado
5. O sistema vincula automaticamente aos veículos desse morador

**Editar/Excluir:**
- Use os botões **Editar** e **Excluir** na linha do morador
- Ao excluir, os veículos vinculados são removidos automaticamente

**Veículos (mesma página):**
- Cadastre placas, modelo e vaga vinculados ao morador
- Indicadores na parte superior mostram: total de veículos, vagas ocupadas, veículos sem morador

---

## 🚪 Visitantes
**Página:** `public/visitantes.html`

**Cadastrar visitante:**
1. Preencha: nome, CPF ou documento, telefone, placa do veículo
2. Salve — o sistema gera o QR Code de pré-autorização (`QR-XXXX`)
3. O visitante pode apresentar o QR Code na portaria para entrada rápida

**Registro de entrada/saída:**
- A portaria registra entrada e saída manualmente ou via scanner do QR Code
- O sistema mostra presença em tempo real e sinaliza se excedeu 24h

**Notificações ao morador visitado:**
- Ao registrar entrada e saída de um visitante, o sistema gera links de **WhatsApp** e **Telegram**
- Clique nos ícones de notificação na coluna "Ações" da lista de visitantes
- O link abre o app do morador com a mensagem do agio (formato `tmplVisita` / `tmplVisitaSaida`)

---

## 🛠️ Prestadores
**Página:** `public/prestadores.html`

**Cadastrar prestador:**
1. Preencha: nome, documento, função, empresa, placa do veículo
2. Defina o `prazo_dias` (validade do acesso) ou data fim
3. Salve — o sistema controla a validade e sinaliza expiração

**Controle de entrada/saída:**
- Registre presença na portaria
- Acesso bloqueado após expirar (sinalizado como `expirado`)

**Notificações ao morador autorizador:**
- Na tabela de prestadores, os botões de WhatsApp e Telegram notificam o morador responsável
- Mensagens diferentes conforme a ação: `registrado`, `entrou`, `saiu`

---

## ⏱️ Duração de Acesso (Visão Geral)
**Página:** `public/index.html` (dashboard) e `public/auditoria.html`

- Cada registro de entrada calcula automaticamente `duracao_minutos` quando há saída
- Visitantes: janela de 24h a partir da entrada
- Prestadores: validade conforme `prazo_dias`
- Filtre por pessoa, placa, data e sentido (entrada/saída)

---

## 📦 Encomendas
**Página:** `public/encomendas.html`

**Registrar encomenda:**
1. Selecione o morador destinatário
2. Descreva a encomenda (remetente, tipo, observações)
3. O sistema gera o código `RET-XXXX`
4. O morador recebe notificação automática (WhatsApp/Telegram)

**Retirada:**
- O morador apresenta o código `RET-XXXX` na portaria
- Registre a retirada com confirmação do código

**Notificações ao morador:**
- Ao cadastrar uma encomenda, o sistema gera links de **WhatsApp** e **Telegram**
- Clique em "Avisar no WhatsApp" ou "Avisar no Telegram" na linha da encomenda
- O link abre o app correspondente com a mensagem pré-preenchida (inclui código RET-XXXX)
- O campo `morador_telegram` é propagado automaticamente do cadastro do morador

---

## 📅 Reservas
**Página:** `public/reservas.html`

**Nova reserva:**
1. Selecione o espaço (área comum, salão, churrasqueira, etc.)
2. Escolha data e horário de início/fim
3. O sistema impede conflitos de horário
4. Salve — o morador recebe confirmação

**Alterar status:**
- Mude o status da reserva (confirmada, cancelada, concluída)
- Notificação automática ao morador

**Notificações ao morador:**
- Na tabela de reservas, os botões de WhatsApp e Telegram enviam o aviso da reserva
- A mensagem inclui espaço, data, período e status (confirmada/cancelada)

---

## ⚠️ Ocorrências
**Página:** `public/ocorrencias.html`

**Registrar ocorrência:**
1. Selecione categoria, gravidade e descreva o incidente
2. Atribua um status (aberta, em tratamento, resolvida)
3. Feche com data de resolução

**Notificações ao morador envolvido:**
- Na tabela de ocorrências, os botões de WhatsApp e Telegram notificam o morador da unidade
- A mensagem inclui título, gravidade, status e unidade

**Restrições de acesso:**
- Cadastre CPF ou placa proibida na portaria
- O sistema bloqueia a entrada automaticamente

---

## 📢 Comunicação (Comunicados)
**Página:** `public/index.html` ou módulo de comunicados

- Crie comunicados para todos os moradores
- Envie notificações diretas a moradores específicos

---

## 🏢 Operação de Portaria
**Página:** `public/portaria-entrada.html`

**Fluxo de entrada:**
1. Abordagem do visitante/prestador
2. Scan do QR Code ou busca por nome/CPF
3. Verificação de restrições (bloqueio ativo?)
4. Registro de entrada com horário

**Fluxo de saída:**
1. Identificação da pessoa/veículo
2. Registro de saída (calcula duração automática)

**Consultas rápidas:**
- Buscar visitante/prestador por nome ou placa
- Ver lista de restrições ativas

---

## 📊 Portal do Morador
**Página:** `public/portal-morador.html`

- **Encomendas:** códigos RET-XXXX e status
- **Pré-autorizações:** QR Codes de visitantes
- **Reservas:** espaços reservados e status
- **Comunicados:** avisos do condomínio
- **Dashboard:** indicadores e gráficos de movimentação

---

## 📈 Dashboard
**Página:** `public/index.html`

Visão consolidada com:
- Cards de indicadores (moradores, veículos, visitantes no condomínio)
- Gráficos de movimentação de acessos
- Alertas de acessos expirados ou restrições ativas

---

## 🔧 Manutenção e Configuração

**Variáveis de ambiente (Render):**
- `SECRET_KEY` — chave secreta JWT (gerada automaticamente no deploy)
- `ACCESS_TOKEN_EXPIRE_MINUTES=480` — expiração do token (8h)

**Health check:**
- `GET /api/health` retorna `{"app":"AMBROS","status":"ok"}`

**Cold start no free tier:**
- Primeira requisição pode levar 30–60s (Render adormece e reinicia)

---

> **Dúvidas?** Consulte o **Manual de Funcionalidades** (MANUAL-V1-FUNCIONALIDADES.md) para o panorama completo do que o AMBROS oferece.
