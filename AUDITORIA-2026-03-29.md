# Auditoria Técnica — Suplemento Control
> Data: 2026-03-29 | Auditor: Claude Sonnet 4.6 (HicaroDev + Claude Code)
> Versão auditada: v1.19D

---

## 1. VISÃO GERAL DO SISTEMA

**O que é:** SaaS de gestão pecuária voltado para controle de suplementação de gado. Digitaliza o processo de lançamento de dados de campo, geração de relatórios, controle de estoque, ordens de serviço (OS) e financeiro básico (livro caixa).

**Problema resolvido:** Fazendas que controlam suplementação em planilhas ou papel passam a ter uma plataforma centralizada com visibilidade em tempo real por pasto, animal e período.

**Público-alvo:** Gestores de fazendas de gado de corte/cria — foco no Brasil rural, acesso via mobile e desktop.

**Product-market fit:** Alto potencial. Agronegócio é vertical pouco digitalizada com grande apetite por ferramentas práticas. O produto é específico o suficiente para ter diferenciação real.

**Complexidade:** Média-alta — multi-tenant, multi-fazenda, múltiplos perfis de acesso, módulos interdependentes (OS → Estoque → Livro Caixa), geração de PDF, importação Excel.

---

## 2. ARQUITETURA DE SOFTWARE

**Tipo:** Monolito frontend (SPA React) + Backend-as-a-Service (Supabase self-hosted)

**Stack:**
- Frontend: React 18.3 + TypeScript 5.5 + Vite 6.3 + Tailwind CSS v4 + React Router 7 + Recharts 2
- BaaS: Supabase self-hosted via EasyPanel (PostgreSQL + Auth + PostgREST + Storage)
- Build: Vite sem code splitting configurado

**Organização do código:**
```
src/
  context/    → AuthContext, DataContext (estado global)
  services/   → 8 serviços (farmService, userService, estoqueService, osService,
                             caixaService, solicitacaoService, manejoService, activityLogService)
  pages/      → 15 páginas (uma por módulo)
  components/ → componentes reutilizáveis
  layouts/    → DashboardLayout (sidebar + roteamento)
  lib/        → supabase.ts, data.ts, utils.ts
  types/      → user.ts
```

**Pontos positivos:**
- Separação clara entre pages, services e context
- Services encapsulam toda a lógica de acesso ao Supabase
- DataContext com optimistic updates e refresh por visibilidade/foco

**Problemas encontrados:**

🔴 **Crítico** — `supabaseAdmin` (service_role key) instanciado no bundle frontend. A SERVICE_ROLE_KEY é exposta no JavaScript entregue ao browser. Qualquer usuário pode extraí-la do DevTools e bypassar completamente o RLS do Supabase.

🟡 **Médio** — Bundle único sem code splitting. Vite.config.ts não configura `rollupOptions.output.manualChunks`. Bundle estimado ~1.47MB (inclui xlsx + recharts + motion).

🟡 **Médio** — `AuthContext.fetchProfile` usa `supabaseAdmin` em vez do cliente anon. Isso trafega a service_role key em operações de leitura que não precisam bypassar RLS.

🟢 **Baixo** — Sem camada de domínio explícita (DDD). Services mistura lógica de negócio com chamadas ao Supabase. Para o estágio atual é aceitável, mas dificulta testes.

---

## 3. FRONT-END (UX + UI + PERFORMANCE)

**Tecnologia:** React SPA + Tailwind CSS v4 + Lucide React icons + Sonner (toasts) + Recharts

**Pontos positivos:**
- Design system consistente: cor brand `#1a6040` aplicada globalmente via `@theme` no Tailwind
- Sidebar com nav filtrado por módulos do usuário — UX correta para multi-perfil
- Skeleton loading em todas as páginas com dados assíncronos
- Toast feedback em todas as ações (success/error via Sonner)
- Export CSV com BOM UTF-8 para compatibilidade Excel pt-BR
- Geração de PDF profissional com brand bar e layout otimizado (print CSS)
- Modal Nova OS redesenhado: barra teal, cards por seção, totais em pills, footer com badge de itens válidos

**Problemas encontrados:**

🟡 **Médio** — Responsividade incompleta (T-231 pendente). Padding responsivo `p-4 md:p-8` está presente mas grids complexos (Estoque, OS) podem quebrar em telas < 768px.

🟡 **Médio** — Sem lazy loading de rotas. Todas as 15 páginas são carregadas no bundle inicial mesmo que o usuário não tenha acesso a todos os módulos.

