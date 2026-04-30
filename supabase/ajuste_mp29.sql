-- MP29 — Ajustes 29 Abril 2026
-- Executar via SQL Editor do Supabase ou pg-meta API

-- A-07: categoria do simulador em supplement_types
ALTER TABLE public.supplement_types
  ADD COLUMN IF NOT EXISTS categoria_simulador text;

-- A-14: ganho médio diário e data de entrada em animals
ALTER TABLE public.animals
  ADD COLUMN IF NOT EXISTS gmd numeric;

ALTER TABLE public.animals
  ADD COLUMN IF NOT EXISTS data_entrada date;

-- A-15: lote(s) vinculados no momento do lançamento
ALTER TABLE public.data_entries
  ADD COLUMN IF NOT EXISTS lote text;

-- Verificação
SELECT table_name, column_name, data_type
FROM information_schema.columns
WHERE table_name IN ('supplement_types', 'animals', 'data_entries')
  AND column_name IN ('categoria_simulador', 'gmd', 'data_entrada', 'lote')
ORDER BY table_name, column_name;
