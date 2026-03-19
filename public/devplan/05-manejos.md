# Módulo Manejos

## O que o módulo faz

O módulo Manejos gerencia os lotes de animais por pasto: movimentações, evoluções de categoria, parições, desmamas e saídas.

## Abas do módulo

### 🐄 Lotes por Pasto
- Exibe todos os lotes agrupados por pasto
- Estatísticas globais: Hectares, Pastos, Cabeças, Peso Médio Ponderado
- Bezerros exibidos em sub-row laranja com quantidade e peso

### ↔ Transferir
- **Lote completo** — move o lote inteiro para outro pasto
- **Transferência parcial** — move uma quantidade de animais
  - Destino sempre = PASTO (vazio ou com lotes)
  - Para pasto vazio: cria novo lote (campo nome)
  - Para pasto com lotes: opção de criar novo ou agregar em lote existente
- Histórico de transferências visível na aba

### 📈 Evolução
- **Parição** — registra nascimento de bezerros
  - Apenas lotes do sexo FÊMEA aparecem na lista
- **Desmama** — registra desmame dos bezerros
  - Apenas lotes FÊMEA **com bezerros ao pé** aparecem na lista
- **Categoria** — evolução de categoria do lote (ex: novilha → vaca)
- **Peso** — atualização de peso médio do lote

### 🚪 Saída (Abate/Venda)
- Registra saída parcial ou total do lote
- Tipos: Abate ou Venda
- Não desagrega o lote — apenas deduz a quantidade

## Regras de Negócio

| Regra | Descrição |
|-------|-----------|
| Parição | Apenas lotes fêmea podem ter parição |
| Desmama | Apenas lotes fêmea com bezerros ao pé |
| Transferência parcial | Destino = pasto (não lote) |
| Histórico | Disponível apenas no menu lateral (não na aba interna) |

---

*Atualizado em 19/03/2026 — v1.18*
