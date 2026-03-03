-- ═══════════════════════════════════════════════════════════════════
--  RODAR_AGORA.sql — Cole tudo no SQL Editor do Supabase e execute
--  Idempotente: pode rodar mais de uma vez sem quebrar nada
--  URL: https://saas-supabase.bj3amt.easypanel.host
-- ═══════════════════════════════════════════════════════════════════


-- ── PASSO 1: Colunas novas em tabelas existentes ─────────────────

-- Profiles: suporte a multi-fazenda + email
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS email    text,
  ADD COLUMN IF NOT EXISTS farm_ids text[] not null default '{}';

-- Pastos: vínculo com retiro
ALTER TABLE public.pastures
  ADD COLUMN IF NOT EXISTS retiro_id uuid;

-- data_entries: campo sacos
ALTER TABLE public.data_entries
  ADD COLUMN IF NOT EXISTS sacos integer not null default 0;

-- Animals: novos campos do formulário de lote
ALTER TABLE public.animals
  ADD COLUMN IF NOT EXISTS categoria_id        uuid,
  ADD COLUMN IF NOT EXISTS peso_medio          numeric,
  ADD COLUMN IF NOT EXISTS sexo                text,
  ADD COLUMN IF NOT EXISTS bezerros_quantidade integer,
  ADD COLUMN IF NOT EXISTS bezerros_peso_medio numeric;


-- ── PASSO 2: Tabelas novas ───────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.retiros (
  id          uuid        primary key default uuid_generate_v4(),
  farm_id     uuid        not null references public.farms(id) on delete cascade,
  nome        text        not null,
  observacoes text,
  created_at  timestamptz not null default now()
);

CREATE TABLE IF NOT EXISTS public.animal_categories (
  id          uuid        primary key default uuid_generate_v4(),
  farm_id     uuid        not null references public.farms(id) on delete cascade,
  nome        text        not null,
  observacoes text,
  created_at  timestamptz not null default now()
);

-- Migration Cadastros (idempotente — cria só se não existir)
CREATE TABLE IF NOT EXISTS public.animals (
  id                    uuid        primary key default uuid_generate_v4(),
  farm_id               uuid        not null references public.farms(id) on delete cascade,
  nome                  text        not null,
  quantidade            integer     not null default 0,
  raca                  text,
  categoria_id          uuid        references public.animal_categories(id) on delete set null,
  peso_medio            numeric,
  sexo                  text,
  bezerros_quantidade   integer,
  bezerros_peso_medio   numeric,
  observacoes           text,
  created_at            timestamptz not null default now()
);

CREATE TABLE IF NOT EXISTS public.supplement_types (
  id          uuid        primary key default uuid_generate_v4(),
  farm_id     uuid        not null references public.farms(id) on delete cascade,
  nome        text        not null,
  unidade     text        not null default 'kg',
  observacoes text,
  created_at  timestamptz not null default now()
);

CREATE TABLE IF NOT EXISTS public.employees (
  id          uuid        primary key default uuid_generate_v4(),
  farm_id     uuid        not null references public.farms(id) on delete cascade,
  nome        text        not null,
  funcao      text,
  contato     text,
  created_at  timestamptz not null default now()
);

CREATE TABLE IF NOT EXISTS public.equipment (
  id          uuid        primary key default uuid_generate_v4(),
  farm_id     uuid        not null references public.farms(id) on delete cascade,
  nome        text        not null,
  tipo        text,
  quantidade  integer     not null default 1,
  observacoes text,
  created_at  timestamptz not null default now()
);


-- ── PASSO 3: RLS nas tabelas novas ──────────────────────────────

ALTER TABLE public.retiros           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.animal_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.animals           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.supplement_types  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.employees         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.equipment         ENABLE ROW LEVEL SECURITY;

-- retiros
DROP POLICY IF EXISTS "admin vê todos os retiros"                   ON public.retiros;
DROP POLICY IF EXISTS "cliente vê retiros da própria fazenda"       ON public.retiros;
DROP POLICY IF EXISTS "admin gerencia retiros"                      ON public.retiros;
DROP POLICY IF EXISTS "cliente gerencia retiros da fazenda"         ON public.retiros;
CREATE POLICY "admin vê todos os retiros"
  ON public.retiros FOR SELECT USING (public.my_role() = 'admin');
CREATE POLICY "cliente vê retiros da própria fazenda"
  ON public.retiros FOR SELECT USING (farm_id = public.my_farm_id());
CREATE POLICY "admin gerencia retiros"
  ON public.retiros FOR ALL USING (public.my_role() = 'admin');
CREATE POLICY "cliente gerencia retiros da fazenda"
  ON public.retiros FOR ALL USING (farm_id = public.my_farm_id());

