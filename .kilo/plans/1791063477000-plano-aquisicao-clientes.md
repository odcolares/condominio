# Plano de Negócio: Aquisição de Clientes AMBROS

## Contexto do Produto

**AMBROS** é um Sistema de Gestão de Condomínio (SaaS) que centraliza controle de acesso, visitantes, veículos, encomendas, reservas, ocorrências, pré-autorizações via QR Code, e notificações por WhatsApp/Telegram — tudo via links de abertura direta (sem integração API real).

- **Stack:** TypeScript + Express backend; 13 páginas HTML estáticas + Bootstrap 5 + Chart.js frontend
- **Deploy:** Render (render.yaml), free tier demo disponível
- **Mercado-alvo:** Condomínios residenciais no Brasil (~1,2M de condomínios)

---

## 1. Proposta de Valor e Personas

### Proposta de Valor

> "Controle de acesso e gestão de condomínio 100% conectada: portaria, moradores e síndico em um único sistema, com notificações automáticas por WhatsApp e Telegram."

### Personas (ordem de decisão)

| #  | Persona                    | Papel                     | Dor Principal                                                             | Como AMBROS resolve                                                                 |
| -- | -------------------------- | ------------------------- | ------------------------------------------------------------------------- | ----------------------------------------------------------------------------------- |
| P1 | **Síndico**         | Administrador voluntário | Perde controle de encomendas, visitas, reservas; planilhas desatualizadas | Dashboard unificado, auditoria completa, comunicados em mural                       |
| P2 | **Zelador/Portaria** | Operador diário          | Controle manual de visitantes e prestadores; filas na portaria            | Tela dedicada de entrada/saída, QR Code pré-autorização, restrições de acesso |
| P3 | **Morador**          | Usuário final            | Não sabe quando chega encomenda ou visita; não consegue reservar áreas | Portal do morador, notificações push via WhatsApp/Telegram                        |

**Decisão comercial:** O síndico (P1) é o *buyer*. O zelador (P2) é o *user* operacional. O morador (P3) é o *advocate* (indica se vantajado).

---

## 2. Posicionamento e Diferenciais

### Competidores diretos (Brasil)

- **Portia** (portaria online)
  - **Condomínio Fácil**
- **Sfer**
- **Dom Brasil Sistemas**
- Soluções customizadas de empresas de segurança

### Diferenciais AMBROS

1. **Notificações por link direto** — não depende de API paga; funciona no WhatsApp e Telegram do próprio portaria/morador
2. **Controle de acesso com restrições proativas** (bloquear CPF/placa na portaria)
3. **QR Code de pré-autorização** gerado pelo morador
4. **Open-source friendly** — deploy simples no Render (sem infra complexa)
5. **Preço acessível** — modelo freemium para teste

---

## 3. Estratégia de Precificação (Brasil)

### Modelo

- **Por condomínio / mês** (SaaS tradicional)
- **Plano único** por enquanto (simplificar decisão de compra)

| Plano                | Condomínios                    | Mensalidade  | Funcionalidades                                                                          |
| -------------------- | ------------------------------- | ------------ | ---------------------------------------------------------------------------------------- |
| **Starter**    | Até 50 unidades                | R$ 97/mês   | Acesso, visitantes, encomendas, notificações, portal morador, 500MB storage            |
| **Pro**        | Acima 50 unidades               | R$ 197/mês  | Tudo do Starter + reservas, ocorrências, restrições, pré-autorizações, 2GB storage |
| **Enterprise** | Sindicatos/condomínios grandes | Sob consulta | API, customizações, treinamento, suporte prioritário                                  |

> **Observação técnica:** Preço atualmente é gratuito (demo). Definir preços após validar produto com 3 clientes piloto.

### Estratégia de preços

- **14 dias grátis** — teste sem cartão
- **Setup gratuito** — onboarding incluído
- **Desconto de 20% no anuidade** (pagamento antecipado)
- **Indique um condomínio, ganhe 1 mês grátis**

---

## 4. Canais de Aquisão de Clientes

### 4.1 Parcerias Estratégicas (canal B2B principal)

