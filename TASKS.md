# Tasks — Suplemento Control

> Última atualização: 2026-03-01

## Legenda
- [ ] Pendente
- [~] Em progresso
- [x] Concluído

---

## FASE 0 — Protótipo HTML (CONCLUÍDA ✅)

- [x] **T-001** Layout SPA com sidebar + tabs
- [x] **T-002** Formulário de lançamento
- [x] **T-003** Tabela de dados com adicionar/remover
- [x] **T-004** Salvar/carregar via localStorage
- [x] **T-005** Gráficos SVG de barras
- [x] **T-006** Filtros por suplemento, pasto, período
- [x] **T-007** Cores por tipo de suplemento
- [x] **T-008** Linha de média vermelha tracejada
- [x] **T-009** Summary cards KPI
- [x] **T-010** Filtros inline no toolbar
- [x] **T-011** Botão Imprimir/PDF
- [x] **T-012** CSS de impressão (@media print)
- [x] **T-013** Design moderno inspirado em dashboard de referência

---

## FASE 1 — SPA React + Vite (CONCLUÍDA ✅)

- [x] **T-101 a T-106** Setup do projeto (Vite + React + TS + Tailwind v4)
- [x] **T-110 a T-112** Camada de dados (data.ts, utils.ts, DataContext)
- [x] **T-120 a T-122** Layout + Routing (DashboardLayout, App.tsx, main.tsx)
- [x] **T-130 a T-133** Componentes (StatsOverview, MetricCard, SummaryChart, SupplementSection)
- [x] **T-140 a T-142** Páginas (Relatorio, Formulario, Cliente)
- [x] **T-150** Estilos CSS (Tailwind + variáveis + @media print)

---

## FASE 1.5 — Auth + Multi-tenant + Gestão (CONCLUÍDA ✅)

- [x] **T-170** Login.tsx com react-hook-form + capa.jpg
- [x] **T-171** AuthContext com sessão localStorage
- [x] **T-172** ProtectedRoute + ModuleRoute
- [x] **T-173** Tipos user.ts (Role, Module, FarmUser, AuthUser)
- [x] **T-174** userService CRUD localStorage + seed 2 usuários
- [x] **T-175** Tipo Farm (farm.ts)
- [x] **T-176** farmService CRUD localStorage
- [x] **T-177** DataContext refatorado — multi-tenant, chaves isoladas por farm
- [x] **T-178** Fazendas.tsx — admin: cards + modal; cliente: readonly
- [x] **T-179** Usuarios.tsx — admin: tabela + modal; cliente: lista readonly
- [x] **T-180** Pastos.tsx — gestão por fazenda, edição inline
- [x] **T-181** DashboardLayout — nav filtrado por módulos, badge role
- [x] **T-182** App.tsx — AuthProvider + rotas fazendas/usuarios
- [x] **T-183 a T-185** Assets — capa.jpg, logo.png, sidebar glassmorphism
- [x] **T-186** GitHub → https://github.com/HicaroDev/movimento_pecuario

---

## FASE 1.6 — Migração Supabase (CONCLUÍDA ✅)

- [x] **T-190** supabase.ts — cliente self-hosted (EasyPanel)
- [x] **T-191** AuthContext → supabase.auth + fetchProfile
- [x] **T-192** farmService → CRUD via tabela farms
- [x] **T-193** userService → CRUD via tabela profiles
- [x] **T-194** seed.sql + seed.mjs — 2 usuários, 1 fazenda, 19 pastos, 28 entries
- [x] **T-195** DataContext → Supabase (data_entries + pastures)
- [x] **T-196** AdminFarmSelector + ClientFarmSelector no sidebar
- [x] **T-197** Formulario → lançamentos via Supabase
- [x] **T-198** AuthUser ganha farmId + farmIds[]
- [x] **T-199** Cadastros.tsx — 5 tabs (Pastos, Animais, Suplementos, Funcionários, Equipamentos)

---

## FASE 2 — Melhorias + Features Avançadas (EM ANDAMENTO 🔄)

### 2A — Relatório Avançado
- [x] **T-200** Filtro por mês (chips YYYY-MM derivados de entries.data)
- [x] **T-201** Subtitle dinâmico no SummaryChart (farm name + mês selecionado)
- [x] **T-202** Badge dinâmico no Relatório (Admin/Cliente via user.role)
- [x] **T-203** Header dinâmico no SupplementSection (farmName prop)
- [x] **T-204** Export Excel (.xlsx) com SheetJS — dados filtrados

### 2B — Import Excel
- [x] **T-210** ImportExcelModal — drag & drop + file picker
- [x] **T-211** Parser SheetJS — lê primeira aba, extrai headers + rows
- [x] **T-212** Auto-mapping de colunas por padrões de nome
- [x] **T-213** UI de mapeamento manual (dropdown por campo)
- [x] **T-214** Preview 5 primeiras linhas
- [x] **T-215** Import em batch via DataContext.addEntry()

### 2C — Tabelas do Cadastros no Supabase
- [x] **T-220** migration_cadastros.sql — animals, supplement_types, employees, equipment
- [x] **T-221** RLS policies para todas as novas tabelas
- [ ] **T-222** Executar migration_cadastros.sql no Supabase ← PENDENTE (manual)

### 2D — Polish
- [ ] **T-230** Filtro de data com range (data início / data fim) além de chips por mês
- [ ] **T-231** Responsividade tablet/mobile
- [ ] **T-232** Empty states para Cadastros (cada tab vazia)
- [ ] **T-233** Deploy Vercel + configurar variáveis de ambiente

---

## FASE 3 — Escala SaaS (FUTURO ⬜)

- [ ] **T-300** Landing page pública
- [ ] **T-301** Planos de assinatura (Mercado Pago / Stripe)
- [ ] **T-302** Alertas de consumo fora da média
- [ ] **T-303** Relatórios comparativos entre fazendas
- [ ] **T-304** API pública para integração

---

## Resumo de Progresso

| Fase | Tasks | Concluídas | Status |
|------|-------|-----------|--------|
| 0 — Protótipo HTML | 13 | 13 | ✅ Concluída |
| 1 — React + Vite | 24 | 24 | ✅ Concluída |
| 1.5 — Auth + Multi-tenant | 16 | 16 | ✅ Concluída |
| 1.6 — Migração Supabase | 10 | 10 | ✅ Concluída |
| 2 — Melhorias Avançadas | 16 | 14 | 🔄 Em andamento |
| 3 — SaaS Escala | 5 | 0 | ⬜ Futuro |
| **TOTAL** | **84** | **77** | **92%** |

---

## Para Rodar

```bash
cd "suplemento-control"
npm run dev
# Abrir: http://localhost:5173
```

## Para Aplicar Migration das Tabelas do Cadastros

Execute `supabase/migration_cadastros.sql` no SQL Editor do Supabase:
`https://saas-supabase.bj3amt.easypanel.host`
