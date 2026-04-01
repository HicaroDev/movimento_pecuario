# Tasks — Suplemento Control

> Última atualização: 2026-04-01

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
- [x] **T-230** Filtro de data com range (data início / data fim) além de chips por mês ✅
- [x] **T-231** Responsividade tablet/mobile ✅
- [x] **T-232** Empty states para Cadastros (cada tab vazia) ✅
- [x] **T-233** Deploy EasyPanel (Dockerfile multi-stage + nginx SPA + secrets inline) ✅
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

### 2I — Entregas Finais (CONCLUÍDA ✅)
- [x] **T-281** Relatório / Dashboard corporativo: redesign visual completo (header limpo teal, StatsOverview cards, SummaryChart responsivo)
- [x] **T-285** Formulário: validar/documentar formato Excel para importação (seção colapsável em ImportExcelModal)
- [x] **T-230** Filtro de data com range (início/fim) no Relatório
- [x] **T-231** Responsividade tablet/mobile (sidebar colapsável, top bar mobile, paddings responsivos)

### 2K — Melhorias Manejos Abr/26 (CONCLUÍDO ✅)
- [x] **T-350** Auditoria técnica completa (13 dimensões) → `AUDITORIA-2026-03-29.md`
- [x] **T-351** `supabase/rls_auditoria_v200.sql` — RLS em tabelas legadas + `user_farm_ids()` corrigida
- [x] **T-352** `supabase/rpc_confirmar_os_v100.sql` — transação atômica para confirmar OS (R-02)
- [x] **T-353** Manejos LotesTab: toggle Lista/Card com `localStorage` persistente
- [x] **T-354** Manejos LotesTab: super filtro por categoria (select dropdown) na toolbar
- [x] **T-355** Manejos LotesTab: PastoCard com header + stats + lotes agrupados por pasto
- [x] **T-356** Manejos: padrão de visualização alterado para Card
- [x] **T-357** Manejos Evolução: remover sub-aba "Transf. Parcial" (redundante com aba Transferir)

### 2J — Ajustes MP_21 MAR (PARCIALMENTE CONCLUÍDO)
- [x] **T-290** Fazendas: edição inline para usuário cliente
- [x] **T-291** Usuários: botão "Trocar Senha" na própria linha do usuário logado
- [x] **T-292** Usuários: role "Representante" + renomear "Cliente/Funcionário" → "Usuário"
- [x] **T-293** Manejos > Parição: simplificada — bezerros ficam no lote da mãe (bezerros_quantidade++)
- [x] **T-294** Manejos > Evolução: nova sub-tab "Transf. Parcial" com seletor de pasto/lote destino
- [x] **T-295** Histórico: fix query data_entries (coluna suplemento + order by data)
- [ ] **T-296** EasyPanel SMTP: configurar envio de e-mail de recuperação de senha
  - Usar Gmail SMTP (smtp.gmail.com:587) com App Password
  - OU resolver DNS do container Docker para usar mail.movimentopecuario.com.br
  - Variáveis: SMTP_HOST, SMTP_PORT=587, SMTP_USER, SMTP_PASS, SMTP_ADMIN_EMAIL, SMTP_SENDER_NAME
  - ENABLE_EMAIL_AUTOCONFIRM=false deve ficar como PRIMEIRA linha do arquivo Ambiente
- [x] **T-297** Relatórios: coluna META (KG/CAB DIA = Peso × %PV) + DESEMBOLSO (R$/CAB DIA e MÊS)
- [x] **T-298** Relatórios: PDF formato A4 retrato com bordas + títulos de colunas centralizados
- [x] **T-299** Pré-cadastros: dados internos uppercase (caixa alta nos inputs)

---

## FASE 3A — Estoque de Suplementos (CONCLUÍDA ✅)

- [x] **T-310** `supabase/estoque_v100.sql` — tabela `estoque_movimentos` + ALTER supplement_types (estoque_minimo_sacos, alerta_reposicao) + RLS
- [x] **T-311** `estoque_minimo_sacos` + `alerta_reposicao` em Cadastros > Suplementos (campo na tabela + save)
- [x] **T-312** `src/services/estoqueService.ts` — CRUD movimentos + calcularSaldos + consumoMedio30d
- [x] **T-313** `src/pages/Estoque.tsx` — cards de saldo + barra de progresso por suplemento
- [x] **T-314** Modal Entrada (data, suplemento, sacos, kg, fornecedor, NF, valor/kg)
- [x] **T-315** Tab Movimentações — tabela filtrada por tipo/suplemento/período + deletar
- [x] **T-316** Tab Alertas — cards com consumo 30d + sugestão de compra
- [x] **T-317** Tab Configurar — edição estoque mínimo + toggle alerta por suplemento
- [x] **T-318** Badge sidebar Estoque (contagem de alertas ativos, admin only) + polling 5 min
- [x] **T-319** Rota `/estoque` + visibilidade admin-only (sidebar + guard na página)

---

## FASE 3B — OS: Ordens de Suplemento (CONCLUÍDA ✅)

- [x] **T-320** `supabase/os_v100.sql` — tabelas `ordens_suplemento` + `ordens_suplemento_itens` + RLS + função `generate_os_numero()`
- [x] **T-321** `src/services/osService.ts` — CRUD OS + numeração automática OS-YYYY-NNN
- [x] **T-322** `src/pages/OS.tsx` — lista por status (Em Aberto / Executadas / Canceladas)
- [x] **T-323** Modal Nova OS — tabela dinâmica de itens (pasto + suplemento + sacos + kg auto + animais)
- [x] **T-324** Auto-cálculo `kg = sacos × peso_saco` do supplement_types
- [x] **T-325** PDF Romaneio de campo — brand bar verde, tabela de itens, totais, linha de assinatura
- [x] **T-326** Confirmar execução → saída automática no estoque + lançamento em `data_entries`
- [x] **T-327** Cancelar OS com motivo obrigatório
- [x] **T-328** Rota `/os` + módulo admin-only (sidebar admin + "EM BREVE" para clientes)