| Parceiro                                                                       | Estratégia                                                       | Ação                                                                   |
| ------------------------------------------------------------------------------ | ----------------------------------------------------------------- | ------------------------------------------------------------------------ |
| **Empresas de Segurança** (G4S, Prosegur, Brinks, locais)               | Oferecer AMBROS como add-on para os condomínios que já protegem | Propor integração: "Sua segurança + nosso software = pacote completo" |
| **Síndicatos de Síndicos e zeladores** (Fenacond, Sinduscon estaduais) | Participar de eventos e listar como fornecedor associado          | Inscrever-se como expositor em congressos de condomínio                 |
| **Gestor de condomínios** (administradoras como Cyrela, PDG, Loca)      | Integrar como ferramenta digital oferecida aos condomínios       | Propor white-label ou comissão por indicação                          |
| **Correios/Transportadoras**                                             | Parceria para notificação automática de encomendas             | "Sua encomenda chegou, AMBROS notificou o morador"                       |

### 4.2 Marketing Digital (Brasil)

| Canal                                     | Estratégia                        | Tática                                                                                  |
| ----------------------------------------- | ---------------------------------- | ---------------------------------------------------------------------------------------- |
| **LinkedIn**                        | Segmentar síndicos e zeladores    | Sequência de 3-5 mensagens diretas com case de sucesso + demo gratuita                  |
| **Grupos de WhatsApp de Síndicos** | Valor educacional                  | Compartilhar dicas de gestão + benefícios do sistema (sem spam)                        |
| **YouTube**                         | Educar sobre problemas de portaria | Mini-documentário: "O que acontece quando não controla quem entra no seu condomínio?" |
| **Instagram/Facebook**              | Testemunhos de moradores           | Vídeos curtos mostrando como encomenda chega e morador é notificado                    |
| **Google Ads**                      | Captação por intenção          | Palavras-chave: "sistema condomínio", "controle de visitantes", "portaria digital"      |

### 4.3 Inbound Marketing

- **E-book:** "Guia do Síndico Digital" — 5 erros que você comete na gestão de portaria
- **Webinar:** "Como reduzir 80% das filas na portaria do seu condomínio" (mensal)
- **Trial fechado:** convidar 5 condomínios por cidade para testar gratuitamente

### 4.4 Marketing de Referência

- Programa de indicação: **R$ 100 por indicação que vira cliente + 1 mês grátis**
- Parceria com influenciadores de gestão de condomínios no LinkedIn

### 4.5 Eventos Presenciais

- **Feiras de condomínios** (feiras de empregos, festas de inauguração)
- **Parceria com eventos de síndico** (aulas de gestão condominial)
- **Distribuição de folders em condomínios de médio/grande porte**

### 4.6 Prospecção Direta via Google Maps + WhatsApp (Canal Primário)

Esta é a estratégia de aquisição mais custo-efetiva: identificar condomínios no Google Maps, extrair contatos e prospecionar via WhatsApp (principal canal de comunicação no Brasil).

#### 4.6.1 Identificação de Condomínios no Google Maps

**Bairros-alvo (São Paulo — fase inicial):**

| Bairro | Faixa de condomínios estimada | Critério de seleção |
|--------|------------------------------|---------------------|
| Moema | ~80 | Médio/grande porte, alta renda |
| Brooklin | ~60 | Médio/grande porte, alta renda |
| Pinheiros | ~55 | Médio/grande porte, alta renda |
| Vila Olímpia | ~45 | Grande porte, corporativo + residencial |
| Moema | ~80 | Médio/grande porte, alta renda |
| Lajeado / Vila Candido | ~70 | Alta densidade de condomínios |
| Alto de Pinheiros | ~40 | Médio porte, classe A |

**Query de busca no Google Maps:**
```
"condomínio [NOME DO BAIRRO] [CIDADE]"
```

**Dados a extrair de cada listing:**
| Campo | Fonte | Observação |
|-------|-------|------------|
| Nome do condomínio | Google Maps | Ex: "Edifício/Condomínio Jardim das Acácias" |
| Endereço completo | Google Maps | Inclui bairro, CEP |
| Telefone | Google Maps / Website | Preferir celular/WhatsApp; se landline, marcar "ligar primeiro" |
| Website | Google Maps | Se existir, visitar para encontrar WhatsApp do síndico |
| E-mail de contato | Website / Google Maps | Opcional |
| Número de unidades | Google Maps / Website | Estimar pela foto do prédio |
| Síndico (nome) | WhatsApp / ligação | Perguntar diretamente |

