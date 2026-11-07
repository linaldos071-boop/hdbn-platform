-- ============================================================
-- HDBN PLATFORM — ATUALIZAÇÃO ANTI-SPAM & HASH SHA-256
-- Execute no SQL Editor do Supabase (Projeto A e Projeto B)
-- ============================================================

-- 1. Detecção de Mapas Duplicados via Hash Criptográfico na tabela beatmaps
ALTER TABLE public.beatmaps ADD COLUMN IF NOT EXISTS map_hash VARCHAR(64);
CREATE UNIQUE INDEX IF NOT EXISTS beatmaps_map_hash_idx ON public.beatmaps (map_hash) WHERE map_hash IS NOT NULL AND map_hash <> '';

-- 2. Controle de Limite Diário de Envios e Tentativas Suspeitas na tabela users
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS uploads_today_count      INT         DEFAULT 0;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS last_upload_date         DATE        DEFAULT CURRENT_DATE;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS custom_upload_limit      INT         DEFAULT NULL;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS is_trusted_creator       BOOLEAN     DEFAULT FALSE;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS duplicate_attempts_count INT         DEFAULT 0;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS ban_expires_at           TIMESTAMPTZ DEFAULT NULL;

-- 3. Permissões
GRANT ALL ON public.beatmaps TO anon, authenticated;
GRANT ALL ON public.users TO anon, authenticated;

-- Verificação rápida
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'beatmaps' AND column_name = 'map_hash';

SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'users' AND column_name IN ('uploads_today_count', 'last_upload_date', 'custom_upload_limit', 'duplicate_attempts_count', 'ban_expires_at');
