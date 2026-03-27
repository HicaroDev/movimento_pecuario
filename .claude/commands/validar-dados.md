# /validar-dados — Validador de SQL, RLS e Segurança
> Suplemento Control — rode periodicamente e após migrations

Você é um especialista em segurança de banco de dados. Valide o estado do Supabase e do código de acesso a dados.

---

## CONFIGURAÇÃO DO SUPABASE

- **URL:** `https://saas-supabase.bj3amt.easypanel.host`
- **API pg-meta:** `POST /pg/query` com header `Authorization: Bearer <service_role_key>`
- **Arquivo cliente:** `src/lib/supabase.ts`

---

## PASSO 1 — VARIÁVEIS DE AMBIENTE

Leia `src/lib/supabase.ts` e verifique:

- [ ] `VITE_SUPABASE_URL` lido de `import.meta.env`
- [ ] `VITE_SUPABASE_ANON_KEY` lido de `import.meta.env`
- [ ] `VITE_SUPABASE_SERVICE_KEY` lido de `import.meta.env`
- [ ] Nenhuma chave hardcoded no código fonte
- [ ] `.env` está no `.gitignore`

---

## PASSO 2 — RLS ATIVO

Verifique via SQL (use pg-meta ou SQL Editor do Supabase):

```sql
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;
```

Tabelas que **devem** ter RLS ativo (`rowsecurity = true`):

| Tabela | RLS |
|--------|-----|
| `profiles` | ✅ |
| `farms` | ✅ |
| `pastures` | ✅ |
| `data_entries` | ✅ |
| `animals` | ✅ |
| `supplement_types` | ✅ |
| `employees` | ✅ |
| `manejo_historico` | ✅ |
| `animal_categories` | ✅ |
| `estoque_movimentos` | ✅ |

---

## PASSO 3 — POLÍTICAS RLS

Para cada tabela, verifique se existe ao menos:
- Uma política `admin_all_*` com `role = 'admin'` para acesso total
- Uma política `client_read_*` limitando por `farm_id`

```sql
SELECT tablename, policyname, cmd, qual
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;
```

Verifique:
- [ ] Admin tem acesso SELECT/INSERT/UPDATE/DELETE em todas as tabelas
- [ ] Cliente tem acesso somente à sua `farm_id`
- [ ] Nenhuma tabela tem política `USING (true)` sem restrição de farm

---

## PASSO 4 — INTEGRIDADE REFERENCIAL

```sql
-- Orphan data_entries (farm_id inexistente)
SELECT COUNT(*) FROM data_entries d
LEFT JOIN farms f ON f.id = d.farm_id
WHERE f.id IS NULL;

-- Orphan animals (farm_id inexistente)
SELECT COUNT(*) FROM animals a
LEFT JOIN farms f ON f.id = a.farm_id
WHERE f.id IS NULL;

-- Orphan estoque_movimentos
SELECT COUNT(*) FROM estoque_movimentos e
LEFT JOIN farms f ON f.id = e.farm_id
WHERE f.id IS NULL;
```

- [ ] Todos os resultados devem ser 0

---

## PASSO 5 — PROFILES SEM AUTH

```sql
-- Profiles sem usuário correspondente no auth.users
SELECT p.id, p.email FROM profiles p
LEFT JOIN auth.users u ON u.id = p.id
WHERE u.id IS NULL;
```

- [ ] Resultado deve ser vazio (ou justificado)

---

## PASSO 6 — CÓDIGO SEGURO

Verifique nos arquivos TypeScript:

- [ ] Nenhum `eval()` ou `innerHTML` com dados do usuário
- [ ] Nenhuma query SQL construída por concatenação de string com input do usuário
- [ ] `supabaseAdmin` (service role) usado **apenas em services**, nunca em componentes diretamente
- [ ] Inputs de formulário validados antes de enviar ao Supabase

---

## PASSO 7 — DADOS DE TESTE

```sql
-- Usuários de demo (devem existir apenas em dev)
SELECT email FROM profiles WHERE email LIKE '%@malhada%' OR email LIKE '%admin@%';
```

- [ ] Em produção: verificar se dados de seed foram removidos ou são dados reais do cliente

---

## RELATÓRIO FINAL

```
TABELAS COM RLS: X/10
POLÍTICAS OK: X
ORPHANS ENCONTRADOS: X
ISSUES DE SEGURANÇA: X
```

Para cada problema encontrado: descreva o risco e a correção recomendada.