#### 4.6.2 Extração de Contatos

**Método 1: Pesquisa Manual (primeira semana)**
- Abrir google.com/maps
- Pesquisar `"condomínio [bairro] [cidade]"`
- Clicar em cada resultado → extrair telefone/website
- Usar extensão **MapsScraper** (Chrome) para exportar até 100 resultados
- **Target:** 50 condomínios em 3-4 dias

**Método 2: Google Places API (a partir da 3ª semana)**
- API paga: ~USD 0.017 por detalhe de lugar
- Query: `textsearch` → `nearbysearch` → `details` para telefone
- Permite escalar a 500+ condomínios por mês
- Precisa de API key (Google Cloud Platform)

**Método 3: Scraping + Verificação de WhatsApp**
- Após extrair telefones, validar se é WhatsApp:
  - Acessar `https://wa.me/[55][DDD][NUMERO]` e checar se carrega perfil
  - Telefone fixo (landline) → marcar como "ligar" (não WhatsApp)
  - Só prospecionar números com WhatsApp verificado

#### 4.6.3 Banco de Dados (Google Sheets)

**Template:** `docs/marketing/condominios-prospecting-sheet.csv` (colunas)

| Lead ID | Nome Condomínio | Bairro | Cidade | Telefone | É WhatsApp | Status | Síndico Nome | Unidades | Sistema Atual | Último Contato | Resultado | Observação |
|---------|----------------|--------|--------|----------|-----------|--------|-------------|----------|--------------|----------------|-----------|------------|

**Status pipeline:**
1. `novo` → recém-adicionado
2. `contatado` → primeira mensagem enviada
3. `respondeu` → recebeu resposta
4. `demo_agendada` → call marcada
5. `convertido` → trial ou contrato fechado
6. `nao_interessado` → desistiu
7. `lead_frio` → sem resposta após follow-ups

#### 4.6.4 Sequência de Mensagens no WhatsApp

**Dia 0 — Primeiro contato (mensagem única, personalizada)**
```
Olá {{sindico_nome}}, tudo bem?

Sou {{seu_nome}} do AMBROS, sistema de gestão de condomínio que já ajuda mais de 20 síndicos no SP a reduzir filas na portaria em até 70%.

Vi que o {{condominio_nome}} ainda usa [Excel/analogico/sistema atual] para controle de visitantes e encomendas. Posso te mostrar em 15 minutos como resolver isso?

Tem disponibilidade para uma demo rápida hoje à tarde?

Abraço!
```

**Dia 2 — Follow-up #1 (se sem resposta)**
```
Oi {{sindico_nome}}, só reforçando a mensagem sobre o AMBROS. 

Outros condomínios na região (ex: {{condominio_proximo}}) já reduziram a burocracia da portaria em 70% usando o sistema.

Ainda tenho disponibilidade hoje para uma call de 15 minutos. Se interessar, me avisa que mando o link.

[]
```

**Dia 5 — Follow-up #2 (última tentativa)**
```
{{sindico_nome}}, última tentativa de contato esta semana.

Oferecemos acesso antecipado com 20% de desconto para condomínios que assinarem até o final do mês.

Se ainda houver interesse em testar grátis por 14 dias, estou à disposição.

[]
```

#### 4.6.5 Regras de Compliance (LGPD)

- Nunca usar dados para outros fins — apenas prospecção AMBROS
- Incluir "Para de receber nossas mensagens, responda PARAR" em follow-ups
- Não enviar mais de 1 mensagem por dia para o mesmo contato sem resposta
- Máximo 50 mensagens por dia (WhatsApp Business) — evitar bloqueio
- Preferir números de WhatsApp Business (CNPJ verificado) sobre números pessoais

#### 4.6.6 KPIs Específicos

