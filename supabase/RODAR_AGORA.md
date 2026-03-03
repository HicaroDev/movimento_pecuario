# SQL para Rodar no Supabase Agora

> **Como rodar:** Acesse `https://saas-supabase.bj3amt.easypanel.host` → SQL Editor → cole cada bloco e execute.
> Todos os blocos são **idempotentes** (podem ser rodados mais de uma vez sem quebrar nada).

---

## PASSO 1 — Colunas novas em tabelas existentes

Cole e execute tudo junto:

```sql
-- Profiles: suporte a multi-fazenda
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS email    text,
  ADD COLUMN IF NOT EXISTS farm_ids text[] not null default '{}';

-- Pastos: vínculo com retiro
ALTER TABLE public.pastures
  ADD COLUMN IF NOT EXISTS retiro_id uuid;

-- data_entries: campo sacos (quantidade de sacos por lançamento)
ALTER TABLE public.data_entries
  ADD COLUMN IF NOT EXISTS sacos integer not null default 0;

-- Animals: novos campos do formulário de lote
ALTER TABLE public.animals
  ADD COLUMN IF NOT EXISTS categoria_id        uuid,
  ADD COLUMN IF NOT EXISTS peso_medio          numeric,
  ADD COLUMN IF NOT EXISTS sexo                text,
  ADD COLUMN IF NOT EXISTS bezerros_quantidade integer,
  ADD COLUMN IF NOT EXISTS bezerros_peso_medio numeric;
```

---

## PASSO 2 — Tabelas novas (Retiros e Categorias de Animais)

Cole e execute tudo junto:

```sql
-- ── Retiros ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.retiros (
  id           uuid primary key default uuid_generate_v4(),
  farm_id      uuid not null references public.farms(id) on delete cascade,
  nome         text not null,
  observacoes  text,
  created_at   timestamptz not null default now()
);

-- ── Categorias de Animais ───────────────────────────────────
CREATE TABLE IF NOT EXISTS public.animal_categories (
  id           uuid primary key default uuid_generate_v4(),
  farm_id      uuid not null references public.farms(id) on delete cascade,
  nome         text not null,
  observacoes  text,
  created_at   timestamptz not null default now()
);
```

---

## PASSO 3 — RLS nas tabelas novas

Cole e execute tudo junto:

```sql
-- Ativa RLS
ALTER TABLE public.retiros          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.animal_categories ENABLE ROW LEVEL SECURITY;

-- ── Políticas: retiros ──────────────────────────────────────
DROP POLICY IF EXISTS "admin vê todos os retiros"                     ON public.retiros;
DROP POLICY IF EXISTS "cliente vê retiros da própria fazenda"         ON public.retiros;
DROP POLICY IF EXISTS "admin gerencia retiros"                        ON public.retiros;
DROP POLICY IF EXISTS "cliente gerencia retiros da própria fazenda"   ON public.retiros;

CREATE POLICY "admin vê todos os retiros"
  ON public.retiros FOR SELECT USING (public.my_role() = 'admin');

CREATE POLICY "cliente vê retiros da própria fazenda"
  ON public.retiros FOR SELECT USING (farm_id = public.my_farm_id());

CREATE POLICY "admin gerencia retiros"
  ON public.retiros FOR ALL USING (public.my_role() = 'admin');

CREATE POLICY "cliente gerencia retiros da própria fazenda"
  ON public.retiros FOR ALL USING (farm_id = public.my_farm_id());

-- ── Políticas: animal_categories ───────────────────────────
DROP POLICY IF EXISTS "admin vê todas as categorias de animais"               ON public.animal_categories;
DROP POLICY IF EXISTS "cliente vê categorias de animais da própria fazenda"   ON public.animal_categories;
DROP POLICY IF EXISTS "admin gerencia categorias de animais"                  ON public.animal_categories;
DROP POLICY IF EXISTS "cliente gerencia categorias de animais da fazenda"     ON public.animal_categories;

CREATE POLICY "admin vê todas as categorias de animais"
  ON public.animal_categories FOR SELECT USING (public.my_role() = 'admin');

CREATE POLICY "cliente vê categorias de animais da própria fazenda"
  ON public.animal_categories FOR SELECT USING (farm_id = public.my_farm_id());

CREATE POLICY "admin gerencia categorias de animais"
  ON public.animal_categories FOR ALL USING (public.my_role() = 'admin');

CREATE POLICY "cliente gerencia categorias de animais da fazenda"
  ON public.animal_categories FOR ALL USING (farm_id = public.my_farm_id());
```

---

## PASSO 4 — Trigger atualizado (inclui email e farm_ids)

Cole e execute:

```sql
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
```

---

## PASSO 5 — Migration Cadastros (só se ainda não rodou)

> **Só rode este passo se as tabelas `animals`, `supplement_types`, `employees` não existirem ainda.**
> Se já existirem, pule — o Passo 1 já cuida das colunas novas.

Cole e execute o arquivo completo: `supabase/migration_cadastros.sql`

---

## Checklist

- [ ] Passo 1 — Colunas novas
- [ ] Passo 2 — Tabelas Retiros + Categorias
- [ ] Passo 3 — RLS das tabelas novas
- [ ] Passo 4 — Trigger
- [ ] Passo 5 — Migration Cadastros (se necessário)
