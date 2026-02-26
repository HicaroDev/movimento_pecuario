# Suplemento Control — Sistema de Gestão de Suplementação Pecuária

## 📖 Overview

O **Suplemento Control** é um sistema SaaS de gestão de suplementação para fazendas, desenvolvido para o **Movimento Pecuário**. Conta com um portal administrativo para gerenciamento completo de fazendas, usuários e lançamentos, e um portal do cliente onde cada fazenda acessa seus próprios dados de consumo, pastos e relatórios.

## 🏗️ Arquitetura

**Stack Tecnológica:**
- React 18 + TypeScript com Vite 6
- Tailwind CSS v4
- React Router 7 (SPA)
- Recharts para gráficos
- React Hook Form para formulários
- Motion (Framer Motion) para animações
- Sonner para notificações toast
- Lucide React para ícones
- localStorage como camada de dados (migração Supabase planejada)

**Estrutura do Projeto:**
```
src/
├── context/        # AuthContext (sessão + módulos) | DataContext (dados por fazenda)
├── services/       # userService | farmService (API-ready, troca por Supabase)
├── types/          # user.ts | farm.ts
├── pages/          # Relatorio | Formulario | Pastos | Fazendas | Usuarios | Login
├── components/     # MetricCard | SummaryChart | SupplementSection | ProtectedRoute
├── layouts/        # DashboardLayout (sidebar + nav por módulos)
└── lib/            # data.ts | utils.ts
```

## 🔐 Auth & Controle de Acesso

O sistema usa um modelo baseado em **roles** + **módulos**:

- `admin` — acesso total, gerencia fazendas e usuários
- `client` — acesso restrito à sua própria fazenda

Cada usuário tem uma lista de **módulos habilitados** que controlam quais rotas e itens de menu são visíveis:

| Módulo | Rota | Descrição |
|--------|------|-----------|
| `relatorio` | `/` | Dashboard com gráficos e KPIs |
| `formulario` | `/formulario` | Lançamento de consumo |
| `pastos` | `/pastos` | Gestão de pastos por fazenda |
| `fazendas` | `/fazendas` | Cadastro e gestão de fazendas |
| `usuarios` | `/usuarios` | Gestão de usuários e permissões |

## 🗄️ Dados

Atualmente persistidos em **localStorage** com chaves isoladas por fazenda:

| Chave | Conteúdo |
|-------|----------|
| `suplementoControlUsers` | Lista de usuários (FarmUser[]) |
| `suplementoControlFarms` | Lista de fazendas (Farm[]) |
| `suplementoControlAuth` | Sessão ativa (AuthUser) |
| `suplementoControlData_${farmId}` | Lançamentos por fazenda |
| `suplementoControlPastures_${farmId}` | Pastos por fazenda |

A camada de serviços (`userService`, `farmService`) é **API-ready** — ao integrar o Supabase, apenas o corpo das funções muda, sem impacto no restante da aplicação.

## 🚀 Como Rodar

```bash
# Instalar dependências
npm install

# Rodar em desenvolvimento
npm run dev
# Acesse: http://localhost:5173

# Build de produção
npm run build
```

**Credenciais de acesso (desenvolvimento):**

| Perfil | E-mail | Senha |
|--------|--------|-------|
| Admin | admin@suplemento.com | admin123 |
| Cliente | cliente@malhada.com | malhada123 |

## 📚 Documentação

- [`TASKS.md`](./TASKS.md) — todas as tasks com status por fase
- [`PLANO-MIGRACAO.md`](./PLANO-MIGRACAO.md) — planejamento da migração para Supabase + Next.js

## 🗺️ Roadmap

- [ ] Migração para **Supabase** (PostgreSQL + Auth + RLS)
- [ ] Migração para **Next.js 15** com App Router
- [ ] Relatório de Pastos com gráficos dedicados
- [ ] Export Excel/CSV dos lançamentos
- [ ] Import de planilha para lançamento em batch
- [ ] Deploy na **Vercel**
