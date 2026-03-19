# Próximas Versões — Roadmap

## v1.19 — Relatório por Lote (Curva de Consumo)

> **Origem:** Brainstorm Phyllypi Melo — áudio de 18/03/2026

- ⬜ **Gráfico de linha** ao filtrar por Lote
  - Eixo X = datas dos lançamentos
  - Eixo Y = consumo KG/cab/dia
  - Cada suplemento com cor fixa (verde, vermelho, laranja…)
  - Linha muda de cor quando o suplemento muda no período
  - Visualiza queda/alta ao trocar de produto

- ⬜ **% PV por lote**
  - Fórmula: `(Consumo KG/cab/dia ÷ Peso Vivo) × 100 = % PV`
  - Exibido ao lado do consumo médio e da meta no relatório

- ⬜ **Ficha de consumo em PDF pré-preenchida**
  - PDF para download com: Pasto, Quantidade de animais, Produto
  - Nome do arquivo: `[lote]_[fazenda]_[pasto]_[produto].pdf`
  - Objetivo: vaqueiro baixa no celular e usa em campo

- ⬜ **Intervalos irregulares tratados corretamente**
  - Lançamentos podem ter 3, 5, 7+ dias de intervalo
  - Cálculo deve usar o período real entre apontamentos

## v2.0 — Módulo Estoque de Produtos e Fábrica

- ⬜ Controle de estoque de suplementos minerais e proteicos
- ⬜ Entrada de matéria-prima e produção na fábrica
- ⬜ Alerta de estoque baixo

## v2.1 — Lançamento pelo Vaqueiro (QRCode nos Cochos)

- ⬜ QRCode impresso/fixado em cada cocho de pasto
- ⬜ Vaqueiro lê o QR no celular → abre formulário simplificado
- ⬜ Sem login — acesso direto pelo QR
- ⬜ Lançamento aprovado/revisado pelo gestor antes de entrar no sistema

## v3.0 — SaaS Escala

- ⬜ Multi-tenant com planos pagos
- ⬜ Dashboard corporativo por fazenda
- ⬜ App mobile (PWA ou React Native)

---

*Roadmap atualizado em 19/03/2026 — HicaroDev + Phyllypi Melo*
