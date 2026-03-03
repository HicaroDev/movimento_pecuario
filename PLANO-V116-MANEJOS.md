# Plano v1.16 — Módulo Manejos

> **Data:** 2026-03-03
> **Status:** Aguardando aprovação
> **Autor:** HicaroDev + Claude Code

---

## 1. CONTEXTO ATUAL

A página `Manejos.tsx` está como placeholder ("em desenvolvimento").
As tabelas `animals` e `animal_categories` já existem no Supabase.

**Problema central:** `animals` no sistema atual representa **lotes** (tem `quantidade`, `peso_medio`),
não animais individuais. Vamos assumir esse modelo — **Animal = Lote operacional** — pois é o que existe.

---

## 2. OBJETIVO DA V1.16

Transformar o módulo Manejos em 4 operações do dia a dia da fazenda:

| # | Operação | O que faz |
|---|---------|-----------|
| 1 | **Alocar lote** | Vincular um lote a um pasto |
| 2 | **Transferir lote** | Mover lote de um pasto para outro |
| 3 | **Evoluir categoria** | Mudar categoria de um ou mais lotes (bezerro → recria → engorda → gordo) |
| 4 | **Registrar abate** | Marcar lote (ou parte dele) como abatido — reduz quantidade, gera evento |

Todas as operações geram um **histórico rastreável** em `manejo_historico`.

---

## 3. MODELO DE DADOS

### 3A — Colunas novas em `animals`

```sql
ALTER TABLE public.animals
  ADD COLUMN IF NOT EXISTS pasto_id  uuid REFERENCES public.pastures(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS status    text NOT NULL DEFAULT 'ativo';
  -- status: 'ativo' | 'abatido' | 'vendido'
```

### 3B — Tabela nova: `manejo_historico`

```sql
CREATE TABLE IF NOT EXISTS public.manejo_historico (
  id           uuid        PRIMARY KEY DEFAULT uuid_generate_v4(),
  farm_id      uuid        NOT NULL REFERENCES public.farms(id) ON DELETE CASCADE,
  animal_id    uuid        NOT NULL REFERENCES public.animals(id) ON DELETE CASCADE,
  tipo         text        NOT NULL,
  -- tipos: 'alocacao' | 'transferencia' | 'evolucao_categoria' | 'abate' | 'ajuste_quantidade'
  descricao    text,
  pasto_origem uuid        REFERENCES public.pastures(id),
  pasto_destino uuid       REFERENCES public.pastures(id),
  categoria_origem uuid    REFERENCES public.animal_categories(id),
  categoria_destino uuid   REFERENCES public.animal_categories(id),
  quantidade   integer,
  peso_medio   numeric,
  created_at   timestamptz NOT NULL DEFAULT now(),
  created_by   uuid        REFERENCES auth.users(id)
);
```

### 3C — RLS (mesmo padrão do sistema)

```sql
ALTER TABLE public.manejo_historico ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admin vê todo histórico"
  ON public.manejo_historico FOR SELECT USING (public.my_role() = 'admin');
CREATE POLICY "cliente vê histórico da fazenda"
  ON public.manejo_historico FOR SELECT USING (farm_id = public.my_farm_id());
CREATE POLICY "admin gerencia histórico"
  ON public.manejo_historico FOR ALL USING (public.my_role() = 'admin');
CREATE POLICY "cliente gerencia histórico da fazenda"
  ON public.manejo_historico FOR ALL USING (farm_id = public.my_farm_id());
```

---

## 4. INTERFACE — TELAS

### Estrutura: 4 tabs

```
┌─────────────────────────────────────────────────────────┐
│  Manejos                                [+ Nova Operação] │
│  Fazenda Malhada Grande                                   │
├──────────┬────────────┬────────────────┬─────────────────┤
│  Lotes   │ Transferir │   Evolução     │    Abate        │
│  por Pasto│           │  de Categoria  │                 │
└──────────┴────────────┴────────────────┴─────────────────┘
```

