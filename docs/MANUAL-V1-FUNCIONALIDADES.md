# AMBROS — Visão Geral de Funcionalidades (Para o Cliente)

Bem-vindo ao **AMBROS**, o sistema de controle de acesso do seu condomínio. Abaixo, um panorama do que você terá ao assinar o serviço.

---

## 🔐 1. Autenticação e Segurança
- Login seguro com token JWT (expiração de 8h)
- Controle por perfis: **administrador**, **morador** e **portaria**
- Registro de auditoria de todos os acessos

## 🏠 2. Gestão de Moradores
- Cadastro completo (nome, CPF, telefone, bloco, apartamento)
- Sincronização com veículos no cadastro
- Exclusão segura que remove veículos vinculados

## 🚗 3. Gestão de Veículos
- Controle de placas, modelos e vagas
- Indicadores de frota (total, com morador, vagas ocupadas)
- Vínculo automático entre veículo e morador

## 🚪 4. Visitantes e Pré-autorizações
- Cadastro rápido de visitantes
- Pré-autorização via QR Code (`QR-XXXX`) gerada pelo morador
- Registro automático de entrada/saída com presença em tempo real
- Janela de 24h para visitantes

## 🛠️ 5. Prestadores de Serviço
- Cadastro com documento, função, empresa e vínculo
- Validade declarável em dias (`prazo_dias`) ou data fim
- Controle de crachá e placa
- Entrada/saída com presença e expiração sinalizada

## ⏱️ 6. Controle de Duração de Acesso
- Registro automático da duração de permanência (entrada → saída)
- Visitante: janela de 24 horas
- Prestador: validade conforme prazo estabelecido
- Histórico completo de acessos com filtros

## 📦 7. Encomendas
- Registro de encomendas com código de retirada `RET-XXXX`
- Notificação automática ao morador (WhatsApp e Telegram)
- Histórico de retiradas com confirmação de código

## 📅 8. Reservas de Áreas Comuns
- Catálogo de espaços (capacidade, regras, taxa)
- Reserva visual sem conflitos de horário
- Alteração de status e notificação ao morador

## ⚠️ 9. Ocorrências e Restrições
- Registro de ocorrências por categoria, gravidade e status
- Feche automático com data de resolução
- Bloqueio proativo na portaria por CPF/placa proibida

## 📢 10. Comunicação do Condomínio
- Mural de comunicados para todos os moradores
- Notificações diretas ao morador selecionado

## 📊 11. Portal do Morador
- Visão consolidada: encomendas, pré-autorizações, reservas, comunicados
- Dashboard com indicadores e gráficos de movimentação

## 🏢 12. Operação de Portaria
- Tela dedicada de entrada/saída (scanner de pré-autorização)
- Consulta rápida de visitantes, prestadores e restrições

---

## 📈 Benefícios para o seu condomínio

- **Mais segurança:** controle rigoroso de entradas e saídas
- **Mais agilidade:** portaria e moradores conectados em tempo real
- **Mais organização:** reservas, encomendas e ocorrências centralizadas
- **Mais transparência:** auditoria completa de todos os acessos

---

> **Próximo passo:** consulte o **Manual de Operação** (MANUAL-V2-OPERACAO.md) para aprender a usar cada funcionalidade passo a passo.
