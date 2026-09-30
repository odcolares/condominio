# AMBROS - Sistema Inteligente de Controle de Acesso para Condomínios

> Projeto: AMBROS - Controle de Acesso Versão: 1.0

## Objetivo

O AMBROS é um sistema web para gerenciamento de acesso de moradores,
visitantes, veículos e prestadores, integrado às controladoras de acesso
existentes.

## Tecnologias

-   Frontend: AdminLTE 4, Bootstrap 5, JavaScript
-   Backend: FastAPI (Python)
-   Banco de Dados: PostgreSQL

## Funcionalidades

-   Dashboard
-   Cadastro de moradores
-   Cadastro de visitantes
-   Cadastro de veículos
-   Controle de entrada e saída
-   Histórico de acessos
-   Relatórios
-   Integração futura com QR Code, OCR, WhatsApp e LPR

## Estrutura

### Moradores

-   Nome completo
-   CPF
-   Telefone
-   WhatsApp
-   Bloco
-   Apartamento
-   Proprietário/Inquilino
-   Foto
-   Veículo
-   Número da vaga

### Visitantes

-   Nome
-   CPF/RG/CNH
-   Telefone
-   Foto
-   Veículo
-   Morador visitado
-   Bloco/Apartamento
-   Vaga automática
-   Entrada e saída

## Roadmap

### MVP

-   Login
-   Dashboard
-   Cadastros
-   Entrada/Saída
-   Relatórios

### Futuro

-   Integração com controladoras
-   OCR
-   Reconhecimento de placas
-   Aplicativo móvel
