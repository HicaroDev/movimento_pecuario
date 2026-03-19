# Ajustes MP17 — 17 Março 2026

> Conjunto de ajustes entregues na versão v1.18 com base na reunião de 17/03/2026 + áudio de 18/03/2026.

## Segurança

- ✅ Lançamentos > Editar registro agora exige senha (PasswordConfirmModal)
- ✅ Cadastros > Excluir Forragem agora exige senha
- ✅ Cadastros > Excluir Suplemento agora exige senha

## Manejos — Regras de Sexo

- ✅ Parição — lista apenas lotes do sexo **FÊMEA**
- ✅ Desmama — lista apenas lotes **FÊMEA com bezerros ao pé**
- ✅ Parição bloqueada para machos (filtro impede seleção)
- ✅ Desmama bloqueada para machos e para fêmeas sem bezerros

## Manejos — Transferir Unificado

- ✅ "Transferir" e "Transferir Parcial" unificados em uma tela
  - Toggle **Lote completo / Transferência parcial**
  - Destino sempre por **PASTO** (vazio ou com lotes)
  - Parcial: opção de criar novo lote ou agregar em lote existente
- ✅ Select "Pasto de destino" mostra todos os pastos com indicação de quantidade de lotes

## Histórico

- ✅ Filtro "Lançamentos" agora inclui atividades do módulo formulário
- ✅ Filtro "Atividades" exclui itens do módulo formulário
- ✅ Contagens dos chips corrigidas

## Relatórios

- ✅ SummaryChart — rótulo de dados acima de cada barra do gráfico

## Pendente de Verificação

- ⬜ Suplementos em CAIXA ALTA — verificar se precisa de migração SQL no banco
- ⬜ Categoria Animal nos pré-lançamentos — confirmar se seed está correto
- ⬜ Testar fluxo completo de Transferir unificado (especialmente parcial para pasto vazio)

## Em Implementação (Áudio 18/03)

- ⬜ Gráfico de linha — curva de consumo diário por lote (ao filtrar por lote)
- ⬜ % PV nos relatórios por lote
- ⬜ Ficha de consumo em PDF pré-preenchida para download em campo
- ⬜ Tratar intervalos irregulares entre lançamentos no cálculo de dias reais

## Status Resumido

| Área | Item | Status |
|------|------|--------|
| Segurança | Editar lançamento com senha | ✅ |
| Segurança | Excluir Forragem com senha | ✅ |
| Segurança | Excluir Suplemento com senha | ✅ |
| Manejos | Parição: apenas lotes fêmea | ✅ |
| Manejos | Desmama: apenas fêmeas com bezerros | ✅ |
| Manejos | Transferir + Parcial na mesma tela | ✅ |
| Manejos | Destino por PASTO (vazio ou com lotes) | ✅ |
| Histórico | Filtro Lançamentos corrigido | ✅ |
| Relatórios | Rótulo acima das barras | ✅ |
| Relatórios | Curva de consumo diário (linha) | ⬜ |
| Relatórios | % PV por lote | ⬜ |
| Relatórios | Ficha PDF pré-preenchida | ⬜ |

---

*MP17 entregue em 19/03/2026 — Suplemento Control v1.18*
*Brainstorm Phyllypi Melo adicionado em 19/03/2026 (áudio 18/03/2026)*
