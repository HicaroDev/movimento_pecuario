-- ═══════════════════════════════════════════════════════════════
--  ajustes_v116b.sql — Migração Completa Março 2026
--  Idempotente: pode rodar mais de uma vez sem quebrar nada
--  Inclui tudo do migration_cadastros.sql + novas colunas
--  Rodar em: https://saas-supabase.bj3amt.easypanel.host → SQL Editor
-- ═══════════════════════════════════════════════════════════════


-- ── PASSO 1: Tabela animals ──────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.animals (
  id                    uuid        PRIMARY KEY DEFAULT uuid_generate_v4(),
  farm_id               uuid        NOT NULL REFERENCES public.farms(id) ON DELETE CASCADE,
  nome                  text        NOT NULL,
  quantidade            integer     NOT NULL DEFAULT 0,
  raca                  text,
  categoria_id          uuid        REFERENCES public.animal_categories(id) ON DELETE SET NULL,
  peso_medio            numeric,
  sexo                  text,
  bezerros_quantidade   integer,
  bezerros_peso_medio   numeric,
  observacoes           text,
  created_at            timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.animals ADD COLUMN IF NOT EXISTS categoria_id        uuid;
ALTER TABLE public.animals ADD COLUMN IF NOT EXISTS peso_medio          numeric;
ALTER TABLE public.animals ADD COLUMN IF NOT EXISTS sexo                text;
ALTER TABLE public.animals ADD COLUMN IF NOT EXISTS bezerros_quantidade integer;
ALTER TABLE public.animals ADD COLUMN IF NOT EXISTS bezerros_peso_medio numeric;
ALTER TABLE public.animals ADD COLUMN IF NOT EXISTS pasto_id            uuid REFERENCES public.pastures(id) ON DELETE SET NULL;
ALTER TABLE public.animals ADD COLUMN IF NOT EXISTS status              text NOT NULL DEFAULT 'ativo';


-- ── PASSO 2: Tabela supplement_types ────────────────────────────

CREATE TABLE IF NOT EXISTS public.supplement_types (
  id           uuid        PRIMARY KEY DEFAULT uuid_generate_v4(),
  farm_id      uuid        NOT NULL REFERENCES public.farms(id) ON DELETE CASCADE,
  nome         text        NOT NULL,
  unidade      text        NOT NULL DEFAULT 'kg',
  observacoes  text,
  created_at   timestamptz NOT NULL DEFAULT now()
);

-- Novas colunas adicionadas em março/2026
ALTER TABLE public.supplement_types ADD COLUMN IF NOT EXISTS peso     numeric;
ALTER TABLE public.supplement_types ADD COLUMN IF NOT EXISTS valor_kg numeric;
ALTER TABLE public.supplement_types ADD COLUMN IF NOT EXISTS consumo  text;


-- ── PASSO 3: Tabela employees ────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.employees (
  id           uuid        PRIMARY KEY DEFAULT uuid_generate_v4(),
  farm_id      uuid        NOT NULL REFERENCES public.farms(id) ON DELETE CASCADE,
  nome         text        NOT NULL,
  funcao       text,
  contato      text,
  created_at   timestamptz NOT NULL DEFAULT now()
);


-- ── PASSO 4: Novas colunas em pastures ──────────────────────────

ALTER TABLE public.pastures ADD COLUMN IF NOT EXISTS forragem           text;
ALTER TABLE public.pastures ADD COLUMN IF NOT EXISTS qualidade_forragem  text;


-- ── PASSO 5: Tabela manejo_historico ────────────────────────────

CREATE TABLE IF NOT EXISTS public.manejo_historico (
  id                uuid        PRIMARY KEY DEFAULT uuid_generate_v4(),
  farm_id           uuid        NOT NULL REFERENCES public.farms(id) ON DELETE CASCADE,
  animal_id         uuid        NOT NULL REFERENCES public.animals(id) ON DELETE CASCADE,
  tipo              text        NOT NULL,
  descricao         text,
  pasto_origem      uuid        REFERENCES public.pastures(id),
  pasto_destino     uuid        REFERENCES public.pastures(id),
  categoria_origem  uuid        REFERENCES public.animal_categories(id),
  categoria_destino uuid        REFERENCES public.animal_categories(id),
  quantidade        integer,
  peso_medio        numeric,
  created_at        timestamptz NOT NULL DEFAULT now()
);


-- ── PASSO 6: RLS ─────────────────────────────────────────────────

ALTER TABLE public.animals          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.supplement_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.employees        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.manejo_historico ENABLE ROW LEVEL SECURITY;

-- animals
DROP POLICY IF EXISTS "admin vê todos os animais"                        ON public.animals;
DROP POLICY IF EXISTS "cliente vê animais da própria fazenda"            ON public.animals;
DROP POLICY IF EXISTS "admin gerencia animais"                           ON public.animals;
DROP POLICY IF EXISTS "cliente gerencia animais da própria fazenda"      ON public.animals;

CREATE POLICY "admin vê todos os animais"
  ON public.animals FOR SELECT USING (public.my_role() = 'admin');
CREATE POLICY "cliente vê animais da própria fazenda"
  ON public.animals FOR SELECT USING (farm_id = public.my_farm_id());
CREATE POLICY "admin gerencia animais"
  ON public.animals FOR ALL USING (public.my_role() = 'admin');
CREATE POLICY "cliente gerencia animais da própria fazenda"
  ON public.animals FOR ALL USING (farm_id = public.my_farm_id());

-- supplement_types
DROP POLICY IF EXISTS "admin vê todos os tipos de suplemento"                       ON public.supplement_types;
DROP POLICY IF EXISTS "cliente vê tipos de suplemento da própria fazenda"           ON public.supplement_types;
DROP POLICY IF EXISTS "admin gerencia tipos de suplemento"                          ON public.supplement_types;
DROP POLICY IF EXISTS "cliente gerencia tipos de suplemento da própria fazenda"     ON public.supplement_types;

CREATE POLICY "admin vê todos os tipos de suplemento"
  ON public.supplement_types FOR SELECT USING (public.my_role() = 'admin');
CREATE POLICY "cliente vê tipos de suplemento da própria fazenda"
  ON public.supplement_types FOR SELECT USING (farm_id = public.my_farm_id());
CREATE POLICY "admin gerencia tipos de suplemento"
  ON public.supplement_types FOR ALL USING (public.my_role() = 'admin');
CREATE POLICY "cliente gerencia tipos de suplemento da própria fazenda"
  ON public.supplement_types FOR ALL USING (farm_id = public.my_farm_id());

-- employees
DROP POLICY IF EXISTS "admin vê todos os funcionários"                   ON public.employees;
DROP POLICY IF EXISTS "cliente vê funcionários da própria fazenda"       ON public.employees;
DROP POLICY IF EXISTS "admin gerencia funcionários"                      ON public.employees;
DROP POLICY IF EXISTS "cliente gerencia funcionários da própria fazenda" ON public.employees;
DROP POLICY IF EXISTS "admin vê funcionários"                            ON public.employees;
DROP POLICY IF EXISTS "cliente vê funcionários"                          ON public.employees;
DROP POLICY IF EXISTS "admin gerencia funcionários"                      ON public.employees;
DROP POLICY IF EXISTS "cliente gerencia funcionários"                    ON public.employees;

CREATE POLICY "admin vê todos os funcionários"
  ON public.employees FOR SELECT USING (public.my_role() = 'admin');
CREATE POLICY "cliente vê funcionários da própria fazenda"
  ON public.employees FOR SELECT USING (farm_id = public.my_farm_id());
CREATE POLICY "admin gerencia funcionários"
  ON public.employees FOR ALL USING (public.my_role() = 'admin');
CREATE POLICY "cliente gerencia funcionários da própria fazenda"
  ON public.employees FOR ALL USING (farm_id = public.my_farm_id());

-- manejo_historico
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
