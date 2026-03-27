# Plano de Novos Módulos — Suplemento Control
> Última atualização: 2026-03-27 | Fase 3 do roadmap

---

## Visão Geral

```
COMPRA
  │
  ▼
[ESTOQUE] ──────► alerta de reposição → responsável pela compra
  │
  │  saída via OS
  ▼
[OS — Ordem de Suplemento]  ──► impresso para o salgador ( OU UM APLICATIVO QUE VAI SER NOTIFICADO ## estamos querendo criar )
  │
  │  lançamento automático ( pode ser por foto ou depois com um aplicativo reduzido so para salgador )
  ▼
[DATA ENTRIES — Relatório]  ← já existe

[LIVRO CAIXA]  ─── módulo financeiro independente
   (compras, vendas de animais, despesas gerais)
```

---

## MÓDULO 1 — Estoque de Materiais

### Conceito
Controle de entrada e saída dos **suplementos** já cadastrados em `supplement_types`.
Cada fazenda tem seu próprio estoque. A saída pode ser manual ou automática via OS.

### Fluxo
```
Entrada (compra/recebimento)
  → registra: data, suplemento, qtd em sacos, qtd em kg, fornecedor, NF, valor unitário

Saída (consumo / OS)
  → registra: data, suplemento, qtd em sacos, qtd em kg, referência (OS ou manual)

Saldo atual
  = soma das entradas - soma das saídas
  → alerta quando saldo < estoque_minimo (configurável por suplemento)
```

### Tabela Supabase: `estoque_movimentos`
```sql
CREATE TABLE estoque_movimentos (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  farm_id     uuid REFERENCES farms(id),
  tipo        text NOT NULL CHECK (tipo IN ('entrada', 'saida')),
  suplemento_id uuid REFERENCES supplement_types(id),
  suplemento_nome text NOT NULL,         -- desnormalizado para histórico
  data        date NOT NULL DEFAULT now(),
  sacos       numeric(10,2) DEFAULT 0,
  kg          numeric(10,2) DEFAULT 0,
  valor_unitario_kg numeric(10,4),       -- R$/kg (só na entrada)
  fornecedor  text,
  nota_fiscal text,
  os_id       uuid,                      -- ref. à OS que gerou a saída
  observacoes text,
  created_at  timestamptz DEFAULT now()
);
```

### Tabela: `estoque_minimo` (configuração por suplemento/fazenda)
```sql
ALTER TABLE supplement_types
  ADD COLUMN estoque_minimo_sacos numeric(10,2) DEFAULT 0,
  ADD COLUMN alerta_reposicao boolean DEFAULT false;
```

### Tela — Estoque (`/estoque`)
```
┌─────────────────────────────────────────────────────┐
│  ESTOQUE DE SUPLEMENTOS            [+ Entrada]       │
├─────────────────────────────────────────────────────┤
│  [cards por suplemento: saldo atual / mínimo]       │
│   ██████████ Mineral Adensado Águas  │ 45 sacos ✓  │
│   ████░░░░░░ Proteico 0,1%          │ 8 sacos ⚠   │
│   ██░░░░░░░░ Sal Mineral Seca        │ 2 sacos 🔴  │
├─────────────────────────────────────────────────────┤
│  [Tabs: Movimentações | Alertas]                    │
│  tabela: Data | Tipo | Suplemento | Sacos | KG | NF │
└─────────────────────────────────────────────────────┘
```

### Sistema de Alerta
- Quando `saldo_sacos <= estoque_minimo_sacos`: exibe badge vermelho no card
- **Alerta Sidebar**: badge numérico no módulo Estoque (igual ao DevPlan)
- **Botão "Solicitar Compra"**: abre modal com sugestão de quantidade baseada no consumo médio dos últimos 30 dias × período desejado
- Futuramente: envio por WhatsApp/email para o responsável

### Tasks (Fase 3A)
```
T-310  Criar tabela estoque_movimentos + alter supplement_types
T-311  estoque_minimo_sacos + alerta_reposicao em Cadastros > Suplementos
T-312  estoqueService.ts — CRUD movimentos + calcular saldo
T-313  Página Estoque.tsx — cards de saldo + barra de progresso
T-314  Modal de Entrada (data, suplemento, sacos, kg, fornecedor, NF)
T-315  Tab Movimentações — tabela filtrada por suplemento/período
T-316  Tab Alertas — lista suplementos com saldo abaixo do mínimo
T-317  Botão "Solicitar Compra" — modal com cálculo automático de qtd sugerida
T-318  Badge sidebar Estoque (contagem de alertas ativos)
T-319  Integração: saída automática ao confirmar OS
```

