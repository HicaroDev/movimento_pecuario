-- ═══════════════════════════════════════════════════════════
--  Suplemento Control — Seed de Demonstração
--
--  Execute no SQL Editor do Supabase (self-hosted).
--  Pode ser rodado múltiplas vezes sem problemas (idempotente).
--
--  Credenciais criadas:
--    Admin  → admin@suplemento.com   / admin123
--    Cliente→ cliente@malhada.com    / malhada123
-- ═══════════════════════════════════════════════════════════

-- ── Extensões ───────────────────────────────────────────────
create extension if not exists "uuid-ossp";
create extension if not exists pgcrypto;

-- ── IDs fixos para ser idempotente ──────────────────────────
-- Farm    : 10000000-0000-4000-8000-000000000001
-- Admin   : 20000000-0000-4000-8000-000000000001
-- Cliente : 30000000-0000-4000-8000-000000000001
-- Pastos  : 40000000-0000-4000-8000-0000000000XX  (01-19)

-- ── Patch (idempotente) ─────────────────────────────────────
alter table public.profiles     add column if not exists email text;
alter table public.data_entries add column if not exists sacos integer not null default 0;
alter table public.data_entries alter column data set default current_date;

-- Remove coluna redundante 'tipo' se ainda existir
do $$ begin
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public'
      and table_name   = 'data_entries'
      and column_name  = 'tipo'
  ) then
    alter table public.data_entries drop column tipo;
  end if;
end $$;

-- Trigger atualizado com email
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into public.profiles (id, name, email, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'name', new.email),
    new.email,
    coalesce(new.raw_user_meta_data->>'role', 'client')
  );
  return new;
end;
$$;

-- ── Limpar dados de demonstração anteriores ─────────────────
delete from public.data_entries
  where farm_id = '10000000-0000-4000-8000-000000000001';

delete from public.pastures
  where farm_id = '10000000-0000-4000-8000-000000000001';

delete from public.profiles
  where id in (
    '20000000-0000-4000-8000-000000000001',
    '30000000-0000-4000-8000-000000000001'
  );

delete from auth.users
  where id in (
    '20000000-0000-4000-8000-000000000001',
    '30000000-0000-4000-8000-000000000001'
  );

delete from public.farms
  where id = '10000000-0000-4000-8000-000000000001';

-- ═══════════════════════════════════════════════════════════
--  1. FAZENDA
-- ═══════════════════════════════════════════════════════════
insert into public.farms (
  id, nome_fazenda, nome_responsavel,
  quantidade_cabecas, endereco, telefone, email, active
) values (
  '10000000-0000-4000-8000-000000000001',
  'Fazenda Malhada Grande',
  'Carlos Eduardo Oliveira',
  1200,
  'Rodovia BR-080, Km 45 — Cocalinho/MT',
  '(65) 98765-4321',
  'carlos@malhada.com.br',
  true
);

-- ═══════════════════════════════════════════════════════════
--  2. USUÁRIOS (trigger cria o perfil automaticamente)
-- ═══════════════════════════════════════════════════════════
insert into auth.users (
  id, instance_id, aud, role,
  email, encrypted_password,
  email_confirmed_at,
  raw_user_meta_data, raw_app_meta_data,
  is_super_admin, is_sso_user,
  created_at, updated_at
)
values
  -- Admin
  (
    '20000000-0000-4000-8000-000000000001',
    '00000000-0000-0000-0000-000000000000',
    'authenticated', 'authenticated',
    'admin@suplemento.com',
    crypt('admin123', gen_salt('bf')),
    now(),
    '{"name":"Administrador","role":"admin"}'::jsonb,
    '{"provider":"email","providers":["email"]}'::jsonb,
    false, false,
    now(), now()
  ),
  -- Cliente
  (
    '30000000-0000-4000-8000-000000000001',
    '00000000-0000-0000-0000-000000000000',
    'authenticated', 'authenticated',
    'cliente@malhada.com',
    crypt('malhada123', gen_salt('bf')),
    now(),
    '{"name":"Fazenda Malhada Grande","role":"client"}'::jsonb,
    '{"provider":"email","providers":["email"]}'::jsonb,
    false, false,
    now(), now()
  );

-- ── Ajustar perfis criados pelo trigger ─────────────────────

-- Admin: todos os módulos, sem farm_id
update public.profiles set
  modules = array['relatorio','formulario','pastos','fazendas','usuarios'],
  active  = true
where id = '20000000-0000-4000-8000-000000000001';

