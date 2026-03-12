-- ajustes_v119.sql — Permissões granulares + Activity Log + user_name em manejo_historico

-- 1. Permissões granulares de módulos nos profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS module_permissions jsonb;

-- 2. Tabela de audit log
CREATE TABLE IF NOT EXISTS activity_log (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  farm_id     uuid        REFERENCES farms(id) ON DELETE SET NULL,
  user_id     uuid,
  user_name   text        NOT NULL DEFAULT '',
  module      text        NOT NULL,
  action      text        NOT NULL,
  description text        NOT NULL,
  created_at  timestamptz DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_activity_log_farm_created ON activity_log(farm_id, created_at DESC);

-- 3. Adiciona user_name e user_id ao manejo_historico (se não existir)
ALTER TABLE manejo_historico ADD COLUMN IF NOT EXISTS user_id   uuid;
ALTER TABLE manejo_historico ADD COLUMN IF NOT EXISTS user_name text;
