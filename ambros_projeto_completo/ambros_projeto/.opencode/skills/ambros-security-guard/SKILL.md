---
name: ambros-security-guard
description: >-
  Skill de auditoria de segurança do AMBROS (sistema de controle de acesso
  condominial). Use ao revisar ou hardenear autenticação JWT, CORS, secrets,
  senhas, logs de acesso e privacidade de dados. Triggers: "segurança do
  ambros", "hardening ambros", "jwt ambros", "cors ambros", "secret key
  ambros", "auditar acessos", "lgpd ambros", "vulnerabilidade do ambros".
user-invocable: false
disable-model-invocation: false
progressive_disclosure:
  entry_point:
    summary: "Auditoria de segurança do AMBROS: JWT, CORS, secrets, senhas, LGPD."
    when_to_use:
      - "Ao revisar código que mexe em auth, JWT, CORS, .env ou senhas"
      - "Antes de um release/deploy para produção"
      - "Quando suspeitar de vulnerabilidade"
      - "Para atendimento a LGPD (dados de moradores/visitantes)"
    quick_start:
      - "Rode o checklist de auditoria abaixo"
      - "Padronize require por privilégios (admin vs portaria vs leitor)"
      - "Confirme SECRET_KEY e DATABASE_URL setados via variável de ambiente"
      - "Verifique CORS restrito a origens confiáveis"
      - "Audite logs de acesso para que rastreiem quem/regis_trou o quê"
---

# AMBROS — Security Guard Skill

## Contexto de risco

O AMBROS manipula dados pessoais de moradores (CPF, telefone, foto, unidade
residencial), visitantes (documento, placa) e logs de acesso (movimento de
pessoas). É **dados sensíveis sob LGPD**. Todo hardening deve considerar:

1. Confidencialidade (quem pode ver dados de quem)
2. Integridade (logs de acesso não podem ser apagados por usuários comuns)
3. Disponibilidade (portaria não pode ficar offline)

## Checklist de auditoria de produção

### Secrets e configuração

- [ ] `SECRET_KEY` NÃO é o valor default `troque-esta-chave-em-producao`
- [ ] `SECRET_KEY` injetada por variável de ambiente (não commitada no `.env`)
- [ ] `.env` **não** está versionado (adicionar ao `.gitignore`)
- [ ] `DATABASE_URL` aponta para PostgreSQL em produção (não SQLite local)
- [ ] Senha do banco PostgreSQL uses credencial isolada (não `ambros:ambros`)
- [ ] `ACCESS_TOKEN_EXPIRE_MINUTES` revisado (480 min = 8h pode ser muito)

### Autenticação JWT

- [ ] Token JWT valida `expiração` e rejeita tokens expirados (já implementado
  via `jwt.decode` com `exp` no payload)
- [ ] `get_current_user` bloqueia usuário `ativo=False` (já faz)
- [ ] Em 401, retornado `WWW-Authenticate: Bearer` (já faz)
- [ ] **Falta**: implementar refresh token para sessões longas
- [ ] **Falta**: invalidar token por logout (blacklist ou versão)
- [ ] **Falta**: limite de tentativas de login (rate limiting / lockout)

### Senhas

- [ ] Hash usa `pbkdf2_sha256` do passlib (já faz)
- [ ] Senhas **nunca** aparecem em logs, mensagens de erro ou responses
- [ ] Senha admin padrão `123` **não existe em produção** — remover ou forçar
  troca no primeiro login
- [ ] **Falta**: política de complexidade mínima (8+, misturar tipos)
- [ ] **Falta**: endpoint "esqueci minha senha" com fluxo seguro

### CORS

- [ ] `allow_origins=["*"]` **NÃO** é aceitável em produção — substituir por
  lista das origens confiáveis (ex: `["http://ambros.exemplo.com"]`)
- [ ] `allow_credentials=True` + `allow_origins=["*"]` é **inválido** pela
  spec CORS; escolha uma ou outra
- [ ] Considerar `allow_methods=["GET","POST","PUT","DELETE"]` em vez de `["*"]`

### Autorização (RBAC)

- [ ] Hoje só há `perfil="admin"`; verificar se portaria/síndico precisam
  permissões distintas
- [ ] **Falta**: dependência `require_admin` para endpoints sensíveis
  (ex: DELETE /moradores, criar usuário)
- [ ] **Falta**: log de quem consultou dados de quem (auditoria)

### Logs de acesso

`Acesso` já é a entidade de log de portaria, mas **logs administrativos**
(quem consultou/cadastrou/apagou o quê) não existem. Considerar:

```python
class LogOperacao(Base):
    __tablename__ = "logs_operacao"
    id: Mapped[int] = mapped_column(primary_key=True)
    usuario_id: Mapped[int] = mapped_column(ForeignKey("usuarios.id"))
    acao: Mapped[str]  # "criar_morador", "deletar_acesso", etc.
    alvo_tipo: Mapped[str | None]
    alvo_id: Mapped[int | None]
    registrado_em: Mapped[datetime]
```

### LGPD — dados pessoais

Moradores/visitantes armazenam: CPF, telefone, WhatsApp, foto, placa. Pontos
de atenção:

- [ ] **Falta**: endpoint de exportação de dados pessoais (direito de acesso)
- [ ] **Falta**: anonimização / soft delete de morador (LGPD direito ao
  esquecimento)
- [ ] **Falta**: retenção mínima — visitantes permanentes precisam expirar?
- [ ] Fotos hoje são apenas URL; se for armazenar, definir política de
  retenção e criptografia em repouso
- [ ] **Falta**: termo de uso / consentimento claramente visível
- [ ] **Falta**: comunicação à ANPD em caso de incidente (processo)

### Upload de fotos (roadmap)

- **Falta**: validar MIME e tamanho máximo (máx 2MB, tipos image/*)
- **Falta**: nomes de arquivo sanitizados (UUID, sem path traversal)
- **Falta**: servir fotos com URL temporária assinada, não pública

### CRLF / Injection

- FastAPI + Pydantic já neutralizam maior parte de JSON injection
- Mensagens de erro não devem refletir input cru em telas (XSS via `.textContent`
  em vez de `innerHTML` no frontend)
- SQL: usar sempre `select(Model).where(...)` — SQLAlchemy parametriza;
  **nunca** concatenar string em query

### Headers de segurança recomendados

Adicionar no `main.py` middleware de headers:

```python
@app.middleware("http")
async def security_headers(request, call_next):
    response = await call_next(request)
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
    return response
```

## Script de auditoria rápida (manual)

```bash
# Procure por padrões inseguros no código:
rg -n "allow_origins=\[\"\\*\"\]" backend/
rg -n "troque-esta-chave" backend/ --no-ignore
rg -n "senha.*123|password.*123" backend/
rg -n "innerHTML\(" frontend/
```

## Checklist de PR de segurança

- [ ] Nenhum secret hardcoded novo
- [ ] Endpoint sensível (DELETE, criar user) restringe perfil
- [ ] Logs não expõem CPF/senha em texto puro
- [ ] Mensagens de erro não vazam internals
- [ ] CORS revisado se novo domínio adicionado
- [ ] Validação de MIME/tamanho se upload envolvido
- [ ] Update deste skill com novas medidas aplicadas