🟢 **Baixo** — Ausência de `aria-label` e atributos de acessibilidade em botões de ação (ícone sem texto). Baixo impacto para o perfil de usuário atual mas relevante para WCAG.

🟢 **Baixo** — `motion` (Framer Motion fork) adicionado como dependência mas uso limitado — aumenta bundle sem retorno proporcional.

---

## 4. BACK-END E APIs

**Padrão:** PostgREST via SDK `@supabase/supabase-js` — sem backend customizado.

**Pontos positivos:**
- Services bem organizados com tipos TypeScript explícitos (interfaces para cada entidade)
- Tratamento de erros consistente: serviços retornam `throw new Error(error.message)`
- Numeração automática de OS (`OS-YYYY-NNN`) via função SQL `generate_os_numero()`
- Auto-lançamento no livro_caixa ao confirmar OS (despesa por item com `valor_kg`)

**Problemas encontrados:**

🔴 **Crítico** — `confirmarExecucao` em `osService.ts` executa múltiplos inserts sequenciais sem transação atômica:
1. Saída em `estoque_movimentos`
2. Lançamento em `data_entries`
3. Despesa em `livro_caixa`

Se qualquer step falhar após o primeiro, os dados ficam inconsistentes (estoque baixado mas sem registro no data_entries, por exemplo). Necessita de função RPC PostgreSQL em transação.

🟡 **Médio** — Sem paginação em listagens. `osService.listar()`, `estoqueService.listarMovimentos()` e `caixaService.listar()` fazem `select('*')` sem `range()`. Com volume alto de dados, isso trava o browser e sobrecarrega o Supabase.

🟡 **Médio** — `solicitacaoService` e `estoqueService` usam `supabaseAdmin` para operações que poderiam usar o cliente anon com RLS correto, ampliando a superfície de exposição da service_role key.

🟢 **Baixo** — Ausência de validação de schema nos inputs antes de enviar ao Supabase (ex: Zod ou Yup). Validação atual é apenas HTML5 + TypeScript types, não runtime.

---

## 5. BANCO DE DADOS

**Engine:** PostgreSQL (Supabase self-hosted)

**Tabelas mapeadas:**
| Tabela | Função |
|--------|--------|
| `profiles` | Usuários — role, modules[], farm_ids[] |
| `farms` | Fazendas |
| `pastures` | Pastos por fazenda |
| `data_entries` | Lançamentos de suplementação |
| `animals` | Lotes animais por pasto |
| `supplement_types` | Tipos de suplemento por fazenda |
| `employees` | Funcionários |
| `manejo_historico` | Histórico de manejos |
| `animal_categories` | Categorias de animais |
| `estoque_movimentos` | Movimentações de estoque |
| `ordens_suplemento` | Ordens de Suplemento (OS) |
| `ordens_suplemento_itens` | Itens das OS |
| `livro_caixa` | Lançamentos financeiros |
| `solicitacoes_compra` | Pedidos de compra de suplemento |

**Pontos positivos:**
- Multi-tenant via `farm_id` em todas as tabelas operacionais
- RLS ativo nas tabelas novas (livro_caixa, estoque_movimentos, ordens_suplemento, solicitacoes_compra)
- FK implícita via `farm_id` nas queries
- Função SQL para numeração sequencial de OS

**Problemas encontrados:**

🔴 **Crítico** — RLS ausente ou não verificado em tabelas legadas (`data_entries`, `animals`, `pastures`, `supplement_types`, `manejo_historico`). Se RLS não estiver ativo, qualquer usuário autenticado pode ler dados de outras fazendas via PostgREST direto.

🟡 **Médio** — Ausência de índices explícitos documentados em `farm_id`, `data`, `status`. Com volume crescente, queries de listagem com filtros por fazenda e período degradarão.

🟡 **Médio** — `profiles.modules[]` é array de texto sem FK para tabela de módulos. Adicionar um módulo novo requer update manual em todos os registros — sem controle de integridade.

🟢 **Baixo** — Sem `updated_at` automático nas tabelas operacionais. Dificulta auditoria de mudanças e sincronização offline no futuro.

🟢 **Baixo** — Sem soft-delete (`deleted_at`). Registros deletados são removidos permanentemente, sem possibilidade de recuperação.

---

## 6. SEGURANÇA

**Autenticação:** Supabase Auth (`signInWithPassword`) — JWT com refresh token. Session persistida em localStorage. ✅

**Autorização:**
- RLS nas tabelas novas — filtra por `farm_id` para admin e clientes ✅
- Guard `if (!isAdmin) return null` nos componentes admin-only ✅
- `ModuleRoute` bloqueia acesso a rotas não habilitadas ✅

