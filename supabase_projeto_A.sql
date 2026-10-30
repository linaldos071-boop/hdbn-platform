-- ============================================================
-- HDBN RHYTHM GAME PLATFORM — SUPABASE PROJETO A (PRIMÁRIO)
-- Tabelas: users, beatmaps, scores, favorites, punishments,
--          wiki, system_settings
--
-- INSTRUÇÕES:
-- 1. Acesse: https://supabase.com/dashboard/project/<SEU_ID_PROJETO_A>/sql
-- 2. Cole TODO este script e clique em "Run"
-- 3. As senhas NUNCA ficam aqui — elas vivem em auth.users (Supabase Auth)
-- ============================================================


-- ============================================================
-- PASSO 1: EXTENSÕES NECESSÁRIAS
-- ============================================================
CREATE EXTENSION IF NOT EXISTS "pgcrypto";   -- gen_random_uuid()
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";  -- uuid_generate_v4()


-- ============================================================
-- PASSO 2: TABELA users (perfis públicos — SEM SENHA)
-- A autenticação (email + senha com hash bcrypt) fica em auth.users
-- ============================================================
CREATE TABLE IF NOT EXISTS public.users (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  username      TEXT        NOT NULL UNIQUE,
  email         TEXT        UNIQUE,
  bio           TEXT        DEFAULT '',
  avatar_url    TEXT        DEFAULT '',
  discord_tag   TEXT        DEFAULT '',
  role          TEXT        DEFAULT 'player'
                            CHECK (role IN ('player', 'mod', 'writer', 'admin', 'dev')),
  is_dev        BOOLEAN     DEFAULT FALSE,
  is_admin_apto BOOLEAN     DEFAULT FALSE,
  is_writer     BOOLEAN     DEFAULT FALSE,
  is_streamer   BOOLEAN     DEFAULT FALSE,
  status        TEXT        DEFAULT 'active'
                            CHECK (status IN ('active', 'suspended', 'banned')),
  infraction_count INT      DEFAULT 0,
  last_login    TIMESTAMPTZ DEFAULT NOW(),
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- Remove coluna de senha caso já exista de versões antigas
ALTER TABLE public.users DROP COLUMN IF EXISTS password;

-- Remove chave estrangeira antiga que bloqueava sincronização com auth.users
ALTER TABLE public.users DROP CONSTRAINT IF EXISTS users_id_fkey;

-- Garantir colunas adicionais (seguro para rodar em tabela já existente)
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS bio           TEXT    DEFAULT '';
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS discord_tag   TEXT    DEFAULT '';
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS role          TEXT    DEFAULT 'player';
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS is_dev        BOOLEAN DEFAULT FALSE;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS is_admin_apto BOOLEAN DEFAULT FALSE;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS is_writer     BOOLEAN DEFAULT FALSE;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS is_streamer   BOOLEAN DEFAULT FALSE;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS status        TEXT    DEFAULT 'active';
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS infraction_count INT  DEFAULT 0;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS last_login    TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS avatar_url    TEXT    DEFAULT '';


-- ============================================================
-- PASSO 3: TABELA beatmaps (mapas .hbn publicados)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.beatmaps (
  id                   TEXT        PRIMARY KEY,
  mapper_id            UUID,       -- id do usuário autor (sem FK rígida)
  mapper_name          TEXT        DEFAULT '',
  title                TEXT        NOT NULL,
  artist               TEXT        NOT NULL DEFAULT 'Artista Desconhecido',
  bpm                  NUMERIC     DEFAULT 120,
  difficulty_level     TEXT        DEFAULT 'medio'
                                   CHECK (difficulty_level IN ('facil','medio','hard','expert','extreme')),
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
  status               TEXT        DEFAULT 'pending'
                                   CHECK (status IN ('pending','ranked','unranked','hidden','suspended')),
  observation          TEXT        DEFAULT '',
  downloads_count      INT         DEFAULT 0,
  favorites_count      INT         DEFAULT 0,
  reports_count        INT         DEFAULT 0,
  created_at           TIMESTAMPTZ DEFAULT NOW(),
  updated_at           TIMESTAMPTZ DEFAULT NOW()
);

-- Remove FK antiga que bloqueava inserções
ALTER TABLE public.beatmaps DROP CONSTRAINT IF EXISTS beatmaps_mapper_id_fkey;

-- Garantir colunas adicionais
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
-- PASSO 4: TABELA scores (pontuações dos jogadores)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.scores (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID        NOT NULL,
  beatmap_id  TEXT        NOT NULL,
  score       BIGINT      DEFAULT 0,
  accuracy    NUMERIC     DEFAULT 0,     -- 0 a 100
  max_combo   INT         DEFAULT 0,
  miss_count  INT         DEFAULT 0,
  rank_grade  TEXT        DEFAULT 'C',   -- SS+, SS, S, A, B, C
  mods        TEXT[]      DEFAULT '{}',
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.scores DROP CONSTRAINT IF EXISTS scores_user_id_fkey;
ALTER TABLE public.scores DROP CONSTRAINT IF EXISTS scores_beatmap_id_fkey;

ALTER TABLE public.scores ADD COLUMN IF NOT EXISTS max_combo  INT  DEFAULT 0;
ALTER TABLE public.scores ADD COLUMN IF NOT EXISTS miss_count INT  DEFAULT 0;
ALTER TABLE public.scores ADD COLUMN IF NOT EXISTS rank_grade TEXT DEFAULT 'C';
ALTER TABLE public.scores ADD COLUMN IF NOT EXISTS mods       TEXT[] DEFAULT '{}';


-- ============================================================
-- PASSO 5: TABELA favorites (mapas favoritos por usuário)
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
-- PASSO 6: TABELA punishments (histórico de punições)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.punishments (
  id         TEXT        PRIMARY KEY DEFAULT ('pun_' || extract(epoch from now())::text),
  user_id    UUID        NOT NULL,
  applied_by UUID,
  type       TEXT        NOT NULL
                         CHECK (type IN ('warning', 'suspension', 'ban')),
  reason     TEXT        DEFAULT 'Infração dos termos da comunidade.',
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.punishments DROP CONSTRAINT IF EXISTS punishments_user_id_fkey;
ALTER TABLE public.punishments DROP CONSTRAINT IF EXISTS punishments_applied_by_fkey;


-- ============================================================
-- PASSO 7: TABELA wiki (artigos da wiki HDBN)
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
-- PASSO 8: TABELA system_settings (configurações do sistema)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.system_settings (
  key        TEXT        PRIMARY KEY,
  value      TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);


-- ============================================================
-- PASSO 9: DESATIVAR RLS EM TODAS AS TABELAS
-- (acesso público controlado pelo código — sem policies conflitantes)
-- ============================================================

-- Remover todas as policies existentes (dinâmico)
DO $$
DECLARE
  pol RECORD;
BEGIN
  FOR pol IN
    SELECT tablename, policyname
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename IN ('users','beatmaps','scores','favorites','punishments','wiki','system_settings')
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', pol.policyname, pol.tablename);
  END LOOP;
END $$;

ALTER TABLE public.users           DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.beatmaps        DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.scores          DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.favorites       DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.punishments     DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.wiki            DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_settings DISABLE ROW LEVEL SECURITY;


-- ============================================================
-- PASSO 10: PERMISSÕES PARA anon E authenticated
-- ============================================================
GRANT ALL ON public.users           TO anon, authenticated;
GRANT ALL ON public.beatmaps        TO anon, authenticated;
GRANT ALL ON public.scores          TO anon, authenticated;
GRANT ALL ON public.favorites       TO anon, authenticated;
GRANT ALL ON public.punishments     TO anon, authenticated;
GRANT ALL ON public.wiki            TO anon, authenticated;
GRANT ALL ON public.system_settings TO anon, authenticated;


-- ============================================================
-- PASSO 11: CONFIRMAR EMAIL DE TODOS OS USUÁRIOS JÁ EXISTENTES
-- (evita que contas antigas fiquem travadas aguardando confirmação)
-- ============================================================
UPDATE auth.users
SET email_confirmed_at = COALESCE(email_confirmed_at, NOW()),
    updated_at = NOW()
WHERE email_confirmed_at IS NULL;


-- ============================================================
-- PASSO 12: FUNÇÕES RPC ÚTEIS
-- ============================================================

-- Incrementa o contador de downloads de um beatmap
CREATE OR REPLACE FUNCTION public.increment_downloads(beatmap_id TEXT)
RETURNS VOID AS $$
BEGIN
  UPDATE public.beatmaps
  SET downloads_count = downloads_count + 1
  WHERE id = beatmap_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Incrementa o contador de favoritos de um beatmap
CREATE OR REPLACE FUNCTION public.increment_favorites(beatmap_id TEXT, delta INT DEFAULT 1)
RETURNS VOID AS $$
BEGIN
  UPDATE public.beatmaps
  SET favorites_count = GREATEST(0, favorites_count + delta)
  WHERE id = beatmap_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Incrementa o contador de reports de um beatmap
CREATE OR REPLACE FUNCTION public.increment_reports(beatmap_id TEXT)
RETURNS VOID AS $$
BEGIN
  UPDATE public.beatmaps
  SET reports_count = reports_count + 1
  WHERE id = beatmap_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Adiciona +1 infração ao usuário
CREATE OR REPLACE FUNCTION public.add_infraction(target_user_id UUID)
RETURNS INT AS $$
DECLARE
  new_count INT;
BEGIN
  UPDATE public.users
  SET infraction_count = infraction_count + 1
  WHERE id = target_user_id
  RETURNING infraction_count INTO new_count;
  RETURN COALESCE(new_count, 0);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.increment_downloads   TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.increment_favorites   TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.increment_reports     TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.add_infraction        TO anon, authenticated;


-- ============================================================
-- PASSO 13: VERIFICAÇÃO FINAL
-- O resultado abaixo deve mostrar as tabelas criadas.
-- ============================================================
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name IN ('users','beatmaps','scores','favorites','punishments','wiki','system_settings')
ORDER BY table_name;

-- Confirmar que NÃO existe coluna "password" em users:
SELECT column_name FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'users' AND column_name = 'password';
-- ↑ deve retornar 0 linhas (vazio)
