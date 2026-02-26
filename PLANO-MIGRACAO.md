# Plano de Migração — Suplemento Control

> Última atualização: 2026-02-25

---

## Visão Geral das Fases

| Fase | Descrição | Stack | Status |
|------|-----------|-------|--------|
| **0** | Protótipo HTML/JS vanilla | HTML + CSS + JS | ✅ Concluída |
| **1** | SPA React standalone (localStorage) | React + Vite + Tailwind + Recharts | ✅ **Concluída** |
| **2** | Migração para SaaS com backend | Next.js + Supabase + Auth | ⬜ Planejada |

---

## FASE ATUAL: Fase 1 — SPA React Standalone

### Objetivo
Migrar o app vanilla HTML/JS para React + TypeScript + Vite + Tailwind CSS,
mantendo localStorage como fonte de dados, seguindo o design do Figma (`Recriação de site` + melhorias do export `modelo`).
A seção de relatório é idêntica ao app original.

### Stack Utilizada

| Camada | Tecnologia |
|--------|------------|
| Framework | React 18 + TypeScript |
| Build | Vite 6 |
| Estilo | Tailwind CSS v4 |
| Gráficos | Recharts 2 |
| Routing | React Router 7 |
| Formulários | React Hook Form |
| Animações | Motion (motion/react) |
| Notificações | Sonner |
| Ícones | Lucide React |
| Persistência | localStorage (3 chaves) |

### Estrutura Final do Projeto

```
suplemento-control/
├── package.json
├── vite.config.ts
├── tsconfig.json / tsconfig.app.json / tsconfig.node.json
├── index.html                    ← entry point Vite
└── src/
    ├── main.tsx
    ├── App.tsx                   ← Router + DataProvider + Toaster
    ├── vite-env.d.ts
    ├── styles/
    │   └── index.css             ← Tailwind + variáveis CSS + @media print
    ├── lib/
    │   ├── data.ts               ← DataEntry, STORAGE_KEY, sampleRows (29 linhas), loadData/saveData
    │   └── utils.ts              ← fmt, fmtInt, groupByType, averageConsumo, sumQuantidade
    ├── context/
    │   └── DataContext.tsx       ← entries + clientInfo + pastures, persistência automática
    ├── layouts/
    │   └── DashboardLayout.tsx   ← sidebar gradient #1a1f2e → #2d3548 (Figma), 3 nav itens
    ├── pages/
    │   ├── Relatorio.tsx         ← Header + Filtros card + KPIs + Gráficos + Seções por suplemento
    │   ├── Formulario.tsx        ← Formulário de lançamento + tabela de registros
    │   └── Cliente.tsx           ← Cadastro de fazenda + logo upload + gestão de pastos
    └── components/
        ├── StatsOverview.tsx     ← 4 KPI cards (azul/verde/roxo/laranja)
        ├── MetricCard.tsx        ← card gradiente com ícone, valor e trend badge colorido
        ├── SummaryChart.tsx      ← card com legenda + Recharts BarChart (motion animado)
        └── SupplementSection.tsx ← seção completa: cabeçalho verde, tabela 7 colunas, totais, gráfico com ReferenceLine vermelha
```

### Rotas

| Rota | Componente | Descrição |
|------|-----------|-----------|
| `/` | `Relatorio` | Página principal: header + filtros card + KPIs + gráficos + seções por suplemento |
| `/formulario` | `Formulario` | Adicionar/remover/carregar registros |
| `/cliente` | `Cliente` | Cadastro de fazenda, logo, contato e lista de pastos |

### Persistência (localStorage)

| Chave | Conteúdo |
|-------|----------|
| `suplementoControlData` | Array de `DataEntry` (registros de consumo) |
| `suplementoControlClient` | Objeto `ClientInfo` (dados da fazenda/cliente) |
| `suplementoControlPastures` | Array de `Pasture` (lista de pastos cadastrados) |

- Compatibilidade com dados do app HTML antigo (chave `suplementoControlData`)
- Suporte a legacy arrays-of-arrays (conversão automática em `loadData()`)
- Auto-persistência via `useEffect` no `DataContext`

### Melhorias do Figma export (`modelo`) — implementadas

- **Relatorio**: header com title + description + badge "Admin"; filtros em card branco 4-colunas; botão "Limpar filtros"; aviso de resultado vazio dentro do card; botão "Exportar PDF" com ícone `FileDown`; `ChevronDown` nos selects; animações `motion`
- **SummaryChart**: tornou-se card completo com motion, legenda lateral esquerda + gráfico, aceita `title` e `subtitle`
- **MetricCard**: trend badge com background colorido (`bg-green-50` / `bg-red-50`)
- **Formulario**: `pasto` agora é select dinâmico populado da lista de pastos do contexto; `kg = sacos × 25` é auto-calculado
- **DataContext**: extendido com `ClientInfo` + `Pasture` + CRUD completo (`addPasture`, `deletePasture`, `updatePasture`, `updateClientInfo`)
- **DashboardLayout**: 3º item de navegação "Cliente" com ícone `Building2`
- **Cliente**: página completa de cadastro de fazenda com upload de logo (FileReader → base64) e gestão de pastos