**Problemas encontrados:**

🔴 **CRÍTICO** — `VITE_SUPABASE_SERVICE_ROLE_KEY` exposta no bundle JavaScript do frontend.

A `SERVICE_ROLE_KEY` do Supabase bypassa RLS completamente. No código atual:
- `src/lib/supabase.ts` cria `supabaseAdmin` com a service_role key
- Essa variável `VITE_*` é compilada pelo Vite e fica disponível em claro no `dist/assets/index-[hash].js`
- Qualquer usuário com DevTools ou acesso ao arquivo `.js` tem a chave mestra do banco

**Impacto:** Acesso irrestrito a todos os dados de todas as fazendas. Operações de DELETE, UPDATE sem filtro. Equivale a vazar a senha root do banco.

**Solução obrigatória:** Mover todas as operações que usam `supabaseAdmin` para funções RPC no PostgreSQL ou para um backend intermediário (Edge Function, Vercel/Railway serverless).

🔴 **Crítico** — RLS não verificado em tabelas legadas. Sem garantia de isolamento entre fazendas para `data_entries`, `animals` etc.

🟡 **Médio** — Profile cache em `localStorage` sem expiração. Um usuário desativado pode continuar autenticado até o cache expirar ou ser limpo manualmente.

🟡 **Médio** — Sem rate limiting no login (`signInWithPassword`). Sujeito a brute force.

🟢 **Baixo** — Dados pessoais armazenados (nome, email, contato de funcionários) sem política LGPD explícita de retenção e exclusão.

🟢 **Baixo** — `dompurify` importado mas uso não verificado em todos os campos de input livre.

---

## 7. PERFORMANCE E ESCALABILIDADE

**Estado atual:**
- Bundle JS: ~1.47MB (sem code splitting)
- Carregamento inicial: pesado — todas as rotas carregadas juntas
- Queries: sem paginação, `select('*')` em listagens

**Pontos positivos:**
- Refresh inteligente por `visibilitychange` + `online` event com threshold 5s
- Optimistic updates no DataContext reduzem latência percebida
- Imagens via `/public` (sem CDN atualmente)

**Problemas encontrados:**

🟡 **Médio** — Bundle 1.47MB sem splitting. `xlsx` (~700KB) e `recharts` são carregados mesmo em páginas que não os usam.

🟡 **Médio** — Sem paginação server-side. 10.000 lançamentos = 10.000 rows no browser. Performance degrada linearmente.

🟡 **Médio** — Sem cache de dados no frontend além do estado em memória. Reload da página = nova chamada ao Supabase para tudo.

🟢 **Baixo** — Sem CDN para assets estáticos. Deploy via EasyPanel serve arquivos diretamente, sem edge caching.

🟢 **Baixo** — Gráficos Recharts re-renderizam a cada mudança de filtro sem memoização (`useMemo`/`useCallback`).

---

## 8. DEVOPS E INFRAESTRUTURA

**Deploy:** EasyPanel (self-hosted) com Docker
- `Dockerfile` presente no projeto ✅
- Deploy manual via push + rebuild no EasyPanel

**Infraestrutura:**
- Supabase self-hosted no EasyPanel (PostgreSQL + Auth + PostgREST + pg-meta)
- Sem CDN, sem load balancer
- Sem staging environment — deploy direto em produção

**Problemas encontrados:**

🔴 **Crítico** — Sem CI/CD pipeline. Deploy é manual — risco de subir versão quebrada sem verificação automática.

🟡 **Médio** — Sem ambiente de staging. Qualquer mudança vai direto para produção com dados reais.

🟡 **Médio** — Sem monitoramento de uptime e alertas. Indisponibilidade só é detectada quando alguém reclamar.

🟡 **Médio** — Backup do PostgreSQL não documentado. Self-hosted sem estratégia de backup = risco de perda total.

🟢 **Baixo** — Sem variáveis de ambiente separadas por ambiente (`.env.production` vs `.env.staging`).

🟢 **Baixo** — `dist/` não está no `.gitignore` — artefatos de build sendo commitados no repositório.

---

## 9. QUALIDADE DE CÓDIGO

**Pontos positivos:**
- TypeScript estrito com interfaces explícitas para todas as entidades
- Nenhum `any` observado nos serviços
- Padrão de nomenclatura consistente (camelCase TS, snake_case DB)
- Componentes de UI reutilizáveis (Skeleton, ImportExcelModal)
- `clsx` + `tailwind-merge` para composição de classes

**Problemas encontrados:**

🔴 **Crítico** — Zero cobertura de testes. Sem testes unitários, integração ou E2E. Nenhuma dependência de teste no `package.json` (sem vitest, jest, playwright, cypress).