---

## MÓDULO 2 — OS (Ordem de Suplemento)

### Conceito
A **Ordem de Suplemento** é o documento que o responsável emite para o salgador:
> "Leve X sacos de Produto Y para o Cocho Z do Pasto W"

Quando a OS é executada → gera automaticamente:
- Uma **saída no Estoque**
- Um **lançamento em `data_entries`** (relatório)

### Fluxo
```
Responsável cria OS
  → seleciona fazenda, data, lista de itens:
     [pasto + cocho + suplemento + sacos + qtd animais]

OS impressa / enviada ao salgador
  → PDF formato "romaneio de campo"

Salgador executa e confirma
  → OS status: pendente → executada
  → saída automática no estoque
  → lançamento automático no relatório (data_entries)
```

### Tabela Supabase: `ordens_suplemento`
```sql
CREATE TABLE ordens_suplemento (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  farm_id     uuid REFERENCES farms(id),
  numero      text,                      -- ex: OS-2026-001 (auto-incremento)
  data_emissao date NOT NULL DEFAULT now(),
  data_prevista date,
  responsavel text,
  salgador    text,
  status      text DEFAULT 'pendente' CHECK (status IN ('pendente','executada','cancelada')),
  observacoes text,
  created_at  timestamptz DEFAULT now()
);

CREATE TABLE ordens_suplemento_itens (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  os_id       uuid REFERENCES ordens_suplemento(id) ON DELETE CASCADE,
  pasto_id    uuid REFERENCES pastures(id),
  pasto_nome  text NOT NULL,
  cocho       text,                      -- identificação do cocho no pasto
  suplemento_id uuid REFERENCES supplement_types(id),
  suplemento_nome text NOT NULL,
  sacos       numeric(10,2) NOT NULL,
  kg          numeric(10,2),             -- sacos × peso_saco (auto)
  quantidade_animais integer,
  periodo_dias integer DEFAULT 1,
  executado   boolean DEFAULT false
);
```

### Tela — OS (`/os`)
```
┌──────────────────────────────────────────────────────────┐
│  ORDENS DE SUPLEMENTO              [+ Nova OS]           │
├──────────────────────────────────────────────────────────┤
│  [Tabs: Em Aberto | Executadas | Canceladas]             │
├──────────────────────────────────────────────────────────┤
│  OS-2026-001  │  27/03/2026  │  João Salgador  │ 🟡 ABERTA │
│  OS-2026-002  │  25/03/2026  │  Pedro S.        │ ✅ EXEC.  │
└──────────────────────────────────────────────────────────┘
```

### Modal Criação de OS
```
Cabeçalho:  Data emissão | Data prevista | Salgador

Itens (tabela dinâmica — adicionar/remover linhas):
┌──────────┬──────────────┬──────────┬───────┬──────┐
│ PASTO    │ SUPLEMENTO   │ SACOS    │  KG   │ CAB  │
├──────────┼──────────────┼──────────┼───────┼──────┤
│ Pasto 01 │ Min. Águas   │  12      │  300  │  80  │
│ Pasto 02 │ Sal Mineral  │   6      │  150  │  40  │
└──────────┴──────────────┴──────────┴───────┴──────┘
[+ Adicionar item]

Rodapé: Total sacos | Total kg | [Imprimir] [Confirmar Execução]
```

### PDF Romaneio de Campo
```
ORDEM DE SUPLEMENTO — OS-2026-001
Fazenda Malhada Grande | Data: 27/03/2026
Salgador: João Silva

PASTO       COCHO  SUPLEMENTO       SACOS   KG     ANIMAIS
──────────────────────────────────────────────────────────
Pasto 01    C-01   Min. Adensado Á   12     300      80
Pasto 02    C-02   Sal Mineral        6     150      40
──────────────────────────────────────────────────────────
TOTAL                                18     450     120

Assinatura do salgador: ___________________  Data: _______
```

### Tasks (Fase 3B)
```
T-320  Criar tabelas ordens_suplemento + ordens_suplemento_itens
T-321  osService.ts — CRUD OS + numeração automática
T-322  Página OS.tsx — lista por status + cards
T-323  Modal Nova OS — tabela dinâmica de itens com seleção pasto/suplemento
T-324  Auto-cálculo kg = sacos × peso_saco do supplement_types
T-325  PDF Romaneio de campo — layout de impressão com assinatura
T-326  Confirmar execução → saída no estoque + lançamento data_entries
T-327  Cancelar OS com motivo
T-328  Rota /os + módulo 'os' no sistema de auth
```

---

## MÓDULO 3 — Livro Caixa

