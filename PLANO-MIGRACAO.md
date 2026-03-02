# Plano de Migração — Suplemento Control

> Última atualização: 2026-03-01

---

## Visão Geral das Fases

| Fase | Descrição | Stack | Status |
|------|-----------|-------|--------|
| **0** | Protótipo HTML/JS vanilla | HTML + CSS + JS | ✅ Concluída |
| **1** | SPA React standalone (localStorage) | React + Vite + Tailwind + Recharts | ✅ Concluída |
| **1.5** | Auth + Multi-tenant + Gestão | Supabase Auth + Profiles + Multi-farm | ✅ Concluída |
| **1.6** | Migração Supabase completa | Supabase DB (data_entries, pastures, farms) | ✅ Concluída |
| **2** | Melhorias avançadas (em curso) | SheetJS + novos CRUDs + filtros | 🔄 Em andamento |
| **3** | SaaS Escala | Planos, billing, multi-org | ⬜ Futuro |

---

## Stack Atual (Fase 1.6+)

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
| Backend/Auth | Supabase (self-hosted EasyPanel) |
| Import/Export | SheetJS (xlsx) |

---

## Estrutura do Projeto

```
suplemento-control/
├── package.json
├── vite.config.ts
├── index.html
├── supabase/
│   ├── schema.sql              ← schema base (farms, profiles, pastures, data_entries)
│   ├── patch.sql               ← patches (email, sacos, trigger)
│   ├── migration_cadastros.sql ← ← animals, supplement_types, employees, equipment
│   └── seed.sql                ← dados de exemplo
└── src/
    ├── App.tsx                 ← Router + Providers + Toaster
    ├── main.tsx
    ├── lib/
    │   ├── supabase.ts         ← cliente Supabase
    │   ├── data.ts             ← DataEntry, sampleRows, supplementOrder/Colors
    │   └── utils.ts            ← fmt, fmtInt, groupByType, averageConsumo
    ├── context/
    │   ├── AuthContext.tsx     ← supabase.auth + fetchProfile + hasModule
    │   └── DataContext.tsx     ← entries + pastures + clientInfo via Supabase
    ├── types/
    │   ├── user.ts             ← Role, Module, FarmUser, AuthUser
    │   └── farm.ts             ← Farm
    ├── services/
    │   ├── farmService.ts      ← CRUD farms
    │   └── userService.ts      ← CRUD profiles
    ├── layouts/
    │   └── DashboardLayout.tsx ← sidebar glassmorphism + AdminFarmSelector
    ├── pages/
    │   ├── Login.tsx           ← split-screen + supabase.auth
    │   ├── Relatorio.tsx       ← filtros (mês, suplemento, pasto) + export PDF/Excel
    │   ├── Formulario.tsx      ← lançamentos + import Excel
    │   ├── Cadastros.tsx       ← 5 tabs: Pastos/Animais/Suplementos/Funcionários/Equipamentos
    │   ├── Fazendas.tsx        ← CRUD fazendas
    │   └── Usuarios.tsx        ← CRUD usuários (admin)
    └── components/
        ├── ProtectedRoute.tsx  ← ProtectedRoute + ModuleRoute
        ├── StatsOverview.tsx   ← 4 KPI cards
        ├── MetricCard.tsx      ← card com trend badge
        ├── SummaryChart.tsx    ← legenda lateral + BarChart
        ├── SupplementSection.tsx ← header colorido + tabela + gráfico
        ├── Skeleton.tsx        ← loading skeletons
        └── ImportExcelModal.tsx ← upload + mapping + import em batch
```

---

## Banco de Dados Supabase

### Tabelas Existentes

| Tabela | Descrição |
|--------|-----------|
| `farms` | Fazendas (id, nome_fazenda, ativo, ...) |
| `profiles` | Usuários (id, name, email, role, modules[], farm_id, farm_ids[], active) |
| `pastures` | Pastos (id, farm_id, nome, area, observacoes) |
| `data_entries` | Lançamentos (id, farm_id, data, pasto_nome, suplemento, quantidade, periodo, sacos, kg, consumo) |

### Tabelas para Migrar (migration_cadastros.sql)

| Tabela | Descrição |
|--------|-----------|
| `animals` | Animais (id, farm_id, nome, quantidade, raca, observacoes) |
| `supplement_types` | Tipos de suplemento (id, farm_id, nome, unidade, observacoes) |
| `employees` | Funcionários (id, farm_id, nome, funcao, contato) |
| `equipment` | Equipamentos (id, farm_id, nome, tipo, quantidade, observacoes) |

---

## Módulos e Rotas

| Rota | Componente | Módulo |
|------|-----------|--------|
| `/` | Relatorio | relatorio |
| `/formulario` | Formulario | formulario |
| `/cadastros` | Cadastros | cadastros |
| `/fazendas` | Fazendas | fazendas |
| `/usuarios` | Usuarios | usuarios |

---

## Supabase (self-hosted)

- **URL:** `https://saas-supabase.bj3amt.easypanel.host`
- **Admin user:** `admin@suplemento.com` / `admin123`
- **Client user:** `cliente@malhada.com` / `malhada123`
- **Farm:** Fazenda Malhada Grande (ID: `10000000-0000-4000-8000-000000000001`)

---

## Próximos Passos

1. Executar `supabase/migration_cadastros.sql` no SQL Editor do Supabase
2. Implementar filtro de data com range (data início / data fim)
3. Responsividade tablet/mobile
4. Deploy Vercel

---

## Comandos

```bash
# Desenvolvimento
cd "suplemento-control"
npm install
npm run dev       # http://localhost:5173

# Verificação TypeScript
npx tsc --noEmit

# Build de produção
npm run build
npm run preview
```
