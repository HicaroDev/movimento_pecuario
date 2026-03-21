# Changelog — Suplemento Control

## v1.21 — 21/03/2026

### Manejos
- Parição: exibe apenas lotes FÊMEA marcados como **prenha = SIM**
- Filtro sexo corrigido para aceitar variações de caixa (FÊMEA / femea / Femea)

### Cadastros
- Campo **Prenha** (SIM / NÃO) exibido ao selecionar sexo FÊMEA no cadastro de animais
- Salvo corretamente como boolean no banco (era string "true" — corrigido)
- Destaque visual: botão SIM fica rosa quando selecionado

### Layout / UX
- Sidebar: footer com gradiente verde na base
- Botão "Voltar ao topo" (canto inferior esquerdo)
- Sem barra de rolagem própria no menu lateral

### DevPlan (Planejamento)
- Botão flutuante **Responder** para o cliente enviar feedback diretamente na aba
- Contador de respostas não lidas no menu lateral (polling 30s)

### Banco de Dados
- Nova coluna `animals.prenha boolean DEFAULT false` (ajustes_v121.sql)
- Tabela `devplan_comments` para respostas do cliente (ajustes_v119.sql)

---

## v1.19 — 19/03/2026

### Relatórios
- Curva de consumo diário por lote — gráfico de LINHA ao selecionar Lote
- % PV (consumo em % do peso vivo) exibido no gráfico de linha
- Suplementos em CAIXA ALTA em todo o relatório
- Intervalos irregulares entre lançamentos tratados corretamente
- Botão "Ficha PDF" — ficha pré-preenchida para vaqueiro usar em campo
- Botão Excel removido (mantido apenas PDF)

### Formulário (Lançamento)
- Botão Importar Excel removido

### Geral
- Versão atualizada para v1.19
- Aba Planejamento visível somente para administradores
- Cadastros > Suplementos: nome salvo automaticamente em CAIXA ALTA

---

## v1.18 — 19/03/2026

### Segurança
- Editar lançamento agora exige confirmação de senha (PasswordConfirmModal)
- Excluir Forragem agora exige confirmação de senha
- Excluir Suplemento agora exige confirmação de senha

### Manejos
- Parição: lista apenas lotes do sexo FÊMEA
- Desmama: lista apenas lotes FÊMEA com bezerros ao pé
- Transferir + Transferir Parcial unificados em uma tela
  - Toggle "Lote completo / Transferência parcial"
  - Destino sempre por PASTO (vazio ou com lotes)
  - Parcial: criar novo lote ou agregar em lote existente
- Novo método `manejoService.transferirParcialParaPasto`

### Histórico
- Filtro "Lançamentos" corrigido — inclui atividades do módulo formulário
- Filtro "Atividades" corrigido — exclui itens de lançamento
- Contagens dos chips atualizadas

### Relatórios
- SummaryChart: rótulo de dados (LabelList) acima de cada barra do gráfico

---

## v1.17 — 04/03/2026

### Segurança
- Excluir Pastos agora exige senha (PasswordConfirmModal)
- Excluir Animais agora exige senha

### Relatórios
- Total de Cabeças sem duplicidade
- Filtro "Lote" no relatório
- Coluna "Lote" e "META KG/CAB DIA" na tabela
- "DIAS REAIS" renomeado para "DIAS DE CONSUMO"
- Filtro de data inicial e final
- PDF A4 retrato com bordas
- Meta de Consumo (% PV) com linha azul no gráfico
- Desembolso R$/cab/dia nos totals

### Manejos
- Aba "Histórico" removida do menu interno
- Filtro De/Até no Histórico (menu lateral)

### Formulário (Lançamento)
- Redesign visual completo
- Pasto = select dinâmico do banco de dados
- KG = sacos × 25 calculado automaticamente

---

## v1.16 — Fev/2026

- Migração completa para Supabase (banco de dados em nuvem)
- Auth multi-tenant com perfis por fazenda
- Tabelas: animals, supplement_types, employees, manejo_historico + RLS
- Módulo Manejos completo: Lotes, Transferir, Evolução, Saída, Histórico

---

## v1.15 — Jan/2026

- Sistema de autenticação (login/logout)
- Multi-tenant: admin vê todas as fazendas, cliente vê só a sua
- Módulo Usuários e Fazendas
- Controle de módulos por usuário

---

*Changelog mantido por HicaroDev*
