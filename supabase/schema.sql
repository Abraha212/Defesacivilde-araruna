-- =====================================================
-- DEFESA CIVIL ARARUNA - SCHEMA DO BANCO DE DADOS
-- Execute este script no SQL Editor do Supabase
-- =====================================================

-- Habilitar extensão UUID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- TABELA: AGENDA
-- =====================================================
CREATE TABLE IF NOT EXISTS public.agenda (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    titulo VARCHAR(255) NOT NULL,
    descricao TEXT,
    data DATE NOT NULL,
    hora_inicio TIME NOT NULL,
    hora_fim TIME,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_agenda_user_id ON public.agenda(user_id);
CREATE INDEX IF NOT EXISTS idx_agenda_data ON public.agenda(data);

-- RLS: Apenas o próprio usuário pode acessar seus dados
ALTER TABLE public.agenda ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Usuários podem ver apenas seus próprios compromissos" ON public.agenda;
CREATE POLICY "Usuários podem ver apenas seus próprios compromissos"
    ON public.agenda FOR SELECT
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Usuários podem inserir seus próprios compromissos" ON public.agenda;
CREATE POLICY "Usuários podem inserir seus próprios compromissos"
    ON public.agenda FOR INSERT
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Usuários podem atualizar seus próprios compromissos" ON public.agenda;
CREATE POLICY "Usuários podem atualizar seus próprios compromissos"
    ON public.agenda FOR UPDATE
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Usuários podem excluir seus próprios compromissos" ON public.agenda;
CREATE POLICY "Usuários podem excluir seus próprios compromissos"
    ON public.agenda FOR DELETE
    USING (auth.uid() = user_id);

-- =====================================================
-- TABELA: MEMORANDOS
-- =====================================================
CREATE TABLE IF NOT EXISTS public.memorandos (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    numero INTEGER NOT NULL CHECK (numero >= 1 AND numero <= 100),
    status VARCHAR(20) DEFAULT 'pendente' CHECK (status IN ('pendente', 'concluido')),
    observacao TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, numero)
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_memorandos_user_id ON public.memorandos(user_id);
CREATE INDEX IF NOT EXISTS idx_memorandos_status ON public.memorandos(status);

-- RLS: Apenas o próprio usuário pode acessar seus dados
ALTER TABLE public.memorandos ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Usuários podem ver apenas seus próprios memorandos" ON public.memorandos;
CREATE POLICY "Usuários podem ver apenas seus próprios memorandos"
    ON public.memorandos FOR SELECT
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Usuários podem inserir seus próprios memorandos" ON public.memorandos;
CREATE POLICY "Usuários podem inserir seus próprios memorandos"
    ON public.memorandos FOR INSERT
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Usuários podem atualizar seus próprios memorandos" ON public.memorandos;
CREATE POLICY "Usuários podem atualizar seus próprios memorandos"
    ON public.memorandos FOR UPDATE
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Usuários podem excluir seus próprios memorandos" ON public.memorandos;
CREATE POLICY "Usuários podem excluir seus próprios memorandos"
    ON public.memorandos FOR DELETE
    USING (auth.uid() = user_id);

-- =====================================================
-- TABELA: CONVERSÕES NETCDF
-- =====================================================
CREATE TABLE IF NOT EXISTS public.conversoes_netcdf (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    nome_arquivo VARCHAR(255) NOT NULL,
    formato_saida VARCHAR(10) NOT NULL CHECK (formato_saida IN ('csv', 'xlsx')),
    status VARCHAR(20) DEFAULT 'processando' CHECK (status IN ('processando', 'concluido', 'erro')),
    storage_path TEXT,
    url_download TEXT,
    erro_mensagem TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_conversoes_user_id ON public.conversoes_netcdf(user_id);
CREATE INDEX IF NOT EXISTS idx_conversoes_status ON public.conversoes_netcdf(status);

-- RLS: Apenas o próprio usuário pode acessar seus dados
ALTER TABLE public.conversoes_netcdf ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Usuários podem ver apenas suas próprias conversões" ON public.conversoes_netcdf;
CREATE POLICY "Usuários podem ver apenas suas próprias conversões"
    ON public.conversoes_netcdf FOR SELECT
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Usuários podem inserir suas próprias conversões" ON public.conversoes_netcdf;
CREATE POLICY "Usuários podem inserir suas próprias conversões"
    ON public.conversoes_netcdf FOR INSERT
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Usuários podem atualizar suas próprias conversões" ON public.conversoes_netcdf;
CREATE POLICY "Usuários podem atualizar suas próprias conversões"
    ON public.conversoes_netcdf FOR UPDATE
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Usuários podem excluir suas próprias conversões" ON public.conversoes_netcdf;
CREATE POLICY "Usuários podem excluir suas próprias conversões"
    ON public.conversoes_netcdf FOR DELETE
    USING (auth.uid() = user_id);

-- =====================================================
-- STORAGE BUCKET PARA ARQUIVOS NETCDF
-- =====================================================
-- Execute no Dashboard do Supabase > Storage > New Bucket
-- Nome: netcdf-files
-- Public: false

-- Políticas de Storage (executar no SQL Editor):
/*
INSERT INTO storage.buckets (id, name, public) 
VALUES ('netcdf-files', 'netcdf-files', false)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Usuários podem fazer upload de seus arquivos"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'netcdf-files' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Usuários podem ver seus próprios arquivos"
ON storage.objects FOR SELECT
USING (bucket_id = 'netcdf-files' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Usuários podem excluir seus próprios arquivos"
ON storage.objects FOR DELETE
USING (bucket_id = 'netcdf-files' AND auth.uid()::text = (storage.foldername(name))[1]);
*/

-- =====================================================
-- FUNÇÕES AUXILIARES
-- =====================================================

-- Função para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers para updated_at
DROP TRIGGER IF EXISTS update_agenda_updated_at ON public.agenda;
CREATE TRIGGER update_agenda_updated_at
    BEFORE UPDATE ON public.agenda
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_memorandos_updated_at ON public.memorandos;
CREATE TRIGGER update_memorandos_updated_at
    BEFORE UPDATE ON public.memorandos
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_conversoes_updated_at ON public.conversoes_netcdf;
CREATE TRIGGER update_conversoes_updated_at
    BEFORE UPDATE ON public.conversoes_netcdf
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- COMENTÁRIOS DAS TABELAS (documentação)
-- =====================================================
COMMENT ON TABLE public.agenda IS 'Agenda de compromissos dos servidores da Defesa Civil';
COMMENT ON TABLE public.memorandos IS 'Controle numérico de memorandos (1-100) por usuário';
COMMENT ON TABLE public.conversoes_netcdf IS 'Histórico de conversões de arquivos NetCDF';

-- FIM DO SCHEMA
