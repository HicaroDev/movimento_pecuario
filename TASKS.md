# Tasks — Suplemento Control

> Última atualização: 2026-03-10

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
- [x] **T-222** Executar migration_cadastros.sql no Supabase ✅

### 2D — Polish
- [ ] **T-230** Filtro de data com range (data início / data fim) além de chips por mês
- [ ] **T-231** Responsividade tablet/mobile
- [ ] **T-232** Empty states para Cadastros (cada tab vazia)
- [x] **T-233** Deploy EasyPanel (Dockerfile + nginx + env vars) ✅
- [x] **T-234** Sync: refresh silencioso ao voltar ao foco (visibility + focus + online, threshold 5s) ✅

### 2E — Deploy otimizado (tudo no VPS)
- [ ] **T-240** GitHub Actions: build Docker no CI e push para ghcr.io → EasyPanel só puxa imagem pronta (~20s deploy)
- [ ] **T-241** Alternativa Nixpacks: remover Dockerfile e usar Nixpacks nativo do EasyPanel (~1-2 min deploy)

### 2F — Módulo Manejos (CONCLUÍDO ✅)
- [x] **T-250** `src/pages/Manejos.tsx` — estrutura base + 5 tabs
- [x] **T-251** `src/services/manejoService.ts` — CRUD animals, categorias, historico
- [x] **T-252** `supabase/ajustes_v116b.sql` — tabelas: animals, supplement_types, employees, manejo_historico + RLS
- [x] **T-253** Tab "Lotes por Pasto" — listagem de animais agrupados por pasto
- [x] **T-254** Tab "Transferir" — mover animal entre pastos com registro no histórico
- [x] **T-255** Tab "Evolução" — subtabs: Categoria, Parição, Desmama
- [x] **T-256** Tab "Saída" — abate ou venda com quantidade parcial/total + encerrar lote
- [x] **T-257** Tab "Histórico" — tabela filtrada por período, tipo e pasto
- [x] **T-258** Alocação de animais a pastos (modal inline em LotesTab)
- [x] **T-259** Rota `/manejos` + módulo `manejos` no sistema de auth

### 2G — AJUSTES MP_04 MAR + PDF Profissional (CONCLUÍDO ✅)
- [x] **T-260** Reordenar sidebar: Manejo → Lançamento → Relatórios → Cadastros → Usuários → Fazenda
- [x] **T-261** LotesTab: header global da fazenda (HA total, N° pastos, Cab total, Peso Médio Pond.)
- [x] **T-262** LotesTab: somatória por pasto (total cab + peso médio ponderado por pasto)
- [x] **T-263** LotesTab: sub-row laranja de bezerros (bezerros_quantidade + bezerros_peso_medio)
- [x] **T-264** LotesTab: bezerros no header global (total bezerros + peso médio ponderado)
- [x] **T-265** Selects de lote (Parição, Desmama, Saída): exibir categoria junto com nome e quantidade
- [x] **T-266** Desmama: mostrar "Bezerros disponíveis: X cab." ao selecionar lote origem
- [x] **T-267** EvolucaoTab: "+ X bez." em laranja na lista de checkboxes dos lotes
- [x] **T-268** EvolucaoTab > Categoria: campo "Novo peso médio — Bezerros" quando lote selecionado tem bezerros
- [x] **T-269** `manejoService.evoluirCategorias()`: atualizar bezerros_peso_medio nos animais com bezerros
- [x] **T-270** Remover opção "Desagrupar bezerros" da tab Saída
- [x] **T-271** Cadastros > Suplementos: coluna CONSUMO com 9 opções (range de g/100kg PV a % PV)
- [x] **T-272** SQL: `ALTER TABLE supplement_types ADD COLUMN consumo text` (em ajustes_v116b.sql)
- [x] **T-273** SupplementSection: trocar azul `#3b82f6` por verde `#1a6040` nas colunas de números
- [x] **T-274** Sidebar: "Formulário Pasto" e "Livro Caixa" como itens dimmed com badge "EM BREVE"
- [x] **T-275** Sidebar: modal "Em Desenvolvimento" ao clicar nos módulos em breve
- [x] **T-276** PDF Histórico de Manejos: brand bar verde, cards de período/total/resumo por tipo, badges coloridos (landscape)
- [x] **T-277** PDF Pastos: botão PDF no header, layout portrait, brand bar, sumário de área total, tabela numerada
- [x] **T-278** index.css: `print-color-adjust`, classes `.pdf-brand-bar`, `.pdf-table`, `.pdf-badge-*`

### 2H — Ajustes MP_05 MAR (CONCLUÍDO ✅)
- [x] **T-280** Formulário: date picker (sem datas futuras) + auto-fill pasto/suplemento + remover Consumo
- [x] **T-282** fix: bug cursor desaparece no campo "Nome do novo lote" — Desmama (DestinoSelector remontava)
- [x] **T-283** Formulário: suplementos carregados do banco (supplement_types) ao invés de lista estática
- [x] **T-284** Formulário: ao selecionar pasto → auto-fill quantidade + badge N° lotes

### 2I — Entregas Finais (PENDENTE)
- [ ] **T-281** Relatório / Dashboard corporativo: redesign visual completo
- [ ] **T-285** Formulário: validar/documentar formato Excel para importação
- [ ] **T-230** Filtro de data com range (início/fim) no Relatório
- [ ] **T-231** Responsividade tablet/mobile

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
| 2A–E — Melhorias Avançadas | 19 | 17 | 🔄 89% |
| 2F — Módulo Manejos | 10 | 10 | ✅ Concluída |
| 2G — Ajustes MP_04 MAR + PDF | 19 | 19 | ✅ Concluída |
| 2H — Ajustes MP_05 MAR | 4 | 4 | ✅ Concluída |
| 2I — Entregas Finais | 4 | 0 | 🔄 Pendente |
| 3 — SaaS Escala | 5 | 0 | ⬜ Futuro |
| **TOTAL** | **126** | **117** | **93%** |

---

## Para Rodar

```bash
cd "suplemento-control"
npm run dev
# Abrir: http://localhost:5173
```

## Para Aplicar Migration Completa (v116b)

Execute `supabase/ajustes_v116b.sql` no SQL Editor do Supabase:
`https://saas-supabase.bj3amt.easypanel.host`

Inclui: tabelas `animals`, `supplement_types` (+ coluna `consumo`), `employees`, `manejo_historico` + todas as RLS policies.

## Commits Recentes

| Hash | Descrição |
|------|-----------|
| `bf34c92` | chore: bump versão sidebar para v1.17 |
| `82aa287` | feat: v1.17 — Formulário redesign + fix cursor Desmama |
| `214f85b` | feat: header global e por pasto com peso médio bezerros + total geral |
| `65d1b71` | feat: Exportar PDF na aba Lotes por Pasto |
| `7024af2` | fix: PDF limpo + farm name no Histórico + PDF button no Pastos |
| `b0b5920` | feat: PDF profissional Histórico de Manejos e Pastos |
