# /organizar — Organização e Sincronização da Documentação
> Suplemento Control v1.19D — use para manter docs e estrutura limpos e atualizados

Você é um curador de documentação técnica. Revise, organize e sincronize todos os arquivos Markdown e de configuração do projeto.

---

## ARQUIVOS A REVISAR

### Documentação principal
| Arquivo | Propósito |
|---------|-----------|
| `TASKS.md` | Status de todas as tasks por fase |
| `CHANGELOG.md` | Histórico de versões |
| `PLANO-MIGRACAO.md` | Arquitetura, stack, estrutura do projeto |

### Skills (claude commands)
| Arquivo | Propósito |
|---------|-----------|
| `.claude/commands/padrao.md` | Guardião do padrão visual |
| `.claude/commands/qa.md` | Quality assurance completo |
| `.claude/commands/versionar.md` | Criar checkpoints de versão |
| `.claude/commands/upgrade.md` | Workflow de melhorias |
| `.claude/commands/organizar.md` | Este arquivo |

### SQL Migrations (ordem de execução)
| Arquivo | Tabela criada |
|---------|--------------|
| `supabase/ajustes_v116b.sql` | animals, supplement_types, employees, manejo_historico |
| `supabase/estoque_v100.sql` | estoque_movimentos |
| `supabase/os_v100.sql` | ordens_suplemento + itens |
| `supabase/caixa_v100.sql` | livro_caixa |
| `supabase/solicitacoes_v100.sql` | solicitacoes_compra |

### Serviços ativos
| Arquivo | Responsabilidade |
|---------|-----------------|
| `src/services/estoqueService.ts` | Movimentos de estoque + saldos + alertas |
| `src/services/osService.ts` | OS + execução → estoque + data_entries + livro_caixa |
| `src/services/caixaService.ts` | Livro Caixa — lançamentos + gráfico + resumo |
| `src/services/solicitacaoService.ts` | Pedidos de compra → entrada no estoque |
| `src/services/manejoService.ts` | Animais + histórico + categorias |
| `src/services/farmService.ts` | Fazendas CRUD |
| `src/services/userService.ts` | Usuários CRUD |

---

## PASSO 1 — INVENTÁRIO

Liste todos os arquivos `.md` do projeto (exceto node_modules):

```bash
find . -name "*.md" -not -path "*/node_modules/*" | sort
```

Documente quais existem e quais estão desatualizados.

---

## PASSO 2 — TASKS.md

Verifique e corrija:

- [ ] Data `> Última atualização:` está correta (hoje)
- [ ] Todas as tasks `[x]` foram de fato implementadas (confirmar no código)
- [ ] Tasks pendentes `[ ]` ainda fazem sentido
- [ ] Tabela "Resumo de Progresso" — contagens corretas
- [ ] Fase 3A, 3B, 3C, 3D todas marcadas como ✅ Concluída
- [ ] Seção "Para Rodar as Migrations" lista todas as 5 SQLs na ordem correta
- [ ] Seção "Commits Recentes" atualizada com os últimos commits

---

## PASSO 3 — PLANO-MIGRACAO.md

Verifique:

- [ ] Stack listada ainda está correta (React 18, Vite 6, Tailwind v4, Recharts 2, React Router 7)
- [ ] Estrutura de arquivos inclui: `src/pages/Estoque`, `OS`, `LivroCaixa`, `Historico`
- [ ] Serviços listados incluem: `estoqueService`, `osService`, `caixaService`, `solicitacaoService`
- [ ] Módulos admin-only listados: Estoque, OS, Livro Caixa

---

## PASSO 4 — SKILLS (.claude/commands)

Para cada skill verificar:

- [ ] `/padrao` — cobre os 3 novos módulos (Estoque, OS, Livro Caixa) com checklist próprio
- [ ] `/qa` — fluxos de OS (confirmar → estoque + data_entries + livro_caixa) e Livro Caixa presentes
- [ ] `/versionar` — instrução para atualizar badge de versão no DashboardLayout
- [ ] Caminhos de arquivo mencionados existem no projeto
- [ ] Versão mencionada nas skills é `v1.19D`

---

## PASSO 5 — VERIFICAR INCONSISTÊNCIAS

- [ ] `TASKS.md` e `PLANO-MIGRACAO.md` não contradizem o estado atual do código
- [ ] Nenhum arquivo `.md` menciona módulos como "PLANEJADO" que já foram implementados
- [ ] Nenhuma credencial ou chave exposta em qualquer `.md`
- [ ] `padrao.md` — checklist de Estoque/OS/Livro Caixa presente

---

## PASSO 6 — LIMPAR OBSOLETOS

Identifique arquivos que podem ser arquivados ou removidos:
- `PLANO-NOVOS-MODULOS.md` — se os módulos já foram implementados, pode ser arquivado
- Skills antigas que referenciam arquivos inexistentes

Não deletar sem confirmação do desenvolvedor. Apenas listar.

---

## RELATÓRIO FINAL

```markdown
## Organização executada — [DATA]

### Arquivos revisados: X
### Correções feitas:
- [arquivo] — [o que foi corrigido]

### Inconsistências encontradas (requer decisão):
- [descrição]

### Arquivos OK sem alteração: [lista]
### Arquivos candidatos a arquivar: [lista]
```
