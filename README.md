# Suplemento Control — Sistema de Gestão de Suplementação Pecuária

> Versão atual: **v1.19D** | Stack: React 18 + TypeScript + Vite 6 + Supabase self-hosted

## Visão Geral

O **Suplemento Control** é um SaaS de gestão de suplementação para fazendas de pecuária, desenvolvido para o **Movimento Pecuário**. Controla todo o ciclo operacional: lançamentos de consumo, animais, estoque de suplementos, ordens de serviço, livro caixa e solicitações de compra.

---

## Stack Tecnológica

| Camada | Tecnologia |
|--------|-----------|
| Frontend | React 18 + TypeScript + Vite 6 |
| Estilo | Tailwind CSS v4 (tokens via `@theme`) |
| Roteamento | React Router 7 (SPA) |
| Gráficos | Recharts 2 |
| Formulários | React Hook Form |
| Notificações | Sonner (toasts) |
| Ícones | Lucide React |
| Backend | Supabase self-hosted (EasyPanel) — PostgreSQL + Auth + PostgREST |
| Deploy | Docker + EasyPanel (VPS) |

---

## Estrutura do Projeto

```
src/
├── context/        # AuthContext (auth + módulos + roles) | DataContext (entries + pastures)
├── services/       # estoqueService | osService | caixaService | solicitacaoService
│                   # manejoService | farmService | userService | activityLogService
├── types/          # user.ts
├── pages/          # Relatorio | Formulario | Manejos | Estoque | OS | LivroCaixa
│                   # Cadastros | Pastos | Fazendas | Usuarios | Login
├── components/     # MetricCard | SummaryChart | SupplementSection | ImportExcelModal
│                   # Skeleton | ProtectedRoute | ModuleRoute
├── layouts/        # DashboardLayout (sidebar + nav filtrado por módulos)
└── lib/            # supabase.ts | data.ts | utils.ts
supabase/
├── schema.sql              # Tabelas base + RLS (farms, profiles, pastures, data_entries)
├── ajustes_v116b.sql       # animals, supplement_types, employees, manejo_historico + RLS
├── estoque_v100.sql        # estoque_movimentos + ALTER supplement_types
├── os_v100.sql             # ordens_suplemento + itens + generate_os_numero()
├── caixa_v100.sql          # livro_caixa + RLS
├── solicitacoes_v100.sql   # solicitacoes_compra + RLS
├── rls_auditoria_v200.sql  # RLS tabelas legadas + user_farm_ids() + policies client write
└── rpc_confirmar_os_v100.sql  # confirmar_execucao_os (transação atômica)
```

---

## Auth & Controle de Acesso

Modelo baseado em **roles** + **módulos habilitados por usuário**:

| Role | Acesso |
|------|--------|
| `admin` | Total — gerencia fazendas, usuários, estoque, OS, caixa |
| `client` | Restrito aos módulos habilitados na própria fazenda |

**Módulos disponíveis:**

| Módulo | Rota | Admin only |
|--------|------|-----------|
| `relatorio` | `/` | Não |
| `formulario` | `/formulario` | Não |
| `manejos` | `/manejos` | Não |
| `cadastros` | `/cadastros` | Não |
| `fazendas` | `/fazendas` | Não |
| `usuarios` | `/usuarios` | Não |
| `estoque` | `/estoque` | **Sim** |
| `os` | `/os` | **Sim** |
| `caixa` | `/caixa` | **Sim** |

---

## Banco de Dados (Supabase)

