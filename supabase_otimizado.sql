-- ============================================================================
-- HDBN RHYTHM GAME PLATFORM — SCHEMA OTIMIZADO PARA SUPABASE
-- ============================================================================
-- Instruções:
-- 1. Acesse o painel do seu projeto no Supabase: https://supabase.com/dashboard
-- 2. No menu lateral esquerdo, clique em "SQL Editor"
-- 3. Crie uma "New query", cole TODO este arquivo e clique no botão "Run"
-- ============================================================================

-- PASSO 1: Extensões essenciais
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- PASSO 2: TABELA DE USUÁRIOS (public.users)
-- ============================================================================
-- Cria a tabela com colunas limpas (sem colunas inúteis ou senhas em texto puro)
CREATE TABLE IF NOT EXISTS public.users (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username            TEXT NOT NULL UNIQUE,
  email               TEXT UNIQUE,
  bio                 TEXT DEFAULT '',
  avatar_url          TEXT DEFAULT '',
  discord_tag         TEXT DEFAULT '',
  
  -- Links de Transmissão / Canais (Streamers)
  stream_kick         TEXT DEFAULT '',
  stream_twitch       TEXT DEFAULT '',
  stream_youtube      TEXT DEFAULT '',
  
  -- Permissões e Hierarquia
  role                TEXT DEFAULT 'player' CHECK (role IN ('player', 'mod', 'writer', 'admin', 'dev')),
  is_dev              BOOLEAN DEFAULT FALSE,
  status              TEXT DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'banned')),
  infraction_count    INT DEFAULT 0,
  
  -- Limite Diário de Publicação
  uploads_today_count INT DEFAULT 0,
  last_upload_date    DATE DEFAULT CURRENT_DATE,
  custom_upload_limit INT DEFAULT NULL,
  
  -- Auditoria e Datas
  created_at          TIMESTAMPTZ DEFAULT NOW(),
  last_login          TIMESTAMPTZ DEFAULT NOW()
);

-- Se a tabela já existia, garante que novas colunas de stream estejam presentes:
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS stream_kick    TEXT DEFAULT '';
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS stream_twitch  TEXT DEFAULT '';
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS stream_youtube TEXT DEFAULT '';
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS created_at     TIMESTAMPTZ DEFAULT NOW();

-- Limpeza: remove colunas redundantes ou inúteis para economizar espaço e simplificar o banco
ALTER TABLE public.users DROP COLUMN IF EXISTS password;
ALTER TABLE public.users DROP COLUMN IF EXISTS is_streamer;
ALTER TABLE public.users DROP COLUMN IF EXISTS is_writer;
ALTER TABLE public.users DROP COLUMN IF EXISTS is_admin_apto;
ALTER TABLE public.users DROP COLUMN IF EXISTS duplicate_attempts_count;

-- ============================================================================
-- PASSO 3: TABELA DE BEATMAPS (public.beatmaps)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.beatmaps (
  id                  TEXT PRIMARY KEY,
  mapper_id           UUID,
  mapper_name         TEXT DEFAULT '',
  title               TEXT NOT NULL,
  artist              TEXT NOT NULL DEFAULT 'Artista Desconhecido',
  bpm                 NUMERIC DEFAULT 120,
  difficulty_level    TEXT DEFAULT 'medio' CHECK (difficulty_level IN ('facil','medio','hard','expert','extreme')),
  difficulty_name     TEXT DEFAULT 'Médio',
  star_rating         NUMERIC DEFAULT 2.5,
  cover_url           TEXT DEFAULT '',
  file_url            TEXT DEFAULT '',
  audio_preview_url   TEXT DEFAULT '',
  audio_preview_start NUMERIC DEFAULT 0,
  duration_seconds    INT DEFAULT 0,
  total_notes         INT DEFAULT 0,
  charts              JSONB DEFAULT '{}',
  charts_data         JSONB DEFAULT '{}',
  status              TEXT DEFAULT 'pending' CHECK (status IN ('pending','approved_ranked','approved_unranked','ranked','unranked','suspended','deleted')),
  downloads_count     INT DEFAULT 0,
  favorites_count     INT DEFAULT 0,
  created_at          TIMESTAMPTZ DEFAULT NOW()
);

