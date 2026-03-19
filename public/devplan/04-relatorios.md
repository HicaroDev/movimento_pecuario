# Módulo Relatórios

## O que o módulo faz

O módulo Relatórios exibe o consumo de suplementos por pasto, lote e período, com gráficos e tabelas detalhadas.

## Funcionalidades Atuais

### Filtros disponíveis
- **Período** — data inicial e data final
- **Lote** — filtra por lote específico dentro do pasto
- **Pasto** — visão por pasto

### Gráficos
- **SummaryChart** — gráfico de barras com médias de consumo por suplemento (com rótulos acima)
- **SupplementSection** — uma seção por tipo de suplemento com:
  - Tabela de lançamentos (Data, Lote, KG, Dias de Consumo, KG/cab/dia, META, Desembolso)
  - Gráfico de barras do histórico de consumo

### Métricas exibidas
- **KG/CAB DIA** — consumo médio por cabeça por dia
- **META KG/CAB DIA** — meta calculada a partir do % PV do lote
- **Desembolso R$/cab/dia** — custo diário por cabeça
- **Total de Cabeças** — sem duplicidade entre lotes

### Export
- **PDF A4 retrato** — com bordas e dados completos

## Em Implementação

- ⬜ **Curva de consumo diário** — ao filtrar por Lote, exibir gráfico de linha com eixo X = datas
  - Cada suplemento com cor diferente
  - Linha muda de cor quando o suplemento muda
- ⬜ **% PV** — consumo em porcentagem do peso vivo ao lado da meta
  - Fórmula: `(Consumo KG/cab/dia ÷ Peso Vivo) × 100 = % PV`

## Regras de Cálculo Confirmadas

| Campo | Fórmula |
|-------|---------|
| KG/cab/dia | `Total KG ÷ Dias reais ÷ Qtd cabeças` |
| Dias reais | `Data fechamento − Data abertura` (dia do fechamento NÃO conta) |
| META KG/cab/dia | `Peso do lote × Meta (% PV)` |
| Desembolso R$/cab/dia | `KG/cab/dia × Valor do produto (R$/kg)` |
| % PV | `(KG/cab/dia ÷ Peso Vivo) × 100` |

> **Importante:** os lançamentos podem ter intervalos irregulares (3, 5, 7+ dias). O sistema calcula o período real entre apontamentos.

---

*Atualizado em 19/03/2026 — v1.18*