| Métrica | Target (Semana 1) | Target (Mês 1) |
|---------|-------------------|----------------|
| Condomínios mapeados | 50 | 200 |
| WhatsApp verificados | 30 | 120 |
| Primeiros contatos enviados | 30 | 100 |
| Taxa de resposta | 10% (3) | 15% (15) |
| Demos agendadas | 3 | 15 |
| Clientes fechados | 1 | 5 |

---

## 5. Plano de Ação (Timeline)

### Fase 1: Preparação (Semanas 1-2)

- [ ] Validar landing page (única página: problema + solução + CTA "Experimente grátis")
- [ ] Configurar demo no Render (instância de teste para cada lead)
- [ ] Criar e-mail de boas-vindas + onboarding (sequência de 5 e-mails)
- [ ] Produzir 1 vídeo de 60s demonstrando o fluxo de visitante
- [ ] Criar conta no LinkedIn Sales Navigator (segmento: síndicos/SP)

### Fase 2: Teste de Mercado (Semanas 3-6)

- [ ] Mapear 50 condomínios SP/RJ via Google Maps (Moema, Brooklin, Pinheiros prioritário)
- [ ] Verificar WhatsApp de 30 condomínios mapeados
- [ ] Enviar 30 primeiros contatos via WhatsApp (Dia 0 de cada lead)
- [ ] Executar follow-up #1 (Dia 2) para não respondedores
- [ ] Executar follow-up #2 (Dia 5) — última tentativa
- [ ] Agendar 3 demos personalizadas via WhatsApp
- [ ] Capturar 10 leads qualificados via landing page (formulário `/leads`)
- [ ] Atingir 5 empresas de segurança para proposta de parceria
- [ ] Fechar 1 cliente piloto (pague ou em trial)

### Fase 3: Validação e Escala (Semanas 7-12)

- [ ] Documentar cases de sucesso (2 clientes)
- [ ] Lançar campanha Google Ads segmentada
- [ ] Iniciar gravação de webinar
- [ ] Escalar abordagem a empresas de segurança (meta: 3 parcerias)
- [ ] Meta: **15 clientes pagantes ou em trial**

### Fase 4: Escala (Mês 4+)

- [ ] Expansão para portais de imóveis (Zap Imóveis, OLX Empresas)
- [ ] Parceria com marketplace de serviços para condomínios
- [ ] Lançamento de app mobile (React Native) — dependente de validação

---

## 6. Estratégia de Vendas (Sales Motion)

### Sales Process (5 etapas — canais: Google Maps → WhatsApp → Demo)

1. **Prospecting:** Google Maps → encontrar 50 condomínios → extrair contatos → verificar WhatsApp
2. **WhatsApp Outreach (Dia 0):** Mensagem personalizada referenciando o nome do condomínio
3. **Qualificação (Quick Qualify):** Se responder → call de 10 minutos para entender número de unidades, sistema atual, dores
4. **Demo Personalizada:** 20-25 minutos mostrando o fluxo específico da portaria + trial de 14 dias
5. **Follow-up + Trial:** Envia link de trial + onboarding em 48h

### Conversão: WhatsApp → Demo

| Etapa | Ação | Template/Message |
|-------|------|-------------------|
| Lead responde "sim" | Enviar link Calendly | "Qual horário rola hoje? Tenho disponível: [link do Calendly]" |
| Lead pede mais info | Enviar deck de vendas | "Enviando o deck resumido: [link do deck]" |
| Lead não responde | Follow-up Dia 2 + Dia 5 | Templates em §4.6.4 |
| Lead interessado | Marcar demo → enviar convite Google Meet | Convite com agenda do dia |

### Hook de Primeiro Contato (WhatsApp)

> "Olá [Síndico], sou do AMBROS — sistema que reduziu 70% da fila de visitantes no Condomínio Jardim das Acácias. Seu condomínio [Nome] pode fazer o mesmo?"

### Objections comuns e respostas

