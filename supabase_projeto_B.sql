-- ============================================================
-- HDBN RHYTHM GAME PLATFORM — SUPABASE PROJETO B (SECUNDÁRIO)
-- Tabelas: news, beatmaps (espelho), maps (legado),
--          wiki (espelho), favorites (espelho)
--
-- Projeto B serve como:
--   • Banco de notícias/blog (news)
--   • Failover/espelho do Projeto A para leitura
--   • Banco de backup para mapas e wiki
--
-- INSTRUÇÕES
-- 1. Acesse: https://supabase.com/dashboard/project/<SEU_ID_PROJETO_B>/sql
-- 2. Cole TODO este script e clique em "Run"
-- ============================================================


-- ============================================================
-- PASSO 1: EXTENSÕES NECESSÁRIAS
-- ============================================================
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";


-- ============================================================
-- PASSO 2: TABELA news (notícias / artigos de blog HDBN)
-- Principal razão de existência do Projeto B
-- ============================================================
CREATE TABLE IF NOT EXISTS public.news (
  id           TEXT        PRIMARY KEY,
  author_id    UUID,
  author_name  TEXT        DEFAULT '',
  tag          TEXT        DEFAULT 'Novidade',
  title        TEXT        NOT NULL,
  excerpt      TEXT        DEFAULT '',
  content      TEXT        DEFAULT '',
  cover_image  TEXT        DEFAULT '',
  youtube_url  TEXT        DEFAULT '',
  created_at   TIMESTAMPTZ DEFAULT NOW(),
  updated_at   TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.news ADD COLUMN IF NOT EXISTS author_id   UUID;
ALTER TABLE public.news ADD COLUMN IF NOT EXISTS author_name TEXT DEFAULT '';
ALTER TABLE public.news ADD COLUMN IF NOT EXISTS tag         TEXT DEFAULT 'Novidade';
ALTER TABLE public.news ADD COLUMN IF NOT EXISTS excerpt     TEXT DEFAULT '';
ALTER TABLE public.news ADD COLUMN IF NOT EXISTS content     TEXT DEFAULT '';
ALTER TABLE public.news ADD COLUMN IF NOT EXISTS cover_image TEXT DEFAULT '';
ALTER TABLE public.news ADD COLUMN IF NOT EXISTS youtube_url TEXT DEFAULT '';
ALTER TABLE public.news ADD COLUMN IF NOT EXISTS updated_at  TIMESTAMPTZ DEFAULT NOW();


-- ============================================================
-- PASSO 3: TABELA beatmaps (espelho do Projeto A — failover de leitura)
-- Mantida em sincronia pelo código quando Projeto A retorna erro
-- ============================================================
CREATE TABLE IF NOT EXISTS public.beatmaps (
  id                   TEXT        PRIMARY KEY,
  mapper_id            UUID,
  mapper_name          TEXT        DEFAULT '',
  title                TEXT        NOT NULL,
  artist               TEXT        NOT NULL DEFAULT 'Artista Desconhecido',
  bpm                  NUMERIC     DEFAULT 120,
  difficulty_level     TEXT        DEFAULT 'medio',
  difficulty_name      TEXT        DEFAULT 'Médio',
  star_rating          NUMERIC     DEFAULT 2.5,
  cover_url            TEXT        DEFAULT '',
  file_url             TEXT        DEFAULT '',
  audio_preview_url    TEXT        DEFAULT '',
  audio_preview_start  NUMERIC     DEFAULT 0,
  duration_seconds     INT         DEFAULT 0,
  total_notes          INT         DEFAULT 0,
  charts               JSONB       DEFAULT '{}',
  charts_data          JSONB       DEFAULT '{}',
  tags                 TEXT[]      DEFAULT '{}',
  status               TEXT        DEFAULT 'pending',
  observation          TEXT        DEFAULT '',
  downloads_count      INT         DEFAULT 0,
  favorites_count      INT         DEFAULT 0,
  reports_count        INT         DEFAULT 0,
  created_at           TIMESTAMPTZ DEFAULT NOW(),
  updated_at           TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.beatmaps ADD COLUMN IF NOT EXISTS mapper_name        TEXT    DEFAULT '';
ALTER TABLE public.beatmaps ADD COLUMN IF NOT EXISTS audio_preview_url  TEXT    DEFAULT '';
ALTER TABLE public.beatmaps ADD COLUMN IF NOT EXISTS audio_preview_start NUMERIC DEFAULT 0;
ALTER TABLE public.beatmaps ADD COLUMN IF NOT EXISTS duration_seconds   INT     DEFAULT 0;
ALTER TABLE public.beatmaps ADD COLUMN IF NOT EXISTS total_notes        INT     DEFAULT 0;
ALTER TABLE public.beatmaps ADD COLUMN IF NOT EXISTS charts             JSONB   DEFAULT '{}';
ALTER TABLE public.beatmaps ADD COLUMN IF NOT EXISTS charts_data        JSONB   DEFAULT '{}';
ALTER TABLE public.beatmaps ADD COLUMN IF NOT EXISTS tags               TEXT[]  DEFAULT '{}';
ALTER TABLE public.beatmaps ADD COLUMN IF NOT EXISTS observation        TEXT    DEFAULT '';
ALTER TABLE public.beatmaps ADD COLUMN IF NOT EXISTS downloads_count    INT     DEFAULT 0;
ALTER TABLE public.beatmaps ADD COLUMN IF NOT EXISTS favorites_count    INT     DEFAULT 0;
ALTER TABLE public.beatmaps ADD COLUMN IF NOT EXISTS reports_count      INT     DEFAULT 0;


-- ============================================================
-- PASSO 4: TABELA maps (nome legado usado em partes do código)
-- Compatibilidade com código que usa .from("maps")
-- ============================================================
CREATE TABLE IF NOT EXISTS public.maps (
  id                TEXT        PRIMARY KEY,
  user_id           UUID,
  title             TEXT        NOT NULL,
  artist            TEXT        DEFAULT 'Artista Desconhecido',
  bpm               NUMERIC     DEFAULT 120,
  difficulties      TEXT[]      DEFAULT '{}',
  audio_url         TEXT        DEFAULT '',
  cover_url         TEXT        DEFAULT '',
  package_url       TEXT        DEFAULT '',
  map_hash          TEXT        UNIQUE,
  status            TEXT        DEFAULT 'pending'
                                CHECK (status IN ('pending','approved','suspended')),
  observation       TEXT        DEFAULT '',
  downloads         INT         DEFAULT 0,
  likes_count       INT         DEFAULT 0,
  reports_count     INT         DEFAULT 0,
  ui_file           TEXT        DEFAULT '',
  art_file          TEXT        DEFAULT '',
  audio_preview_start NUMERIC   DEFAULT 0,
  sfx_files         TEXT[]      DEFAULT '{}',
  created_at        TIMESTAMPTZ DEFAULT NOW(),
  updated_at        TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.maps DROP CONSTRAINT IF EXISTS maps_user_id_fkey;

ALTER TABLE public.maps ADD COLUMN IF NOT EXISTS map_hash           TEXT    UNIQUE;
ALTER TABLE public.maps ADD COLUMN IF NOT EXISTS observation        TEXT    DEFAULT '';
ALTER TABLE public.maps ADD COLUMN IF NOT EXISTS audio_preview_start NUMERIC DEFAULT 0;
ALTER TABLE public.maps ADD COLUMN IF NOT EXISTS sfx_files          TEXT[]  DEFAULT '{}';
ALTER TABLE public.maps ADD COLUMN IF NOT EXISTS ui_file            TEXT    DEFAULT '';
ALTER TABLE public.maps ADD COLUMN IF NOT EXISTS art_file           TEXT    DEFAULT '';


-- ============================================================
-- PASSO 5: TABELA users (espelho do Projeto A — só perfis públicos)
-- Sem senha. Usada como failover de leitura.
-- ============================================================
CREATE TABLE IF NOT EXISTS public.users (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  username      TEXT        NOT NULL UNIQUE,
  email         TEXT        UNIQUE,
  bio           TEXT        DEFAULT '',
  avatar_url    TEXT        DEFAULT '',
  discord_tag   TEXT        DEFAULT '',
  role          TEXT        DEFAULT 'player',
  is_dev        BOOLEAN     DEFAULT FALSE,
  is_admin_apto BOOLEAN     DEFAULT FALSE,
  is_writer     BOOLEAN     DEFAULT FALSE,
  is_streamer   BOOLEAN     DEFAULT FALSE,
  status        TEXT        DEFAULT 'active',
  infraction_count INT      DEFAULT 0,
  last_login    TIMESTAMPTZ DEFAULT NOW(),
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.users DROP COLUMN IF EXISTS password;
ALTER TABLE public.users DROP CONSTRAINT IF EXISTS users_id_fkey;


-- ============================================================
-- PASSO 6: TABELA favorites (espelho do Projeto A)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.favorites (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID        NOT NULL,
  beatmap_id TEXT        NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, beatmap_id)
);

ALTER TABLE public.favorites DROP CONSTRAINT IF EXISTS favorites_user_id_fkey;
ALTER TABLE public.favorites DROP CONSTRAINT IF EXISTS favorites_beatmap_id_fkey;


-- ============================================================
-- PASSO 7: TABELA wiki (espelho do Projeto A)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.wiki (
  id          TEXT        PRIMARY KEY,
  author_id   UUID,
  author_name TEXT        DEFAULT '',
  category    TEXT        DEFAULT 'Geral',
  title       TEXT        NOT NULL,
  slug        TEXT        NOT NULL UNIQUE,
  content     TEXT        DEFAULT '',
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);


-- ============================================================
-- PASSO 8: DESATIVAR RLS EM TODAS AS TABELAS
-- ============================================================
DO $$
DECLARE
  pol RECORD;
BEGIN
  FOR pol IN
    SELECT tablename, policyname
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename IN ('news','beatmaps','maps','users','favorites','wiki')
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', pol.policyname, pol.tablename);
  END LOOP;
END $$;

ALTER TABLE public.news      DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.beatmaps  DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.maps      DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.users     DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.favorites DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.wiki      DISABLE ROW LEVEL SECURITY;


-- ============================================================
-- PASSO 9: PERMISSÕES
-- ============================================================
GRANT ALL ON public.news      TO anon, authenticated;
GRANT ALL ON public.beatmaps  TO anon, authenticated;
GRANT ALL ON public.maps      TO anon, authenticated;
GRANT ALL ON public.users     TO anon, authenticated;
GRANT ALL ON public.favorites TO anon, authenticated;
GRANT ALL ON public.wiki      TO anon, authenticated;


-- ============================================================
-- PASSO 10: CONFIRMAR EMAILS DE USUÁRIOS EXISTENTES
-- ============================================================
UPDATE auth.users
SET email_confirmed_at = COALESCE(email_confirmed_at, NOW()),
    updated_at = NOW()
WHERE email_confirmed_at IS NULL;


-- ============================================================
-- PASSO 11: VERIFICAÇÃO FINAL
-- ============================================================
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name IN ('news','beatmaps','maps','users','favorites','wiki')
ORDER BY table_name;
