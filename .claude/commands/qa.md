# /qa — Quality Assurance Completo
> Suplemento Control — roda após qualquer implementação significativa

Você é um engenheiro de QA. Execute todos os passos abaixo em ordem e reporte o resultado.

---

## PASSO 1 — BUILD LIMPO

```bash
cd "C:\Users\Ione\OneDrive\Área de Trabalho\DEV\Cliente Stela\suplemento-control"
npm run build
```

- ✅ Deve terminar `✓ built in X.XXs` sem erros TypeScript
- ⚠️ Warnings de chunk size são aceitáveis
- ❌ Qualquer erro de tipo deve ser corrigido antes de continuar

---

## PASSO 2 — IMPORTS E EXPORTS

Verifique se não há imports quebrados ou tipos não encontrados:

```bash
grep -rn "from '\.\." src/ --include="*.tsx" --include="*.ts" | grep -v "node_modules"
```

- [ ] Nenhum import apontando para arquivo inexistente
- [ ] Nenhum `export` referenciado que não existe

---

## PASSO 3 — FLUXOS CRÍTICOS

Leia os arquivos e verifique cada fluxo:

### Auth
- [ ] `AuthContext.tsx` — `signInWithPassword` → `fetchProfile` → `setUser` com `farmId`
- [ ] `ProtectedRoute` — redireciona `/login` quando `!user`
- [ ] `ModuleRoute` — redireciona `/` quando módulo não habilitado
- [ ] Logout limpa localStorage e session

### DataContext
- [ ] `entries` carregados do Supabase com `farm_id = activeFarmId`
- [ ] Optimistic update em `addEntry` / `updateEntry` / `removeEntry`
- [ ] Refresh ao voltar ao foco (visibility + online events, threshold 5s)

### Formulário
- [ ] Pasto vem de `pastures` do DataContext (não hardcoded)
- [ ] `kg = sacos × 25` calculado automaticamente
- [ ] Suplemento vem de `supplement_types` do Supabase
- [ ] Submit cria registro em `data_entries` com `farm_id` correto

### Manejos
- [ ] `listarAnimais(farmId)` retorna apenas animais da fazenda
- [ ] Transferência atualiza `pasto_id` do animal
- [ ] Parição incrementa `bezerros_quantidade` no lote da mãe (não cria lote novo)
- [ ] Saída (abate/venda) atualiza `status` do animal

### Estoque
- [ ] Somente admin acessa `/estoque`
- [ ] Entrada/saída registra em `estoque_movimentos` com `farm_id`
- [ ] `calcularSaldos` usa soma de entradas − saídas
- [ ] Alertas só disparam quando `alerta_reposicao = true`

---

## PASSO 4 — SEGURANÇA BÁSICA

- [ ] Nenhuma `SERVICE_ROLE_KEY` exposta em código frontend (deve estar em variável de ambiente)
- [ ] `supabaseAdmin` usa `import.meta.env.VITE_SUPABASE_SERVICE_KEY` (nunca hardcoded)
- [ ] Rotas admin (`/estoque`, `/devplan`) têm guard `if (!isAdmin)` no componente
- [ ] RLS ativo nas tabelas críticas (verificar via `/validar-dados`)

---

## PASSO 5 — UX E CONSISTÊNCIA

- [ ] Todos os botões de submit têm `disabled` durante `saving/loading`
- [ ] Todos os erros de Supabase são exibidos com `toast.error()`
- [ ] Todos os sucessos têm `toast.success()`
- [ ] Loading states (Skeleton) em todas as páginas que carregam dados
- [ ] Mensagem de "sem dados" apenas após loading completar

---

## PASSO 6 — MOBILE

- [ ] Sidebar colapsável em mobile (hamburger na top bar)
- [ ] Padding `p-4 md:p-8` nas páginas principais
- [ ] Grids responsivos (nenhum `grid-cols-4` sem breakpoint `md:` ou `lg:`)
- [ ] Inputs com altura mínima `h-10` para toque

---

## RELATÓRIO FINAL

Liste:
- ✅ Itens OK
- 🔧 Itens corrigidos nesta execução
- ⚠️ Itens que precisam de atenção mas não foram alterados (com justificativa)
