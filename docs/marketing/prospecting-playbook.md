# Playbook: Prospecção via Google Maps + WhatsApp

> **Canal primário de aquisição de clientes para AMBROS**
> Estratégia de prospecção direta B2C2B: encontrar condomínios no Google Maps → extrair contatos → prospector via WhatsApp.

---

## Visão Geral do Workflow

```
Google Maps → Extrair Contatos (CSV) → Verificar WhatsApp → Gerar Links (Tool) → Enviar 1 por 1 → Follow-up → Demo → Trial → Conversão
```

---

## Passo 1: Mapeamento de Condomínios (Google Maps)

### Bairros-alvo (Manaus/AM — operação atual)

| # | Bairro | Estratégia de busca |
|---|--------|---------------------|
| 1 | **Ponta Negra** | `"condomínio Ponta Negra Manaus"` |
| 2 | **Vieiralves** | `"condomínio Vieiralves Manaus"` |
| 3 | **Adrianópolis** | `"condomínio Adrianópolis Manaus"` |
| 4 | **Parque 10 de Novembro** | `"condomínio Parque 10 Manaus"` |
| 5 | **Alvorada** | `"condomínio Alvorada Manaus"` |

### Como extrair dados (manual — primeira semana)

1. Acesse **google.com/maps**
2. Pesquise: `"condomínio [bairro] São Paulo"`
3. Clique no primeiro resultado → copie:
   - Nome do condomínio
   - Endereço (bairro + CEP)
   - Telefone (se disponível)
   - Site (se disponível)
4. Abra o site do condomínio (se existir) → procure:
   - WhatsApp do síndico ou zelador
   - E-mail de contato
5. **Verifique WhatsApp:** acesse `https://wa.me/55[DDD][NUMERO]` → se abrir o chat, é WhatsApp ✓

### Extensão recomendada (Chrome)

- **MapsScraper** — exporta resultados do Google Maps para CSV
- Limite gratuito: ~100 resultados por busca
- Instalar: Chrome Web Store → "MapsScraper"

---

## Passo 2: Preencher o CRM (CSV)

Use o template em `docs/marketing/condominios-prospecting.csv`

**Colunas obrigatórias:**
| Coluna | Exemplo | Origem |
|--------|---------|--------|
| `lead_id` | 001 | Auto-incremental |
| `nome_condominio` | Jardim das Acácias | Google Maps |
| `bairro` | Ponta Negra | Google Maps |
| `cidade` | Manaus/AM | Google Maps |
| `telefone` | 559295129901 | Google Maps/Site |
| `eh_whatsapp` | sim/nao | Verificação wa.me |
| `tipo_fone` | movel/fixo | Classificação |
| `sindico_nome` | Carlos Silva | Pergunta no primeiro contato |
| `unidades` | 48 | Estimativa (contagem de andares × 4) |
| `sistema_atual` | Excel | Resposta do síndico |
| `status` | novo/contatado/... | Pipeline |

### Status do pipeline

| Status | Significado | Ação |
|--------|-------------|------|
| `novo` | Acabou de mapear | Aguarda contato |
| `contatado` | Enviada mensagem Dia 0 | Aguarda resposta |
| `respondeu` | Síndico respondeu | Agendar demo |
| `demo_agendada` | Call marcada | Envy link de convite |
| `convertido` | Trial ou contrato | Onboarding |
| `perdido` | "Não interessado" | Arquivar |
| `frio` | Sem resposta | Follow-up Dia 5 |

---

## Passo 3: Gerar Links de WhatsApp (Tool)

### Instalar dependências
```bash
# O script usa apenas Node.js built-in (fs, path, http)
# Nenhuma dependência externa necessária
```

### Uso básico (Dia 0 — primeiro contato)
```bash
node tools/generate-wa-links.cjs docs/marketing/condominios-prospecting.csv
```

### Uso para follow-up (Dia 2)
```bash
node tools/generate-wa-links.cjs docs/marketing/condominios-prospecting.csv --followup
```

### Uso para follow-up final (Dia 5)
```bash
node tools/generate-wa-links.cjs docs/marketing/condominios-prospecting.csv --followup2
```

### Output
- **Console:** lista de links prontos para abrir (um por vez)
- **CSV:** `docs/marketing/links-whatsapp-dia0.csv` (ou dia2/dia5)

---

## Passo 4: Envio de Mensagens (Manual, 1 por 1)

### Regras de ouro do WhatsApp

| Regra | Limite | Por que |
|-------|--------|---------|
| Mensagens por dia (início) | **5-10** | Evita flag de spam |
| Mensagens por dia (escala) | **50** | Limite WhatsApp Business |
| Intervalo entre mensagens | **2-3 minutos** | Aparenta humano |
| Lista de transmissão | **NÃO usar** | Alto risco de bloqueio |
| Mensagens por contato/dia | **1** | Sem spam |