---

## FASE 3C — Livro Caixa (CONCLUÍDA ✅)

- [x] **T-330** `supabase/caixa_v100.sql` — tabela `livro_caixa` + RLS
- [x] **T-331** `src/services/caixaService.ts` — CRUD lançamentos + calcularResumo + calcularGrafico
- [x] **T-332** `src/pages/LivroCaixa.tsx` — cards receita/despesa/saldo + tabela filtrada
- [x] **T-333** Modal de lançamento — tipo/categoria/valor/data/descrição/referência
- [x] **T-334** Gráfico mensal — barras receita vs despesa por mês (Recharts)
- [x] **T-335** Export CSV — extrato do período (BOM pt-BR)
- [x] **T-336** Auto-lançamento despesa ao confirmar OS — por item com valor_kg cadastrado, origem 'os'
- [x] **T-337** Rota `/caixa` + módulo admin-only (sidebar + "EM BREVE" para clientes)

---

## FASE 3D — Solicitações de Compra (CONCLUÍDA ✅)

- [x] **T-340** `supabase/solicitacoes_v100.sql` — tabela `solicitacoes_compra` + RLS (admin only)
- [x] **T-341** `src/services/solicitacaoService.ts` — criar, aprovar, receber (→ entrada estoque), cancelar, deletar
- [x] **T-342** Aba "Pedidos" no Estoque — tabela com fluxo pendente → aprovada → recebida → cancelada
- [x] **T-343** Badge laranja de pedidos pendentes na tab "Pedidos"
- [x] **T-344** Modal "Nova Solicitação" — suplemento, sacos, fornecedor, observações
- [x] **T-345** Ao "Receber" → auto-entrada no `estoque_movimentos` + marca como recebida com data

---

## FASE 3 — Escala SaaS (FUTURO ⬜)
- OBS : O CLIENTE VAI REPASSAR PARA OS CLIENTE ELE NAO VAI OMERCIALIZAR NAO !!! 


- [ ] **T-300** Landing page pública (NAO VAI TER )
- [ ] **T-301** Planos de assinatura (Mercado Pago / Stripe)(NAO VAI TER )
- [ ] **T-302** Alertas de consumo fora da média ( o que seria isso ?)
- [ ] **T-303** Relatórios comparativos entre fazendas -ok
- [ ] **T-304** API pública para integração -ok 

---

## MODULO ESTOQUE
- tenha a opção de solicitação de compra dos suplementeos 

## Resumo de Progresso

| Fase | Tasks | Concluídas | Status |
|------|-------|-----------|--------|
| 0 — Protótipo HTML | 13 | 13 | ✅ Concluída |
| 1 — React + Vite | 24 | 24 | ✅ Concluída |
| 1.5 — Auth + Multi-tenant | 16 | 16 | ✅ Concluída |
| 1.6 — Migração Supabase | 10 | 10 | ✅ Concluída |
| 2A–E — Melhorias Avançadas | 21 | 21 | ✅ Concluída |
| 2F — Módulo Manejos | 10 | 10 | ✅ Concluída |
| 2G — Ajustes MP_04 MAR + PDF | 19 | 19 | ✅ Concluída |
| 2H — Ajustes MP_05 MAR | 4 | 4 | ✅ Concluída |
| 2I — Entregas Finais | 4 | 4 | ✅ Concluída |
| 2J — Ajustes MP_21 MAR | 10 | 9 | 🔄 90% (falta T-296 SMTP) |
| 2K — Melhorias Manejos Abr/26 | 8 | 8 | ✅ Concluída |
| 3A — Estoque de Suplementos | 10 | 10 | ✅ Concluída |
| 3B — OS: Ordens de Suplemento | 9 | 9 | ✅ Concluída |
| 3C — Livro Caixa | 8 | 8 | ✅ Concluída |
| 3D — Solicitações de Compra | 6 | 6 | ✅ Concluída |
| 3 — SaaS Escala | 5 | 0 | ⬜ Futuro |
| **TOTAL** | **178** | **171** | **96%** |

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
| `a5fe9ca` | style: padronizar fontes dos headers — text-3xl font-bold conforme sistema |
| `cbc9fca` | chore: Dockerfile seguro — secrets inline no RUN, sem ENV persistente |
| `e885fa1` | fix: remover hero banners de Estoque e OS — header limpo conforme padrão |
| `fe60ee6` | fix: remover hero banner do Relatorio — header limpo conforme padrão |
| `ecb7656` | feat: v1.23 — Módulo OS (Ordens de Suplemento) — Fase 3B |
| `925441d` | feat: v1.22 — Módulo Estoque (Fase 3A) — admin only |

## Para Rodar as Migrations (ordem obrigatória)

```
1. supabase/ajustes_v116b.sql  — base: animals, manejos, RLS
2. supabase/estoque_v100.sql   — estoque_movimentos + alter supplement_types
3. supabase/os_v100.sql        — ordens_suplemento + itens + generate_os_numero()
4. supabase/caixa_v100.sql     — livro_caixa + RLS
```

Execute no SQL Editor: `https://saas-supabase.bj3amt.easypanel.host`
