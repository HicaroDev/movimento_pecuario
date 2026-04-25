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
