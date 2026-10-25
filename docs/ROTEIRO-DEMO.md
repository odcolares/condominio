# 🎬 ROTEIRO-DEMO.md — Script de Apresentação (5 minutos)

> **Objetivo:** Roteiro pronto para apresentação comercial a síndicos, administradoras e condomínios.
> **Público:** Tomadores de decisão (não técnicos).
> **Duração:** 5 minutos.

---

## 👥 Perfis de acesso usados na demo

| Perfil | Email | Senha | O que faz na apresentação |
|--------|-------|-------|---------------------------|
| Morador | `carlos@ambros.com` | `morador123` | Pré-autoriza visitante, reserva área, vê encomendas |
| Porteiro | `portaria@ambros.com` | `portaria123` | Faz check-in/check-out de visitantes |
| Administrador | `admin@ambros.com` | `admin123` | Dashboard, cadastro de moradores e prestadores |
| Síndico | `sindico@ambros.com` | `sindico123` | Visão gerencial, restrições, ocorrências |

---

## ⏱️ Cronograma (5 minutos)

| Tempo | Ação | Tela | O que dizer (script) |
|-------|------|------|---------------------|
| **0:00–0:30** | Login como morador | `/login.html` | "Bom dia. Este é o portal de acesso do morador Carlos Lima. Login com JWT, seguro e rápido." |
| **0:30–1:00** | Dashboard com métricas | `/ambros-dashboard.html` | "Aqui temos a visão geral: acessos de hoje, visitantes presentes, encomendas pendentes e alertas da portaria." |
| **1:00–2:00** | Pré-autorizar visitante | `/portal-morador.html` | "O morador pode pré-autorizar uma visita. Gera um QR code único, define data e observaçãp. O visitante recebe o acesso automaticamente." |
| **2:00–3:00** | Check-in na portaria | `/portaria-entrada.html` | "Na portaria, o porteiro valida o QR code do visitante, registra a entrada e o morador é notificado instantânea via WhatsApp/Telegram." |
| **3:00–4:00** | Reservar área comum | `/reservas.html` | "O morador reserva o salão de festas ou churrasqueira. O sistema bloqueia o horário para evitar conflitos com outros moradores." |
| **4:00–4:45** | Alternar condomínio | Seletor "Condomínio:" | "Este é um sistema multi-tenant. Mesmo rodando em uma única instância, os dados de cada condomínio estão completamente isolados. Veja: trocamos de condomínio e os dados mudam totalmente." |
| **4:45–5:00** | Encerramento | Qualquer tela | "Quer ver o sistema rodando no seu condomínio? Agende uma apresentação personalizada." |

---

## 🎯 Fluxos principais para demonstrar

### Fluxo A — Visitante (o mais impactante)

1. Login como **morador** (`carlos@ambros.com` / `morador123`)
2. Acessar **Portal do Morador** → Pré-autorizar visitante
3. Preencher nome, documento, placa do veículo, data prevista
4. Sistema gera **QR code** (ex: `QR-7104`)
5. Login como **porteiro** (`portaria@ambros.com` / `portaria123`)
6. Acessar **Portaria Entrada** → Validar QR code
7. Check-in registrado, morador notificado via WhatsApp

### Fluxo B — Reserva de Área Comum

1. Login como **morador**
2. Acessar **Reservas**
3. Selecionar espaço (Salão de Festas / Churrasqueira / Quadra / Coworking)
4. Escolher data e período
5. Sistema confirma ou bloqueia se houver conflito de horário

### Fluxo C — Multi-tenant (o diferencial técnico)

1. No cabeçalho, clicar no seletor **"Condomínio:"**
2. Escolher outro condomínio da lista
3. Página recarrega com dados completamente diferentes
4. Explicar: "mesma instância, dados isolados por cliente"

---

## ⚠️ O que NÃO fazer durante a demo

| Não faça | Por quê |
|----------|---------|
| Não mexer no código-fonte | A demo deve ser estável |
| Não excluir dados do banco | Pode quebrar o fluxo |
| Não tentar fazer deploy ao vivo | Foque na apresentação local |
| Não logar como admin se for mostrar morador | Cada perfil tem tela diferente |

---

## 🆘 Plano B (se algo der errado)

| Situação | Solução rápida |
|----------|---------------|
| Servidor não sobe | Verificar porta 3000 livre (`netstat -ano \| findstr :3000`) |
| Login não funciona | Verificar se usou email/senha corretos da tabela acima |
| Página não carrega dados | Recarregar a página (F5) após selecionar o tenant |
| Erro de CORS | O servidor já inclui `cors()`, raramente ocorre |
| Dados não aparecem | Reiniciar o servidor (`Ctrl+C`, depois `npm run dev`) |

---

## 📞 Após a demo

- Disponibilizar acesso de teste por 7 dias
- Enviar proposta comercial com planos por porte do condomínio
- Agendar treinamento para porteiros e síndicos
- Contato comercial: whatsapp (92) 99512-9901
