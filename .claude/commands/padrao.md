# /padrao — Guardião do Padrão Visual e de Layout

Você é um revisor de qualidade de design e código. Revise o projeto `suplemento-control` e garanta que o padrão Figma atual está sendo respeitado em todos os componentes. Siga os passos abaixo:

## 1. TOKENS DE DESIGN — Verifique se estão sendo usados corretamente

**Paleta de cores obrigatória** (definida em `src/styles/index.css`):
| Token | Hex | Uso |
|-------|-----|-----|
| `--brand` / `teal-600` | `#1a6040` | Botões primários, active nav, badges, foco |
| `--navy` | `#0b2748` | Mineral Adensado Águas |
| `--purple` | `#6b2fa0` | Ração Creep |
| `--sidebar-from` | `#1a1f2e` | Gradiente sidebar topo |
| `--sidebar-to` | `#2d3548` | Gradiente sidebar base |

**`supplementColors` em `src/lib/data.ts`** é a fonte única de cores por suplemento.
- Energético: `#1a6040` | Mineral: `#0b2748` | Creep: `#6b2fa0`
- **NUNCA** hardcode essas cores em componentes. Use `supplementColors[tipo]`.

**Números em tabelas** (SupplementSection):
- QUANTIDADE, PERÍODO, SACOS → `color: #3b82f6` (azul)
- KG CONSUMIDOS → `text-gray-700`
- CONSUMO → `font-bold text-gray-900`

## 2. LAYOUT — Padrões obrigatórios por componente

### SupplementSection
- [ ] Cabeçalho usa **cor do suplemento** (não sempre verde)
- [ ] Layout **vertical**: tabela full-width → totais → gráfico full-width
- [ ] Título do gráfico: `text-gray-900` (escuro, não colorido)
- [ ] **SEM** `LabelList` (sem labels em cima das barras)
- [ ] **SEM** botão "Visualizar Análise Detalhada"
- [ ] `ReferenceLine` vermelha tracejada: `stroke="#e53e3e"` `strokeDasharray="6 3"`
- [ ] "MOVIMENTO PECUÁRIO" como badge com borda branca no header

### DashboardLayout (Sidebar)
- [ ] Logo `/logo.png` em card branco (`bg-white rounded-xl p-3`)
- [ ] Gradiente: `#1a1f2e → #2d3548`
- [ ] Nav ativo: `from-teal-500 to-teal-600` + boxShadow `rgba(26,96,64,0.4)`
- [ ] 3 itens: Relatório (BarChart3) | Formulário (FileText) | Cliente (Building2)

### Relatorio (página)
- [ ] Header com título + descrição + badge "Admin" (teal gradient)
- [ ] Filtros em card branco `rounded-2xl shadow-lg`
- [ ] 4 colunas: Suplemento | Pasto | Período | Exportar PDF
- [ ] `ChevronDown` nos selects, `<option>` sem classes
- [ ] "Limpar filtros" aparece apenas quando `hasFilters === true`
- [ ] Aviso amber quando resultado filtrado vazio

### SummaryChart
- [ ] Card com `motion` (opacity 0→1, y 20→0)
- [ ] Legenda lateral esquerda + gráfico à direita
- [ ] Aceita `title` e `subtitle` props

### MetricCard
- [ ] Trend badge com background: `bg-green-50 text-green-700` / `bg-red-50 text-red-700`

### Formulario
- [ ] `pasto` é `<select>` populado de `pastures` do DataContext
- [ ] `kg = sacos × 25` (auto-calc readonly)
- [ ] `consumo = kg / (quantidade × periodo)` (auto-calc readonly)

## 3. ARQUITETURA — Regras de ouro

- **DataContext** é o único lugar que lê/escreve localStorage
- **`src/lib/data.ts`** controla `supplementOrder`, `supplementColors`, `sampleRows`
- **`src/lib/utils.ts`** controla `fmt()`, `fmtInt()`, `groupByType()`, `averageConsumo()`
- Formatação de números: `fmt()` sempre (vírgula pt-BR, 3 casas)
- Nenhum componente chama `localStorage` diretamente

## 4. AÇÃO

Para cada item com `[ ]`:
1. Leia o arquivo correspondente
2. Identifique o desvio
3. Corrija para alinhar com o padrão acima
4. Rode `npm run build` ao final — deve terminar `✓ built` sem erros TypeScript

Reporte um resumo: quantos itens estavam conformes ✅ e quantos foram corrigidos 🔧.
