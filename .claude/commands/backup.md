# /backup — Backup do Projeto e do Banco de Dados
> Suplemento Control — execute antes de mudanças grandes ou semanalmente

Você vai garantir que o código e os dados do banco estão salvos com segurança.

---

## PARTE 1 — BACKUP DO CÓDIGO (Git)

### 1.1 Verificar status

```bash
cd "C:\Users\Ione\OneDrive\Área de Trabalho\DEV\Cliente Stela\suplemento-control"
git status
git log --oneline -5
```

- [ ] Nenhum arquivo modificado sem commit (se houver, fazer commit antes)
- [ ] Branch `main` está sincronizada com `origin/main`

### 1.2 Push de segurança

```bash
git push origin main
```

- [ ] Push realizado com sucesso

### 1.3 Verificar repositório remoto

- **GitHub:** https://github.com/HicaroDev/movimento_pecuario
- Confirme que o último commit no GitHub bate com o local

### 1.4 Tag de versão (opcional — para releases importantes)

```bash
git tag -a v$(node -p "require('./package.json').version") -m "Backup $(date +%Y-%m-%d)"
git push origin --tags
```

---

## PARTE 2 — BACKUP DO BANCO DE DADOS (Supabase)

### 2.1 Export via pg-meta

O Supabase self-hosted (EasyPanel) permite export via API. Use o SQL Editor em:
`https://saas-supabase.bj3amt.easypanel.host`

### 2.2 Exportar tabelas críticas

Execute cada query no SQL Editor e salve o resultado como CSV:

```sql
-- 1. Fazendas
SELECT * FROM farms ORDER BY created_at;

-- 2. Profiles (usuários)
SELECT id, name, email, role, modules, farm_id, active, created_at
FROM profiles ORDER BY created_at;

-- 3. Data entries (lançamentos)
SELECT * FROM data_entries ORDER BY data DESC;

-- 4. Animals (lotes)
SELECT * FROM animals ORDER BY created_at;

-- 5. Supplement types
SELECT * FROM supplement_types ORDER BY nome;

-- 6. Pastures
SELECT * FROM pastures ORDER BY nome;

-- 7. Estoque movimentos
SELECT * FROM estoque_movimentos ORDER BY data DESC;

-- 8. Manejo historico
SELECT * FROM manejo_historico ORDER BY created_at DESC;
```

### 2.3 Salvar os arquivos

Salve os CSVs em:
```
C:\Users\Ione\OneDrive\Área de Trabalho\DEV\Backups\suplemento-control\YYYY-MM-DD\
```

### 2.4 Verificação de contagem

```sql
SELECT
  (SELECT COUNT(*) FROM farms)             AS farms,
  (SELECT COUNT(*) FROM profiles)          AS profiles,
  (SELECT COUNT(*) FROM data_entries)      AS data_entries,
  (SELECT COUNT(*) FROM animals)           AS animals,
  (SELECT COUNT(*) FROM pastures)          AS pastures,
  (SELECT COUNT(*) FROM supplement_types)  AS supplement_types,
  (SELECT COUNT(*) FROM estoque_movimentos) AS estoque_movimentos,
  (SELECT COUNT(*) FROM manejo_historico)  AS manejo_historico;
```

Registre as contagens para comparação futura.

---

## PARTE 3 — CHECKLIST FINAL

- [ ] Código: todos os commits feitos e push realizado
- [ ] GitHub: commit mais recente visível no repositório remoto
- [ ] Banco: CSVs das tabelas críticas salvos localmente
- [ ] Contagens registradas para auditoria

---

## RELATÓRIO

```
BACKUP — [DATA]

Código:
  Último commit: [hash] — [mensagem]
  Branch: main → origin/main ✅

Banco (contagens):
  farms: X | profiles: X | data_entries: X
  animals: X | pastures: X | supplement_types: X
  estoque_movimentos: X | manejo_historico: X

Status: ✅ Backup completo
```
