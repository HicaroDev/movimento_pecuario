-- DevPlan Comments — v1.19
-- Tabela de comentários/respostas do cliente no módulo Planejamento

create table if not exists public.devplan_comments (
  id          uuid        default gen_random_uuid() primary key,
  farm_id     uuid        not null,
  file        text        not null,           -- ex: "03-ajustes-mp17.md"
  comment     text        not null,
  author_name text        not null,
  author_role text        not null,           -- 'admin' | 'client'
  lido        boolean     default false,      -- true quando o dev leu
  created_at  timestamptz default now()
);

alter table public.devplan_comments enable row level security;

-- Qualquer usuário autenticado pode ler e inserir comentários
create policy "devplan_comments_select" on public.devplan_comments
  for select using (auth.role() = 'authenticated');

create policy "devplan_comments_insert" on public.devplan_comments
  for insert with check (auth.role() = 'authenticated');

create policy "devplan_comments_update" on public.devplan_comments
  for update using (auth.role() = 'authenticated');