| Tabela | Descrição |
|--------|-----------|
| `profiles` | Usuários — role, modules[], farm_ids[] |
| `farms` | Fazendas |
| `pastures` | Pastos por fazenda |
| `data_entries` | Lançamentos de suplementação |
| `animals` | Lotes de animais por pasto |
| `supplement_types` | Tipos de suplemento por fazenda |
| `employees` | Funcionários |
| `manejo_historico` | Histórico de manejos |
| `animal_categories` | Categorias de animais |
| `estoque_movimentos` | Movimentações de estoque (entrada/saída) |
| `ordens_suplemento` | Ordens de Suplemento (OS) |
| `ordens_suplemento_itens` | Itens das OS |
| `livro_caixa` | Lançamentos financeiros |
| `solicitacoes_compra` | Pedidos de compra de suplemento |

---

## Como Rodar

```bash
# Instalar dependências
npm install

# Criar .env.local com as variáveis:
# VITE_SUPABASE_URL=https://...
# VITE_SUPABASE_ANON_KEY=...

# Rodar em desenvolvimento
npm run dev
# Porta: 5173 (ou próxima disponível)

# Build de produção
npm run build
```

### Migrations (ordem obrigatória)

Execute no SQL Editor do Supabase:

```
1. supabase/schema.sql
2. supabase/ajustes_v116b.sql
3. supabase/estoque_v100.sql
4. supabase/os_v100.sql
5. supabase/caixa_v100.sql
6. supabase/solicitacoes_v100.sql
7. supabase/rls_auditoria_v200.sql
8. supabase/rpc_confirmar_os_v100.sql
```

---

## Skills (Claude Code — Slash Commands)

Skills disponíveis no projeto via `.claude/commands/`:

| Skill | Comando | Descrição |
|-------|---------|-----------|
| **Padrão visual** | `/padrao` | Verifica se o padrão Figma está sendo seguido em todos os componentes |
| **Quality Assurance** | `/qa` | Auditoria completa: build, headers, fluxos críticos, segurança, UX, rotas |
| **Versionar** | `/versionar` | Cria checkpoint de versão + atualiza CHANGELOG + TASKS.md |
| **Upgrade** | `/upgrade` | Workflow seguro para implementar melhorias sem quebrar o design |
| **Organizar** | `/organizar` | Revisa e sincroniza toda a documentação do projeto |
| **Build** | `/build` | Roda `npm run build` e reporta erros TypeScript |
| **Guardar** | `/guardar` | Gera snapshot `ESTADO-ATUAL.md` antes de alterações no Relatório |
| **Manejos** | `/manejos` | Guardião do módulo Manejos — audita abas, fluxos e PDF |
| **Auditoria SaaS** | `/auditoria-saas` | Auditoria técnica end-to-end: arquitetura, segurança, performance, produto (13 dimensões) |

### `/auditoria-saas`

Skill de auditoria completa para SaaS. Atua como **Engenheiro de Software Sênior (Staff/Principal Level)** e avalia:

1. Visão Geral do Sistema
2. Arquitetura de Software
3. Front-end (UX + UI + Performance)
4. Back-end e APIs
5. Banco de Dados
6. Segurança (OWASP Top 10)
7. Performance e Escalabilidade
8. DevOps e Infraestrutura
9. Qualidade de Código
10. Produto e Negócio
11. Riscos Identificados (🔴🟡🟢)
12. Plano de Melhorias (Matriz Impacto × Esforço)
13. Maturidade do Sistema (Nível 0–4)

> Baseada em: OWASP, Clean Architecture, DDD, Google SRE, Marty Cagan.
> Relatório da auditoria deste projeto: [`AUDITORIA-2026-03-29.md`](./AUDITORIA-2026-03-29.md)

---

## Documentação

- [`TASKS.md`](./TASKS.md) — todas as tasks com status por fase
- [`AUDITORIA-2026-03-29.md`](./AUDITORIA-2026-03-29.md) — auditoria técnica completa v1.19D
- [`PLANO-NOVOS-MODULOS.md`](./PLANO-NOVOS-MODULOS.md) — planejamento dos módulos Fase 3

---

## Desenvolvido por

**HicaroDev** em parceria com **Claude Code (Anthropic)**
[github.com/HicaroDev](https://github.com/HicaroDev)