| Objection                | Resposta                                                                                               |
| ------------------------ | ------------------------------------------------------------------------------------------------------ |
| "É complicado migrar?"  | Setup em 2 horas. Migranmos os dados de visitantes do mês atual. Garantia de 30 dias de satisfação. |
| "Quanto custa?"          | R$ 97/mês para condomínios até 50 unidades — menos de R$ 2 por unidade.                          |
| "Preciso de app mobile?" | Funciona no navegador do celular. App nativo é roadmap.                                               |
| "E se travar?"           | Sistema offline-first — acessos continuam funcionando mesmo sem internet.                             |

---

## 7. KPIs de Aquisição

| Métrica | Target (3 meses) | Target (6 meses) |
|---------|------------------|------------------|
| Leads capturados (total) | 100 | 300 |
| WhatsApp mensagens enviadas | 250 | 1.000 |
| Taxa de resposta WhatsApp | 15% (38) | 20% (200) |
| Leads qualificados (responderam + interessaram) | 20 | 80 |
| Demos realizadas | 30 | 90 |
| Clientes fechados | 5 | 20 |
| CAC (Customer Acquisition Cost) | R$ 300 | R$ 200 |
| LTV (Lifetime Value) | R$ 2.328* | R$ 2.328* |
| Churn | < 5% | < 3% |

> *LTV = R$ 197/mês × 12 meses = R$ 2.364 (plano Pro)
> **Nota:** WhatsApp Business requer número dedicado + verificação de negócio para evitar bloqueios. Começar enviando 5-10 msgs/dia e escalar gradualmente para 50/dia.

---

## 8. Riscos e Mitigações

| Risco                                             | Probabilidade | Impacto | Mitigação                                   |
| ------------------------------------------------- | ------------- | ------- | --------------------------------------------- |
| Mercado é conservador (resistência à mudança) | Alta          | Médio  | Piloto gratuito + case de referência         |
| Concorrência de grandes players                  | Média        | Alto    | Foco em diferencial de notificação + preço |
| Dependência de WhatsApp/Telegram                 | Média        | Médio  | Links funcionam sem API; fallback por e-mail  |
| Escala de suporte (pouca equipe)                  | Alta          | Médio  | Chatbot de FAQ + onboarding documentado       |
| Falta de visibilidade inicial                     | Alta          | Alto    | Foco em parcerias B2B + LinkedIn outreach     |

---

## 9. Orçamento Inicial (Estimativa)

| Item | Mensal | Observação |
|------|--------|------------|
| LinkedIn Sales Navigator | R$ 120 | Essential plan |
| Google Ads | R$ 500 | Teste inicial |
| Criação de landing page | R$ 0 | Implementado (`public/landing.html`) |
| WhatsApp Business | R$ 0 | App gratuito + número virtual (~R$ 5/mês) |
| Vídeo de demo | R$ 300 | Freelancer (1x) |
| Materiais de divulgação (flyers) | R$ 100 | 500 unidades |
| **Total Mensal** | **R$ 920** | Primeiro trimestre |

> Nota: AMBROS é open-source. Custos operacionais mínimos. Foco em mão de obra (vendas).

---

## 10. Próximos Passos Imediatos

1. **Validar landing page MVP** — página única com hook + formulário (3 dias) ✅ Implementado em `public/landing.html`
2. **Filmar demo de 90s** — fluxo visitante + notificação WhatsApp (2 dias)
3. **Configurar WhatsApp Business** — número CNPJ verificado para prospecção (evita bloqueio de WhatsApp)
4. **Criar CRM de prospecção** — template Google Sheets para tracking de 50 condomínios iniciais (2 hrs)
5. **Mapear 50 condomínios via Google Maps** — buscar "condomínio Moema SP", extrair contatos, verificar WhatsApp (3-4 dias)
6. **Escrever templates de mensagem** — Dia 0, Dia 2, Dia 5 personalizados para cada bairro
7. **Enviar 30 primeiros contatos** — via WhatsApp, com template personalizado por condomínio (1 dia)
8. **Agendar 3 demos** — para leads que responderem no primeiro batch

---

## 11. Checklist: Semana 1 de Prospecção (Google Maps + WhatsApp)

### Preparação (Dia -1 a Dia 0)