### Conceito
Controle financeiro básico da fazenda: receitas e despesas.
O dono lança manualmente o que entra e sai.
Permite visualizar o resultado (lucro/prejuízo) por período.

### Categorias sugeridas
**Receitas:** Venda de animais | Venda de leite | Outras receitas
**Despesas:** Compra de suplemento | Compra de ração | Medicamentos | Mão de obra | Manutenção | Combustível | Outras despesas

### Tabela Supabase: `livro_caixa`
```sql
CREATE TABLE livro_caixa (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  farm_id     uuid REFERENCES farms(id),
  tipo        text NOT NULL CHECK (tipo IN ('receita', 'despesa')),
  categoria   text NOT NULL,
  descricao   text,
  valor       numeric(12,2) NOT NULL,
  data        date NOT NULL DEFAULT now(),
  referencia  text,                      -- NF, contrato, etc.
  origem      text DEFAULT 'manual'      -- manual | os | estoque (auto-vinculado)
  CHECK (tipo IN ('receita','despesa')),
  created_at  timestamptz DEFAULT now()
);
```

### Tela — Livro Caixa (`/caixa`)
```
┌────────────────────────────────────────────────────────┐
│  LIVRO CAIXA                     [+ Lançamento]        │
├────────────────────────────────────────────────────────┤
│  [Filtro: Mês/Período]  [Tipo: Todos/Receita/Despesa]  │
├─────────────────────────┬──────────────────────────────┤
│  RECEITAS               │  DESPESAS                    │
│  R$ 48.500,00  ▲        │  R$ 12.340,00  ▼             │
├─────────────────────────┴──────────────────────────────┤
│  SALDO DO PERÍODO                                      │
│  R$ 36.160,00  📈                                      │
├────────────────────────────────────────────────────────┤
│  Data   │ Tipo  │ Categoria    │ Descrição   │  Valor  │
│  01/03  │ 🟢    │ Venda animais│ 10 novilhos │ 25.000  │
│  05/03  │ 🔴    │ Suplemento   │ NF 1234     │  3.200  │
└────────────────────────────────────────────────────────┘
```

### Tasks (Fase 3C)
```
T-330  Criar tabela livro_caixa + RLS
T-331  caixaService.ts — CRUD lançamentos
T-332  Página LivroCaixa.tsx — cards receita/despesa/saldo + tabela
T-333  Modal de lançamento — tipo/categoria/valor/data/descrição/referência
T-334  Gráfico mensal — barras receita vs despesa por mês
T-335  Export Excel — extrato do período
T-336  Auto-lançamento ao confirmar OS (despesa de suplemento automática)
T-337  Rota /caixa + módulo 'caixa' no sistema de auth
```

---

## Ordem de Desenvolvimento Recomendada

```
Fase 3A — Estoque (base para tudo)
  → T-310 a T-319

Fase 3B — OS (usa estoque + gera relatório)
  → T-320 a T-328
  → Ao executar OS: saída no estoque + lançamento no relatório

Fase 3C — Livro Caixa (independente, mas integra via OS)
  → T-330 a T-337
  → Ao executar OS: despesa automática no caixa (opcional)
```

## Sidebar (itens a adicionar)

```
Manejo       ← já existe
Lançamento   ← já existe
Relatórios   ← já existe
Cadastros    ← já existe
─────────────── (divisor)
Estoque      ← NOVO (T-3A) (SOMENTE ADMIM PODE VISUALIZAR )( APAREÇA PARA OS CLIENTES - " EM BREVE")
OS           ← NOVO (T-3B) (SOMENTE ADIM PODE VISUALIZAR)( APAREÇA PARA OS CLIENTES - " EM BREVE")
Livro Caixa  ← NOVO (T-3C)  (SOMENTE ADIM PODE VISUALIZAR)( APAREÇA PARA OS CLIENTES - " EM BREVE")
─────────────── (divisor)
Usuários     ← já existe
Fazenda      ← já existe
```

## Integrações entre módulos

| Evento | Origem | Destino |
|--------|--------|---------|
| Compra de suplemento | Livro Caixa (despesa) | Estoque (entrada) |
| OS executada | OS | Estoque (saída) + data_entries (relatório) + Livro Caixa (despesa automática, opcional) |
| Venda de animais | Livro Caixa (receita) | — |

---

> **Próximo passo:** Confirmar escopo com usuário → iniciar Fase 3A (Estoque)
> ** NAO ESQUEÇA DE CRIAR UM PLANO DE IMPLATAÇÃO QUANDO HOUVER ALGUMA COISA QUE TENHO Q RODA NO SQL 

