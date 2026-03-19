# Ajustes MP17 — 17 Março 2026

> Versão **v1.18 / v1.19** — ajustes entregues com base na reunião de 17/03/2026 e áudio de 18/03/2026.

---

## Segurança

- ✅ **Lançamentos > Editar registro** agora exige confirmação de senha
- ✅ **Cadastros > Excluir Forragem** agora exige confirmação de senha
- ✅ **Cadastros > Excluir Suplemento** agora exige confirmação de senha

---

## Manejos — Regras de Sexo

- ✅ **Parição** — lista apenas lotes do sexo **FÊMEA**
- ✅ **Desmama** — lista apenas lotes **FÊMEA com bezerros ao pé**
- ✅ Parição bloqueada para machos (filtro impede seleção)
- ✅ Desmama bloqueada para machos e para fêmeas sem bezerros

---

## Manejos — Transferir Unificado

- ✅ **"Transferir" e "Transferir Parcial" unificados em uma única tela**
  - Toggle **Lote completo / Transferência parcial**
  - Destino sempre por **PASTO** (vazio ou com lotes)
  - Parcial: opção de criar novo lote ou agregar em lote existente
  - Pasto destino mostra quantos lotes já possui

---

## Histórico

- ✅ Filtro **"Lançamentos"** corrigido — inclui atividades do módulo formulário
- ✅ Filtro **"Atividades"** corrigido — exclui itens de lançamento
- ✅ Contagens dos chips atualizadas corretamente

---

## Relatórios — Gráficos e Labels

- ✅ **SummaryChart** — rótulo de dados (valor) acima de cada barra
- ✅ **Suplementos em CAIXA ALTA** em toda a exibição do relatório
- ✅ **Curva de consumo diário por lote** — ao selecionar um Lote no filtro, exibe gráfico de **LINHA** com:
  - Eixo X = datas dos lançamentos
  - Eixo Y = KG/cab/dia
  - Uma linha por tipo de suplemento (cor distinta por produto)
  - Linha tracejada = % PV (consumo em % do peso vivo)
- ✅ **% PV** — exibido no gráfico de linha com linha tracejada e no tooltip
- ✅ **Intervalos irregulares tratados corretamente** — cada lançamento usa seu próprio período real (3, 5, 7+ dias)

---

## Ficha de Consumo em PDF

- ✅ **Botão "Ficha PDF"** aparece quando um Lote está selecionado no relatório
- ✅ PDF gerado com: Fazenda, Pasto, Lote, Quantidade de animais, Suplemento atual
- ✅ Tabela em branco para o vaqueiro registrar em campo

---

## Ajustes da v1.19

- ✅ **Botão Excel removido** do Relatório (mantido apenas PDF)
- ✅ **Botão Importar Excel removido** do Formulário
- ✅ **Aba Planejamento** visível somente para administradores
- ✅ **Versão atualizada** para v1.19

---

## Pendente de Validação com o Cliente

- ⬜ **Categoria Animal nos pré-lançamentos** — confirmar com Phyllypi se os dados cadastrados estão corretos
- ⬜ **Testar Transferir Parcial para pasto vazio** — validar fluxo completo em tela

---

## Status Resumido

| Área | Item | Status |
|------|------|--------|
| Segurança | Editar lançamento com senha | ✅ |
| Segurança | Excluir Forragem com senha | ✅ |
| Segurança | Excluir Suplemento com senha | ✅ |
| Manejos | Parição: apenas lotes fêmea | ✅ |
| Manejos | Desmama: apenas fêmeas com bezerros | ✅ |
| Manejos | Bloquear Parição/Desmama de machos | ✅ |
| Manejos | Transferir + Parcial na mesma tela | ✅ |
| Manejos | Destino por PASTO (vazio ou com lotes) | ✅ |
| Histórico | Filtro Lançamentos corrigido | ✅ |
| Histórico | Chips de filtro corrigidos | ✅ |
| Relatórios | Rótulo acima das barras | ✅ |
| Relatórios | Suplementos em CAIXA ALTA | ✅ |
| Relatórios | Curva de consumo diário (linha) | ✅ |
| Relatórios | % PV ao lado do consumo | ✅ |
| Relatórios | Intervalos irregulares tratados | ✅ |
| Relatórios | Ficha PDF pré-preenchida | ✅ |
| Geral | Remover Excel (Relatório + Formulário) | ✅ |
| Geral | Versão v1.19 | ✅ |
| Seed/Dados | Categoria Animal nos pré-lançamentos | ⬜ Validar |
| Manejos | Testar Transferir Parcial pasto vazio | ⬜ Validar |

---

*MP17 iniciado em 19/03/2026 · v1.18 → v1.19 · Suplemento Control*
