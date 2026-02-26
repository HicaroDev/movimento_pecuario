# Tasks — Suplemento Control

> Última atualização: 2026-02-26

## Legenda
- [ ] Pendente
- [~] Em progresso
- [x] Concluído

---

## FASE 0 — Protótipo HTML (CONCLUÍDA ✅)

- [x] **T-001** Criar layout SPA com sidebar + tabs (Formulário / Relatório)
- [x] **T-002** Formulário de lançamento com 7 campos
- [x] **T-003** Tabela de dados com adicionar/remover
- [x] **T-004** Salvar/carregar dados via localStorage
- [x] **T-005** Gráficos SVG de barras com dados de exemplo
- [x] **T-006** Filtros por suplemento, pasto, período
- [x] **T-007** Cores por tipo de suplemento (verde/azul/roxo)
- [x] **T-008** Linha de média vermelha tracejada com label
- [x] **T-009** Summary cards KPI com badges e ícones
- [x] **T-010** Filtros inline no toolbar do relatório
- [x] **T-011** Botão Imprimir/PDF
- [x] **T-012** CSS de impressão (@media print)
- [x] **T-013** Design moderno inspirado em dashboard de referência

---

## FASE 1 — SPA React + Vite (CONCLUÍDA ✅)

### 1A — Configuração do Projeto
- [x] **T-101** Criar `package.json` com React + Vite + Tailwind CSS v4 + Recharts + React Router + React Hook Form + Motion + Sonner + Lucide
- [x] **T-102** Criar `vite.config.ts` com plugin React e Tailwind
- [x] **T-103** Criar `tsconfig.json` / `tsconfig.app.json` / `tsconfig.node.json`
- [x] **T-104** Criar `index.html` como entry point Vite
- [x] **T-105** Executar `npm install` com sucesso
- [x] **T-106** Build de produção sem erros TypeScript (`npm run build` ✅)

### 1B — Camada de Dados
- [x] **T-110** `src/lib/data.ts` — interface `DataEntry`, `STORAGE_KEY`, `sampleRows` (29 linhas), `loadData()`, `saveData()`, `supplementOrder`, `supplementColors`
- [x] **T-111** `src/lib/utils.ts` — `fmt`, `fmtInt`, `groupByType`, `averageConsumo`, `sumQuantidade`, `cn`
- [x] **T-112** `src/context/DataContext.tsx` — estado global React com auto-persistência; tipos `ClientInfo` e `Pasture`; CRUD pastos (`addPasture`, `deletePasture`, `updatePasture`); `updateClientInfo`; 3 chaves localStorage

### 1C — Layout + Routing
- [x] **T-120** `src/layouts/DashboardLayout.tsx` — sidebar gradient Figma, logo Leaf, **3 nav itens** (Relatório / Formulário / Cliente), footer
- [x] **T-121** `src/App.tsx` — `createBrowserRouter` com `/` → Relatório, `/formulario` → Formulário, `/cliente` → Cliente
- [x] **T-122** `src/main.tsx` — entry point React

### 1D — Componentes do Dashboard
- [x] **T-130** `src/components/StatsOverview.tsx` — 4 KPI cards (registros/cabeças/pastos/consumo médio), ícones coloridos, motion staggered
- [x] **T-131** `src/components/MetricCard.tsx` — card com ícone, valor grande, trend badge com bg colorido (`bg-green-50`/`bg-red-50`), motion hover
- [x] **T-132** `src/components/SummaryChart.tsx` — card com motion, legenda lateral esquerda + Recharts BarChart, aceita `title`/`subtitle`
- [x] **T-133** `src/components/SupplementSection.tsx` — cabeçalho verde, tabela 7 colunas, totais, gráfico com `ReferenceLine` vermelha, escala dinâmica por tipo

### 1E — Páginas
- [x] **T-140** `src/pages/Relatorio.tsx` — page header + badge "Admin"; filtros em card branco 4-colunas com ChevronDown; "Limpar filtros"; "Exportar PDF" (FileDown); StatsOverview + MetricCards × 3 + SummaryChart + SupplementSection × 3
- [x] **T-141** `src/pages/Formulario.tsx` — header com link "Ir para Relatórios"; pasto como select dinâmico (pastos do contexto); auto-cálculo kg = sacos × 25 e consumo = kg ÷ (qtd × período); botões Adicionar / Carregar Exemplo / Salvar / Limpar Tudo; tabela completa de registros
- [x] **T-142** `src/pages/Cliente.tsx` — header; card logo com upload FileReader → base64 (max 2MB); card info cliente (nome fazenda, cliente, cabeças, endereço, telefone, email); toggle editar/visualizar; tabela de pastos cadastrados; sidebar form "Novo Pasto" (nome, área, observações)