-- Cliente: 3 módulos, vinculado à fazenda
update public.profiles set
  farm_id = '10000000-0000-4000-8000-000000000001',
  modules = array['relatorio','formulario','pastos'],
  active  = true
where id = '30000000-0000-4000-8000-000000000001';

-- ═══════════════════════════════════════════════════════════
--  3. PASTOS  (19 pastos com área em hectares)
-- ═══════════════════════════════════════════════════════════
insert into public.pastures (id, farm_id, nome, area) values
  ('40000000-0000-4000-8000-000000000001', '10000000-0000-4000-8000-000000000001', 'Cana',                    45.0),
  ('40000000-0000-4000-8000-000000000002', '10000000-0000-4000-8000-000000000001', 'Tamboril',                38.5),
  ('40000000-0000-4000-8000-000000000003', '10000000-0000-4000-8000-000000000001', 'Sujo 1',                  62.0),
  ('40000000-0000-4000-8000-000000000004', '10000000-0000-4000-8000-000000000001', 'Mama de Baixo Piquete 2', 28.0),
  ('40000000-0000-4000-8000-000000000005', '10000000-0000-4000-8000-000000000001', 'Mama de Baixo Piquete 1', 32.0),
  ('40000000-0000-4000-8000-000000000006', '10000000-0000-4000-8000-000000000001', 'Palhadão do Meio',        55.0),
  ('40000000-0000-4000-8000-000000000007', '10000000-0000-4000-8000-000000000001', 'Rio do Ouro de Baixo',    80.0),
  ('40000000-0000-4000-8000-000000000008', '10000000-0000-4000-8000-000000000001', 'Rio do Ouro de Cima',     75.0),
  ('40000000-0000-4000-8000-000000000009', '10000000-0000-4000-8000-000000000001', 'Pequi 2',                 41.0),
  ('40000000-0000-4000-8000-000000000010', '10000000-0000-4000-8000-000000000001', 'João Jacinto de Cima',    52.0),
  ('40000000-0000-4000-8000-000000000011', '10000000-0000-4000-8000-000000000001', 'Da Maternidade',          23.5),
  ('40000000-0000-4000-8000-000000000012', '10000000-0000-4000-8000-000000000001', 'Ponte Cima',              19.0),
  ('40000000-0000-4000-8000-000000000013', '10000000-0000-4000-8000-000000000001', 'Luizinho',                16.0),
  ('40000000-0000-4000-8000-000000000014', '10000000-0000-4000-8000-000000000001', 'Boiada Gorda',            88.0),
  ('40000000-0000-4000-8000-000000000015', '10000000-0000-4000-8000-000000000001', 'Divaldo',                110.0),
  ('40000000-0000-4000-8000-000000000016', '10000000-0000-4000-8000-000000000001', 'Pasto do Braquiarão',     67.0),
  ('40000000-0000-4000-8000-000000000017', '10000000-0000-4000-8000-000000000001', 'João Jacinto de Baixo',   49.0),
  ('40000000-0000-4000-8000-000000000018', '10000000-0000-4000-8000-000000000001', 'Tucuzão Braquiára',       71.0),
  ('40000000-0000-4000-8000-000000000019', '10000000-0000-4000-8000-000000000001', 'Da Pedra',                44.0);

-- ═══════════════════════════════════════════════════════════
--  4. LANÇAMENTOS DE CONSUMO  (28 registros — ciclo jan/2026)
--     Todos os dados espelham os sampleRows de data.ts
-- ═══════════════════════════════════════════════════════════
insert into public.data_entries
  (farm_id, data, pasto_nome, suplemento, quantidade, periodo, sacos, kg, consumo)
