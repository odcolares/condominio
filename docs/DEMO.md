# 📖 DEMO.md — Guia de Execução do Ambiente de Demonstração

> **Objetivo:** Subir o ambiente AMBROS para demonstração comercial em menos de 10 minutos.

---

## 📋 Pré-requisitos

| Item | Versão | Observação |
|------|--------|------------|
| Node.js | ≥ 18 | Recomendado: Node 22 |
| npm | ≥ 10 | Vem com o Node |
| Navegador | Chrome/Edge/Firefox | Para acessar o frontend |

---

## 🚀 Passo a passo

### 1. Clonar o repositório

```bash
git clone https://github.com/odcolares/condominio.git
cd condominio
git checkout main
```

### 2. Instalar dependências

```bash
npm install
```

### 3. Configurar variáveis de ambiente

Crie um arquivo `.env` na raiz (exemplo em `.env.example`):

```bash
cp .env.example .env
```

Edite o `.env` se necessário. Para demo local, os valores padrão funcionam:

| Variável | Valor padrão | Observação |
|----------|--------------|------------|
| `PORT` | `3000` | Porta do servidor |
| `SECRET_KEY` | `troque-esta-chave-em-producao` | Chave JWT (alterar em produção) |

### 4. Iniciar o servidor

```bash
npm run dev
```

O servidor ficará disponível em: **`http://localhost:3000`**

### 5. Verificar se está funcionando

Acesse no navegador: **`http://localhost:3000/api/health`**

Deve retornar JSON:
```json
{ "app": "AMBROS", "status": "ok", "docs": "/docs" }
```

### 6. Fazer login

Acesse: **`http://localhost:3000/login.html`**

Use uma das credenciais abaixo:

| Perfil | Email | Senha |
|--------|-------|-------|
| Administrador | `admin@ambros.com` | `admin123` |
| Porteiro | `portaria@ambros.com` | `portaria123` |
| Morador | `carlos@ambros.com` | `morador123` |
| Síndico | `sindico@ambros.com` | `sindico123` |

### 7. Selecionar o condomínio (tenant)

Após o login, um seletor "Condomínio:" aparecerá no cabeçalho da página. Selecione o condomínio desejado e a página recarregará com os dados daquele condomínio.

### 8. Telas disponíveis para demo

| Tela | URL | Uso na apresentação |
|------|-----|---------------------|
| Dashboard | `/ambros-dashboard.html` | Métricas gerais, últimos acessos |
| Moradores | `/moradores.html` | Cadastro e lista de moradores |
| Veículos | `/veiculos.html` | Cadastro de veículos |
| Visitantes | `/visitantes.html` | Lista de visitantes |
| Portaria (entrada) | `/portaria-entrada.html` | Check-in/check-out de visitantes |
| Portal do Morador | `/portal-morador.html` | Pré-autorizar visitante, reservas, encomendas |
| Prestadores | `/prestadores.html` | Cadastro de prestadores |
| Ocorrências | `/ocorrencias.html` | Registro de ocorrências |
| Reservas | `/reservas.html` | Reserva de áreas comuns |
| Encomendas | `/encomendas.html` | Controle de encomendas |

---

## 🔄 Resetar dados do demo

Se precisar limpar e recarregar os dados do zero:

```bash
# O banco carrega de data/database.json automaticamente
# Para forçar re-seed, exclua o arquivo e reinicie:
rm data/database.json
# Em seguida, reinicie o servidor:
# (Ctrl+C no servidor, depois) npm run dev
```

---

## 🧪 Testes automatizados (opcional)

```bash
npm test
```

Serão executados 67 testes com vitest + supertest.

---

## 🛠️ Solução de problemas comuns

| Problema | Causa provável | Solução |
|----------|---------------|---------|
| Porta 3000 já em uso | Outro processo rodando | Altere `PORT` no `.env` ou mate o processo |
| Erro de CORS | Frontend acessando de outra origem | O servidor já inclui `cors()` |
| Login não funciona | Credenciais incorretas | Verifique email/senha na tabela acima |
| Dados não aparecem | Banco não foi populado | Reinicie o servidor após `rm data/database.json` |

---

## 📞 Suporte

Em caso de dúvidas durante a demo, consulte:
- `docs/MANUAL-V1-FUNCIONALIDADES.md`
- `docs/MANUAL-V2-OPERACAO.md`
- `docs/PLANO-SEEDS-DEMO.md`
