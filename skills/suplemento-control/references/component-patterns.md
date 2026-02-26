# Component Patterns — Suplemento Control

## Chart Components (Recharts)

### ConsumptionBarChart
Bar chart with optional red average reference line.

```tsx
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ReferenceLine, Tooltip, Cell } from "recharts";

interface ChartProps {
  data: { name: string; value: number }[];
  color: string;
  average?: number;
  colors?: string[];  // per-bar colors (for summary chart)
}

export function ConsumptionBarChart({ data, color, average, colors }: ChartProps) {
  return (
    <BarChart data={data} width={560} height={340}>
      <CartesianGrid strokeDasharray="3 3" stroke="#ececec" />
      <XAxis dataKey="name" angle={-40} textAnchor="end" height={80} fontSize={10} />
      <YAxis fontSize={11} />
      <Tooltip formatter={(v: number) => v.toFixed(3).replace(".", ",")} />
      <Bar dataKey="value" radius={[3, 3, 0, 0]}>
        {data.map((_, i) => (
          <Cell key={i} fill={colors?.[i] || color} />
        ))}
      </Bar>
      {average && (
        <ReferenceLine
          y={average}
          stroke="#e53e3e"
          strokeWidth={2}
          strokeDasharray="6 3"
          label={{ value: `média ${average.toFixed(3).replace(".", ",")}`, position: "right", fontSize: 10, fill: "#e53e3e" }}
        />
      )}
    </BarChart>
  );
}
```

### SummaryChart
Summary with 3 bars, each with its own color.

```tsx
const supplementColors = {
  "Energético 0,3%": "#0b6b45",
  "Mineral Adensado Águas": "#0b2748",
  "Ração Creep": "#6b2fa0",
};
```

## Filter Components

### FilterBar
Inline filter bar with dropdowns.

```tsx
interface Filters {
  month?: string;
  farmId?: string;
  divisionId?: string;
  supplementId?: string;
  pastureId?: string;
}
```

Filters cascade: Farm → Division → Pasture. When farm changes, reset division and pasture.

## Layout Components

### Sidebar
- Dark background (#1e1e2d)
- Logo/avatar at top
- Nav links: Dashboard, Lançamentos, Relatórios, Cadastros (expandable), Importar
- Active link has green accent

### KPI Cards
- Grid of 3 cards
- Left colored border (4px)
- Icon + Name + Big Number + Badge (count)
- Colors match supplement type

## Number Formatting (Brazilian)

```tsx
function fmt(value: number, decimals = 3): string {
  return value.toFixed(decimals).replace(".", ",");
}

function fmtInt(value: number): string {
  return Math.round(value).toLocaleString("pt-BR");
}
```

## Data Fetching Pattern (Supabase)

```tsx
// Server Component
async function getConsumptionData(filters: Filters) {
  const supabase = createServerClient();
  let query = supabase
    .from("consumption_records")
    .select(`
      *,
      pastures(name),
      supplements(name, type),
      divisions(name),
      farms(name)
    `);

  if (filters.month) {
    query = query.gte("closing_date", `${filters.month}-01`)
                 .lt("closing_date", `${filters.month}-31`);
  }
  if (filters.supplementId) {
    query = query.eq("supplement_id", filters.supplementId);
  }

  const { data, error } = await query;
  return data;
}
```