### O que NÃO mudou
- Conteúdo textual do relatório (títulos, colunas, totais)
- Lógica de cálculo (médias, somas, agrupamentos)
- Escala dos gráficos por tipo (Energético max=1.5, Mineral max=0.2, Creep max=1.0)
- Cabeçalho verde "CONTROLE DE CONSUMO..." com "MOVIMENTO PECUÁRIO"
- Linha de referência vermelha tracejada nos gráficos
- Suporte a impressão/PDF via `@media print`

---

## FASE PRÓXIMA: Fase 2 — SaaS com Backend

### Objetivo
Evoluir o app React para um SaaS multi-tenant com banco de dados real, autenticação e deploy em nuvem.

### Stack Planejada

| Camada | Tecnologia | Justificativa |
|--------|------------|---------------|
| Framework | Next.js 15 (App Router) | SSR, routing, API routes |
| Backend/DB | Supabase (PostgreSQL) | Auth, DB, RLS, free tier |
| UI Base | shadcn/ui | Componentes acessíveis |
| Import Excel | SheetJS (xlsx) | Migração de planilhas históricas |
| Hospedagem | Vercel + Supabase | Deploy automático, free tier |

### Banco de Dados (PostgreSQL via Supabase)

```sql
CREATE TABLE organizations (id UUID PRIMARY KEY, name TEXT, created_at TIMESTAMPTZ);
CREATE TABLE farms (id UUID PRIMARY KEY, org_id UUID REFERENCES organizations, name TEXT);
CREATE TABLE divisions (id UUID PRIMARY KEY, farm_id UUID REFERENCES farms, name TEXT);
CREATE TABLE pastures (id UUID PRIMARY KEY, division_id UUID REFERENCES divisions, name TEXT);
CREATE TABLE supplements (id UUID PRIMARY KEY, org_id UUID REFERENCES organizations, name TEXT, type TEXT);
CREATE TABLE forage_types (id UUID PRIMARY KEY, org_id UUID REFERENCES organizations, name TEXT);
CREATE TABLE consumption_records (
  id UUID PRIMARY KEY,
  org_id UUID REFERENCES organizations,
  farm_id UUID REFERENCES farms,
  division_id UUID REFERENCES divisions,
  pasture_id UUID REFERENCES pastures,
  supplement_id UUID REFERENCES supplements,
  forage_type_id UUID REFERENCES forage_types,
  closing_date DATE NOT NULL,
  lot_size INTEGER,
  days_count INTEGER DEFAULT 30,
  sacks_25kg INTEGER,
  kg_consumed NUMERIC(10,2),
  consumption_per_head_day NUMERIC(8,4),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);
CREATE TABLE profiles (id UUID PRIMARY KEY, user_id UUID REFERENCES auth.users, org_id UUID REFERENCES organizations, role TEXT, name TEXT);
```

### Fases Detalhadas

#### Fase 2A — Setup + Fundação
- Criar projeto Next.js 15 com TypeScript + Tailwind
- Configurar Supabase (projeto + banco + auth)
- Criar migrations SQL + executar no Supabase
- Deploy inicial no Vercel

#### Fase 2B — Auth + Layout
- Login / Registro via Supabase Auth
- Layout dashboard (Sidebar + Header)
- Middleware de proteção de rotas

#### Fase 2C — CRUDs Base
- CRUD Fazendas, Retiros, Pastos, Suplementos, Forragens
- Seed: Fazenda Malhada Grande com dados de exemplo

#### Fase 2D — Lançamento de Consumo
- Formulário de lançamento com selects cascata
- Tabela de registros com paginação e edição inline

#### Fase 2E — Dashboard + Gráficos
- KPI Cards, FilterBar, gráficos Recharts idênticos à Fase 1
- Tabelas por suplemento com totais

#### Fase 2F — Relatórios + Import/Export
- Import de planilha Excel (.xlsx)
- Export PDF (window.print) + Export Excel/CSV

#### Fase 2G — Polish + Deploy
- Loading states, responsividade mobile, performance
- Deploy final Vercel + Supabase produção

---

## Mapeamento: Código Atual → Fase 2 (Next.js)

| Fase 1 (React/Vite) | Fase 2 (Next.js/Supabase) |
|---------------------|---------------------------|
| `loadData()` localStorage | Supabase queries (`lib/queries/`) |
| `saveData()` localStorage | Supabase `INSERT`/`UPDATE` |
| `ClientInfo` localStorage | tabela `farms` + `organizations` |
| `Pasture[]` localStorage | tabela `pastures` |
| `groupByType()` em memória | GROUP BY na query SQL |
| `averageConsumo()` em memória | AVG() na query SQL |
| `DataContext` state React | Supabase realtime |
| `window.print()` | API route ou print CSS |
| Filtros React state | SQL WHERE clauses |

---

## Riscos e Mitigações

| Risco | Mitigação |
|-------|-----------|
| Path com Unicode quebra ferramentas | Fase 1 funciona no path atual ✅ |
| Cliente perde dados na migração | Import de Excel mantém dados históricos |
| Supabase free tier limitado | 500MB DB + 50K auth users é suficiente para MVP |
| Gráficos diferentes do Excel | Customização exata em Fase 1 serve como referência |

---

## Comandos

```bash
# Rodar Fase 1 (React + Vite)
cd "suplemento-control"
npm install       # se necessário
npm run dev       # http://localhost:5173

# Build de produção
npm run build
npm run preview

# Fase 2 (futuro)
npx create-next-app@latest suplemento-control-v2 --typescript --tailwind --app --src-dir
```
