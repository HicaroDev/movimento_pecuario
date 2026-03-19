# Ajustes MP16 — 04 Março 2026

> Conjunto de ajustes entregues na versão v1.17 com base na reunião de 04/03/2026.

## Segurança

- ✅ Excluir Pastos agora exige confirmação de senha (PasswordConfirmModal)
- ✅ Excluir Animais agora exige confirmação de senha

## Relatórios

- ✅ Total de Cabeças sem duplicidade — usa máximo de `quantidade` por pasto (deduplicado), não soma de lançamentos
- ✅ Filtro "Lote" — dropdown para filtrar consumo por lote específico
- ✅ Coluna "Lote" na tabela de relatório
- ✅ Coluna "META (KG/CAB DIA)" na tabela
- ✅ "DIAS REAIS" renomeado para "DIAS DE CONSUMO"
- ✅ Filtro de data inicial e final no relatório
- ✅ PDF A4 retrato com bordas — botão PDF injeta `@page { size: A4 portrait; margin: 14mm }`
- ✅ Meta de Consumo — fórmula: `Peso do lote × Meta (% PV) = META KG/cab dia`
  - Linha azul no gráfico + coluna META na tabela + badge nos totals
- ✅ Desembolso R$/cab dia — fórmula: `Consumo médio × Valor do produto (R$/kg)`

## Manejos

- ✅ Aba "Histórico" removida do menu interno de Manejos (disponível apenas no menu lateral)
- ✅ Filtro De/Até no Histórico (menu lateral)

## Status Resumido

| Área | Item | Status |
|------|------|--------|
| Segurança | Excluir Pastos com senha | ✅ |
| Segurança | Excluir Animais com senha | ✅ |
| Relatórios | Cabeças sem duplicidade | ✅ |
| Relatórios | Filtro por Lote | ✅ |
| Relatórios | Meta de consumo + Desembolso | ✅ |
| Relatórios | PDF A4 retrato | ✅ |
| Manejos | Remover aba Histórico interna | ✅ |
| Histórico | Filtro De/Até | ✅ |

---

*MP16 entregue em 04/03/2026 — Suplemento Control v1.17*
