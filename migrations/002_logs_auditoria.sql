-- Migration 002: Tabela de auditoria de banco de dados
-- Dependencia: 001_baseline.sql
-- Aplica��o: Supabase Postgres

-- Tabela de logs de auditoria para tabelas críticas do sistema
CREATE TABLE IF NOT EXISTS public.logs_auditoria (
    id SERIAL PRIMARY KEY,
    tenant_id VARCHAR(50),
    tabela VARCHAR(50) NOT NULL,
    registro_id INTEGER NOT NULL,
    acao VARCHAR(10) NOT NULL CHECK (acao IN ('INSERT','UPDATE','DELETE')),
    usuario_id INTEGER,
    usuario_email VARCHAR(255),
    dados_antes JSONB,
    dados_depois JSONB,
    ip_origem INET,
    criado_em TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para performance de consulta e relatórios
CREATE INDEX idx_logs_auditoria_tenant_data ON public.logs_auditoria(tenant_id, criado_em);
CREATE INDEX idx_logs_auditoria_tabela_registro ON public.logs_auditoria(tabela, registro_id);
CREATE INDEX idx_logs_auditoria_usuario ON public.logs_auditoria(usuario_id, criado_em);
CREATE INDEX idx_logs_auditoria_acao ON public.logs_auditoria(acao, criado_em);

-- Comentário de documentação para o banco de dados
COMMENT ON TABLE public.logs_auditoria IS 'Log de auditoria de alterações nas tabelas críticas do sistema';
COMMENT ON COLUMN public.logs_auditoria.dados_antes IS 'Estado do registro antes da alteração (NULL em INSERT)';
COMMENT ON COLUMN public.logs_auditoria.dados_depois IS 'Estado do registro após a alteração (NULL em DELETE)';
COMMENT ON COLUMN public.logs_auditoria.usuario_email IS 'E-mail do usuário que realizou a ação (para auditoria rápida sem JOIN)';
COMMENT ON COLUMN public.logs_auditoria.ip_origem IS 'IP de origem da requisição (para auditoria de segurança)';