### Protocolo de envio

1. Abra o link gerado no navegador
2. **Aguarde abrir o WhatsApp Web** (ou app no celular)
3. Verifique se o número é real (WhatsApp verde)
4. Envie a mensagem **manualmente** (Ctrl+Enter)
5. Marque como `contatado` no CSV
6. **Não envie mais nada até ter resposta**

### Horário ideal
- **Manhã:** 10h00 - 11h30
- **Tarde:** 14h00 - 16h00
- Evite: semana dia, final de tarde, feriados

---

## Passo 5: Follow-up (Sequência 3-2-5)

### Dia 0 — Primeiro contato
```
Olá {{nome}}, tudo bem?

Sou {{seu_nome}} do AMBROS, sistema de gestão de condomínio em lançamento — estamos abrindo pilotos com 14 dias grátis.

Vi que o {{condominio}} poderia se beneficiar de controle digital de visitantes e encomendas. Posso te mostrar em 15 minutos como funciona?

Tem disponibilidade para uma demo rápida hoje à tarde?

Abraço!
```

### Dia 2 — Follow-up #1
```
Oi {{nome}}, só reforçando a mensagem sobre o AMBROS (piloto com 14 dias grátis). Ainda tenho disponibilidade hoje para uma call de 15 minutos. Se interessar, me avisa!

[]
```

### Dia 5 — Follow-up #2 (última)
```
{{nome}}, última tentativa desta semana. Oferecemos acesso antecipado com 20% de desconto. Se ainda houver interesse em testar grátis por 14 dias, estou à disposição.

[]
```

---

## Passo 6: Conversão (WhatsApp → Demo → Trial)

### Quando o síndico responder "sim":
1. Envie: "Qual horário rola hoje? Tenho disponível para hoje [horário] ou amanhã [horário]. Qual prefere?"
2. Marque a call no Google Meet
3. Envie convite 5 minutos antes

### Durante a demo (15-20 minutos):
1. Compartilhe tela → mostre o fluxo do problema dele
2. Use os dados reais do condomínio dele (se possuir)
3. Mostre: portaria, encomendas, notificações
4. Termine com: "Vou ativar seu trial de 14 dias agora. Senha já chega por e-mail."

### Pós-demo:
1. Envia e-mail de boas-vindas (templates em `/docs/marketing/emails/`)
2. Marca no CSV como `demo_agendada` → `convertido`
3. Inicia processo de onboarding

---

## Checklist Semana 1

### Preparação
- [ ] WhatsApp Business configurado (número + CNPJ)
- [ ] Calendly configurado (links de disponibilidade)
- [ ] Template de mensagem preparado (3 variações por bairro)
- [ ] CRM de prospecting pronto (CSV template)
- [ ] Deck de vendas PDF pronto (`docs/marketing/deck.pt-br.md`)

### Mapeamento (Dia 1-2)
- [ ] Buscar no Google Maps: `"condomínio Ponta Negra Manaus"`
- [ ] Extrair 30 condomínios (nome, endereço, telefone, site)
- [ ] Verificar WhatsApp de cada um (`wa.me`)
- [ ] Preencher CSV `docs/marketing/condominios-manaus.csv` com 30 leads validados

### Primeiro contato (Dia 3)
- [ ] Gerar links: `node tools/generate-wa-links.cjs docs/marketing/condominios-manaus.csv`
- [ ] Enviar 10 mensagens (10h-11h)
- [ ] Marcar não-respondedores como `contatado`

### Follow-up (Dia 5)
- [ ] Enviar follow-up Dia 2 para não-respondedores
- [ ] Agendar demos para respondentes

### Follow-up final (Dia 7)
- [ ] Enviar follow-up Dia 5
- [ ] Fechar 1 cliente piloto

---

## Ferramentas e Resources

| Recurso | Local/Caminho |
|---------|---------------|
| CSV template prospecting | `docs/marketing/condominios-prospecting.csv` |
| WhatsApp link generator | `tools/generate-wa-links.cjs` |
| Landing page lead capture | `public/landing.html` → POST `/leads` |
| Leads dashboard | `public/leads.html` → GET `/leads` (auth) |
| Email onboarding (5 seq) | `docs/marketing/emails/01-05.html` |
| Sales deck | `docs/marketing/deck.pt-br.md` |
| API de leads | `GET/POST/PUT/DELETE /leads` |

---

## Métricas-Chave (Week 1 Targets)

| Métrica | Meta |
|---------|------|
| Condomínios mapeados | 50 |
| WhatsApp verificados | 30 |
| Primeiros contatos | 30 |
| Taxa de resposta | 10% (3) |
| Demos agendadas | 3 |
| Clientes fechados | 1 |