---

### TAB 1 — Lotes por Pasto (Visão Geral)

```
┌─────────────────────────────────────────────────────────┐
│ PASTO: Pasto Norte (42 ha)                               │
│                                                          │
│  Lote         Categoria    Cabeças   Peso Médio  Status  │
│  ─────────    ──────────   ───────   ─────────── ──────  │
│  Nelore 01    Engorda      120       380 kg      Ativo   │
│  Bezerros A   Bezerro      45        95 kg       Ativo   │
│                          [+ Alocar lote a este pasto]    │
├─────────────────────────────────────────────────────────┤
│ PASTO: Pasto Sul (18 ha)                                 │
│  Lote         Categoria    Cabeças   Peso Médio  Status  │
│  Novilhas 02  Recria       80        220 kg      Ativo   │
│                          [+ Alocar lote a este pasto]    │
├─────────────────────────────────────────────────────────┤
│ SEM PASTO — Lotes não alocados (3)                       │
│  Touretes     Touro        12        —            Ativo  │
│  ...                                                     │
└─────────────────────────────────────────────────────────┘
```

- Agrupa lotes pelo `pasto_id` atual
- Pastos sem lote ficam ocultos (ou colapsados)
- Lotes sem pasto aparecem em seção "Não alocados"
- Botão "Alocar" abre modal simples: seleciona pasto → salva `pasto_id`

---

### TAB 2 — Transferir Lote

```
┌─────────────────────────────────────────────────────────┐
│  Transferir lote entre pastos                            │
│                                                          │
│  Lote:    [ Nelore 01 (Pasto Norte) ▼ ]                  │
│  Destino: [ Pasto Sul               ▼ ]                  │
│  Obs:     [ campo de texto opcional    ]                  │
│                                                          │
│                    [ Confirmar Transferência ]           │
│                                                          │
│ ──── Histórico de Transferências ────────────────────── │
│ 02/03 · Nelore 01 · Norte → Sul                         │
│ 28/02 · Bezerros A · Sem pasto → Norte                  │
└─────────────────────────────────────────────────────────┘
```

- Ao confirmar: atualiza `pasto_id` no animal + insere registro em `manejo_historico`
- Histórico mostra os últimos 20 eventos de transferência

---

### TAB 3 — Evolução de Categoria

```
┌─────────────────────────────────────────────────────────┐
│  Evoluir categoria de lotes                              │
│                                                          │
│  Selecione os lotes:                                     │
│  ☑ Bezerros A (45 cabeças) — Bezerro                    │
│  ☑ Bezerros B (30 cabeças) — Bezerro                    │
│  ☐ Nelore 01  (120 cabeças) — Engorda                   │
│                                                          │
│  Nova categoria: [ Recria ▼ ]                            │
│  Novo peso médio (opcional): [______] kg                 │
│  Obs: [_____________________]                            │
│                                                          │
│                    [ Evoluir Selecionados (75 cab.) ]    │
└─────────────────────────────────────────────────────────┘
```

- Checkboxes nos lotes
- Seleciona nova categoria
- Atualiza `categoria_id` em todos os lotes selecionados + gera evento em `manejo_historico`

---

### TAB 4 — Abate

```
┌─────────────────────────────────────────────────────────┐
│  Registrar abate                                         │
│                                                          │
│  Lote:       [ Nelore 01 (120 cabeças) ▼ ]               │
│  Quantidade: [ 40 ] cabeças                              │
│              (restam 80 após o abate)                    │
│  Peso médio: [ 420 ] kg                                  │
│  Data:       [ 2026-03-03 ]                              │
│  Obs:        [_____________________]                     │
│                                                          │
│  ⚠ Se quantidade = total do lote, o lote será marcado   │
│    como "Abatido" e removido dos lotes ativos.           │
│                                                          │
│                    [ Confirmar Abate ]                   │
│                                                          │
│ ──── Histórico de Abates ────────────────────────────── │
│ 01/03 · Nelore 01 · 20 cab. · 430 kg                    │
│ 15/02 · Gordo Sul · 60 cab. (lote encerrado)            │
└─────────────────────────────────────────────────────────┘
```

