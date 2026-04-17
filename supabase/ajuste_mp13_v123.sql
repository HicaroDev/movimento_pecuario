-- MP13 v1.23 — Migrações de banco
-- Executar via SQL Editor do Supabase ou pg-meta API

-- 1. Adicionar coluna meta_pct em supplement_types (meta de consumo editável)
ALTER TABLE public.supplement_types
  ADD COLUMN IF NOT EXISTS meta_pct text;

-- 2. Adicionar coluna user_name em manejo_historico (já pode existir — seguro com IF NOT EXISTS)
ALTER TABLE public.manejo_historico
  ADD COLUMN IF NOT EXISTS user_name text;

-- Verificação
SELECT column_name, data_type FROM information_schema.columns
WHERE table_name IN ('supplement_types', 'manejo_historico')
  AND column_name IN ('meta_pct', 'user_name');
