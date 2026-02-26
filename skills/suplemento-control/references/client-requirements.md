# Requisitos do Cliente — Suplemento Control

## Perfil do Cliente
- **Profissão**: Zootecnista
- **Dispositivo**: Notebook (não celular)
- **Experiência**: Excel avançado (tabelas dinâmicas, gráficos manuais)
- **Fazenda**: Malhada Grande (com múltiplos retiros e pastos)

## Problema Atual
- Cria gráficos manualmente toda vez a partir da planilha Excel
- Não consegue fazer filtros dinâmicos como deseja
- Tentou Tabela Dinâmica + Slicers mas não funcionou como esperado
- Precisa cruzar informações (produto × local × mês)

## Requisitos Funcionais

### 1. Banco de dados único
- Uma aba (ou tabela) para todos os lançamentos do ano
- Empilhamento cronológico (janeiro, fevereiro, março...)
- Respeitar colunas e fórmulas existentes

### 2. Filtros dinâmicos (slicers)
- Tipo de produto / suplemento
- Retiro / Fazenda
- Pasto
- Mês / Período
- Todos os filtros interligados

### 3. Gráficos automáticos
- Atualizam conforme filtros aplicados
- **Linha vermelha de média** em todos os gráficos (parâmetro de referência)
- Estilo **idêntico aos PDFs enviados** (cores, layout, títulos)
- Poder gerar gráficos variados conforme combinação de filtros

### 4. Coluna N = dado principal
- `consumption_per_head_day` (consumo kg/cab/dia)
- É a métrica central de todos os gráficos e relatórios

## Dados de Referência (Março 2025)

### Pastos por suplemento:

**Energético 0,3%** (13 pastos, verde):
Cana, Tamboril, Sujo 1, Mama de Baixo Piq 2, Mama de Baixo Piq 1, Palhadão do Meio, Rio do Ouro de Baixo, Rio do Ouro de Cima, Pequi 2, João Jacinto de Cima, Da Maternidade, Ponte Cima, Luizinho

**Mineral Adensado Águas** (6 pastos, azul):
Boiada Gorda, Divaldo, Pasto do Braquiarão, João Jacinto de Baixo, Tucuzão Braquiára, Da Pedra

**Ração Creep** (9 pastos, roxo):
Tamboril, Boiada Gorda, Rio do Ouro de Cima, Pasto do Braquiarão, João Jacinto de Cima, Tucuzão Braquiára, Da Pedra, Da Maternidade, Ponte Cima

### Médias de referência:
- Energético: 0,748 kg/cab/dia
- Mineral: 0,156 kg/cab/dia
- Creep: 0,370 kg/cab/dia

## Entregáveis do PDF (layout a reproduzir)

### Página 1 — Resumo
- Título: "CONSUMO KG/CAB DIA - MÉDIAS CONSUMO"
- Subtítulo: "FAZENDA MALHADA GRANDE - MAR/25"
- Tabela resumo (3 linhas: nome + média) à esquerda
- Gráfico de barras (3 barras coloridas) à direita

### Páginas 2-4 — Por suplemento
- Header verde: "CONTROLE DE CONSUMO SUPLEMENTOS - FAZENDA MALHADA GRANDE 2025" + "MOVIMENTO PECUÁRIO"
- Título: "CONSUMO KG/CAB DIA - [TIPO] (MARÇO 2025)"
- Grid: tabela de dados (esquerda) + gráfico de barras (direita)
- Linha vermelha de média no gráfico
- Total de cabeças + média no rodapé da tabela
