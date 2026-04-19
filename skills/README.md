# Skills do Projeto — Suplemento Control

> Pasta de documentação das skills (slash commands) disponíveis.
> Os arquivos funcionais ficam em `.claude/commands/`.

---

## Lista de Skills

| Comando | Arquivo | O que faz |
|---------|---------|-----------|
| `/padrao` | `.claude/commands/padrao.md` | Audita cores, tokens e identidade visual em todas as páginas |
| `/relatorio` | `.claude/commands/relatorio.md` | Audita e corrige a página de Relatório (filtros, KPIs, PDF, META) |
| `/qa` | `.claude/commands/qa.md` | QA completo: build, tipos TS, fluxos críticos, UX e consistência |
| `/validar-dados` | `.claude/commands/validar-dados.md` | Valida SQL, RLS, segurança e integridade dos dados no Supabase |
| `/analisar` | `.claude/commands/analisar.md` | Analisa o projeto e propõe melhorias futuras priorizadas |
| `/organizar` | `.claude/commands/organizar.md` | Revisa e organiza todos os arquivos .md do projeto |
| `/backup` | `.claude/commands/backup.md` | Backup do código (git) e dos dados do banco (Supabase export) |
| `/versionar` | `.claude/commands/versionar.md` | Cria snapshot de versão: build check, CHANGELOG, TASKS, package.json |
| `/upgrade` | `.claude/commands/upgrade.md` | Workflow seguro para implementar melhorias sem quebrar o design |
| `/commit` | `~/.claude/commands/commit.md` | Cria commit com assinatura HicaroDev + Claude (global) | # NO GITHUB BLZ MAIS NO PLANEJAMENTO NAO PODE APARECER NA 
2
---

## Fluxo recomendado

```
Antes de implementar uma melhoria grande:
  /guardar → /upgrade

Após implementar:
  /qa → /padrao → /relatorio (se afetou relatórios)

Ao finalizar uma versão:
  /versionar → /commit

Periodicamente:
  /validar-dados → /organizar → /analisar
```

---

## Como invocar

No prompt do Claude Code: `/nome-da-skill`
Exemplo: `/qa`
