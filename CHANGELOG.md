## [1.29.0] — 2026-05-14

### Adicionado
- **Histórico Diário — módulo completo**: aba dedicada separada do Manejos com gráficos e tabela
- **SQL retroativo `upsert_lote_diario_retroativo`**: backfill a partir de `data_entries`, projeta até `CURRENT_DATE` para entradas nos últimos 365 dias
- **Cron 23h automático**: gera registros de `lote_diario` diariamente para todas as fazendas
- **Filtros de período**: 7 / 30 / 90 / 180 dias + "Sem Data" (todos os registros)
- **Carga sob demanda**: dados carregam somente ao selecionar um lote específico (performance)
- **Coluna Simulado — peso acumulado**: `peso_inicial + Σ consumo_kg_cab` diário — cálculo incremental no frontend, independente por lote
- **Gráfico Evolução do Peso**: linha verde tracejada (Peso Inicial estático) + linha azul sólida (Ganho Simulado acumulado)
- **Gráfico Consumo Diário vs Meta**: lado a lado com o de peso — linha verde tracejada (Meta kg/cab) + linha azul (Consumo real)
- **Botão Reprocessar Retroativo** (admin): dispara o SQL retroativo manualmente via UI

### Alterado
- Colunas da tabela reorganizadas: removido GMD (reservado para v2.0), Status renomeado para "Simulado"
- `buscarHistoricoDiario` com limite 10.000 registros (era 600)
- Dois gráficos lado a lado em grid `xl:grid-cols-2` (antes era um único gráfico de linha)
- `data_entries` vinculados a `pastures` por UUID em vez de nome de texto

### Corrigido
- `consumo_kg_cab` calculado como `kg / quantidade` (campo `consumo` estava zerado)
- Retroativo parava na data do último lançamento — agora projeta até hoje
- Filtros de 7/30 dias não mostravam dados (registros eram antigos — corrigido com retroativo estendido)

### Tokens de Design
- Brand: #1a6040 (verde Movimento Pecuário)
- Navy: #0b2748 | Purple: #6b2fa0
- Stack: React 18 + Vite 6 + Tailwind v4 + Recharts 2

## [1.25.0] — 2026-04-25

### Adicionado
- **Simulador V2 — Motor Sazonal**: detecção automática de época (Seca/Transição/Águas) por datas de fase
- **Simulador V2 — GMD ponderado**: quando fase cruza duas épocas, calcula GMD proporcional aos dias em cada época
- **Simulador V2 — Qualidade da pastagem**: auto-preenchida do cadastro do pasto (`qualidade_forragem`)
- **Tabela de Fases redesenhada**: 4 dimensões visíveis por linha (Época · Condição · g/100kg PV · GMD tabela)
- **SimuladosTab — Tabela Técnica**: 3 blocos de época idênticos ao PDF CONSUMO × GANHO do Phyllypi Melo
- **SimuladosTab — CRUD inline por categoria**: cada linha de categoria é expansível; adicionar/editar/excluir produtos sem modal
- **Banco semeado**: 6 categorias do PDF (MINERAL → RACAO SEMI 1,0% PV) para todas as 4 fazendas
- **Tabela `simulador_parametros`**: 18 registros (6 categorias × 3 épocas) com g/100kg PV e GMD por condição de pastagem
- **Colunas `epoca` e `condicao_pastagem`** adicionadas a `supplement_simulated`

### Alterado
- SimuladosTab unificado: tabela técnica + gestão de produtos em uma única aba
- Produtos PROTEVIT substituídos pelas 6 categorias padronizadas do PDF

### Tokens de Design
- Brand: #1a6040 (verde Movimento Pecuário)
- Navy: #0b2748 | Purple: #6b2fa0
- Stack: React 18 + Vite 6 + Tailwind v4 + Recharts 2
