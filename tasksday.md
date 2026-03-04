# TASKSDAY — Ajustes 03 Mar 2026

> Documento de testes para validação das correções implementadas nesta sessão.
> Versão: **v1.16**

---

## ✅ Módulo Manejos — Sessão Anterior

### 1. Aba Histórico (janela separada)
**O que foi feito:** Histórico virou uma 5ª aba dedicada na página de Manejos, não mais uma gaveta.

**Como testar:**
- [ ] Entrar em Manejos → ver 5 abas: Lotes por Pasto, Alocação, Evolução, Saída, **Histórico**
- [ ] Clicar em Histórico → exibe lista de eventos paginada com filtros no topo
- [ ] Filtro de mês (chips): clicar em cada mês e ver a lista filtrar
- [ ] Filtro de tipo (chips): Alocação, Transferência, Evolução, Abate, Venda, Desagrupamento
- [ ] Filtro de pasto (select dropdown): selecionar um pasto → lista filtra pelos eventos daquele pasto
- [ ] Botão "Limpar" ao lado do select de pasto → limpa o filtro
- [ ] Botão "Exportar PDF" → abre diálogo de impressão com o histórico formatado

### 2. Saída — 3 modos
**O que foi feito:** A aba Saída agora tem 3 sub-opções: Abate, Venda direta, Desagrupar bezerros.

**Como testar:**
- [ ] Aba Saída → ver 3 botões: "Abate (venda para abatedor)", "Venda direta", "Desagrupar bezerros"
- [ ] **Abate:** selecionar lote → informar quantidade, peso médio, data, observação → salvar → histórico mostra tipo "abate"
- [ ] **Venda direta:** mesma estrutura do Abate → histórico mostra tipo "venda"
- [ ] **Desagrupar bezerros:** selecionar lote de origem → informar qtd → escolher "Lote existente" ou "Novo lote" → salvar → lote origem reduz, lote destino aumenta (ou é criado)
- [ ] Verificar que o lote de origem fica com a quantidade reduzida após qualquer saída

### 3. Campo Data em Evolução e Saída
**O que foi feito:** Campos de data foram adicionados às abas Evolução e Saída.

**Como testar:**
- [ ] Aba Evolução → ver campo "Data da Evolução" → preencher e salvar → histórico mostra a data formatada (dd/mm/aaaa)
- [ ] Aba Saída → ver campo "Data" → preencher e salvar → histórico mostra a data

### 4. Filtro de pasto em Histórico (select dropdown)
**O que foi feito:** Filtro de pasto substituído de chips para select dropdown.

**Como testar:**
- [ ] Aba Histórico → ver select "Filtrar por pasto" com ChevronDown icon
- [ ] Selecionar um pasto → lista filtra
- [ ] Clicar "Limpar" → volta a mostrar tudo

---

## ✅ Módulo Cadastros — Sessão Atual (PDF Ajustes Pág. 1-5)

### PASSO OBRIGATÓRIO — Executar SQL antes de testar Pastos e Suplementos

**Arquivo:** `supabase/ajustes_v116b.sql`

**Rodar em:** https://saas-supabase.bj3amt.easypanel.host → SQL Editor

O SQL cria/atualiza:
- Coluna `pastures.forragem` (text)
- Coluna `pastures.qualidade_forragem` (text)
- Coluna `supplement_types.peso` (numeric)
- Coluna `supplement_types.valor_kg` (numeric)
- Tabela `employees` com RLS (caso não exista)

---

### 5. Texto MAIÚSCULO em campos de texto (Página 1)
**O que foi feito:** Todos os campos de texto (nome, função, observações) agora forçam UPPERCASE ao digitar.

**Como testar:**
- [ ] Cadastros → Pastos → Novo Pasto → digitar nome em minúsculo → verifica que fica em MAIÚSCULO
- [ ] Cadastros → Animais → Novo Lote → campo Nome → digitar → fica MAIÚSCULO
- [ ] Cadastros → Funcionários → Novo Funcionário → Nome e Função → MAIÚSCULO
- [ ] Cadastros → Forragens → Nova Forragem → MAIÚSCULO
- [ ] Cadastros → Suplementos → Novo Suplemento → Nome → MAIÚSCULO

### 6. Raça como lista pre-selecionada (Página 1)
**O que foi feito:** Campo Raça nos Lotes virou select com 3 opções.

**Como testar:**
- [ ] Cadastros → Animais → Novo Lote → campo "Raça" → deve ser um SELECT com: NELORE, CRUZAMENTO INDUSTRIAL, COMPOSTO
- [ ] Editar um lote existente → campo Raça no edit row também deve ser select
- [ ] Salvar → valor salvo deve ser um dos 3

### 7. Sexo — remover Misto (Página 1)
**O que foi feito:** A opção "Misto" foi removida do select Sexo.

**Como testar:**
- [ ] Cadastros → Animais → Novo Lote → campo "Sexo" → deve ter apenas: — (vazio), MACHO, FÊMEA
- [ ] Editar lote → campo Sexo no edit row → idem, sem "Misto"

### 8. Pastos — Forragem e Qualidade da Forragem (Página 2)
**REQUER SQL executado (passo acima).**

**O que foi feito:** Formulário de pasto ganhou 2 novos campos: Forragem (select de forage_types) e Qualidade da Forragem (REGULAR, BOA, ÓTIMA).

