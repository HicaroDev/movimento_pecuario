# /manejos — Guardião do Módulo Manejos

Você é um revisor especializado no módulo Manejos do `suplemento-control`. Audite e corrija tudo relacionado às abas, filtros, operações e histórico de manejos.

> **ANTES DE QUALQUER ALTERAÇÃO**: rode `/guardar` para criar um snapshot do estado atual.

---

## ARQUIVOS ENVOLVIDOS

| Arquivo | Responsabilidade |
|---------|-----------------|
| `src/pages/Manejos.tsx` | Página principal — todas as abas e sub-tabs |
| `src/services/manejoService.ts` | CRUD animals, historico, categorias, operações |
| `src/pages/Pastos.tsx` | Lista de pastos com PDF |
| `src/styles/index.css` | Classes PDF: `.pdf-brand-bar`, `.pdf-table`, `.pdf-badge-*` |

---

## 1. ABAS PRINCIPAIS

- [ ] `LotesTab` — lotes por pasto com header global de fazenda
- [ ] `TransferirTab` — mover lote entre pastos (completo ou parcial unificado)
- [ ] `EvolucaoTab` — evolução de categoria, parição, desmama, abate/saída, transf. parcial
- [ ] Não existe mais aba "Histórico" interna — removida no MP17

---

## 2. LOTES (LotesTab)

- [ ] Header global da fazenda: HA total, N° pastos, Cab total, Peso Médio Pond.
- [ ] Bezerros no header global: total bezerros + peso médio ponderado
- [ ] Sub-row laranja para bezerros: `bezerros_quantidade` + `bezerros_peso_medio`
- [ ] Somatória por pasto: total cab + peso médio ponderado
- [ ] Selects de lote exibem: `nome · categoria · quantidade`

---

## 3. TRANSFERIR (TransferirTab)

- [ ] Toggle: **Lote completo** / **Transferência parcial**
- [ ] Destino sempre por PASTO (com lotes existentes ou vazio)
- [ ] Cada pasto no select mostra quantidade de lotes ("· 2 lotes" ou "· vazio")
- [ ] Parcial → pasto com lotes: toggle criar novo / agregar existente
- [ ] Parcial → pasto vazio: apenas campo nome novo lote
- [ ] Usa `manejoService.transferirParcialParaPasto()`

---

## 4. EVOLUÇÃO (EvolucaoTab)

### Sub-ops disponíveis:
- `categoria` — Evolução de Categoria
- `paricao` — Parição
- `desmama` — Desmama
- `abate` — Saída (Abate/Venda)
- `transf_parcial` — Transferência Parcial

### Regras críticas:

**Parição:**
- [ ] Lista SOMENTE lotes com `sexo === 'FÊMEA'`
- [ ] Bezerros ficam no lote da mãe (`bezerros_quantidade++`)
- [ ] `prenha` marcado como `false` após parição
- [ ] SEM criação de lote separado para bezerros

**Desmama:**
- [ ] Lista SOMENTE lotes com `sexo === 'FÊMEA'` E `bezerros_quantidade > 0`
- [ ] Exibe "Bezerros disponíveis: X cab." ao selecionar lote
- [ ] Decrementa `bezerros_quantidade` no lote mãe

**Abate/Saída:**
- [ ] Tipo: Abate ou Venda
- [ ] Qtd parcial ou total
- [ ] SEM desagrupar bezerros (removido MP16)

**Transf. Parcial:**
- [ ] Selecionar lote origem → qtd + data → pasto destino
- [ ] Criar novo lote ou agregar em existente no pasto destino

---

## 5. HISTÓRICO PDF (Manejos)

- [ ] Landscape — brand bar verde `#1a6040`
- [ ] Cards: período, total registros, resumo por tipo
- [ ] Badges coloridos por tipo de manejo
- [ ] Usa `.pdf-brand-bar`, `.pdf-table`, `.pdf-badge-{color}`

---

## 6. CORES BEZERROS

- [ ] Sub-row bezerros: `bg-orange-50`, `text-orange-700`
- [ ] Ícone/badge bezerros: `orange-*` em toda a UI de Manejos

---

## 7. AÇÃO

Para cada `[ ]` não conforme:
1. Leia o arquivo correspondente
2. Corrija o desvio **sem alterar nada mais**
3. Rode `/build` — deve terminar sem erros TypeScript

Reporte: quantos itens conformes ✅ e quantos corrigidos 🔧.