-- Garante as colunas de métricas e remove tags inúteis
ALTER TABLE public.beatmaps ADD COLUMN IF NOT EXISTS downloads_count INT DEFAULT 0;
ALTER TABLE public.beatmaps ADD COLUMN IF NOT EXISTS favorites_count INT DEFAULT 0;
ALTER TABLE public.beatmaps DROP COLUMN IF EXISTS tags;

-- ============================================================================
-- PASSO 4: TABELA DE FAVORITOS (public.favorites)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.favorites (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id             UUID NOT NULL,
  beatmap_id          TEXT NOT NULL,
  created_at          TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, beatmap_id)
);

-- ============================================================================
-- PASSO 5: TABELA DE PONTUAÇÕES / SCORES (public.scores)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.scores (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id             UUID NOT NULL,
  beatmap_id          TEXT NOT NULL,
  score               INT NOT NULL DEFAULT 0,
  accuracy            NUMERIC DEFAULT 0,
  max_combo           INT DEFAULT 0,
  rank_grade          TEXT DEFAULT 'C',
  mode                TEXT DEFAULT 'normal' CHECK (mode IN ('normal', 'pro')),
  created_at          TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- PASSO 6: ÍNDICES DE PERFORMANCE (Buscas ultra rápidas na plataforma)
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_beatmaps_status ON public.beatmaps(status);
CREATE INDEX IF NOT EXISTS idx_beatmaps_downloads ON public.beatmaps(downloads_count DESC);
CREATE INDEX IF NOT EXISTS idx_beatmaps_favorites ON public.beatmaps(favorites_count DESC);
CREATE INDEX IF NOT EXISTS idx_beatmaps_mapper ON public.beatmaps(mapper_name);
CREATE INDEX IF NOT EXISTS idx_favorites_user ON public.favorites(user_id);
CREATE INDEX IF NOT EXISTS idx_favorites_map ON public.favorites(beatmap_id);
CREATE INDEX IF NOT EXISTS idx_scores_user ON public.scores(user_id);

-- ============================================================================
-- PASSO 7: SEGURANÇA E POLÍTICAS RLS (Row Level Security)
-- ============================================================================
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.beatmaps ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.favorites ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scores ENABLE ROW LEVEL SECURITY;

-- Políticas de Leitura Pública (Qualquer visitante pode visualizar mapas, perfis e rankings)
DROP POLICY IF EXISTS "Permitir leitura publica de usuarios" ON public.users;
CREATE POLICY "Permitir leitura publica de usuarios" ON public.users FOR SELECT USING (true);

DROP POLICY IF EXISTS "Permitir leitura publica de beatmaps" ON public.beatmaps;
CREATE POLICY "Permitir leitura publica de beatmaps" ON public.beatmaps FOR SELECT USING (true);

DROP POLICY IF EXISTS "Permitir leitura publica de favoritos" ON public.favorites;
CREATE POLICY "Permitir leitura publica de favoritos" ON public.favorites FOR SELECT USING (true);

DROP POLICY IF EXISTS "Permitir leitura publica de scores" ON public.scores;
CREATE POLICY "Permitir leitura publica de scores" ON public.scores FOR SELECT USING (true);

-- Políticas de Escrita / Atualização
DROP POLICY IF EXISTS "Permitir criacao e edicao de usuarios" ON public.users;
CREATE POLICY "Permitir criacao e edicao de usuarios" ON public.users FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Permitir manipulacao de beatmaps" ON public.beatmaps;
CREATE POLICY "Permitir manipulacao de beatmaps" ON public.beatmaps FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Permitir manipulacao de favoritos" ON public.favorites;
CREATE POLICY "Permitir manipulacao de favoritos" ON public.favorites FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Permitir registro de scores" ON public.scores;
CREATE POLICY "Permitir registro de scores" ON public.scores FOR ALL USING (true) WITH CHECK (true);

-- Sucesso!
SELECT 'Schema otimizado aplicado com sucesso no HDBN!' AS status;