**Como testar:**
- [ ] Cadastros → Forragens → adicionar pelo menos 1 forragem (ex: CAPIM-BRACHIARIA)
- [ ] Ir em Pastos → Novo Pasto → ver campos "Forragem" e "Qualidade da Forragem"
- [ ] Forragem → deve listar as forragens do cadastro de Forragens
- [ ] Qualidade → deve ter: REGULAR, BOA, ÓTIMA
- [ ] Salvar → novo pasto aparece na tabela com colunas Forragem e Qualidade
- [ ] Qualidade exibe badge colorido: ÓTIMA (verde), BOA (teal), REGULAR (amarelo)

### 9. Pastos — ordem alfabética ao adicionar (Página 2)
**O que foi feito:** Ao adicionar um pasto, a lista é re-ordenada alfabeticamente (otimismo + DB já estava ordenado).

**Como testar:**
- [ ] Cadastros → Pastos → adicionar pasto "ZANGÃO" → verificar posição na lista (deve ir para o final)
- [ ] Adicionar pasto "ALFA" → deve aparecer no início da lista
- [ ] Sem precisar recarregar a página

### 10. Suplementos — remover "litro" (Página 3)
**O que foi feito:** Opção "litro" removida do select Unidade.

**Como testar:**
- [ ] Cadastros → Suplementos → Novo Suplemento → campo "Unidade" → deve ter apenas: KG, SACO
- [ ] Editar suplemento existente → Unidade no edit row → idem, sem "litro"

### 11. Suplementos — campo Peso e Valor/KG (Página 3)
**REQUER SQL executado (passo acima).**

**O que foi feito:** Formulário de suplemento ganhou campo "Peso por Unidade (kg)" e "Valor/KG (R$)".

**Como testar:**
- [ ] Cadastros → Suplementos → Novo Suplemento → ver campos "Peso por Unidade (kg)" e "Valor/KG (R$)"
- [ ] Exemplo: Unidade=SACO, Peso=30, Valor/KG=2.50 → Adicionar
- [ ] Tabela mostra colunas "Peso (kg)" e "Valor/KG (R$)" com os valores
- [ ] Editar um suplemento → edit row tem os novos campos

### 12. Suplementos — ordem alfabética ao adicionar (Página 4)
**O que foi feito:** Após inserir novo suplemento, a lista é re-ordenada alfabeticamente.

**Como testar:**
- [ ] Cadastros → Suplementos → adicionar "ZINCO" → verificar que vai para o final
- [ ] Adicionar "AMINOÁCIDO" → deve aparecer no início
- [ ] Sem recarregar a página

### 13. Suplementos — campo de busca/filtro (Página 4)
**O que foi feito:** Campo de pesquisa adicionado ao topo da lista de suplementos.

**Como testar:**
- [ ] Cadastros → Suplementos → ver campo de busca com ícone de lupa no topo
- [ ] Digitar "mineral" → lista filtra mostrando apenas suplementos com "mineral" no nome
- [ ] Apagar o texto → lista volta ao normal
- [ ] Quando filtrado, rodapé mostra "X de Y suplementos"

### 14. Funcionários — botão Adicionar (Página 5)
**REQUER SQL executado (passo acima) para criar a tabela `employees`.**

**O que foi feito:** A tabela `employees` é agora criada pelo SQL, e o handler mostra erro claro se a tabela não existir.

**Como testar:**
- [ ] Rodar `ajustes_v116b.sql` no Supabase
- [ ] Cadastros → Funcionários → Novo Funcionário → preencher Nome + Função + Contato → clicar Adicionar
- [ ] Funcionário deve aparecer na lista
- [ ] Se der erro: verificar no console do browser e checar se a tabela existe

### 15. Funcionários — máscara de telefone (Página 5)
**O que foi feito:** Campo Contato tem máscara automática (XX) XXXXX-XXXX ao digitar.

**Como testar:**
- [ ] Cadastros → Funcionários → Novo Funcionário → campo "Contato"
- [ ] Digitar "11999887766" → deve formatar automaticamente como "(11) 99988-7766"
- [ ] Digitar os dois primeiros dígitos → vira "(11)"
- [ ] Editar funcionário → campo Contato no edit row → mesma máscara

### 16. Placeholders padronizados com "Ex.:" (Página 5)
**O que foi feito:** Todos os placeholders de texto agora seguem o padrão "Ex.: ..."

**Como testar:**
- [ ] Cadastros → qualquer aba → todos os inputs de texto devem ter placeholder iniciando com "Ex.:"
- [ ] Ex.: "Ex.: Lagoa Verde", "Ex.: João Silva", "Ex.: Veterinário", "Ex.: (00) 00000-0000"

---

## Versão e Build

- [ ] Badge de versão no sidebar mostra **v1.16**
- [ ] `npm run build` sem erros de TypeScript
- [ ] `npx tsc --noEmit` sem erros

---

## Notas Importantes

- **Página 6 do PDF NÃO foi implementada** (conforme instrução do usuário)
- O SQL `ajustes_v116b.sql` é **idempotente** (pode rodar mais de uma vez sem problema)
- Funcionários requer a tabela `employees` — se já existir do `migration_cadastros.sql` anterior, o SQL apenas atualiza RLS