- Reduz `quantidade` do lote
- Se `quantidade` chegar a 0 → `status = 'abatido'`
- Gera evento em `manejo_historico` com `tipo = 'abate'`

---

## 5. COMPONENTES A CRIAR

| Componente | Arquivo | Descrição |
|-----------|---------|-----------|
| `Manejos.tsx` | `src/pages/Manejos.tsx` | Página principal com 4 tabs |
| `LotesPorPasto` | inline em Manejos | Tab 1 — visão agrupada por pasto |
| `TransferirTab` | inline em Manejos | Tab 2 — form + histórico |
| `EvolucaoTab` | inline em Manejos | Tab 3 — checkboxes + nova categoria |
| `AbateTab` | inline em Manejos | Tab 4 — form + histórico |
| `manejoService.ts` | `src/services/manejoService.ts` | CRUD Supabase: animals + historico |

---

## 6. SERVIÇO — manejoService.ts

```typescript
// Funções principais:
alocarLote(animalId, pastoId)         // UPDATE animals SET pasto_id + INSERT historico
transferirLote(animalId, pastoDestinoId, obs?) // idem, com pasto_origem registrado
evoluirCategoria(animalIds[], catId, pesoMedio?) // UPDATE animals SET categoria_id
registrarAbate(animalId, quantidade, pesoMedio, data, obs?) // UPDATE quantidade/status
listarHistorico(farmId, tipo?, limit?)  // SELECT manejo_historico ORDER BY created_at DESC
```

---

## 7. ORDEM DE DESENVOLVIMENTO

```
ETAPA 1 — SQL (rodar no Supabase)
  └─ ADD COLUMN pasto_id + status em animals
  └─ CREATE TABLE manejo_historico + RLS

ETAPA 2 — manejoService.ts
  └─ Funções CRUD + insert histórico

ETAPA 3 — Tab 1: Lotes por Pasto
  └─ Busca animals + pastures da fazenda
  └─ Agrupa por pasto_id
  └─ Modal simples de alocação

ETAPA 4 — Tab 2: Transferir
  └─ Form select lote + select pasto destino
  └─ Tabela de histórico de transferências

ETAPA 5 — Tab 3: Evolução de Categoria
  └─ Checkboxes + select categoria + submit em batch

ETAPA 6 — Tab 4: Abate
  └─ Form com validação (quantidade ≤ total do lote)
  └─ Tabela de histórico de abates

ETAPA 7 — SQL migration file
  └─ Gerar manejo_v116.sql pronto para rodar no Supabase
```

---

## 8. FORA DO ESCOPO DA V1.16

> Estas features ficam para v1.17+:

- Animal individual com brinco único (rastreio individual)
- Pesagem em balança (importação de arquivo)
- Vacinação e medicamentos
- Relatório de evolução de categoria no tempo
- Integração com Relatório de suplementação por lote

---

## 9. ESTIMATIVA DE IMPACTO

| Item | Qtd |
|------|-----|
| Arquivos novos | 2 (Manejos.tsx reformulado + manejoService.ts) |
| SQL novo | 2 alterações + 1 tabela nova |
| Tabelas afetadas | `animals` (2 colunas), `manejo_historico` (nova) |
| Sem quebrar | Cadastros, Relatório, Formulário continuam iguais |

---

## 10. PRÓXIMOS PASSOS

1. **Você aprova este plano?** (pode pedir ajustes)
2. Rodar o SQL no Supabase (ETAPA 1)
3. Implementar as etapas 2–7 em sequência
4. Testar via localhost
5. Commit + deploy
