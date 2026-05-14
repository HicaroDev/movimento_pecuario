# Como Acessar a VPS via SSH

> IP da VPS: `129.121.45.185` | Usuário padrão: `root`

---

## Passo 1 — Pegar a senha SSH no painel Hostgator

1. Acesse **hpanel.hostgator.com.br** e faça login
2. No menu, clique em **VPS**
3. Clique na sua VPS
4. Procure o botão **"Gerenciar"** ou **"Painel de Controle"**
5. Localize **"Senha Root"** ou **"Acesso SSH"**
6. Se não lembrar a senha → clique em **"Alterar senha root"** e crie uma nova

---

## Passo 2 — Abrir o terminal SSH

No Claude Code, você pode rodar direto no terminal:

```
! ssh root@129.121.45.185
```

Ou abra o **Prompt de Comando / PowerShell** do Windows e digite:

```
ssh root@129.121.45.185
```

---

## Passo 3 — Digitar a senha

- O terminal vai pedir a senha (não aparece nada enquanto digita — é normal)
- Digite a senha do Passo 1 e aperte **Enter**
- Se aparecer `root@...#` → você está dentro da VPS ✅

---

## Passo 4 — Reiniciar a VPS travada

Com o terminal aberto dentro da VPS, rode:

```bash
reboot
```

A conexão SSH vai cair (normal) — a VPS está reiniciando.  
Aguarde **1-2 minutos** e o EasyPanel volta em `http://129.121.45.185:3000/`

---

## Passo 5 — Adicionar Swap (após reiniciar, conecte de novo)

```bash
# Conectar novamente após o reboot
ssh root@129.121.45.185

# Criar swap de 2GB
fallocate -l 2G /swapfile
chmod 600 /swapfile
mkswap /swapfile
swapon /swapfile

# Tornar permanente (não some após reboot)
echo '/swapfile none swap sw 0 0' >> /etc/fstab

# Confirmar que criou
free -h
```

Resultado esperado na última linha:
```
Swap:   2.0G    0B    2.0G
```

---

## Problemas comuns

| Problema | Solução |
|----------|---------|
| `Connection refused` | VPS ainda travada, aguarda mais 1 min |
| `Permission denied` | Senha errada — redefine no painel Hostgator |
| `ssh: command not found` | Usa o terminal do Claude: `! ssh root@129.121.45.185` |
| Primeira conexão pede confirmação | Digite `yes` e Enter |
