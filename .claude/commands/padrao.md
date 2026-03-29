# /padrao — Guardião do Padrão Visual do Sistema Inteiro
> Atualizado: v1.21 (2026-03-27)

Você é um revisor de qualidade. Percorra **todos os arquivos** do projeto `suplemento-control` e garanta que o padrão aprovado pelo cliente está sendo respeitado em cada página e componente.

---

## REGRA DE OURO — CORES

**Apenas uma cor primária no sistema: `teal` (`#1a6040`)**

| Onde | Classe correta |
|------|---------------|
| Botões primários (todas as páginas) | `bg-teal-600 hover:bg-teal-700` |
| Ícones de ação hover | `hover:text-teal-600 hover:bg-teal-50` |
| Focus ring | `focus:ring-teal-500` |
| Nav ativo sidebar | `from-teal-500 to-teal-600` |
| Badge Admin | `from-teal-500 to-teal-600` |
| Toggle ativo | `bg-teal-500` ou `text-teal-600` |

❌ **NUNCA usar `indigo`, `violet`, `purple` ou `blue` em botões, badges ou ícones de ação** — exceto onde é cor de suplemento (Ração Creep = `#6b2fa0`) ou número em tabela (azul `#3b82f6`).

---

## 1. PADRÃO DE HEADER DE PÁGINA

**Todas as páginas** devem usar exatamente esta estrutura de cabeçalho:

```tsx
<p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-1">Suplemento Control</p>
<h1 className="text-3xl font-bold text-gray-900">[Título da Página]</h1>
<p className="text-sm text-gray-500 mt-1">[descrição opcional]</p>
```

| Elemento | Classe obrigatória |
|----------|-------------------|
| Subtítulo | `text-xs font-semibold text-gray-400 uppercase tracking-widest mb-1` |
| Texto subtítulo | **sempre "Suplemento Control"** — nunca customizado por módulo |
| Título h1 | `text-3xl font-bold text-gray-900` |
| Descrição (opcional) | `text-sm text-gray-500 mt-1` |

❌ **NUNCA** usar `font-extrabold`, `text-2xl` ou subtítulo customizado ("Gestão de...", "Relatório de...") no header de página.

---

## 2. TOKENS DE DESIGN


| Token | Hex | Uso exclusivo |
|-------|-----|---------------|
| Brand / teal-600 | `#1a6040` | Botões, nav ativo, foco, badges |
| Navy | `#0b2748` | Mineral Adensado Águas |
| Purple | `#6b2fa0` | Ração Creep |
| Sidebar top | `#1a1f2e` | Gradiente sidebar |
| Sidebar bottom | `#2d3548` | Gradiente sidebar |
| Número tabela | `#3b82f6` | QUANTIDADE, PERÍODO, SACOS |

`supplementColors` em `src/lib/data.ts` é a fonte única de cores por suplemento. Nunca hardcode.

---

## 3. CHECKLIST POR PÁGINA

### DashboardLayout / Sidebar
- [ ] Logo em card branco `bg-white rounded-xl p-3`
- [ ] Badge de versão `v1.15` ao lado do título — `bg-teal-50 text-teal-600 border border-teal-100 rounded-full text-[9px]`
- [ ] Gradiente `#1a1f2e → #2d3548`
- [ ] Nav ativo: `from-teal-500 to-teal-600` + `boxShadow rgba(26,96,64,0.4)`
- [ ] Seletor de fazenda: **somente admin** (`{isAdmin && <AdminFarmSelector />}`)
- [ ] Botão Sair: `text-gray-400 hover:text-white`

### Relatorio
- [ ] Badge "Admin": `from-teal-500 to-teal-600`
- [ ] Filtros: `rounded-2xl shadow-lg border border-gray-200`
- [ ] Botão "Exportar PDF": `from-teal-500 to-teal-600`
- [ ] Skeletons enquanto `loading` (4 cards KPI, 3 metric cards, chart)
- [ ] Mensagem vazia apenas quando `!loading && filtered.length === 0`

### Formulario
- [ ] Botão "Adicionar": `bg-teal-600`
- [ ] Botão "Ir para Relatórios": `bg-teal-600`
- [ ] Select de pasto mostra "Carregando pastos..." quando `loading`
- [ ] `kg = sacos × 25` (auto-calc readonly)

