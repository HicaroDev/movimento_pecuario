# /relatorio — Guardião da Página de Relatório
> Atualizado: v1.21 (2026-03-27)

Você é um revisor especializado na página de Relatório do `suplemento-control`. Audite e corrija tudo relacionado à exibição, filtragem, gráficos e export do relatório.

> **ANTES DE QUALQUER ALTERAÇÃO**: rode `/guardar` para criar um snapshot do estado atual.

---

## ARQUIVOS ENVOLVIDOS

| Arquivo | Responsabilidade |
|---------|-----------------|
| `src/pages/Relatorio.tsx` | Página principal — hero banner, filtros, KPIs, charts, lógica META/DESEMBOLSO |
| `src/components/StatsOverview.tsx` | 4 cards KPI com accent bar |
| `src/components/SupplementSection.tsx` | Seção por suplemento (header gradiente + tabela + totals card + gráfico) |
| `src/components/SummaryChart.tsx` | Gráfico de resumo geral com header + legenda responsiva |
| `src/components/SupplementPills.tsx` | Pills de suplemento com ranking top-3 |
| `src/components/Skeleton.tsx` | Loading states |
| `src/lib/data.ts` | `supplementOrder`, `supplementColors`, `DataEntry` |
| `src/lib/utils.ts` | `fmt()`, `fmtInt()`, `groupByType()`, `averageConsumo()`, `aggregateEntriesByPasto()` |
| `src/styles/index.css` | `@theme` tokens, `.supplement-table`, `@page`, `.no-print` |
| `src/context/DataContext.tsx` | `entries`, `loading`, `pastures`, `clientInfo` |

---

## 1. HERO BANNER CORPORATIVO (v1.20+)

- [ ] `motion.div` com `background: linear-gradient(135deg, #0f3d26, #1a6040, #1d7a4e)`
- [ ] Exibe nome da fazenda (`farmName`) em destaque — `text-2xl md:text-3xl font-extrabold`
- [ ] Período selecionado (`periodoStr`) em `text-green-200/80`
- [ ] Badge usuário (Admin ou nome) — `border border-white/20`
- [ ] Botão PDF **no hero** (não nos filtros) — `rgba(255,255,255,0.15)`
- [ ] Strip de KPIs (3 colunas): Registros | Pastos | Cabeças — só quando `!loading && filtered.length > 0`
- [ ] Hero tem classe `no-print`
- [ ] Bloco de impressão `hidden print:block` com `h1` + período

---

## 2. FILTROS

- [ ] Card `rounded-2xl shadow-lg border border-gray-200 p-6 no-print`
- [ ] Chips de mês (multi-select) — cor ativa `#1a6040`
- [ ] Date range De/Até com inputs `type="date"`
- [ ] **3 colunas** `grid-cols-1 sm:grid-cols-3`: Suplemento | Pasto | Lote
- [ ] **Sem** botão PDF nos filtros (foi movido para o hero banner)
- [ ] "Limpar filtros" aparece **somente** quando `hasFilters === true`
- [ ] Aviso amber `bg-amber-50 border-amber-200` quando filtro retorna vazio

---

## 3. KPI CARDS (StatsOverview — v1.21)

- [ ] Grid `grid-cols-2 lg:grid-cols-4`
- [ ] Cada card: accent bar esquerda + ícone em blob + pattern de fundo
- [ ] Métricas: Registros | Cabeças | Pastos | Consumo Médio (kg/cab/dia)
- [ ] Valores calculados de `filtered` (não de `entries`)

---

## 4. SUPPLEMENT PILLS

- [ ] Só renderiza quando `!loading && activeTypes.length > 0`
- [ ] Pills proporcionais ao consumo médio (altura `MIN_H=48` a `MAX_H=110`)
- [ ] Top 3 em cores sólidas brand green, restante com listras
- [ ] Badge de valor visível no hover (não-top) e sempre (top)

---

## 5. SUMMARY CHART (v1.21)

- [ ] Só renderiza quando `!loading && filtered.length > 0`
- [ ] Header com ícone `BarChart2` + badge "KG / CAB / DIA"
- [ ] Legenda `flex-col md:flex-row` — responsiva (abaixo em mobile)
- [ ] **Com** `LabelList` nas barras (valor acima de cada barra)
- [ ] `title` = "CONSUMO KG/CAB DIA — MÉDIAS CONSUMO"
- [ ] Tooltip arredondado `borderRadius: 12px`

---

## 6. SUPPLEMENT SECTIONS — TABELA (v1.21)

### Header (SupplementSection)
- [ ] `background: linear-gradient(135deg, ${color}ee, ${color})`
- [ ] Nome do suplemento + período em destaque
- [ ] Badge status META integrado no header (▲ ACIMA DA META / ✓ DENTRO DA META) — quando `avgMeta != null`
- [ ] Badge "MOVIMENTO PECUÁRIO" no header

### Colunas (em ordem):