values

  -- ── Energético 0,3% ──────────────────────────────────────
  ('10000000-0000-4000-8000-000000000001','2026-01-28','Cana',                   'Energético 0,3%',  30, 30,  96, 2400, 0.842),
  ('10000000-0000-4000-8000-000000000001','2026-01-28','Tamboril',               'Energético 0,3%',  30, 30,  48, 1200, 1.000),
  ('10000000-0000-4000-8000-000000000001','2026-01-28','Sujo 1',                 'Energético 0,3%',  40, 30,  54, 1350, 1.452),
  ('10000000-0000-4000-8000-000000000001','2026-01-28','Mama de Baixo Piquete 2','Energético 0,3%', 117, 30,  16,  400, 0.833),
  ('10000000-0000-4000-8000-000000000001','2026-01-28','Mama de Baixo Piquete 1','Energético 0,3%',  98, 30,  44, 1100, 0.780),
  ('10000000-0000-4000-8000-000000000001','2026-01-28','Palhadão do Meio',       'Energético 0,3%',  31, 30,  70, 1750, 0.729),
  ('10000000-0000-4000-8000-000000000001','2026-01-28','Rio do Ouro de Baixo',   'Energético 0,3%',  64, 30, 120, 3000, 0.862),
  ('10000000-0000-4000-8000-000000000001','2026-01-28','Rio do Ouro de Cima',    'Energético 0,3%',  80, 30,  40, 1000, 0.450),
  ('10000000-0000-4000-8000-000000000001','2026-01-28','Pequi 2',                'Energético 0,3%',  20, 30,  45, 1125, 0.586),
  ('10000000-0000-4000-8000-000000000001','2026-01-28','João Jacinto de Cima',   'Energético 0,3%',  74, 30,  40, 1000, 0.606),
  ('10000000-0000-4000-8000-000000000001','2026-01-28','Da Maternidade',         'Energético 0,3%',  34, 30,  38,  950, 0.772),
  ('10000000-0000-4000-8000-000000000001','2026-01-28','Ponte Cima',             'Energético 0,3%',  36, 30,  28,  700, 0.496),
  ('10000000-0000-4000-8000-000000000001','2026-01-28','Luizinho',               'Energético 0,3%',  30, 30,  25,  625, 0.326),

  -- ── Mineral Adensado Águas ───────────────────────────────
  ('10000000-0000-4000-8000-000000000001','2026-01-28','Boiada Gorda',          'Mineral Adensado Águas',  97, 30, 18, 450, 0.155),
  ('10000000-0000-4000-8000-000000000001','2026-01-28','Divaldo',               'Mineral Adensado Águas', 174, 30, 30, 750, 0.144),
  ('10000000-0000-4000-8000-000000000001','2026-01-28','Pasto do Braquiarão',   'Mineral Adensado Águas',  57, 30, 12, 300, 0.175),
  ('10000000-0000-4000-8000-000000000001','2026-01-28','João Jacinto de Baixo', 'Mineral Adensado Águas',  78, 30, 15, 375, 0.160),
  ('10000000-0000-4000-8000-000000000001','2026-01-28','Tucuzão Braquiára',     'Mineral Adensado Águas',  85, 30, 17, 425, 0.167),
  ('10000000-0000-4000-8000-000000000001','2026-01-28','Da Pedra',              'Mineral Adensado Águas',  82, 30, 15, 375, 0.152),

  -- ── Ração Creep ──────────────────────────────────────────
  ('10000000-0000-4000-8000-000000000001','2026-01-28','Tamboril',              'Ração Creep', 40, 30, 27,  675, 0.563),
  ('10000000-0000-4000-8000-000000000001','2026-01-28','Boiada Gorda',          'Ração Creep', 94, 30,  9,  225, 0.080),
  ('10000000-0000-4000-8000-000000000001','2026-01-28','Rio do Ouro de Cima',   'Ração Creep', 75, 30, 75, 1875, 0.833),
  ('10000000-0000-4000-8000-000000000001','2026-01-28','Pasto do Braquiarão',   'Ração Creep', 56, 30, 25,  625, 0.372),
  ('10000000-0000-4000-8000-000000000001','2026-01-28','João Jacinto de Cima',  'Ração Creep', 53, 30, 20,  500, 0.314),
  ('10000000-0000-4000-8000-000000000001','2026-01-28','Tucuzão Braquiára',     'Ração Creep', 82, 30, 20,  500, 0.203),
  ('10000000-0000-4000-8000-000000000001','2026-01-28','Da Pedra',              'Ração Creep', 80, 30, 20,  500, 0.208),
  ('10000000-0000-4000-8000-000000000001','2026-01-28','Da Maternidade',        'Ração Creep', 39, 30, 12,  300, 0.256),
  ('10000000-0000-4000-8000-000000000001','2026-01-28','Ponte Cima',            'Ração Creep', 45, 30, 16,  400, 0.296);

-- ═══════════════════════════════════════════════════════════
--  Resumo do que foi criado
-- ═══════════════════════════════════════════════════════════
select
  (select count(*) from public.farms)        as fazendas,
  (select count(*) from auth.users
     where id in (
       '20000000-0000-4000-8000-000000000001',
       '30000000-0000-4000-8000-000000000001'
     ))                                       as usuarios,
  (select count(*) from public.pastures)     as pastos,
  (select count(*) from public.data_entries) as lancamentos;
