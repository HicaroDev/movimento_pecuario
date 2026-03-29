# /qa — Quality Assurance Completo
> Suplemento Control v1.29D — execute após qualquer implementação significativa

Você é um engenheiro de QA sênior. Execute todos os passos abaixo em ordem e reporte o resultado.

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

## PASSO 2 — PADRÃO DE HEADER (todas as páginas)

Leia cada página e verifique:

| Página | Arquivo |
|--------|---------|
| Relatório | `src/pages/Relatorio.tsx` |
| Formulário | `src/pages/Formulario.tsx` |
| Manejos | `src/pages/Manejos.tsx` |
| Cadastros | `src/pages/Cadastros.tsx` |
| Fazendas | `src/pages/Fazendas.tsx` |
| Usuários | `src/pages/Usuarios.tsx` |
| Estoque | `src/pages/Estoque.tsx` |
| OS | `src/pages/OS.tsx` |
| Livro Caixa | `src/pages/LivroCaixa.tsx` |

Para cada uma:
- [ ] Subtítulo: `text-xs font-semibold text-gray-400 uppercase tracking-widest mb-1` com texto **"Suplemento Control"**
- [ ] Título h1: `text-3xl font-bold text-gray-900`
- [ ] ❌ Sem `font-extrabold`, `text-2xl`, ou subtítulo customizado

---

## PASSO 3 — FLUXOS CRÍTICOS

### Auth
- [ ] `AuthContext.tsx` — `signInWithPassword` → `fetchProfile` → `setUser` com `farmId`
- [ ] `ProtectedRoute` — redireciona `/login` quando `!user`
- [ ] `ModuleRoute` — redireciona `/` quando módulo não habilitado
- [ ] Logout limpa localStorage e session

### DataContext
- [ ] `entries` carregados do Supabase com `farm_id = activeFarmId`
- [ ] Refresh ao voltar ao foco (visibility + online events, threshold 5s)

### Formulário
- [ ] Pasto vem de `pastures` do DataContext (não hardcoded)
- [ ] `kg = sacos × 25` calculado automaticamente
- [ ] Suplemento vem de `supplement_types` do Supabase

### Manejos
- [ ] `listarAnimais(farmId)` retorna apenas animais da fazenda
- [ ] Parição incrementa `bezerros_quantidade` no lote da mãe (não cria lote novo)

### Estoque (admin only)
- [ ] Guard `if (!isAdmin) return null` presente
- [ ] Entrada/saída registra em `estoque_movimentos` com `farm_id`
- [ ] `calcularSaldos` usa soma de entradas − saídas
- [ ] Alertas só disparam quando `alerta_reposicao = true`
- [ ] Aba "Pedidos" lista solicitações de compra com fluxo pendente→aprovada→recebida
- [ ] Ao "Receber" pedido → cria entrada em `estoque_movimentos`

### OS — Ordens de Suplemento (admin only)
- [ ] Guard `if (!isAdmin) return null` presente
- [ ] Numeração automática `OS-YYYY-NNN` via `generate_os_numero()`
- [ ] Ao confirmar execução → saída em `estoque_movimentos` + lançamento em `data_entries`
- [ ] Ao confirmar execução → despesa em `livro_caixa` para itens com `valor_kg` cadastrado
- [ ] Cancelar exige motivo obrigatório
- [ ] Deletar apenas OS com status `pendente`

### Livro Caixa (admin only)
- [ ] Guard `if (!isAdmin) return null` presente
- [ ] Cards de totalização: Receitas (verde), Despesas (vermelho), Saldo (dinâmico)
- [ ] Filtros: tipo, categoria, período (dateFrom/dateTo)
- [ ] Lançamentos com `origem = 'os'` não podem ser deletados (botão oculto)
- [ ] Export CSV com BOM UTF-8 para pt-BR
- [ ] Gráfico mensal Recharts: receitas vs despesas

---

## PASSO 4 — SEGURANÇA

- [ ] Nenhuma `SERVICE_ROLE_KEY` hardcoded em código frontend
- [ ] `supabaseAdmin` usa `import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY`
- [ ] Rotas admin (`/estoque`, `/os`, `/caixa`, `/devplan`) têm guard no componente
- [ ] RLS ativo nas tabelas: `livro_caixa`, `solicitacoes_compra`, `estoque_movimentos`, `ordens_suplemento`

---

## PASSO 5 — UX E CONSISTÊNCIA (padrão teal)

- [ ] Botões primários: `bg-teal-600 hover:bg-teal-700` ou `background: '#1a6040'`
- [ ] ❌ Sem `indigo`, `violet`, `purple` em botões de ação
- [ ] Todos os botões de submit têm `disabled` durante `saving/loading`
- [ ] Todos os erros de Supabase → `toast.error()`
- [ ] Todos os sucessos → `toast.success()`
- [ ] Skeleton ou spinner em todas as páginas que carregam dados
- [ ] Mensagem de "sem dados" apenas após `!loading`

---

## PASSO 6 — ROTAS E SIDEBAR

Verificar `src/App.tsx`:
- [ ] Rota `/estoque` → `Estoque`
- [ ] Rota `/os` → `OS`
- [ ] Rota `/caixa` → `LivroCaixa`
- [ ] Rota `/manejos` → `Manejos`

Verificar `src/layouts/DashboardLayout.tsx`:
- [ ] Badge de versão atualizado (`v1.29D`)
- [ ] Admin vê links reais: Estoque, Ordens (OS), Livro Caixa
- [ ] Clientes veem "EM BREVE" para Estoque, OS e Livro Caixa

---

## PASSO 7 — MOBILE

- [ ] Sidebar colapsável (hamburger na top bar mobile)
- [ ] Padding `p-4 md:p-8` nas páginas principais
- [ ] Grids responsivos — nenhum `grid-cols-N` sem breakpoint `md:` ou `lg:`

---

## RELATÓRIO FINAL

Produza:
- ✅ Itens OK
- 🔧 Itens corrigidos nesta execução
- ⚠️ Itens que precisam de atenção (com justificativa)
- ❌ Erros bloqueantes encontrados
