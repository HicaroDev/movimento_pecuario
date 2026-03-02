-- ═══════════════════════════════════════════════════════════
--  Migration — Tabelas do módulo Cadastros
--  Execute no SQL Editor do Supabase após o schema.sql + patch.sql
-- ═══════════════════════════════════════════════════════════

-- ── Animais ────────────────────────────────────────────────
create table if not exists public.animals (
  id           uuid primary key default uuid_generate_v4(),
  farm_id      uuid not null references public.farms(id) on delete cascade,
  nome         text not null,
  quantidade   integer not null default 0,
  raca         text,
  observacoes  text,
  created_at   timestamptz not null default now()
);

-- ── Tipos de Suplemento ────────────────────────────────────
create table if not exists public.supplement_types (
  id           uuid primary key default uuid_generate_v4(),
  farm_id      uuid not null references public.farms(id) on delete cascade,
  nome         text not null,
  unidade      text not null default 'kg',
  observacoes  text,
  created_at   timestamptz not null default now()
);

-- ── Funcionários ───────────────────────────────────────────
create table if not exists public.employees (
  id           uuid primary key default uuid_generate_v4(),
  farm_id      uuid not null references public.farms(id) on delete cascade,
  nome         text not null,
  funcao       text,
  contato      text,
  created_at   timestamptz not null default now()
);

-- ── Equipamentos ───────────────────────────────────────────
create table if not exists public.equipment (
  id           uuid primary key default uuid_generate_v4(),
  farm_id      uuid not null references public.farms(id) on delete cascade,
  nome         text not null,
  tipo         text,
  quantidade   integer not null default 1,
  observacoes  text,
  created_at   timestamptz not null default now()
);

-- ═══════════════════════════════════════════════════════════
--  RLS — Row Level Security
-- ═══════════════════════════════════════════════════════════

alter table public.animals          enable row level security;
alter table public.supplement_types enable row level security;
alter table public.employees        enable row level security;
alter table public.equipment        enable row level security;

-- ── Políticas: animals ─────────────────────────────────────
create policy "admin vê todos os animais"
  on public.animals for select
  using (public.my_role() = 'admin');

create policy "cliente vê animais da própria fazenda"
  on public.animals for select
  using (farm_id = public.my_farm_id());

create policy "admin gerencia animais"
  on public.animals for all
  using (public.my_role() = 'admin');

create policy "cliente gerencia animais da própria fazenda"
  on public.animals for all
  using (farm_id = public.my_farm_id());

-- ── Políticas: supplement_types ───────────────────────────
create policy "admin vê todos os tipos de suplemento"
  on public.supplement_types for select
  using (public.my_role() = 'admin');

create policy "cliente vê tipos de suplemento da própria fazenda"
  on public.supplement_types for select
  using (farm_id = public.my_farm_id());

create policy "admin gerencia tipos de suplemento"
  on public.supplement_types for all
  using (public.my_role() = 'admin');

create policy "cliente gerencia tipos de suplemento da própria fazenda"
  on public.supplement_types for all
  using (farm_id = public.my_farm_id());

-- ── Políticas: employees ───────────────────────────────────
create policy "admin vê todos os funcionários"
  on public.employees for select
  using (public.my_role() = 'admin');

create policy "cliente vê funcionários da própria fazenda"
  on public.employees for select
  using (farm_id = public.my_farm_id());

create policy "admin gerencia funcionários"
  on public.employees for all
  using (public.my_role() = 'admin');

create policy "cliente gerencia funcionários da própria fazenda"
  on public.employees for all
  using (farm_id = public.my_farm_id());

-- ── Políticas: equipment ───────────────────────────────────
create policy "admin vê todos os equipamentos"
  on public.equipment for select
  using (public.my_role() = 'admin');

create policy "cliente vê equipamentos da própria fazenda"
  on public.equipment for select
  using (farm_id = public.my_farm_id());

create policy "admin gerencia equipamentos"
  on public.equipment for all
  using (public.my_role() = 'admin');

create policy "cliente gerencia equipamentos da própria fazenda"
  on public.equipment for all
  using (farm_id = public.my_farm_id());