### 1F — Estilo
- [x] **T-150** `src/styles/index.css` — Tailwind directives + variáveis CSS (--green, --navy, --purple, --teal) + @media print

---

## FASE 1 — Verificações Pendentes

- [ ] **T-160** Testar no browser: sidebar com navegação funcional (3 rotas)
- [ ] **T-161** Testar: formulário adiciona dados e persiste no localStorage
- [ ] **T-162** Testar: botão "Carregar Exemplo" popula 29 linhas
- [ ] **T-163** Testar: Relatório exibe filtros card, tabelas e gráficos corretos
- [ ] **T-164** Testar: seções Energético/Mineral/Creep com cabeçalho verde correto
- [ ] **T-165** Testar: filtros (suplemento, pasto, período) funcionam + "Limpar filtros"
- [ ] **T-166** Testar: "Exportar PDF" dispara `window.print()` com layout landscape
- [ ] **T-167** Testar: dados do app vanilla HTML são lidos automaticamente (chave `suplementoControlData`)
- [ ] **T-168** Testar: página Cliente salva dados da fazenda no localStorage
- [ ] **T-169** Testar: adicionar/remover pasto na página Cliente atualiza select do Formulário

---

## FASE 1.5 — Auth + Multi-tenant + Gestão (CONCLUÍDA ✅)

### Auth & Controle de Acesso
- [x] **T-170** `src/pages/Login.tsx` — split-screen: painel esquerdo `capa.jpg` com overlay + headline, painel direito form com react-hook-form, toggle senha, redirect automático
- [x] **T-171** `src/context/AuthContext.tsx` — sessão localStorage, `login()` via userService, `logout()`, `isAdmin`, `hasModule(m)`, migração automática de módulos legados
- [x] **T-172** `src/components/ProtectedRoute.tsx` — `ProtectedRoute` (redireciona /login se sem sessão) + `ModuleRoute` (redireciona / se módulo não habilitado)
- [x] **T-173** `src/types/user.ts` — tipos `Role`, `Module` (`relatorio|formulario|pastos|fazendas|usuarios`), `FarmUser`, `AuthUser`

### Serviços (camada API-ready)
- [x] **T-174** `src/services/userService.ts` — CRUD localStorage com seed 2 usuários, `migrateModules()` (renomeia `cliente→fazendas`, garante todos os módulos), `listByFarm()`
- [x] **T-175** `src/types/farm.ts` — tipo `Farm` (entidade separada de FarmUser)
- [x] **T-176** `src/services/farmService.ts` — CRUD localStorage com seed `farm-1` (Fazenda Malhada Grande)

### Dados Multi-tenant
- [x] **T-177** `src/context/DataContext.tsx` — refatorado: `activeFarmId` por fazenda, chaves localStorage isoladas por farm (`suplementoControlData_${farmId}`, `suplementoControlPastures_${farmId}`), `clientInfo` vem do `farmService`, migração de dados legados para farm-id `'2'`

### Páginas
- [x] **T-178** `src/pages/Fazendas.tsx` — admin: grid de cards de fazendas com modal criar/editar (todos os campos + toggle ativo + upload logo); cliente: visualização readonly da sua fazenda vinculada
- [x] **T-179** `src/pages/Usuarios.tsx` — admin: tabela de usuários com modal (nome, email, senha, role, fazenda vinculada, módulos via checkboxes, toggle ativo); cliente: lista readonly dos usuários da sua fazenda com badges de módulos
- [x] **T-180** `src/pages/Pastos.tsx` — gestão de pastos por fazenda; admin tem seletor de fazenda; edição inline na tabela; placeholder "Relatório de Pastos — em breve"

### Layout & Roteamento
- [x] **T-181** `src/layouts/DashboardLayout.tsx` — nav filtrado por `hasModule()`, adicionados itens Pastos / Fazendas / Usuários com ícones Leaf / Building2 / Users; badge role dinâmico; nome do usuário no rodapé
- [x] **T-182** `src/App.tsx` — `AuthProvider` wrapping `DataProvider`; rotas `/fazendas` e `/usuarios` com `ModuleRoute`; `Cliente.tsx` removido

### Visual / Assets
- [x] **T-183** Login: painel esquerdo substituído por `capa.jpg` (boi + trator + nós tech) com overlay verde escuro, logo em card backdrop-blur, headline em 3 linhas, bullets refinados
- [x] **T-184** Logo oficial `Movimento Pecuário` aplicada em todo o app (sidebar + login ambos os painéis)
- [x] **T-185** Imagens organizadas em `public/images/` (logo.png + capa.jpg) — referências atualizadas em todos os arquivos