🟡 **Médio** — Páginas com >500 linhas (OS.tsx, Estoque.tsx, Manejos.tsx). Lógica de UI, estado e negócio misturadas no mesmo arquivo. Dificulta manutenção e onboarding.

🟡 **Médio** — `ActivityLogService` importado mas não verificado se está sendo utilizado em todos os módulos novos (Fase 3).

🟢 **Baixo** — Sem ESLint configurado além do default do Vite. Sem regras de lint para `no-console`, imports não usados, etc.

🟢 **Baixo** — Sem Prettier configurado. Formatação depende do editor de cada dev.

---

## 10. PRODUTO E NEGÓCIO

**Proposta de valor:** Clara — "gestão de suplementação bovina em uma plataforma".

**Jornada do usuário (Admin):**
1. Cadastra fazenda + pastos + suplementos
2. Lança suplementação via Formulário
3. Visualiza relatórios por pasto/suplemento
4. Gerencia animais via Manejos
5. Controla estoque + ordens de suplemento
6. Acompanha financeiro no Livro Caixa

**Jornada do usuário (Cliente/Funcionário):**
1. Login → módulos habilitados pelo admin
2. Acesso limitado — sem módulos admin (estoque, OS, caixa)

**Pontos positivos:**
- Fluxo OS → Estoque → Livro Caixa automatizado (despesa lançada ao confirmar OS)
- Sistema de módulos por usuário permite flexibilidade de pricing
- Exportação CSV e PDF para relatórios — reduz dependência da plataforma

**Gaps de produto:**

🟡 **Médio** — Sem dashboard executivo consolidado. Admin vê relatório de suplementação mas não tem visão unificada de: saldo de estoque + OS pendentes + caixa + alertas.

🟡 **Médio** — Sem notificações ou alertas push. Alertas de estoque existem na tela mas não notificam o usuário.

🟢 **Baixo** — Sem onboarding guiado para novos admins. Usuário novo não sabe por onde começar.

🟢 **Baixo** — Sem métricas de uso/retenção no produto. Não há tracking de eventos para entender como os usuários usam o sistema.

---

## 11. RISCOS IDENTIFICADOS

### 🔴 Críticos (ação imediata)

| # | Risco | Localização |
|---|-------|-------------|
| R-01 | SERVICE_ROLE_KEY exposta no bundle JS frontend | `src/lib/supabase.ts` + todas as envs VITE_ |
| R-02 | Sem transação atômica em `confirmarExecucao` (OS) | `src/services/osService.ts` |
| R-03 | RLS não verificado em tabelas legadas (data_entries, animals, pastures) | Supabase dashboard |
| R-04 | Zero cobertura de testes — nenhum teste automatizado | Projeto inteiro |
| R-05 | Sem CI/CD — deploy manual sem verificação | DevOps |

### 🟡 Médios (próximas sprints)

| # | Risco | Localização |
|---|-------|-------------|
| R-06 | Bundle ~1.47MB sem code splitting | `vite.config.ts` |
| R-07 | Sem paginação server-side em listagens | Services (osService, estoqueService, caixaService) |
| R-08 | Sem staging environment | Infraestrutura |
| R-09 | Sem monitoramento de uptime | DevOps |
| R-10 | Backup PostgreSQL não documentado | EasyPanel |
| R-11 | Profile cache sem expiração | `src/context/AuthContext.tsx` |
| R-12 | Páginas >500 linhas (código complexo) | OS.tsx, Estoque.tsx, Manejos.tsx |

### 🟢 Baixos (backlog técnico)

| # | Risco |
|---|-------|
| R-13 | Responsividade mobile incompleta (T-231) |
| R-14 | Sem acessibilidade WCAG (aria-labels) |
| R-15 | Sem soft-delete nas tabelas |
| R-16 | Sem `updated_at` automático |
| R-17 | Sem ESLint/Prettier configurados |
| R-18 | Sem dashboard executivo unificado |
| R-19 | `dist/` não no `.gitignore` |

---

## 12. PLANO DE MELHORIAS

