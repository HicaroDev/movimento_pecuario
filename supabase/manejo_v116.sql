-- ═══════════════════════════════════════════════════════════════
--  manejo_v116.sql — Módulo Manejos
--  Idempotente: pode rodar mais de uma vez sem quebrar nada
--  Rodar em: https://saas-supabase.bj3amt.easypanel.host → SQL Editor
-- ═══════════════════════════════════════════════════════════════


-- ── PASSO 1: Colunas novas em animals ──────────────────────────

ALTER TABLE public.animals
  ADD COLUMN IF NOT EXISTS pasto_id uuid REFERENCES public.pastures(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS status   text NOT NULL DEFAULT 'ativo';
-- status: 'ativo' | 'abatido' | 'vendido'


-- ── PASSO 2: Tabela manejo_historico ───────────────────────────

CREATE TABLE IF NOT EXISTS public.manejo_historico (
  id                uuid        PRIMARY KEY DEFAULT uuid_generate_v4(),
  farm_id           uuid        NOT NULL REFERENCES public.farms(id) ON DELETE CASCADE,
  animal_id         uuid        NOT NULL REFERENCES public.animals(id) ON DELETE CASCADE,
  tipo              text        NOT NULL,
  -- tipos: 'alocacao' | 'transferencia' | 'evolucao_categoria' | 'abate' | 'ajuste_quantidade'
  descricao         text,
  pasto_origem      uuid        REFERENCES public.pastures(id),
  pasto_destino     uuid        REFERENCES public.pastures(id),
  categoria_origem  uuid        REFERENCES public.animal_categories(id),
  categoria_destino uuid        REFERENCES public.animal_categories(id),
  quantidade        integer,
  peso_medio        numeric,
  created_at        timestamptz NOT NULL DEFAULT now()
);


-- ── PASSO 3: RLS em manejo_historico ───────────────────────────

ALTER TABLE public.manejo_historico ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "admin vê todo histórico de manejo"            ON public.manejo_historico;
DROP POLICY IF EXISTS "cliente vê histórico de manejo da fazenda"    ON public.manejo_historico;
DROP POLICY IF EXISTS "admin gerencia histórico de manejo"           ON public.manejo_historico;
DROP POLICY IF EXISTS "cliente gerencia histórico de manejo"         ON public.manejo_historico;

CREATE POLICY "admin vê todo histórico de manejo"
  ON public.manejo_historico FOR SELECT USING (public.my_role() = 'admin');

CREATE POLICY "cliente vê histórico de manejo da fazenda"
  ON public.manejo_historico FOR SELECT USING (farm_id = public.my_farm_id());

CREATE POLICY "admin gerencia histórico de manejo"
  ON public.manejo_historico FOR ALL USING (public.my_role() = 'admin');

CREATE POLICY "cliente gerencia histórico de manejo"
  ON public.manejo_historico FOR ALL USING (farm_id = public.my_farm_id());
