-- ═══════════════════════════════════════════════════════════
--  Suplemento Control — Schema
--  Execute no SQL Editor do Supabase (self-hosted)
-- ═══════════════════════════════════════════════════════════

-- ── Extensões ──────────────────────────────────────────────
create extension if not exists "uuid-ossp";

-- ── Fazendas ───────────────────────────────────────────────
create table public.farms (
  id               uuid primary key default uuid_generate_v4(),
  nome_fazenda     text not null,
  nome_responsavel text,
  quantidade_cabecas integer,
  endereco         text,
  telefone         text,
  email            text,
  logo_url         text,
  active           boolean not null default true,
  created_at       timestamptz not null default now()
);

-- ── Perfis (estende auth.users) ────────────────────────────
create table public.profiles (
  id         uuid primary key references auth.users(id) on delete cascade,
  name       text not null,
  role       text not null default 'client' check (role in ('admin','client')),
  farm_id    uuid references public.farms(id) on delete set null,
  modules    text[] not null default array['relatorio','formulario','pastos','fazendas','usuarios'],
  active     boolean not null default true,
  created_at timestamptz not null default now()
);

-- ── Pastos ─────────────────────────────────────────────────
create table public.pastures (
  id          uuid primary key default uuid_generate_v4(),
  farm_id     uuid not null references public.farms(id) on delete cascade,
  nome        text not null,
  area        numeric,
  observacoes text,
  created_at  timestamptz not null default now()
);

-- ── Lançamentos de consumo ─────────────────────────────────
create table public.data_entries (
  id          uuid primary key default uuid_generate_v4(),
  farm_id     uuid not null references public.farms(id) on delete cascade,
  data        date not null,
  pasto_id    uuid references public.pastures(id) on delete set null,
  pasto_nome  text,
  suplemento  text not null,
  tipo        text not null,
  quantidade  integer not null,
  periodo     integer not null,
  kg          numeric not null,
  consumo     numeric not null,
  created_by  uuid references auth.users(id) on delete set null,
  created_at  timestamptz not null default now()
);

-- ═══════════════════════════════════════════════════════════
--  RLS — Row Level Security
-- ═══════════════════════════════════════════════════════════

alter table public.farms       enable row level security;
alter table public.profiles    enable row level security;
alter table public.pastures    enable row level security;
alter table public.data_entries enable row level security;

-- Helper: retorna o role do usuário logado
create or replace function public.my_role()
returns text language sql security definer
as $$ select role from public.profiles where id = auth.uid() $$;

-- Helper: retorna o farm_id do usuário logado
create or replace function public.my_farm_id()
returns uuid language sql security definer
as $$ select farm_id from public.profiles where id = auth.uid() $$;

-- ── Políticas: farms ───────────────────────────────────────
create policy "admin vê todas as fazendas"
  on public.farms for select
  using (public.my_role() = 'admin');

create policy "cliente vê só a própria fazenda"
  on public.farms for select
  using (id = public.my_farm_id());

create policy "admin gerencia fazendas"
  on public.farms for all
  using (public.my_role() = 'admin');

-- ── Políticas: profiles ────────────────────────────────────
create policy "admin vê todos os perfis"
  on public.profiles for select
  using (public.my_role() = 'admin');

create policy "cliente vê perfis da própria fazenda"
  on public.profiles for select
  using (farm_id = public.my_farm_id());

create policy "usuário atualiza o próprio perfil"
  on public.profiles for update
  using (id = auth.uid());

create policy "admin gerencia perfis"
  on public.profiles for all
  using (public.my_role() = 'admin');

-- ── Políticas: pastures ────────────────────────────────────
create policy "admin vê todos os pastos"
  on public.pastures for select
  using (public.my_role() = 'admin');

create policy "cliente vê pastos da própria fazenda"
  on public.pastures for select
  using (farm_id = public.my_farm_id());

create policy "admin gerencia pastos"
  on public.pastures for all
  using (public.my_role() = 'admin');

create policy "cliente gerencia pastos da própria fazenda"
  on public.pastures for all
  using (farm_id = public.my_farm_id());

-- ── Políticas: data_entries ────────────────────────────────
create policy "admin vê todos os lançamentos"
  on public.data_entries for select
  using (public.my_role() = 'admin');

create policy "cliente vê lançamentos da própria fazenda"
  on public.data_entries for select
  using (farm_id = public.my_farm_id());

create policy "admin gerencia lançamentos"
  on public.data_entries for all
  using (public.my_role() = 'admin');

create policy "cliente gerencia lançamentos da própria fazenda"
  on public.data_entries for all
  using (farm_id = public.my_farm_id());

-- ═══════════════════════════════════════════════════════════
--  Trigger: cria perfil automaticamente ao registrar usuário
-- ═══════════════════════════════════════════════════════════
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into public.profiles (id, name, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'name', new.email),
    coalesce(new.raw_user_meta_data->>'role', 'client')
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