| Coluna | Condição | Cor/Formato |
|--------|----------|-------------|
| PASTO | sempre | texto cinza |
| LOTE | `hasLote` | texto cinza claro |
| QUANTIDADE | sempre | `fmtInt`, cor `#1a6040` |
| TIPO DE SUPLEMENTO | sempre | texto cinza claro |
| DIAS DE CONSUMO | sempre | `fmtInt`, cor `#1a6040` |
| SACOS | sempre | `fmtInt`, cor `#1a6040` |
| TOTAL KG OFERTADO | sempre | `fmtInt`, cinza |
| CONSUMO (KG/CAB DIA) | sempre | `fmt`, bold |
| META (KG/CAB DIA) | `hasMeta` | verde/vermelho com ▲▼ |
| DESEMBOLSO (R$/CAB DIA) | `hasDesembolso` | amber `#b45309` |
| DESEMBOLSO (R$/CAB MÊS) | `hasDesembolso` | amber `#b45309` |

- [ ] Tabela tem classe `supplement-table` (bordas e cabeçalhos centralizados no PDF)

### Card de Totais (v1.21 — substitui o rodapé antigo)
- [ ] Fundo `rgba(0,0,0,0.025)` com borda `rgba(0,0,0,0.06)` — rounded-xl
- [ ] Exibe: Cabeças | Consumo médio | Badge META (quando disponível) | Desembolso (quando disponível)
- [ ] Aviso ⚠ amarelo quando `avgMeta === null` (sem % PV cadastrado)

### Gráfico
- [ ] `ReferenceLine` vermelha tracejada: `stroke="#e53e3e"` `strokeDasharray="6 3"` — média
- [ ] `ReferenceLine` azul escuro para meta: `stroke="#1a4a7a"` `strokeDasharray="4 3"`
- [ ] **Com** `LabelList` acima das barras (valor de consumo)

---

## 7. GRÁFICO DE LINHA (curva de consumo por lote)

- [ ] Só aparece quando `filterLote` selecionado E há dados
- [ ] Botão "Ficha PDF" abre popup com romaneio de campo
- [ ] Linhas sólidas = consumo kg/cab dia
- [ ] Linhas tracejadas = % do PV (quando `pesoVivo` disponível)

---

## 8. LÓGICA META E DESEMBOLSO

- **META**: `peso_medio_pasto × (consumoPct / 100)` — vem de `suppTypeMap[tipo].consumoPct`
- **DESEMBOLSO DIA**: `consumo × valor_kg` — vem de `suppTypeMap[tipo].valorKg`
- **DESEMBOLSO MÊS**: `desembolso × periodo` (dias de consumo da linha)
- [ ] `suppTypeMap` lido de `supplement_types` do Supabase (campo `consumo` = % PV)
- [ ] `getPesoHistorico()` usa histórico de evoluções (`manejo_historico` tipo `evolucao_categoria`) ou peso atual do animal
- [ ] `pastoLotesMap` — relaciona pasto → lista de lotes ativos
- [ ] `aggregatedGroupsWithMeta` — enriquece cada linha com `meta`, `desembolso`, `lote`

---

## 9. PDF / IMPRESSÃO

- [ ] `handleExportPDF()` injeta `<style id="relatorio-print-portrait">@page { size: A4 portrait; margin: 14mm; }</style>` e remove após `window.print()`
- [ ] Classes `no-print` escondem sidebar, hero, filtros e botões
- [ ] `supplement-table th` — centralizado, borda `#9ca3af`, fundo `#f3f4f6`, font-size 9px
- [ ] `supplement-table td` — borda `#d1d5db`, font-size 9px
- [ ] `@page` padrão em `index.css` = landscape (outros módulos)

---

## 10. RESPONSIVIDADE MOBILE (v1.20+)

- [ ] Padding `p-4 md:p-8`
- [ ] Hero strip KPIs `grid-cols-3` (funciona em mobile)
- [ ] Filtros `grid-cols-1 sm:grid-cols-3`
- [ ] StatsOverview `grid-cols-2 lg:grid-cols-4`
- [ ] SummaryChart legenda `flex-row flex-wrap md:flex-col` (mobile: horizontal)

---

## 11. LOADING STATES

- [ ] Enquanto `loading`: 4 `SkeletonCard` no lugar de `StatsOverview`
- [ ] Enquanto `loading`: 3 `SkeletonCard` no lugar das pills
- [ ] Enquanto `loading`: `SkeletonChart` no lugar do `SummaryChart`
- [ ] Enquanto `loading`: `SkeletonChart` no lugar das `SupplementSection`
- [ ] Mensagem "Sem dados" **não aparece** durante `loading`

---

## 12. CÁLCULOS CRÍTICOS

- [ ] `groupByType(filtered)` — agrupa por `tipo`
- [ ] `aggregateEntriesByPasto(typeEntries)` — 1 linha por pasto com consumo calculado por datas reais
- [ ] `averageConsumo(arr)` — média ponderada por quantidade
- [ ] `fmt(n)` — 3 casas decimais com vírgula pt-BR
- [ ] `fmtInt(n)` — inteiros sem casas decimais

---

## 13. AÇÃO

Para cada `[ ]` não conforme:
1. Leia o arquivo correspondente
2. Corrija o desvio **sem alterar nada mais**
3. Rode `npm run build` — deve terminar `✓ built` sem erros TypeScript

Reporte: quantos itens conformes ✅ e quantos corrigidos 🔧.
