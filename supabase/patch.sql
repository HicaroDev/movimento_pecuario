-- ═══════════════════════════════════════════════════════════
--  Patch — execute no SQL Editor do Supabase após o schema.sql
-- ═══════════════════════════════════════════════════════════

-- 1. Email no perfil (necessário para listar usuários no app)
alter table public.profiles add column if not exists email text;

-- 2. Sacos nos lançamentos
alter table public.data_entries add column if not exists sacos integer not null default 0;

-- 3. Data com default hoje (não obrigatório no formulário)
alter table public.data_entries alter column data set default current_date;

-- 4. Remover coluna tipo (redundante com suplemento)
alter table public.data_entries drop column if exists tipo;

-- 5. Atualizar trigger para incluir email
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

-- ═══════════════════════════════════════════════════════════
--  Criar usuário admin inicial (execute depois do patch)
--  Substitua a senha antes de rodar!
-- ═══════════════════════════════════════════════════════════
-- Obs: use Authentication → Users → "Add user" no Studio
--      ou rode via supabase-admin API com service_role key.
