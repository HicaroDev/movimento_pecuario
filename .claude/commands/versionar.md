# /versionar — Criar Snapshot de Versão

Você vai criar um checkpoint de versão estável do projeto `suplemento-control`. Siga os passos abaixo em ordem.

## 1. VERIFICAR BUILD

Rode o build e confirme que está limpo:
```bash
cd "C:\Users\Ione\OneDrive\Área de Trabalho\DEV\Cliente Stela\suplemento-control"
npm run build
```
- Se houver **erros TypeScript**: pare, corrija, volte ao passo 1.
- Se houver apenas warnings de chunk size: OK, pode continuar.

## 2. INVENTÁRIO DO ESTADO ATUAL

Leia e documente o estado atual dos arquivos-chave:
- `package.json` → versão do projeto e dependências principais
- `src/lib/data.ts` → supplementColors e quantas linhas tem sampleRows
- `src/styles/index.css` → tokens de cor ativos
- `TASKS.md` → progresso atual (quantas tasks concluídas)

## 3. DETERMINAR NÚMERO DA VERSÃO

- Leia a versão atual em `package.json` (`"version"`)
- Incremente o **patch** (terceiro número): ex. `2.0.0` → `2.0.1`
- Se esta versão adiciona uma funcionalidade nova significativa: incremente o **minor**: `2.0.x` → `2.1.0`
- Pergunte ao usuário se não tiver certeza

## 4. ATUALIZAR `package.json`

Atualize o campo `"version"` para o novo número.

## 5. CRIAR ARQUIVO DE VERSÃO

Crie ou atualize `CHANGELOG.md` na raiz do projeto com a nova entrada no topo:

```markdown
## [X.Y.Z] — YYYY-MM-DD

### Adicionado
- [liste funcionalidades novas]

### Alterado
- [liste mudanças de comportamento ou design]

### Corrigido
- [liste bugs corrigidos]

### Tokens de Design
- Brand: #1a6040 (verde Movimento Pecuário)
- Navy: #0b2748 | Purple: #6b2fa0
- Stack: React 18 + Vite 6 + Tailwind v4 + Recharts 2
```

## 6. ATUALIZAR `TASKS.md`

- Marque tasks pendentes que já foram concluídas nesta versão
- Atualize a tabela de "Resumo de Progresso" com contagens corretas
- Atualize a linha `> Última atualização:`

## 7. ATUALIZAR `PLANO-MIGRACAO.md`

- Atualize a linha `> Última atualização:`
- Se a Fase 1 está 100% concluída, marque como tal na tabela de fases

## 8. CONFIRMAR

Rode o build uma vez mais para garantir que as alterações nos .md não quebraram nada:
```bash
npm run build
```

Reporte ao usuário:
- Versão anterior → versão nova
- Principais mudanças documentadas no CHANGELOG
- Status do build
