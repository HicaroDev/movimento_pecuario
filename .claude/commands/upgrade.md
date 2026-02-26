# /upgrade — Workflow de Upgrade com Qualidade Garantida

Você vai implementar uma melhoria ou modificação no projeto `suplemento-control` **sem quebrar o padrão visual e de arquitetura existente**. Siga este workflow rigorosamente.

## FASE 1 — ENTENDER O PEDIDO

Antes de tocar em qualquer arquivo:
1. Leia a solicitação do usuário com atenção
2. Identifique **quais arquivos serão afetados**
3. Classifique o tipo de mudança:
   - 🎨 **Visual** — cores, layout, tipografia, espaçamento
   - 🧩 **Componente** — novo componente ou modificação de existente
   - 📊 **Dados** — mudança em DataContext, lib/data, lib/utils
   - 🗂️ **Página** — nova rota ou modificação de página existente
   - ⚙️ **Config** — package.json, vite.config, tsconfig, CSS

## FASE 2 — BASELINE (antes de qualquer mudança)

Rode o build e guarde o resultado baseline:
```bash
npm run build
```
- Se build falhar antes de começar: **pare** e corrija primeiro.
- Anote o tamanho dos chunks (`index.js` kB) para comparar depois.

## FASE 3 — CHECKLIST DE DESIGN (leia antes de implementar)

Verifique os tokens que NÃO PODEM mudar sem aprovação do usuário:

| Token | Valor | Arquivo |
|-------|-------|---------|
| Brand green | `#1a6040` | `index.css` + `data.ts` |
| Navy | `#0b2748` | `data.ts` |
| Purple | `#6b2fa0` | `data.ts` |
| Sidebar gradient | `#1a1f2e → #2d3548` | `DashboardLayout.tsx` |
| Tabela números azuis | `#3b82f6` | `SupplementSection.tsx` |
| Header suplemento | cor do tipo | `SupplementSection.tsx` |
| Chart: sem labels em barra | (ausente) | `SupplementSection.tsx` |
| Chart: vertical layout | tabela → gráfico | `SupplementSection.tsx` |
| Logo | `/logo.png` em card branco | `DashboardLayout.tsx` |

**Regra:** Se a mudança tocar em algum desses itens, confirme com o usuário antes de implementar.

## FASE 4 — IMPLEMENTAR

1. Leia **todos** os arquivos que serão modificados antes de editar qualquer um
2. Faça as mudanças mínimas necessárias — não refatore além do pedido
3. Siga o padrão de nomenclatura existente:
   - Componentes: PascalCase em `src/components/`
   - Páginas: PascalCase em `src/pages/`
   - Utils: camelCase em `src/lib/utils.ts`
4. Formatação de números: sempre use `fmt()` para decimais e `fmtInt()` para inteiros
5. Cores dos suplementos: sempre leia de `supplementColors` em `data.ts`
6. Estado global: sempre via `useData()` do DataContext

## FASE 5 — VALIDAR

Após implementar:

```bash
npm run build
```

Checklist pós-implementação:
- [ ] Build termina com `✓ built` sem erros TypeScript
- [ ] Nenhum token de design foi alterado sem aprovação
- [ ] Nenhum componente existente foi refatorado além do necessário
- [ ] `supplementColors` continua sendo a única fonte de cores por tipo
- [ ] `DataContext` continua sendo a única fonte de estado global
- [ ] Formatação pt-BR mantida em todas as tabelas e tooltips

## FASE 6 — REPORTAR

Apresente ao usuário:
1. **O que foi feito** — lista objetiva das mudanças
2. **Arquivos modificados** — com caminho relativo
3. **Status do build** — ✓ ou ✗ com detalhes
4. **Tokens preservados** — confirmação de que nada visual indesejado mudou
5. **Próximo passo sugerido** — o que o usuário pode querer fazer depois (ex: `/versionar` para salvar o estado)