### Infraestrutura
- [x] **T-186** Repositório GitHub criado e código publicado → https://github.com/HicaroDev/movimento_pecuario

---

## FASE 2 — SaaS com Backend (PLANEJADA ⬜)

### 2A — Setup + Fundação
- [ ] **T-200** Criar projeto Next.js 15 com TypeScript + Tailwind + App Router
- [ ] **T-201** Instalar dependências: supabase-js, ssr, recharts, xlsx, lucide-react, shadcn/ui
- [ ] **T-202** Criar projeto no Supabase Dashboard
- [ ] **T-203** Configurar variáveis de ambiente (.env.local)
- [ ] **T-204** Criar arquivo de migrations SQL (todas as tabelas)
- [ ] **T-205** Executar migrations no Supabase (`supabase db push`)
- [ ] **T-206** Configurar Supabase client (browser + server + middleware)
- [ ] **T-207** Deploy inicial no Vercel (Hello World)

### 2B — Auth + Layout
- [ ] **T-210** Página de Login (`/login`)
- [ ] **T-211** Página de Registro (`/registro`)
- [ ] **T-212** Middleware de proteção de rotas autenticadas
- [ ] **T-213** Layout dashboard com Sidebar (`(dashboard)/layout.tsx`)
- [ ] **T-214** Componente Header com user chip e logout
- [ ] **T-215** Criação automática de perfil + organização no registro

### 2C — CRUDs Base
- [ ] **T-220** CRUD Fazendas (tabela + form + dialog)
- [ ] **T-221** CRUD Retiros com select de fazenda pai
- [ ] **T-222** CRUD Pastos com select de retiro pai (cascata)
- [ ] **T-223** CRUD Suplementos com tipo (mineral/energético/ração)
- [ ] **T-224** CRUD Forragens
- [ ] **T-225** Seed: Fazenda Malhada Grande com pastos de exemplo

### 2D — Lançamento de Consumo
- [ ] **T-230** Formulário de lançamento com selects cascata (Fazenda → Retiro → Pasto)
- [ ] **T-231** Cálculo automático: consumo kg/cab/dia
- [ ] **T-232** Salvar no Supabase + feedback de sucesso
- [ ] **T-233** Tabela de lançamentos com paginação e ordenação
- [ ] **T-234** Deletar registro com confirmação

### 2E — Dashboard + Gráficos
- [ ] **T-240** KPI Cards (consumo médio, registros, pastos ativos)
- [ ] **T-241** FilterBar: período, fazenda, retiro, suplemento, pasto
- [ ] **T-242** Gráfico de barras resumo (Recharts) com cores por suplemento
- [ ] **T-243** Página relatórios com gráficos por seção + ReferenceLine vermelha
- [ ] **T-244** Tabelas por suplemento com totais (idêntico à Fase 1)
- [ ] **T-245** Sheet headers verdes (idêntico à Fase 1)

### 2F — Import/Export
- [ ] **T-250** Import de planilha Excel (.xlsx) — upload + parse
- [ ] **T-251** Mapeamento de colunas (UI com preview)
- [ ] **T-252** Import em batch para Supabase
- [ ] **T-253** Export PDF (window.print) com layout correto
- [ ] **T-254** Export Excel/CSV dos dados filtrados

### 2G — Polish + Deploy
- [ ] **T-260** Loading states (skeletons, spinners)
- [ ] **T-261** Empty states (quando não há dados)
- [ ] **T-262** Responsividade tablet/mobile
- [ ] **T-263** Deploy final Vercel + Supabase produção

---

## FASE 3 — Escala SaaS (FUTURO ⬜)

- [ ] **T-300** Landing page pública
- [ ] **T-301** Planos de assinatura (Mercado Pago / Stripe)
- [ ] **T-302** Multi-organização completo
- [ ] **T-303** Alertas de consumo fora da média
- [ ] **T-304** Relatórios comparativos entre fazendas
- [ ] **T-305** API pública para integração

---

## Resumo de Progresso

| Fase | Tasks | Concluídas | Status |
|------|-------|-----------|--------|
| 0 — Protótipo HTML | 13 | 13 | ✅ Concluída |
| 1 — React + Vite | 24 | 24 | ✅ Concluída |
| 1 — Verificações browser | 10 | 0 | [ ] Pendente |
| 1.5 — Auth + Multi-tenant + Gestão | 16 | 16 | ✅ Concluída |
| 2A-G — Next.js + Supabase | 35 | 0 | ⬜ Planejada |
| 3 — SaaS Escala | 6 | 0 | ⬜ Futuro |
| **TOTAL** | **104** | **53** | **51%** |

---

## Para Rodar Agora

```bash
cd "suplemento-control"
npm run dev
# Abrir: http://localhost:5173
```
