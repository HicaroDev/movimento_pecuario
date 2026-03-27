# /organizar — Organização e Análise dos Arquivos .md
> Suplemento Control — use para manter a documentação limpa e atualizada

Você é um curador de documentação técnica. Revise, organize e sincronize todos os arquivos Markdown do projeto.

---

## ARQUIVOS A REVISAR

| Arquivo | Propósito |
|---------|-----------|
| `TASKS.md` | Status de todas as tasks por fase |
| `PLANO-MIGRACAO.md` | Arquitetura, stack, estrutura do projeto |
| `PLANO-NOVOS-MODULOS.md` | Planejamento Estoque, OS, Livro Caixa |
| `CHANGELOG.md` | Histórico de versões |
| `Skills/README.md` | Índice de skills disponíveis |
| `.claude/commands/*.md` | Cada skill do projeto |
| `supabase/*.sql` | Migrations disponíveis |

---

## PASSO 1 — INVENTÁRIO

Liste todos os arquivos `.md` do projeto:

```bash
find . -name "*.md" -not -path "*/node_modules/*" | sort
```

Documente:
- Quais existem
- Tamanho aproximado
- Última modificação (se possível)

---

## PASSO 2 — TASKS.md

Verifique e corrija:

- [ ] Todas as tasks `[x]` realmente foram implementadas (confirmar no código)
- [ ] Tasks pendentes `[ ]` ainda fazem sentido (não foram esquecidas)
- [ ] Tabela de "Resumo de Progresso" está correta (contagens batem)
- [ ] Seção "Commits Recentes" está atualizada
- [ ] `> Última atualização:` tem a data correta
- [ ] Fases futuras têm a nota correta (ex.: OBS do cliente sobre SaaS)

---

## PASSO 3 — PLANO-MIGRACAO.md

Verifique:

- [ ] Stack listada ainda está correta (versões dos packages)
- [ ] Estrutura de arquivos refleta o estado atual (`src/pages/`, `src/services/`)
- [ ] Módulos listados estão atualizados (incluindo Estoque, OS, Livro Caixa)
- [ ] Credenciais de exemplo não estão desatualizadas

---

## PASSO 4 — PLANO-NOVOS-MODULOS.md

Verifique:

- [ ] Tasks do Estoque (T-310~T-319) marcadas como concluídas se já implementadas
- [ ] Fluxo de integração entre módulos está correto
- [ ] Tabelas SQL correspondem ao que foi de fato criado
- [ ] Sidebar planejada ainda faz sentido

---

## PASSO 5 — Skills

Para cada skill em `.claude/commands/`:

- [ ] A skill ainda é relevante (não ficou obsoleta)
- [ ] Os arquivos mencionados ainda existem com esses nomes
- [ ] Os caminhos de diretório estão corretos
- [ ] A versão mencionada na skill é a atual

---

## PASSO 6 — LIMPAR DUPLICIDADES

- [ ] Não há informação contraditória entre os arquivos
- [ ] Não há tasks duplicadas em múltiplos arquivos
- [ ] Não há credenciais ou chaves expostas em nenhum `.md`

---

## PASSO 7 — RELATÓRIO

Produza ao final:

```markdown
## Organização executada — [DATA]

### Arquivos revisados: X
### Correções feitas:
- [arquivo] — [o que foi corrigido]

### Inconsistências encontradas (sem correção automática):
- [descrição] — requer decisão do desenvolvedor

### Arquivos OK sem alteração: [lista]
```
