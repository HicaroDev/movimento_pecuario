# /guardar — Snapshot do Estado Atual do Projeto

Você vai **ler os arquivos-chave do projeto** e gerar um arquivo `ESTADO-ATUAL.md` na raiz do projeto documentando tudo que está funcionando e configurado atualmente.

Este snapshot serve como **referência antes de qualquer alteração** — especialmente no Relatório, SupplementSection, index.css e componentes de layout.

---

## PASSO 1 — LER OS ARQUIVOS-CHAVE

Leia em paralelo:

1. `src/pages/Relatorio.tsx` — filtros, KPIs, lógica de meta/desembolso
2. `src/components/SupplementSection.tsx` — colunas da tabela, gráfico, totais
3. `src/components/SummaryChart.tsx` — layout legenda + gráfico
4. `src/styles/index.css` — tokens @theme, classes de impressão
5. `src/lib/data.ts` — supplementColors, supplementOrder
6. `src/context/DataContext.tsx` — campos expostos, farmId logic

---

## PASSO 2 — GERAR O ARQUIVO `ESTADO-ATUAL.md`

Crie ou sobrescreva `ESTADO-ATUAL.md` na raiz do projeto com as seções abaixo, preenchidas com o que você leu nos arquivos.

### Estrutura do arquivo a gerar:

```markdown
# Estado Atual do Projeto — Suplemento Control
> Snapshot gerado em: {DATA_HOJE}

## 1. Tokens de Design (index.css @theme)
- teal-600 = {valor atual}
- [listar todos os overrides do @theme]

## 2. Colunas da Tabela — SupplementSection
| Coluna | Condição de exibição | Formato |
|--------|---------------------|---------|
| PASTO | sempre | texto |
| LOTE | hasLote | texto |
| QUANTIDADE | sempre | fmtInt, cor #1a6040 |
| ... [listar todas as colunas atuais] |

## 3. Totais / Rodapé — SupplementSection
- [o que aparece no rodapé: média, meta badge, desembolso dia, desembolso mês]

## 4. Filtros — Relatorio.tsx
- [listar todos os filtros ativos: suplemento, pasto, lote, meses, dateFrom, dateTo]

## 5. Lógica META e DESEMBOLSO
- META: {formula atual}
- DESEMBOLSO DIA: {formula atual}
- DESEMBOLSO MÊS: {formula atual}

## 6. PDF / Impressão
- @page padrão: {size, margin}
- Classe supplement-table: {o que aplica}
- Classes no-print: [o que é escondido]

## 7. Cores dos Suplementos (data.ts)
| Suplemento | Cor |
|-----------|-----|
| [listar supplementColors atual] |

## 8. Campos do DataContext
- entries: DataEntry[]
- pastures: Pasture[]
- activeFarmId: string
- clientInfo: {...}
- loading: boolean

## 9. O que NÃO deve mudar ao mexer no Relatório
- [listar os padrões que devem ser preservados]
```

---

## PASSO 3 — CONFIRMAR

Após criar o arquivo, informe:
- ✅ Arquivo `ESTADO-ATUAL.md` criado/atualizado
- Resumo das configurações mais importantes encontradas
- Aviso se algo estiver fora do padrão esperado