| Prioridade | Ação | Impacto | Esforço | Sprint |
|-----------|------|---------|---------|--------|
| **Alta** | Remover SERVICE_ROLE_KEY do frontend — criar RPC functions no PostgreSQL para operações admin | Alto (segurança crítica) | Alto | Sprint 1 |
| **Alta** | Adicionar transação atômica em `confirmarExecucao` via função RPC | Alto (integridade de dados) | Médio | Sprint 1 |
| **Alta** | Verificar e ativar RLS em tabelas legadas no Supabase | Alto (isolamento multi-tenant) | Baixo | Sprint 1 |
| **Alta** | Configurar CI/CD básico (GitHub Actions: build + type-check + deploy) | Alto (qualidade de deploy) | Médio | Sprint 1 |
| **Média** | Implementar code splitting por rota (`React.lazy` + `Suspense`) | Médio (performance inicial) | Baixo | Sprint 2 |
| **Média** | Adicionar paginação server-side (`range()`) nas listagens principais | Médio (escalabilidade) | Médio | Sprint 2 |
| **Média** | Configurar Vitest + 10 testes críticos (confirmarExecucao, calcularSaldos, auth flow) | Alto (confiança no deploy) | Alto | Sprint 2 |
| **Média** | Criar ambiente de staging no EasyPanel | Médio (segurança de deploys) | Médio | Sprint 2 |
| **Média** | Dashboard executivo: saldo estoque + OS pendentes + caixa + alertas em uma tela | Alto (produto) | Alto | Sprint 3 |
| **Baixa** | ESLint + Prettier com rules básicas | Baixo (DX) | Baixo | Sprint 3 |
| **Baixa** | Adicionar `aria-label` em botões ícone e melhorar responsividade mobile | Baixo (UX) | Médio | Sprint 3 |
| **Baixa** | Implementar soft-delete + `updated_at` automático via triggers | Baixo (robustez) | Médio | Sprint 4 |

---

## 13. MATURIDADE DO SISTEMA

### Classificação por dimensão:

| Dimensão | Nível | Justificativa |
|----------|-------|---------------|
| Produto / Negócio | **2 — Estruturado** | Fluxos completos, valor claro, gaps de produto identificados |
| Front-end / UX | **2 — Estruturado** | Design system consistente, mas responsividade e acessibilidade incompletos |
| Back-end / APIs | **1 — Operacional** | Funciona mas sem transações atômicas e sem paginação |
| Banco de Dados | **2 — Estruturado** | RLS nas tabelas novas, modelagem adequada, mas tabelas legadas sem RLS |
| Segurança | **1 — Operacional** | Auth funcional mas SERVICE_ROLE_KEY exposta é falha crítica |
| Performance | **1 — Operacional** | Funciona mas bundle pesado e sem paginação |
| DevOps | **1 — Operacional** | Deploy manual, sem CI/CD, sem staging, sem monitoramento |
| Qualidade de Código | **2 — Estruturado** | TypeScript bem tipado, organização boa, mas zero testes |

### Classificação geral:

> **Nível 1 → 2 — Operacional/Estruturado**
>
> O sistema está **funcional e entregando valor real** ao cliente. A arquitetura de código é bem organizada para o estágio atual. No entanto, a falha crítica de segurança (SERVICE_ROLE_KEY exposta), ausência total de testes e deploy sem CI/CD impedem a classificação como "Estruturado" completo.
>
> Com a resolução dos 5 riscos críticos (R-01 a R-05), o sistema avança para **Nível 2 sólido** e estará pronto para crescimento controlado.

---

## RECOMENDAÇÃO EXECUTIVA

O Suplemento Control é um produto com **proposta de valor clara e implementação funcional**. O trabalho de desenvolvimento das Fases 1-3 é visível: módulos completos, design consistente, fluxos automatizados (OS → Estoque → Caixa).

**O bloqueador principal para escalar com segurança é o R-01** (SERVICE_ROLE_KEY no frontend). Isso precisa ser resolvido antes de qualquer expansão de base de clientes. Um cliente técnico ou um auditor de segurança básico identificará isso em minutos.

**Roadmap de estabilização sugerido:**

```
Sprint 1 (1-2 semanas):  Segurança + Integridade de dados
  → Mover operações admin para RPC functions (remove service_role do frontend)
  → Transação atômica em confirmarExecucao
  → RLS nas tabelas legadas

Sprint 2 (2-3 semanas):  Performance + Confiabilidade
  → Code splitting + lazy loading de rotas
  → Paginação server-side
  → Primeiros testes automatizados (fluxos críticos)

Sprint 3 (2 semanas):    Produto + DevOps
  → Dashboard executivo unificado
  → CI/CD básico (GitHub Actions)
  → Staging environment

Sprint 4 (backlog):      Polimento
  → Responsividade mobile completa
  → Acessibilidade
  → LGPD compliance
```

---

*Auditoria realizada com leitura direta dos arquivos do projeto.*
*Baseada em: OWASP Top 10, Clean Architecture, Google SRE, Marty Cagan — Product Thinking.*