### Pastos
- [ ] Botão "Novo Pasto": `bg-teal-600`
- [ ] Botão "Adicionar" no form: `bg-teal-600`
- [ ] Skeleton tabela enquanto `loading`

### Fazendas
- [ ] Botão "Nova Fazenda": `bg-teal-600`
- [ ] Botão "Cadastrar" no modal: `bg-teal-600`
- [ ] Skeleton cards enquanto `loading`
- [ ] Campo de busca abaixo do header — filtra por nome, responsável e endereço em tempo real
- [ ] Estado vazio de "sem resultados" com ícone Search + botão "Limpar busca"

### Usuarios
- [ ] Botão "Novo Usuário": `bg-teal-600` (**não indigo**)
- [ ] Botão "Criar usuário" / "Salvar": `bg-teal-600` (**não indigo**)
- [ ] Hover ícone editar: `hover:text-teal-600 hover:bg-teal-50` (**não indigo**)
- [ ] Ícone equipe: `text-teal-500` (**não indigo**)
- [ ] Skeleton tabela enquanto `loading`
- [ ] **SEM avatar circular** — coluna Usuário mostra só nome + email em texto
- [ ] Badge de perfil (Admin/Cliente): texto simples `text-xs font-medium text-gray-600`, **sem fundo colorido**
- [ ] Chips de módulo: coloridos por tipo com ícone + borda suave (ver `MODULE_COLORS` em Usuarios.tsx)
- [ ] Botões de ação: `opacity-60 group-hover:opacity-100` — ficam discretos, aparecem ao hover na linha

### Login
- [ ] Botão "Entrar": `bg-teal-600 hover:bg-teal-700`
- [ ] Focus ring inputs: `focus:ring-teal-500`

---

## 4. COMPONENTES

### SupplementSection (v1.21)
- [ ] Header usa gradiente `linear-gradient(135deg, ${color}ee, ${color})`
- [ ] Badge status META integrado no header (quando `avgMeta != null`)
- [ ] Card de totais com fundo `rgba(0,0,0,0.025)` (substitui rodapé antigo)
- [ ] **Com** `LabelList` acima das barras
- [ ] `ReferenceLine` vermelha: `stroke="#e53e3e"` `strokeDasharray="6 3"`
- [ ] `ReferenceLine` azul para meta: `stroke="#1a4a7a"` `strokeDasharray="4 3"`

### SummaryChart (v1.21)
- [ ] Header com ícone `BarChart2` + badge "KG / CAB / DIA"
- [ ] Legenda `flex-col md:flex-row` (responsiva)
- [ ] **Com** `LabelList` acima das barras

### Estoque (v1.22 — admin only)
- [ ] Hero banner `linear-gradient(135deg, #1d3461, #1d5c8a, #1a6040)`
- [ ] Botão "Nova Entrada": `background: '#1a6040'`
- [ ] Botão "Registrar Saída": `bg-red-500`
- [ ] Tabs ativas: `background: '#1a6040'`
- [ ] Barra de progresso alerta: `#ef4444` | normal: `#1a6040`

### MetricCard
- [ ] Trend verde: `bg-green-50 text-green-700`
- [ ] Trend vermelho: `bg-red-50 text-red-700`

### Skeleton (src/components/Skeleton.tsx)
- [ ] `animate-pulse bg-gray-200` em todos os blocos
- [ ] Exporta: `SkeletonCard`, `SkeletonRow`, `SkeletonChart`, `SkeletonTable`

---

## 5. ARQUITETURA

- `DataContext` expõe `loading: boolean` — usado em Relatorio, Formulario, Pastos
- `Fazendas` e `Usuarios` têm `loading` local próprio
- `src/lib/logger.ts` — use `logger.error/info/warn` para logs, nunca `console.log` direto
- `userService` usa service role key para `create`, `update`, `remove`
- `supabase` client tem `lock` customizado (sem navigator.locks deadlock)

---

## 6. AÇÃO

Para cada `[ ]` não conforme:
1. Leia o arquivo
2. Corrija o desvio
3. Rode `npm run build` — deve terminar `✓ built` sem erros TypeScript

Reporte: quantos itens conformes ✅ e quantos corrigidos 🔧.