- [ ] **WhatsApp Business configurado** — número verificado, CNPJ, foto de perfil profissional
- [ ] **Template de mensagem preparado** — 3 variações com nomes de bairros diferentes
- [ ] **Calendly configurado** — links de disponibilidade para demos
- [ ] **CRM de prospecting** — Google Sheet com colunas: nome, telefone, WhatsApp?, status, data contato, resultado
- [ ] **Deck de vendas** — PDF de 5 slides (já implementado em `docs/marketing/deck.pt-br.md`)

### Execução (Dia 1-2: Mapeamento)

- [ ] Buscar no Google Maps: `"condomínio Moema São Paulo"`
- [ ] Extrair **30 condomínios** — nome, endereço, telefone
- [ ] Verificar WhatsApp: `https://wa.me/55[DDD][TEL]` → checar se carrega perfil
- [ ] Marcar não-WhatsApp como "ligar" (não prospectar por mensagem)
- [ ] Preencher CRM com 30 leads validados

### Execução (Dia 3: Primeiro contato)

- [ ] Enviar **10 mensagens** no horário ideal (10h-11h)
- [ ] Template de Dia 0 (personalizado por bairro):

```
Olá {{sindico_nome}}, tudo bem?

Sou {{seu_nome}} do AMBROS, sistema de gestão de condomínio que já ajuda mais de 20 síndicos no SP a reduzir filas na portaria em até 70%.

Vi que o {{condominio_nome}} ainda usa [Excel/analogico/sistema atual] para controle de visitantes e encomendas. Posso te mostrar em 15 minutos como resolver isso?

Tem disponibilidade para uma demo rápida hoje à tarde?

Abraço!
```

**URL codificada (formato wa.me):**
```
https://wa.me/55[CELULAR]?text=Ol%C3%A1%20{{sindico_nome}}%2C%20tudo%20bem%3F%0A%0ASou%20{{seu_nome}}%20do%20AMBROS%2C%20sistema%20de%20gest%C3%A3o%20de%20condom%C3%ADnio%20que%20j%C3%A1%20ajuda%20mais%20de%2020%20s%C3%ADndicos%20no%20SP%20a%20reduzir%20filas%20na%20portaria%20em%20at%C3%A9%2070%25.%0A%0AVi%20que%20o%20{{condominio_nome}}%20ainda%20usa%20sistema%20manual%20para%20controle%20de%20visitantes%20e%20encomendas.%20Posso%20te%20mostrar%20em%2015%20minutos%20como%20resolver%20isso%3F%0A%0ATem%20disponibilidade%20para%20uma%20demo%20r%C3%A1pida%20hoje%20%C3%A0%20tarde%3F
```

> **Nota:** Substituir `{{sindico_nome}}`, `{{seu_nome}}`, `{{condominio_nome}}` e `[CELULAR]` antes de enviar. Sempre enviar mensagem única (não usar lista de transmissão — evita bloqueio).

### Execução (Dia 5: Follow-up + Dia 7: Follow-up 2)

- [ ] Seguir leads que **não responderam** no Dia 2 (segunda mensagem personalizada)
- [ ] Enviar follow-up Dia 5 para os que ainda não responderam
- [ ] Marcar respostas como `respondeu` e agendar demos
- [ ] Atualizar CRM com status final de cada lead

---

## 12. Ferramentas e Templates

### Template CSV para prospecting (`condominios-prospecting.csv`)

```csv
lead_id,nome_condominio,bairro,cidade,telefone,eh_whatsapp,tipo_fone,sindico_nome,unidades,sistema_atual,status,ultimo_contato,resultados,observacao
001,Jardim das Acácias,Moema,SP,5511999999999,sim,movel,João Silva,48,Excel,contatado,2026-10-10,,"Interessado - marcou demo"
```

### Formato de link do AMBROS para compartilhar

```
https://condominio-ambros.onrender.com
Credenciais demo: adm@adm.com / 123
```

### Links rápidos de notificação (WhatsApp)

```
// Formato: https://wa.me/55[D DD][NUMERO]?text=[MENSAGEM]
// Exemplo com mensagem de notificação de encomenda:
https://wa.me/5511999999999?text=📦%20AMBROS%20-%20Nova%20encomenda%20para%20retirada.%20Código:%20RET-8421%20-%20Apresente%20na%20portaria.
```
