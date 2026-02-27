# /relatorio — Guardião da Página de Relatório

Você é um revisor especializado na página de Relatório do `suplemento-control`. Audite e corrija tudo relacionado à exibição, filtragem, gráficos e export do relatório.

---

## ARQUIVOS ENVOLVIDOS

| Arquivo | Responsabilidade |
|---------|-----------------|
| `src/pages/Relatorio.tsx` | Página principal — filtros, KPIs, charts |
| `src/components/StatsOverview.tsx` | 4 cards KPI |
| `src/components/MetricCard.tsx` | 3 cards de média por suplemento |
| `src/components/SummaryChart.tsx` | Gráfico de resumo geral |
| `src/components/SupplementSection.tsx` | Seção por suplemento (tabela + gráfico) |
| `src/components/Skeleton.tsx` | Loading states |
| `src/lib/data.ts` | `supplementOrder`, `supplementColors` |
| `src/lib/utils.ts` | `fmt()`, `groupByType()`, `averageConsumo()` |
| `src/context/DataContext.tsx` | `entries`, `loading` |

---

## 1. LOADING STATES

- [ ] `const { entries, loading } = useData()`
- [ ] Enquanto `loading`: 4 `SkeletonCard` no lugar de `StatsOverview`
- [ ] Enquanto `loading`: 3 `SkeletonCard` no lugar dos `MetricCard`
- [ ] Enquanto `loading`: `SkeletonChart` no lugar do `SummaryChart`
- [ ] Enquanto `loading`: `SkeletonChart` no lugar das `SupplementSection`
- [ ] Mensagem "Sem dados" **não aparece** durante `loading`

---

## 2. FILTROS

- [ ] Card `rounded-2xl shadow-lg border border-gray-200 p-6`
- [ ] 4 colunas: **Suplemento** | **Pasto** | **Período (dias)** | **Exportar PDF**
- [ ] Cada select tem `<ChevronDown>` posicionado absolute right
- [ ] "Limpar filtros" aparece **somente** quando `hasFilters === true`
- [ ] Aviso amber `bg-amber-50 border-amber-200` quando filtro retorna vazio
- [ ] Botão "Exportar PDF": `from-teal-500 to-teal-600`

---

## 3. KPI CARDS (StatsOverview)

- [ ] 4 cards em grid `grid-cols-1 md:grid-cols-4`
- [ ] Métricas: Total Registros | Total Animais | Total Pastos | Consumo Médio
- [ ] Valores calculados de `filtered` (não de `entries`)

---

## 4. METRIC CARDS

- [ ] 3 cards: Energético 0,3% | Mineral Adensado Águas | Ração Creep
- [ ] Cor de cada card vem de `supplementColors[nome]`
- [ ] `value = fmt(averageConsumo(groups[nome]))` — formato `0,000`
- [ ] `subtitle = N pastos`
- [ ] Trend badge: verde `bg-green-50 text-green-700` / vermelho `bg-red-50 text-red-700`

---

## 5. SUMMARY CHART

- [ ] Só renderiza quando `!loading && filtered.length > 0`
- [ ] Legenda lateral esquerda, gráfico à direita
- [ ] SEM `LabelList` nas barras
- [ ] `title` = "CONSUMO KG/CAB DIA — MÉDIAS CONSUMO"
- [ ] `subtitle` = nome da fazenda + período

---

## 6. SUPPLEMENT SECTIONS

- [ ] Uma seção por tipo em `supplementOrder`
- [ ] Seção só renderiza quando `sectionEntries.length > 0`
- [ ] Cor do header = `supplementColors[tipo]`
- [ ] Tabela full-width → linha de totais → gráfico full-width
- [ ] SEM `LabelList`
- [ ] `ReferenceLine` tracejada vermelha: `stroke="#e53e3e"` `strokeDasharray="6 3"`
- [ ] Badge "MOVIMENTO PECUÁRIO" no header com borda branca

---

## 7. CÁLCULOS

- [ ] `groupByType(filtered)` — agrupa entradas filtradas por `tipo`
- [ ] `averageConsumo(arr)` — média de `consumo` do array
- [ ] `sumQuantidade(filtered)` — soma `quantidade`
- [ ] `fmt(n)` — sempre para exibir decimais (vírgula pt-BR, 3 casas)
- [ ] `fmtInt(n)` — para inteiros

---

## 8. EXPORT PDF

- [ ] Botão chama `window.print()`
- [ ] Classes `no-print` escondem sidebar e filtros na impressão
- [ ] `no-print-padding` remove padding da página na impressão

---

## 9. AÇÃO

Para cada `[ ]` não conforme:
1. Leia o arquivo correspondente
2. Corrija o desvio
3. Rode `npm run build` — deve terminar `✓ built` sem erros TypeScript

Reporte: quantos itens conformes ✅ e quantos corrigidos 🔧.