-- animal_categories
DROP POLICY IF EXISTS "admin vê todas as categorias"          ON public.animal_categories;
DROP POLICY IF EXISTS "cliente vê categorias da fazenda"      ON public.animal_categories;
DROP POLICY IF EXISTS "admin gerencia categorias"             ON public.animal_categories;
DROP POLICY IF EXISTS "cliente gerencia categorias da fazenda" ON public.animal_categories;
CREATE POLICY "admin vê todas as categorias"
  ON public.animal_categories FOR SELECT USING (public.my_role() = 'admin');
CREATE POLICY "cliente vê categorias da fazenda"
  ON public.animal_categories FOR SELECT USING (farm_id = public.my_farm_id());
CREATE POLICY "admin gerencia categorias"
  ON public.animal_categories FOR ALL USING (public.my_role() = 'admin');
CREATE POLICY "cliente gerencia categorias da fazenda"
  ON public.animal_categories FOR ALL USING (farm_id = public.my_farm_id());

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
DROP POLICY IF EXISTS "admin vê todos os tipos de suplemento"                    ON public.supplement_types;
DROP POLICY IF EXISTS "cliente vê tipos de suplemento da própria fazenda"        ON public.supplement_types;
DROP POLICY IF EXISTS "admin gerencia tipos de suplemento"                       ON public.supplement_types;
DROP POLICY IF EXISTS "cliente gerencia tipos de suplemento da própria fazenda"  ON public.supplement_types;
CREATE POLICY "admin vê todos os tipos de suplemento"
  ON public.supplement_types FOR SELECT USING (public.my_role() = 'admin');
CREATE POLICY "cliente vê tipos de suplemento da própria fazenda"
  ON public.supplement_types FOR SELECT USING (farm_id = public.my_farm_id());
CREATE POLICY "admin gerencia tipos de suplemento"
  ON public.supplement_types FOR ALL USING (public.my_role() = 'admin');
CREATE POLICY "cliente gerencia tipos de suplemento da própria fazenda"
  ON public.supplement_types FOR ALL USING (farm_id = public.my_farm_id());

-- employees
DROP POLICY IF EXISTS "admin vê todos os funcionários"                    ON public.employees;
DROP POLICY IF EXISTS "cliente vê funcionários da própria fazenda"        ON public.employees;
DROP POLICY IF EXISTS "admin gerencia funcionários"                       ON public.employees;
DROP POLICY IF EXISTS "cliente gerencia funcionários da própria fazenda"  ON public.employees;
CREATE POLICY "admin vê todos os funcionários"
  ON public.employees FOR SELECT USING (public.my_role() = 'admin');
CREATE POLICY "cliente vê funcionários da própria fazenda"
  ON public.employees FOR SELECT USING (farm_id = public.my_farm_id());
CREATE POLICY "admin gerencia funcionários"
  ON public.employees FOR ALL USING (public.my_role() = 'admin');
CREATE POLICY "cliente gerencia funcionários da própria fazenda"
  ON public.employees FOR ALL USING (farm_id = public.my_farm_id());

-- equipment
DROP POLICY IF EXISTS "admin vê todos os equipamentos"                    ON public.equipment;
DROP POLICY IF EXISTS "cliente vê equipamentos da própria fazenda"        ON public.equipment;
DROP POLICY IF EXISTS "admin gerencia equipamentos"                       ON public.equipment;
DROP POLICY IF EXISTS "cliente gerencia equipamentos da própria fazenda"  ON public.equipment;
CREATE POLICY "admin vê todos os equipamentos"
  ON public.equipment FOR SELECT USING (public.my_role() = 'admin');
CREATE POLICY "cliente vê equipamentos da própria fazenda"
  ON public.equipment FOR SELECT USING (farm_id = public.my_farm_id());
CREATE POLICY "admin gerencia equipamentos"
  ON public.equipment FOR ALL USING (public.my_role() = 'admin');
CREATE POLICY "cliente gerencia equipamentos da própria fazenda"
  ON public.equipment FOR ALL USING (farm_id = public.my_farm_id());


-- ── PASSO 4: Trigger atualizado (email + farm_ids) ───────────────

ALTER TABLE public.data_entries ALTER COLUMN data SET DEFAULT current_date;
ALTER TABLE public.data_entries DROP COLUMN IF EXISTS tipo;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  INSERT INTO public.profiles (id, name, email, role)
  VALUES (
    new.id,
    coalesce(new.raw_user_meta_data->>'name', new.email),
    new.email,
    coalesce(new.raw_user_meta_data->>'role', 'client')
  );
  RETURN new;
END;
$$;
