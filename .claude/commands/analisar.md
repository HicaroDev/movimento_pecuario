# /analisar — Análise de Melhorias Futuras
> Suplemento Control — use antes de planejar uma nova fase de desenvolvimento

Você é um arquiteto de produto. Analise o estado atual do projeto e produza um relatório priorizado de melhorias.

---

## PASSO 1 — LEITURA DO ESTADO ATUAL

Leia os seguintes arquivos:
1. `TASKS.md` — progresso e tasks pendentes
2. `PLANO-NOVOS-MODULOS.md` — planejamento dos módulos futuros
3. `PLANO-MIGRACAO.md` — arquitetura e fases
4. `CHANGELOG.md` — histórico de versões (se existir)
5. `Skills/README.md` — skills disponíveis

---

## PASSO 2 — ANÁLISE DO CÓDIGO

Examine brevemente:
- `src/pages/` — quais páginas existem e qual é a complexidade percebida
- `src/services/` — quais services existem
- `src/context/` — contextos globais
- Tamanho dos arquivos principais (linhas de código)

---

## PASSO 3 — IDENTIFICAR DÉBITOS TÉCNICOS

Procure por:
- [ ] Arquivos com mais de 800 linhas (candidatos à refatoração)
- [ ] Código duplicado entre páginas
- [ ] `any` types no TypeScript
- [ ] `console.log` esquecidos
- [ ] Comentários `// TODO` ou `// FIXME`
- [ ] Dependências desatualizadas relevantes (`package.json`)

---

## PASSO 4 — MAPEAR OPORTUNIDADES

Com base na leitura, identifique e priorize melhorias nas categorias:

### 🔴 Alta Prioridade (impacto direto no cliente)
- Funcionalidades incompletas ou bugs conhecidos
- UX que causa confusão ou retrabalho
- Performance em páginas com muitos dados

### 🟡 Média Prioridade (qualidade e manutenibilidade)
- Refatorações que reduzem risco de bugs
- Melhorias de responsividade mobile
- Cobertura de casos de borda (edge cases)

### 🟢 Baixa Prioridade (nice to have)
- Melhorias visuais sem impacto funcional
- Funcionalidades dos módulos futuros
- Integrações externas (WhatsApp, email, etc.)

---

## PASSO 5 — PRÓXIMOS MÓDULOS

Com base em `PLANO-NOVOS-MODULOS.md`, avalie:
- Qual módulo tem maior retorno para o cliente agora?
- Quais dependências existem entre módulos? (ex: OS depende do Estoque)
- Qual é o esforço estimado (pequeno / médio / grande)?

---

## PASSO 6 — RELATÓRIO

Produza um relatório estruturado:

```markdown
## Análise — [DATA]

### Estado atual
- X páginas, Y services, Z contexts
- Tasks: X/Y concluídas (Z%)
- Módulos em produção: [lista]
- Módulos planejados: [lista]

### Débitos técnicos encontrados
1. [item] — [arquivo:linha] — [risco]

### Top 5 melhorias recomendadas
1. [melhoria] — prioridade: 🔴/🟡/🟢 — esforço: P/M/G
2. ...

### Próximo módulo recomendado
[módulo] — justificativa

### Ordem de desenvolvimento sugerida
[sequência lógica]
```
