CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TABLE IF NOT EXISTS public.agenda (
    id          UUID        DEFAULT uuid_generate_v4() PRIMARY KEY,
    titulo      VARCHAR(255) NOT NULL,
    descricao   TEXT,
    data        DATE        NOT NULL,
    hora_inicio TIME        NOT NULL,
    hora_fim    TIME,
    created_at  TIMESTAMPTZ DEFAULT NOW(),
    updated_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_agenda_data ON public.agenda(data);

ALTER TABLE public.agenda ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "agenda_all" ON public.agenda;
CREATE POLICY "agenda_all" ON public.agenda FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

DROP TRIGGER IF EXISTS update_agenda_updated_at ON public.agenda;
CREATE TRIGGER update_agenda_updated_at
    BEFORE UPDATE ON public.agenda
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TABLE IF NOT EXISTS public.memorandos (
    id          UUID        DEFAULT uuid_generate_v4() PRIMARY KEY,
    numero      INTEGER     NOT NULL CHECK (numero >= 1 AND numero <= 100) UNIQUE,
    status      VARCHAR(20) DEFAULT 'pendente' CHECK (status IN ('pendente', 'concluido')),
    observacao  TEXT,
    created_at  TIMESTAMPTZ DEFAULT NOW(),
    updated_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_memorandos_status ON public.memorandos(status);

ALTER TABLE public.memorandos ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "memorandos_all" ON public.memorandos;
CREATE POLICY "memorandos_all" ON public.memorandos FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

DROP TRIGGER IF EXISTS update_memorandos_updated_at ON public.memorandos;
CREATE TRIGGER update_memorandos_updated_at
    BEFORE UPDATE ON public.memorandos
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TABLE IF NOT EXISTS public.conversoes_netcdf (
    id              UUID        DEFAULT uuid_generate_v4() PRIMARY KEY,
    nome_arquivo    VARCHAR(255) NOT NULL,
    formato_saida   VARCHAR(10)  NOT NULL CHECK (formato_saida IN ('csv', 'xlsx')),
    status          VARCHAR(20)  DEFAULT 'processando' CHECK (status IN ('processando', 'concluido', 'erro')),
    storage_path    TEXT,
    url_download    TEXT,
    erro_mensagem   TEXT,
    created_at      TIMESTAMPTZ  DEFAULT NOW(),
    updated_at      TIMESTAMPTZ  DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_conversoes_status ON public.conversoes_netcdf(status);

ALTER TABLE public.conversoes_netcdf ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "conversoes_all" ON public.conversoes_netcdf;
CREATE POLICY "conversoes_all" ON public.conversoes_netcdf FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

DROP TRIGGER IF EXISTS update_conversoes_updated_at ON public.conversoes_netcdf;
CREATE TRIGGER update_conversoes_updated_at
    BEFORE UPDATE ON public.conversoes_netcdf
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TABLE IF NOT EXISTS public.kanban_colunas (
    id          UUID        DEFAULT uuid_generate_v4() PRIMARY KEY,
    titulo      VARCHAR(100) NOT NULL,
    cor         VARCHAR(20)  NOT NULL DEFAULT '#1e3a5f',
    ordem       INTEGER      NOT NULL DEFAULT 0,
    created_at  TIMESTAMPTZ  DEFAULT NOW(),
    updated_at  TIMESTAMPTZ  DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_kanban_colunas_ordem ON public.kanban_colunas(ordem);

ALTER TABLE public.kanban_colunas ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "kanban_colunas_all" ON public.kanban_colunas;
CREATE POLICY "kanban_colunas_all" ON public.kanban_colunas FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

DROP TRIGGER IF EXISTS update_kanban_colunas_updated_at ON public.kanban_colunas;
CREATE TRIGGER update_kanban_colunas_updated_at
    BEFORE UPDATE ON public.kanban_colunas
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TABLE IF NOT EXISTS public.kanban_cards (
    id          UUID        DEFAULT uuid_generate_v4() PRIMARY KEY,
    coluna_id   UUID        NOT NULL REFERENCES public.kanban_colunas(id) ON DELETE CASCADE,
    titulo      VARCHAR(255) NOT NULL,
    descricao   TEXT,
    etiquetas   JSONB        NOT NULL DEFAULT '[]',
    imagem      TEXT,
    ordem       INTEGER      NOT NULL DEFAULT 0,
    created_at  TIMESTAMPTZ  DEFAULT NOW(),
    updated_at  TIMESTAMPTZ  DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_kanban_cards_coluna_id ON public.kanban_cards(coluna_id);
CREATE INDEX IF NOT EXISTS idx_kanban_cards_ordem     ON public.kanban_cards(coluna_id, ordem);

ALTER TABLE public.kanban_cards ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "kanban_cards_all" ON public.kanban_cards;
CREATE POLICY "kanban_cards_all" ON public.kanban_cards FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

DROP TRIGGER IF EXISTS update_kanban_cards_updated_at ON public.kanban_cards;
CREATE TRIGGER update_kanban_cards_updated_at
    BEFORE UPDATE ON public.kanban_cards
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
