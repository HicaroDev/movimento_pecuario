---
name: suplemento-control
description: Build and maintain the Suplemento Control SaaS — a livestock supplement consumption tracking dashboard for Brazilian zootechnists. Use when working on any part of this project including dashboard, forms, reports, charts, database, auth, CRUD operations, or Excel import/export. Covers Next.js 15, Supabase, Recharts, shadcn/ui, and Tailwind CSS.
---

# Suplemento Control — Project Skill

## Context

SaaS for Brazilian zootechnists (livestock nutritionists) who manage multiple farms, divisions (retiros), and pastures (pastos). Track daily supplement consumption (kg/head/day) for different supplement types.

## Core Domain

### Supplement Types (always use these exact names and colors)
- **Energético 0,3%** → `#0b6b45` (green)
- **Mineral Adensado Águas** → `#0b2748` (navy)
- **Ração Creep** → `#6b2fa0` (purple)

### Data Structure (consumption record)
| Field | Type | Description |
|-------|------|-------------|
| pasture | text | Pasto name |
| lot_size | integer | Quantity of animals |
| supplement | text | Supplement type |
| days_count | integer | Period in days (default 30) |
| sacks_25kg | integer | Sacks of 25kg |
| kg_consumed | numeric | Total kg consumed in period |
| consumption_per_head_day | numeric(8,4) | **PRIMARY metric** (Coluna N from Excel) |

### Key Calculations
- `consumption_per_head_day = kg_consumed / (lot_size * days_count)`
- Average = `SUM(consumption) / COUNT(records)` per supplement type
- Totals = `SUM(lot_size)` per supplement type

## Tech Stack

- **Next.js 15** (App Router, TypeScript, `src/` directory)
- **Tailwind CSS** + **shadcn/ui** (design system)
- **Recharts** (bar charts with `<ReferenceLine>` for averages)
- **Supabase** (PostgreSQL, Auth, RLS)
- **SheetJS** (xlsx import/export)
- **Vercel** (hosting)

## Database Schema

See `references/database-schema.md` for full SQL.

Key tables: `organizations`, `farms`, `divisions`, `pastures`, `supplements`, `forage_types`, `consumption_records`, `profiles`.

Cascade hierarchy: Organization → Farm → Division → Pasture.

## UI Patterns

### Layout
- Sidebar (dark `#1e1e2d`) with navigation links
- Top header bar with user chip
- Main content area with padding

### Dashboard / Reports
- **KPI Cards**: 3 cards in grid, colored left border per supplement, icon + name + big value + badge
- **Filter Bar**: Inline chips in white card, dropdowns for supplement/pasto/period + print button
- **Summary Sheet**: 2-column grid (table left, bar chart right)
- **Per-Supplement Sections**: Green header bar + h2 title + row(table + chart)
- **Charts**: Recharts `<BarChart>` with `<ReferenceLine stroke="#e53e3e" strokeDasharray="6 3" />` for average

### Chart Colors (per section)
- Summary chart: each bar uses its supplement color
- Energético section: all bars `#0b6b45`
- Mineral section: all bars `#0b2748`
- Creep section: all bars `#6b2fa0`
- Average line: always `#e53e3e` (red, dashed)

### Number Formatting
- Brazilian format: `0,748` (comma as decimal separator)
- Use 3 decimal places for consumption values
- Use 0 decimal places for quantities

## File References

- `references/database-schema.md` — Full SQL schema
- `references/client-requirements.md` — Original client briefing
- `references/component-patterns.md` — React component patterns for this project
