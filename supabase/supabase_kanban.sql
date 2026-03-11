CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE IF NOT EXISTS public.kanban_colunas (
    id          UUID        DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id     UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    titulo      VARCHAR(100) NOT NULL,
    cor         VARCHAR(20)  NOT NULL DEFAULT '#1e3a5f',
    ordem       INTEGER      NOT NULL DEFAULT 0,
    created_at  TIMESTAMPTZ  DEFAULT NOW(),
    updated_at  TIMESTAMPTZ  DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_kanban_colunas_user_id ON public.kanban_colunas(user_id);
CREATE INDEX IF NOT EXISTS idx_kanban_colunas_ordem   ON public.kanban_colunas(user_id, ordem);

ALTER TABLE public.kanban_colunas ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "kanban_colunas_select" ON public.kanban_colunas;
CREATE POLICY "kanban_colunas_select"
    ON public.kanban_colunas FOR SELECT
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "kanban_colunas_insert" ON public.kanban_colunas;
CREATE POLICY "kanban_colunas_insert"
    ON public.kanban_colunas FOR INSERT
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "kanban_colunas_update" ON public.kanban_colunas;
CREATE POLICY "kanban_colunas_update"
    ON public.kanban_colunas FOR UPDATE
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "kanban_colunas_delete" ON public.kanban_colunas;
CREATE POLICY "kanban_colunas_delete"
    ON public.kanban_colunas FOR DELETE
    USING (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS public.kanban_cards (
    id          UUID        DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id     UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    coluna_id   UUID        NOT NULL REFERENCES public.kanban_colunas(id) ON DELETE CASCADE,
    titulo      VARCHAR(255) NOT NULL,
    descricao   TEXT,
    etiquetas   JSONB        NOT NULL DEFAULT '[]',
    imagem      TEXT,
    ordem       INTEGER      NOT NULL DEFAULT 0,
    created_at  TIMESTAMPTZ  DEFAULT NOW(),
    updated_at  TIMESTAMPTZ  DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_kanban_cards_user_id   ON public.kanban_cards(user_id);
CREATE INDEX IF NOT EXISTS idx_kanban_cards_coluna_id ON public.kanban_cards(coluna_id);
CREATE INDEX IF NOT EXISTS idx_kanban_cards_ordem     ON public.kanban_cards(coluna_id, ordem);

ALTER TABLE public.kanban_cards ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "kanban_cards_select" ON public.kanban_cards;
CREATE POLICY "kanban_cards_select"
    ON public.kanban_cards FOR SELECT
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "kanban_cards_insert" ON public.kanban_cards;
CREATE POLICY "kanban_cards_insert"
    ON public.kanban_cards FOR INSERT
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "kanban_cards_update" ON public.kanban_cards;
CREATE POLICY "kanban_cards_update"
    ON public.kanban_cards FOR UPDATE
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "kanban_cards_delete" ON public.kanban_cards;
CREATE POLICY "kanban_cards_delete"
    ON public.kanban_cards FOR DELETE
    USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_kanban_colunas_updated_at ON public.kanban_colunas;
CREATE TRIGGER update_kanban_colunas_updated_at
    BEFORE UPDATE ON public.kanban_colunas
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_kanban_cards_updated_at ON public.kanban_cards;
CREATE TRIGGER update_kanban_cards_updated_at
    BEFORE UPDATE ON public.kanban_cards
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
