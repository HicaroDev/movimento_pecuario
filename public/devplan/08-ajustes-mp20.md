# Ajustes MP_20 — Pendente de Validação

> Itens aguardando conferência com Phyllypi antes de implementar.

---

## Meta (% PV) — Tabela de Conversão dos Suplementos

### O que é

No **Cadastros → Suplementos**, o campo **"Consumo"** é selecionado em gramas por 100 kg de peso vivo (ex: `200 A 300 GRAMAS/100 KG PV`).

O sistema converte esse valor em **% do Peso Vivo** para exibir a coluna **"Meta (% PV)"** e para calcular a META KG/CAB/DIA no Relatório.

---

### Memorial de Cálculo — META KG/CAB/DIA (Relatório)

```
META KG/CAB/DIA = Peso Vivo médio do pasto × (% PV / 100)

Exemplo:
  Animais no pasto pesam em média 300 kg
  Suplemento com consumo de 0,3% PV
  Meta = 300 × (0,3 / 100) = 0,9 kg/cab/dia
```

**Fontes dos dados:**
- **% PV** → campo `consumo` do suplemento em Cadastros → Suplementos
- **Peso Vivo** → peso médio ponderado dos animais cadastrados no pasto na data do lançamento

---

### Tabela Atual no Sistema — AGUARDANDO CONFERÊNCIA

| Faixa de Consumo (cadastro) | Meta exibida (atual) | Cálculo esperado | Status |
|-----------------------------|----------------------|-------------------|--------|
| 20 A 30 GRAMAS/100 KG PV   | 0,030%               | média 25g ÷ 100.000g = **0,025%** | ⬜ Conferir |
| 35 A 45 GRAMAS/100 KG PV   | 0,400%               | média 40g ÷ 100.000g = **0,040%** | ❌ Parece errado (10× maior) |
| 50 A 100 GRAMAS/100 KG PV  | 0,060%               | média 75g ÷ 100.000g = **0,075%** | ⬜ Conferir |
| 100 A 120 GRAMAS/100 KG PV | 0,110%               | média 110g ÷ 100.000g = **0,110%** | ✅ OK |
| 200 A 300 GRAMAS/100 KG PV | 0,250%               | média 250g ÷ 100.000g = **0,250%** | ✅ OK |
| 300 A 400 GRAMAS/100 KG PV | 0,350%               | média 350g ÷ 100.000g = **0,350%** | ✅ OK |
| 500 A 700 GRAMAS/100 KG PV | 0,600%               | média 600g ÷ 100.000g = **0,600%** | ✅ OK |
| 1,0 A 1,50% PV             | 1,300%               | média 1,25% = **1,250%** | ⬜ Conferir |
| 1,50 A 2,30% PV            | 2,000%               | média 1,9% = **1,900%** | ⬜ Conferir |

> **Pergunta para Phyllypi:**
> Os valores de % PV são a média aritmética do intervalo ou existe outro critério (ex: valor mais conservador, valor máximo)?
> O item `35 a 45 g` com `0,400%` parece digitação errada — confirmar se deve ser `0,040%`.

---

## Pendente

- ⬜ Phyllypi confirma/corrige os valores da tabela acima
- ⬜ Após confirmação, HicaroDev ajusta a constante `META_CONSUMO` no código

---

*Criado em 21/03/2026 · HicaroDev*
