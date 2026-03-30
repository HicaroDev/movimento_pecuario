-- =====================================================================
-- RLS Auditoria v2.0.0 — Correção R-03
-- Ativa RLS + políticas corretas em tabelas legadas (animals,
-- supplement_types, manejo_historico, animal_categories, employees)
-- e adiciona policies de escrita para clientes nas tabelas novas.
--
-- Execute no SQL Editor do Supabase ANTES de rodar rpc_confirmar_os_v100.sql
-- =====================================================================

-- ── 1. Helper: farm_ids[] corrigido (considera array multi-fazenda) ──
CREATE OR REPLACE FUNCTION public.user_farm_ids()
RETURNS uuid[]
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT ARRAY(
    SELECT DISTINCT f
    FROM (
      SELECT unnest(COALESCE(farm_ids, ARRAY[]::uuid[])) AS f
        FROM public.profiles WHERE id = auth.uid()
      UNION
      SELECT farm_id AS f
        FROM public.profiles WHERE id = auth.uid() AND farm_id IS NOT NULL
    ) sub
  )
$$;

-- ── 2. Policy: usuário pode ler o próprio profile (fetchProfile via anon) ──
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'profiles'
      AND policyname = 'profiles_self_select'
  ) THEN
    CREATE POLICY profiles_self_select
      ON public.profiles FOR SELECT
      USING (id = auth.uid());
  END IF;
END$$;

-- ── 3. Ativar RLS nas tabelas legadas ─────────────────────────────────
ALTER TABLE public.animals             ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.supplement_types    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.manejo_historico    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.animal_categories   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.employees           ENABLE ROW LEVEL SECURITY;

-- ── 4. animals ────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "admin_all_animals"   ON public.animals;
DROP POLICY IF EXISTS "client_read_animals" ON public.animals;
DROP POLICY IF EXISTS "client_all_animals"  ON public.animals;

CREATE POLICY "admin_all_animals"
  ON public.animals FOR ALL
  USING (public.my_role() = 'admin');

CREATE POLICY "client_all_animals"
  ON public.animals FOR ALL
  USING  (farm_id = ANY(public.user_farm_ids()))
  WITH CHECK (farm_id = ANY(public.user_farm_ids()));

-- ── 5. supplement_types ───────────────────────────────────────────────
DROP POLICY IF EXISTS "admin_all_supplement_types"   ON public.supplement_types;
DROP POLICY IF EXISTS "client_read_supplement_types" ON public.supplement_types;
DROP POLICY IF EXISTS "client_all_supplement_types"  ON public.supplement_types;

CREATE POLICY "admin_all_supplement_types"
  ON public.supplement_types FOR ALL
  USING (public.my_role() = 'admin');

CREATE POLICY "client_all_supplement_types"
  ON public.supplement_types FOR ALL
  USING  (farm_id = ANY(public.user_farm_ids()))
  WITH CHECK (farm_id = ANY(public.user_farm_ids()));

-- ── 6. manejo_historico ───────────────────────────────────────────────
DROP POLICY IF EXISTS "admin_all_manejo_historico"   ON public.manejo_historico;
DROP POLICY IF EXISTS "client_read_manejo_historico" ON public.manejo_historico;
DROP POLICY IF EXISTS "client_all_manejo_historico"  ON public.manejo_historico;

CREATE POLICY "admin_all_manejo_historico"
  ON public.manejo_historico FOR ALL
  USING (public.my_role() = 'admin');

CREATE POLICY "client_all_manejo_historico"
  ON public.manejo_historico FOR ALL
  USING  (farm_id = ANY(public.user_farm_ids()))
  WITH CHECK (farm_id = ANY(public.user_farm_ids()));

-- ── 7. animal_categories ──────────────────────────────────────────────
DROP POLICY IF EXISTS "admin_all_animal_categories"  ON public.animal_categories;
DROP POLICY IF EXISTS "client_all_animal_categories" ON public.animal_categories;

CREATE POLICY "admin_all_animal_categories"
  ON public.animal_categories FOR ALL
  USING (public.my_role() = 'admin');

CREATE POLICY "client_all_animal_categories"
  ON public.animal_categories FOR ALL
  USING  (farm_id = ANY(public.user_farm_ids()))
  WITH CHECK (farm_id = ANY(public.user_farm_ids()));

-- ── 8. employees ──────────────────────────────────────────────────────
DROP POLICY IF EXISTS "admin_all_employees"  ON public.employees;
DROP POLICY IF EXISTS "client_all_employees" ON public.employees;

CREATE POLICY "admin_all_employees"
  ON public.employees FOR ALL
  USING (public.my_role() = 'admin');

CREATE POLICY "client_all_employees"
  ON public.employees FOR ALL
  USING  (farm_id = ANY(public.user_farm_ids()))
  WITH CHECK (farm_id = ANY(public.user_farm_ids()));

-- ── 9. solicitacoes_compra — adicionar write para clientes ────────────
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'solicitacoes_compra'
      AND policyname = 'client_insert_solicitacoes'
  ) THEN
    CREATE POLICY "client_insert_solicitacoes"
      ON public.solicitacoes_compra FOR INSERT
      WITH CHECK (farm_id = ANY(public.user_farm_ids()));
  END IF;
END$$;

-- ── 10. Verificação final ─────────────────────────────────────────────
SELECT
  tablename,
  rowsecurity AS rls_ativo
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN (
    'farms','profiles','pastures','data_entries',
    'animals','supplement_types','manejo_historico',
    'animal_categories','employees',
    'ordens_suplemento','ordens_suplemento_itens',
    'estoque_movimentos','livro_caixa','solicitacoes_compra'
  )
ORDER BY tablename;
-- Todos devem mostrar rls_ativo = true
