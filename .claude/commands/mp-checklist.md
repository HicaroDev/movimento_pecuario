# /mp-checklist — Processar PDF de Ajustes do Cliente

Este skill lê um PDF de ajustes (AJUSTES MP_XX MAR.pdf), cria um checklist detalhado por página, e acompanha o progresso de implementação.

## QUANDO USAR
- Toda vez que o cliente enviar um PDF de correções/ajustes (ex: "AJUSTES MP_16 MARÇO.pdf")
- Quando precisar saber o que já foi feito vs. o que falta implementar
- Antes de iniciar uma sessão de correções

## PASSOS OBRIGATÓRIOS

### 1. LOCALIZAR E LER O PDF

O PDF pode ter caracteres especiais no nome (Ç, Á). Usar Python para copiar:

```python
import os, shutil
base = 'C:/Users/Ione/OneDrive'
for root, dirs, files in os.walk(base):
    for f in files:
        if 'AJUSTE' in f.upper() and 'MP' in f.upper() and f.endswith('.pdf'):
            src = os.path.join(root, f)
            name = f.replace(' ', '_').encode('ascii', 'ignore').decode()
            shutil.copy(src, f'C:/Users/Ione/AppData/Local/Temp/{name}')
```

Depois ler com pdfplumber (instalar se necessário: `pip install pdfplumber`):

```python
import pdfplumber
with pdfplumber.open('C:/Users/Ione/AppData/Local/Temp/AJUSTES_MP_XX_MARCO.pdf') as pdf:
    for i, page in enumerate(pdf.pages):
        print(f'=== PAGE {i+1} ===')
        print(page.extract_text())
```

### 2. CROSS-CHECK COM COMMITS ANTERIORES

Antes de marcar qualquer item como feito, verificar:
- `git log --oneline -10` para ver commits recentes
- `git show <hash> --stat` para ver arquivos alterados
- Ler o código dos arquivos relevantes para confirmar que a feature existe

**NUNCA marcar [x] sem confirmar no código.**

### 3. CRIAR O MD CHECKLIST

Criar em: `C:\Users\Ione\OneDrive\Área de Trabalho\DEV\Cliente Stela\AJUSTE_MP{XX}_CHECKLIST.md`

Formato obrigatório por item:
```markdown
- [x] ou [ ] **Título curto** — Descrição do que foi/deve ser feito
  - Testar: como o usuário deve validar este item
  - ⚠️ Notas ou ressalvas importantes
```

Organizar por página do PDF. Incluir tabela de resumo no final.

### 4. AGUARDAR VALIDAÇÃO DO USUÁRIO

**NUNCA fazer commit sem o usuário confirmar o MD.**

Apresentar o MD e perguntar: "Confirma o checklist? Posso prosseguir com os itens [ ] pendentes?"

### 5. IMPLEMENTAR OS ITENS PENDENTES

Ordem recomendada: do mais simples ao mais complexo.
- Textos/renomear campos → primeiro
- Filtros UI → segundo
- Lógica de negócio → terceiro
- Integrações de dados (joins, cálculos) → por último

Atualizar o MD marcando [x] à medida que implementa.

### 6. COMMIT

Só após validação do usuário. Usar o skill `/commit`.

Atualizar a tabela "Status por Commit" no MD.

---

## PADRÕES DE NAMING

| PDF | MD gerado | Versão app |
|-----|-----------|------------|
| AJUSTES MP_16 MARÇO.pdf | AJUSTE_MP16_CHECKLIST.md | v1.19B |

Sempre confirmar a versão com o usuário antes de commitar.

---

## ERROS COMUNS A EVITAR

1. **Não ler todas as páginas** — Sempre ler o PDF completo, página por página
2. **Marcar [x] sem confirmar no código** — Verificar sempre no código/commits
3. **Commitar antes do usuário validar o MD** — Aguardar confirmação explícita
4. **Versão errada** — Confirmar a versão com o usuário (ex: 1.19B, não 1.20)
5. **Itens em português com caracteres especiais** — Usar pdfplumber, não pdftoppm

---

## USO

```
/mp-checklist AJUSTES MP_17 ABRIL.pdf
```

Ou simplesmente:
```
/mp-checklist
```
(o Claude irá perguntar qual PDF processar)
